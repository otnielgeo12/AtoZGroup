import re

filepath = '/Users/mac/Documents/Restaurant-Showcase-Dashboard/artifacts/dashboard/src/lib/crm-api.ts'

with open(filepath, 'r') as f:
    content = f.read()

# Replace vsfRequest signature
new_signature = '''async function vsfRequest<T>(
  url: string,
  options: RequestInit = {},
  tenantId?: string
): Promise<T> {
  const authHeader = getBasicAuthHeader();
  const defaultTenant = (import.meta as any).env?.VITE_OUTLET_ID || "atoz";
  const finalTenant = tenantId || defaultTenant;
  const headers: HeadersInit = {
    Accept: "application/json",
    "x-outlet-id": finalTenant.toLowerCase() === 'az' ? 'atoz' : (finalTenant.toLowerCase() === 'bs' ? 'bosa' : finalTenant),
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any)?.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}'''

# Replace the vsfRequest implementation
content = re.sub(r'async function vsfRequest<T>\(.*?\).*?return res\.json\(\) as Promise<T>;\n}', new_signature, content, flags=re.DOTALL)

# Now find calls to vsfRequest and inject tenantId if applicable
# For listCustomers:
# return await vsfRequest<VsoftResponse<VsoftMember[]>>(`${base}/api/v1/members?${qs}`);
# Replace it with:
# return await vsfRequest<VsoftResponse<VsoftMember[]>>(`${base}/api/v1/members?${qs}`, {}, outId);

list_customers_call_search = r'return await vsfRequest<VsoftResponse<VsoftMember\[\]>>\(`\$\{base\}/api/v1/members\?\$\{qs\}`\);'
list_customers_call_replace = r'return await vsfRequest<VsoftResponse<VsoftMember[]>>(`${base}/api/v1/members?${qs}`, {}, outId);'
content = re.sub(list_customers_call_search, list_customers_call_replace, content)

# For getCustomer:
# export async function getCustomer(id: string): Promise<CustomerDetail | null> {
# ...
# const resp = await vsfRequest<VsoftResponse<VsoftMember>>(`${base}/api/v1/members/${encodeURIComponent(id)}`);
# Wait, getCustomer doesn't know the outletId! But it might be fine, the backend might just search the default. Actually it's better to leave it default if we don't know.

with open(filepath, 'w') as f:
    f.write(content)

