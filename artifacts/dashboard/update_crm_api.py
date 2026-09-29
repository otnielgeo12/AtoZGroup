import re

filepath = '/Users/mac/Documents/Restaurant-Showcase-Dashboard/artifacts/dashboard/src/lib/crm-api.ts'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Update listOutlets
list_outlets_search = r'export async function listOutlets\(.*?\): Promise<Outlet\[\]> \{.*?\}'
list_outlets_replace = '''export async function listOutlets(
  _getToken?: () => Promise<string | null>,
): Promise<Outlet[]> {
  return [
    { id: "AZ", name: "AtoZ" },
    { id: "BS", name: "BOSA" },
    { id: "Lakers", name: "Lakers" },
    { id: "Ombe", name: "Ombe" },
    { id: "RH", name: "RH" },
    { id: "Bodega", name: "Bodega" },
  ];
}'''
content = re.sub(list_outlets_search, list_outlets_replace, content, flags=re.DOTALL)

# 2. Add ALL_TENANTS
all_tenants_code = '''
const ALL_TENANTS = ["atoz", "bosa", "lakers", "ombe", "rh", "bodega"];
'''
# inject after imports
content = content.replace('export interface ListCustomersParams {', all_tenants_code + '\nexport interface ListCustomersParams {')

# 3. Update listCustomers
list_customers_search = r'export async function listCustomers\(.*?return items;\n\}'
list_customers_replace = '''export async function listCustomers(
  params: ListCustomersParams,
  _getToken?: () => Promise<string | null>,
): Promise<CustomerListItem[]> {
  const base = getCrmBaseUrl();
  const fetchPage = async (outId?: string, customSkip?: number, customTake?: number) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.category) qs.set("category", params.category);
    if (outId) {
      qs.set("outlet_code", outId);
      qs.set("outlet", outId);
      qs.set("primary_outlet_code", outId);
    }
    if (params.status) qs.set("status", params.status);
    qs.set("take", String(customTake ?? params.take ?? 50));
    qs.set("skip", String(customSkip ?? params.skip ?? 0));
    return await vsfRequest<VsoftResponse<VsoftMember[]>>(`${base}/api/v1/members?${qs}`, {}, outId);
  };

  if (params.outletId) {
    let resp = await fetchPage(params.outletId);
    if (params.outletId === "BS" && (!resp.data || resp.data.length === 0 || resp.total === 0)) {
      resp = await fetchPage("Lakers");
    }
    const items = (resp.data ?? []).map(mapVsoftMember).filter(isValidAndAllowedCustomer);
    if (typeof resp.total === "number") (items as any).totalCount = resp.total;
    if (typeof resp.total_new === "number") (items as any).totalNewCount = resp.total_new;
    return items;
  } else {
    // Fetch all tenants
    const requestedTake = params.take ?? 50;
    const requestedSkip = params.skip ?? 0;
    const fetchTake = requestedSkip + requestedTake;
    
    const promises = ALL_TENANTS.map(t => fetchPage(t, 0, fetchTake).catch(() => null));
    const results = await Promise.all(promises);

    let allMembers: VsoftMember[] = [];
    let totalCount = 0;
    let totalNew = 0;

    for (const res of results) {
      if (res && res.data) {
        allMembers = allMembers.concat(res.data);
        totalCount += res.total || 0;
        totalNew += res.total_new || 0;
      }
    }

    let items = allMembers.map(mapVsoftMember).filter(isValidAndAllowedCustomer);
    items.sort((a, b) => a.fullName.localeCompare(b.fullName));
    items = items.slice(requestedSkip, requestedSkip + requestedTake);

    (items as any).totalCount = totalCount;
    (items as any).totalNewCount = totalNew;
    return items;
  }
}'''
content = re.sub(list_customers_search, list_customers_replace, content, flags=re.DOTALL)


# 4. Update countCustomers
count_customers_search = r'export async function countCustomers\(.*?return \(resp\.total \?\? 0\);\n  \} catch.*?\n\}'
count_customers_replace = '''export async function countCustomers(
  search: string,
  category: string | undefined,
  outletId: string | undefined,
  currentDataLength: number,
  skip: number,
  take: number = 50,
): Promise<number> {
  if (currentDataLength < take) {
    return skip + currentDataLength;
  }

  const base = getCrmBaseUrl();
  const fetchTotal = async (outId?: string) => {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (category) qs.set("category", category);
    if (outId) {
      qs.set("outlet_code", outId);
      qs.set("outlet", outId);
    }
    qs.set("take", "1");
    qs.set("skip", "0");
    return await vsfRequest<VsoftResponse<VsoftMember[]>>(`${base}/api/v1/members?${qs}`, {}, outId);
  };

  try {
    if (outletId) {
      const resp = await fetchTotal(outletId);
      return resp.total ?? 0;
    } else {
      const promises = ALL_TENANTS.map(t => fetchTotal(t).catch(() => null));
      const results = await Promise.all(promises);
      let sum = 0;
      for (const r of results) {
        if (r) sum += r.total ?? 0;
      }
      return sum;
    }
  } catch (err) {
    console.error("Failed to count customers:", err);
    return skip + currentDataLength + 10;
  }
}'''
content = re.sub(count_customers_search, count_customers_replace, content, flags=re.DOTALL)


# 5. Update fetchCustomerInsights
fetch_insights_search = r'export async function fetchCustomerInsights\(.*?\): Promise<\{ byCode.*?raw: VsoftInsight\[\] \}> \{.*?return \{ byCode, byPhone, raw: resp\.data \?\? \[\] \};\n\}'
fetch_insights_replace = '''export async function fetchCustomerInsights(
  startDate: string,
  endDate: string,
  outletId?: string,
  _getToken?: () => Promise<string | null>,
): Promise<{ byCode: Map<string, VsoftInsight>; byPhone: Map<string, VsoftInsight>; raw: VsoftInsight[] }> {
  const base = getCrmBaseUrl();
  
  const fetchForTenant = async (outId?: string) => {
    const qs = new URLSearchParams();
    qs.set("start_date", startDate);
    qs.set("end_date", endDate);
    if (outId) qs.set("outlet_code", outId);
    return await vsfRequest<VsoftResponse<VsoftInsight[]>>(`${base}/api/v1/customerInsights?${qs}`, {}, outId);
  };

  let allData: VsoftInsight[] = [];
  
  if (outletId) {
    const resp = await fetchForTenant(outletId).catch(() => null);
    if (resp && resp.data) allData = resp.data;
  } else {
    const promises = ALL_TENANTS.map(t => fetchForTenant(t).catch(() => null));
    const results = await Promise.all(promises);
    for (const r of results) {
      if (r && r.data) allData = allData.concat(r.data);
    }
  }

  const byCode  = new Map<string, VsoftInsight>();
  const byPhone = new Map<string, VsoftInsight>();
  for (const item of allData) {
    const cCode = item.code || item.customer_code;
    const cPhone = item.phone || item.phone_number;
    if (cCode)  byCode.set(cCode, item);
    if (cPhone) byPhone.set(cPhone, item);
  }
  return { byCode, byPhone, raw: allData };
}'''
content = re.sub(fetch_insights_search, fetch_insights_replace, content, flags=re.DOTALL)

with open(filepath, 'w') as f:
    f.write(content)

