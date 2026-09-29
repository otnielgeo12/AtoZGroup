const https = require('https');

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    let req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function test() {
  const auth = "Basic YXBpX2ludGVybmFsOlAzbmFzNHI0bjEwMTAl";
  try {
    console.log("Fetching customer insights...");
    const res = await request("https://apiclone.atozgroupsemarang.com/api/v1/customerInsights?start_date=2026-06-01&end_date=2026-06-30", {
      headers: { "Authorization": auth }
    });
    console.log("Got customer insights, status:", res.status);
    const parsed = JSON.parse(res.data);
    const raw = parsed.data || [];
    console.log("Total records:", raw.length);
    
    raw.sort((a, b) => Number(b.total_spending || 0) - Number(a.total_spending || 0));
    const top10 = raw.slice(0, 10);
    
    for (const item of top10) {
      console.log(`Checking ${item.customer_code}...`);
      const detailRes = await request(`http://atozgroup.tech:3000/api/v1/members/${encodeURIComponent(item.customer_code)}`, {
        headers: { "Authorization": auth }
      });
      console.log(`  -> status: ${detailRes.status}`);
    }
  } catch(e) {
    console.error(e);
  }
}
test();
