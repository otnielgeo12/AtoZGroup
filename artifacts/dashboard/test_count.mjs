
async function run() {
  const checkOffset = async (offset) => {
    const url = `https://apicrm.apicrmatoz.online/api/v1/members?take=1&skip=${offset}`;
    try {
      const res = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "Authorization": "Basic YXRvejpBdG96MjAyNiU="
        }
      });
      if (!res.ok) {
        console.log(`Error at ${offset}: ${res.status}`);
        return false;
      }
      const data = await res.json();
      return (data.data ?? []).length > 0;
    } catch (e) {
      console.log(`Fetch error at ${offset}: ${e.message}`);
      return false;
    }
  };

  let low = 0;
  let high = 15000;
  let total = low;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const hasData = await checkOffset(mid);
    console.log(`mid=${mid}, hasData=${hasData}`);
    if (hasData) {
      total = mid + 1;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  console.log(`Total: ${total}`);
}

run();
