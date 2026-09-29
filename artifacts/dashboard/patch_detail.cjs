const fs = require('fs');

let crm = fs.readFileSync('src/lib/crm-api.ts', 'utf8');

crm = crm.replace(
  /export async function getCustomer\([\s\S]*?return mapVsoftMemberDetail\(resp\.data\);\n\}/m,
  `export async function getCustomer(
  code: string,
  _getToken?: () => Promise<string | null>,
): Promise<CustomerDetail> {
  const base = getCrmBaseUrl();
  
  for (const t of ALL_TENANTS) {
    try {
      const resp = await vsfRequest<VsoftResponse<VsoftMember>>(
        \`\${base}/api/v1/members/\${encodeURIComponent(code)}\`,
        {},
        t
      );
      if (resp && resp.data && (resp.data.code || resp.data.customer_code)) {
        return mapVsoftMemberDetail({ ...resp.data, _injected_tenant: t });
      }
    } catch (e) {
      // ignore and try next
    }
  }
  throw new Error("Customer not found in any tenant");
}`
);

crm = crm.replace(
  /export async function getCustomerHistory\([\s\S]*?return \[\];\n  \}\n\}/m,
  `export async function getCustomerHistory(
  code: string,
  name: string = "",
  phone: string = "",
  _getToken?: () => Promise<string | null>,
  startDate: string = "",
  endDate: string = "",
): Promise<CustomerPurchaseItem[]> {
  const base = getCrmBaseUrl();
  const qs = new URLSearchParams();
  if (name) qs.set("name", name);
  if (phone) qs.set("phone", phone);
  if (startDate) qs.set("start_date", startDate);
  if (endDate) qs.set("end_date", endDate);
  
  let allHistory: CustomerPurchaseItem[] = [];
  for (const t of ALL_TENANTS) {
    try {
      const resp = await vsfRequest<VsoftResponse<CustomerPurchaseItem[]>>(
        \`\${base}/api/v1/members/\${encodeURIComponent(code)}/history?\${qs}\`,
        {},
        t
      );
      if (resp && resp.data && Array.isArray(resp.data)) {
        allHistory = allHistory.concat(resp.data);
      }
    } catch (err) {
      // ignore
    }
  }
  
  // Sort descending by date
  allHistory.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  return allHistory;
}`
);

// We must also update mapVsoftMemberDetail to inject the tenant!
crm = crm.replace(
  /function mapVsoftMemberDetail\(m: VsoftMember\): CustomerDetail \{[\s\S]*?const primaryOutletName = isAtoZ \? "AtoZ" : "BOSA";/m,
  `function mapVsoftMemberDetail(m: VsoftMember & { _injected_tenant?: string }): CustomerDetail {
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
    const rawOutletStr = String(m.outlet || (m as any).outlet_name || (m as any).outlet_code || "").toUpperCase();
    if (rawOutletStr.includes("BS") || rawOutletStr.includes("BOSA")) { primaryOutletId = "BS"; primaryOutletName = "BOSA"; }
    else if (rawOutletStr.includes("LAKER") || rawOutletStr === "LK") { primaryOutletId = "Lakers"; primaryOutletName = "Lakers"; }
    else if (rawOutletStr.includes("OMBE")) { primaryOutletId = "Ombe"; primaryOutletName = "Ombe"; }
    else if (rawOutletStr.includes("RH")) { primaryOutletId = "RH"; primaryOutletName = "RH"; }
    else if (rawOutletStr.includes("BODEGA") || rawOutletStr === "BD") { primaryOutletId = "Bodega"; primaryOutletName = "Bodega"; }
  }`
);

fs.writeFileSync('src/lib/crm-api.ts', crm);
