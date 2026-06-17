const username = "atoz";
const password = "Atoz2026%";
const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

async function testFetch5000() {
  const url = "https://apicrm.apicrmatoz.online/api/v1/members?take=5000&skip=0";
  console.log("Fetching...", url);
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json', 'Authorization': authHeader } });
    console.log("Status:", res.status);
    if (!res.ok) {
      console.log("Response text:", await res.text());
      return;
    }
    const json = await res.json();
    console.log("Fetched length:", json.data ? json.data.length : 0);
  } catch (err) { console.error("Fetch error:", err); }
}

testFetch5000();
