const username = "atoz";
const password = "Atoz2026%";
const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

async function testOutlets() {
  const url = `https://apicrm.apicrmatoz.online/api/v1/outlets`;
  console.log("Fetching:", url);
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'Authorization': authHeader },
    });
    const json = await res.json();
    console.log("Outlets:", JSON.stringify(json.data, null, 2));
  } catch(e) { console.error("Error:", e.message); }
}

testOutlets();
