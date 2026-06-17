const username = "atoz";
const password = "Atoz2026%";
const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

async function checkMembersOutlets() {
  const url = `https://apicrm.apicrmatoz.online/api/v1/members?take=100&skip=0`;
  console.log("Fetching:", url);
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'Authorization': authHeader },
    });
    const json = await res.json();
    const outlets = new Set();
    json.data.forEach(m => {
      const outletCode = m.outlet || m.outlet_code || m.primary_outlet_code || m.outlet_name || "NONE";
      outlets.add(outletCode);
    });
    console.log("Unique outlets in first 100 members:", Array.from(outlets));
    
    // Look for any non-AZ member
    const nonAz = json.data.find(m => m.outlet && m.outlet !== "AZ");
    if(nonAz) {
      console.log("Found a non-AZ member:", nonAz.name, nonAz.outlet);
    } else {
      console.log("No non-AZ members found in this batch.");
    }

  } catch(e) { console.error("Error:", e.message); }
}

checkMembersOutlets();
