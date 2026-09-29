const fs = require('fs');

const code = `
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

fs.appendFileSync('src/lib/crm-api.ts', code);
