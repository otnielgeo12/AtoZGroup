const username = "atoz";
const password = "Atoz2026%";
const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

async function checkParam(paramName, value) {
  const url = `https://apicrm.apicrmatoz.online/api/v1/members?take=50&skip=0&${paramName}=${value}`;
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json', 'Authorization': authHeader } });
    if (!res.ok) return `${res.status}`;
    const json = await res.json();
    return json.data ? json.data.length : 0;
  } catch (err) { return "error"; }
}

async function run() {
  console.log("No params:", await checkParam("ignore", "1"));
  console.log("outlet=TL:", await checkParam("outlet", "TL"));
  console.log("outlet_code=TL:", await checkParam("outlet_code", "TL"));
  console.log("primary_outlet_code=TL:", await checkParam("primary_outlet_code", "TL"));
  console.log("search=IWAN:", await checkParam("search", "IWAN"));
  console.log("q=IWAN:", await checkParam("q", "IWAN"));
  console.log("keyword=IWAN:", await checkParam("keyword", "IWAN"));
  console.log("name=IWAN:", await checkParam("name", "IWAN"));
  console.log("category=VVIP:", await checkParam("category", "VVIP"));
}

run();
