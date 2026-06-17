const username = "atoz";
const password = "Atoz2026%";
const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

async function testMemberCategoryCount() {
  const url = `https://apicrm.apicrmatoz.online/api/v1/members?category=APPETIZERS&take=1&skip=0`;
  const url2 = `https://apicrm.apicrmatoz.online/api/v1/members?take=1&skip=0`;
  try {
    let res = await fetch(url, { headers: { 'Accept': 'application/json', 'Authorization': authHeader } });
    let json = await res.json();
    console.log("APPETIZERS first member name:", json.data[0]?.name);
    
    // To check count, we'd normally iterate or check total_count, but the API doesn't return total_count.
    // Instead we can just check if APPETIZERS works differently than FOOD.
  } catch(e) { console.error("Error:", e.message); }
}

testMemberCategoryCount();
