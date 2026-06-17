const { execSync } = require('child_process');
async function checkOffset(offset) {
  try {
    const out = execSync(`curl -s -u "atoz:Atoz2026%" -H "Accept: application/json" "https://apicrm.apicrmatoz.online/api/v1/members?take=1&skip=${offset}"`);
    const data = JSON.parse(out);
    return data.data && data.data.length > 0;
  } catch (e) {
    return false;
  }
}
async function count() {
  let low = 0 + 50;
  let high = 15000;
  let total = low;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const hasData = await checkOffset(mid);
    if (hasData) { total = mid + 1; low = mid + 1; }
    else { high = mid - 1; }
  }
  console.log("TOTAL:", total);
}
count();
