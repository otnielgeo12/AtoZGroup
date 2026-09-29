import re

filepath = '/Users/mac/Documents/Restaurant-Showcase-Dashboard/artifacts/dashboard/src/pages/crm/index.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# fetchCustomerInsights argument in useQuery
insights_search = r'queryFn: \(\) => fetchCustomerInsights\(insightStart, insightEnd, getToken\),'
insights_replace = r'queryFn: () => fetchCustomerInsights(insightStart, insightEnd, filters.outletId, getToken),'
content = re.sub(insights_search, insights_replace, content)

with open(filepath, 'w') as f:
    f.write(content)

