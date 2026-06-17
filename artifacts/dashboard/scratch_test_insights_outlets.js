const username = "atoz";
const password = "Atoz2026%";
const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

async function checkInsightsOutlets() {
  const url = `https://apicrm.apicrmatoz.online/api/v1/customerInsights?start_date=2026-05-01&end_date=2026-06-01&outlet=BS`;
  console.log("Fetching:", url);
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'Authorization': authHeader },
    });
    const json = await res.json();
    console.log("Result for outlet=BS:", json.data?.length || 0, "records");
    if (json.data?.length > 0) {
      console.log("Sample outlet:", json.data[0].outlet);
    }
  } catch(e) { console.error("Error:", e.message); }
}

checkInsightsOutlets();
