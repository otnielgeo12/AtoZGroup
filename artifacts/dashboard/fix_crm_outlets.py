import re

filepath = '/Users/mac/Documents/Restaurant-Showcase-Dashboard/artifacts/dashboard/src/lib/crm-api.ts'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Update isValidAndAllowedCustomer to NOT filter LK or BD
valid_search = r'  const outId = String\(item\.primaryOutletId \|\| ""\)\.toUpperCase\(\);\n  const outName = String\(item\.primaryOutletName \|\| ""\)\.toUpperCase\(\);\n  if \(outId === "LK" \|\| outId === "BD" \|\| outName === "LAKERS" \|\| outName === "BODEGA"\) \{\n    return false;\n  \}'
valid_replace = r'  // No longer filtering Lakers or Bodega as per new request'
content = re.sub(valid_search, valid_replace, content)

# 2. Update mapVsoftMember to accept injected tenant
map_search = r'function mapVsoftMember\(m: VsoftMember\): CustomerListItem \{.*?const isAtoZ =.*?const primaryOutletName = isAtoZ \? "AtoZ" : "BOSA";'
map_replace = '''function mapVsoftMember(m: VsoftMember & { _injected_tenant?: string }): CustomerListItem {
  const nameVal = m.customer_name || m.name || "";
  const fullName = nameVal.trim() || "(No Name)";
  const phone = m.phone || m.phone_number || "";

  const totalSpending = Number(m.total_spending) || 0;
  const totalVisits = Number(m.total_visit) || Number((m as any).total_visits) || 0;
  const lastVisitDate = m.last_visit || (m as any).last_visit_date || "";
  
  const rawCode = m.code || "";
  let primaryOutletId = "AZ";
  let primaryOutletName = "AtoZ";
  
  const t = m._injected_tenant || "";
  if (t === "bosa" || t === "BS") { primaryOutletId = "BS"; primaryOutletName = "BOSA"; }
  else if (t === "lakers" || t === "LK") { primaryOutletId = "Lakers"; primaryOutletName = "Lakers"; }
  else if (t === "ombe" || t === "Ombe") { primaryOutletId = "Ombe"; primaryOutletName = "Ombe"; }
  else if (t === "rh" || t === "RH") { primaryOutletId = "RH"; primaryOutletName = "RH"; }
  else if (t === "bodega" || t === "Bodega") { primaryOutletId = "Bodega"; primaryOutletName = "Bodega"; }
  else if (t === "atoz" || t === "AZ") { primaryOutletId = "AZ"; primaryOutletName = "AtoZ"; }
  else {
    // fallback parsing
    const rawOutletStr = String(m.outlet || (m as any).outlet_name || (m as any).outlet_code || "").toUpperCase();
    if (rawOutletStr.includes("BS") || rawOutletStr.includes("BOSA")) { primaryOutletId = "BS"; primaryOutletName = "BOSA"; }
    else if (rawOutletStr.includes("LAKER") || rawOutletStr === "LK") { primaryOutletId = "Lakers"; primaryOutletName = "Lakers"; }
    else if (rawOutletStr.includes("OMBE")) { primaryOutletId = "Ombe"; primaryOutletName = "Ombe"; }
    else if (rawOutletStr.includes("RH")) { primaryOutletId = "RH"; primaryOutletName = "RH"; }
    else if (rawOutletStr.includes("BODEGA") || rawOutletStr === "BD") { primaryOutletId = "Bodega"; primaryOutletName = "Bodega"; }
  }'''
content = re.sub(map_search, map_replace, content, flags=re.DOTALL)

# 3. Update listCustomers to inject _injected_tenant
list_customers_search = r'    const items = \(resp\.data \?\? \[\]\)\.map\(mapVsoftMember\)\.filter\(isValidAndAllowedCustomer\);'
list_customers_replace = r'    const tId = params.outletId === "BS" ? "bosa" : (params.outletId === "Lakers" ? "lakers" : (params.outletId === "Ombe" ? "ombe" : (params.outletId === "RH" ? "rh" : (params.outletId === "Bodega" ? "bodega" : "atoz"))));' + '\n' + r'    const items = (resp.data ?? []).map(m => mapVsoftMember({ ...m, _injected_tenant: tId })).filter(isValidAndAllowedCustomer);'
content = re.sub(list_customers_search, list_customers_replace, content)

all_members_search = r'        allMembers = allMembers\.concat\(res\.data\);'
all_members_replace = r'        allMembers = allMembers.concat(res.data.map(m => ({ ...m, _injected_tenant: ALL_TENANTS[results.indexOf(res)] })));'
content = re.sub(all_members_search, all_members_replace, content)

with open(filepath, 'w') as f:
    f.write(content)

