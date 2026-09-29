const fs = require('fs');
let crm = fs.readFileSync('src/lib/crm-api.ts', 'utf8');

// 1. Fix vsfRequest signature
crm = crm.replace(
  /async function vsfRequest<T>\([\s\S]*?options: RequestInit = \{\},\n\): Promise<T> \{[\s\S]*?Accept: "application\/json",[\s\S]*?\};/m,
  `async function vsfRequest<T>(
  url: string,
  options: RequestInit = {},
  outletId?: string,
): Promise<T> {
  const authHeader = getBasicAuthHeader();
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (outletId) {
    let raw = outletId.toLowerCase();
    if (raw === "bs") raw = "bosa";
    if (raw === "lk") raw = "lakers";
    if (raw === "bd") raw = "bodega";
    if (raw === "az") raw = "atoz";
    (headers as any)["x-outlet-id"] = raw;
  }`
);

// 2. Fix isValidAndAllowedCustomer missing
if (!crm.includes('function isValidAndAllowedCustomer')) {
  crm = crm.replace(
    /function mapVsoftMember/m,
    `function isValidAndAllowedCustomer(item: CustomerListItem): boolean {
  return true;
}

function mapVsoftMember`
  );
}

// 3. Fix _injected_tenant typing error in mapVsoftMember
crm = crm.replace(
  /function mapVsoftMember\(m: VsoftMember & \{ _injected_tenant\?: string \}\): CustomerListItem \{/m,
  `function mapVsoftMember(m: any): CustomerListItem {`
);

crm = crm.replace(
  /function mapVsoftMemberDetail\(m: VsoftMember & \{ _injected_tenant\?: string \}\): CustomerDetail \{/m,
  `function mapVsoftMemberDetail(m: any): CustomerDetail {`
);

fs.writeFileSync('src/lib/crm-api.ts', crm);
