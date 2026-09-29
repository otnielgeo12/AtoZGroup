import re

filepath = '/Users/mac/Documents/Restaurant-Showcase-Dashboard/artifacts/dashboard/src/lib/crm-api.ts'
with open(filepath, 'r') as f:
    content = f.read()

count_search = r'const resp = await vsfRequest<VsoftResponse<VsoftMember\[\]>>\(`\$\{base\}/api/v1/members\?\$\{qs\}`\);'
count_replace = r'const resp = await vsfRequest<VsoftResponse<VsoftMember[]>>(`${base}/api/v1/members?${qs}`, {}, outId);'
content = re.sub(count_search, count_replace, content)

with open(filepath, 'w') as f:
    f.write(content)

