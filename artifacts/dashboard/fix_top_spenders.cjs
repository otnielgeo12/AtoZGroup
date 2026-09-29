const fs = require('fs');

let crm = fs.readFileSync('src/lib/crm-api.ts', 'utf8');

const additionalCode = `
export async function fetchTopSpenders(
  startDate: string,
  endDate: string,
  limit: number = 5,
  _getToken?: () => Promise<string | null>,
): Promise<CustomerListItem[]> {
  const insights = await fetchCustomerInsights(startDate, endDate, undefined, _getToken);
  const raw = insights.raw;
  // sort by total_spending desc
  raw.sort((a, b) => (Number(b.total_spending) || 0) - (Number(a.total_spending) || 0));
  
  const top = raw.slice(0, limit);
  // map them to CustomerListItem
  return top.map(insight => {
    return mapInsightToListItem(insight);
  });
}
`;

if (!crm.includes('export async function fetchTopSpenders')) {
  fs.writeFileSync('src/lib/crm-api.ts', crm + additionalCode);
}
