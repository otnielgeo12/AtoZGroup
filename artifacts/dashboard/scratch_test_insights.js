const username = "atoz";
const password = "Atoz2026%";
const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

async function testRange(label, start, end) {
  const url = `https://apicrm.apicrmatoz.online/api/v1/customerInsights?start_date=${start}&end_date=${end}`;
  console.log(`\n${label}: ${start} to ${end}`);
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'Authorization': authHeader },
      signal: AbortSignal.timeout(60000),
    });
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`  Status: ${res.status} (${elapsed}s)`);
    if (res.ok) {
      const json = await res.json();
      const count = Array.isArray(json.data) ? json.data.length : 0;
      console.log(`  Records: ${count}`);
      if (count > 0) {
        console.log(`  Sample outlet: ${json.data[0].outlet}`);
        console.log(`  Sample spending: ${json.data[0].total_spending}`);
      }
    } else {
      const text = await res.text();
      console.log(`  Error body: ${text.substring(0, 200)}`);
    }
  } catch(e) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`  Error (${elapsed}s): ${e.message}`);
  }
}

async function run() {
  // Test progressively wider ranges
  await testRange("1 week", "2026-06-01", "2026-06-07");
  await testRange("1 month", "2026-05-01", "2026-06-01");
  await testRange("3 months", "2026-03-01", "2026-06-13");
  await testRange("6 months", "2025-12-01", "2026-06-13");
  await testRange("1 year", "2025-06-01", "2026-06-13");
}

run();
