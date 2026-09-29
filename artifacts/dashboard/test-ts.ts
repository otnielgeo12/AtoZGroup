import { fetchTopSpenders } from './src/lib/crm-api.ts';
async function run() {
  console.log("STARTING");
  try {
    const res = await fetchTopSpenders('2026-06-01', '2026-06-30');
    console.log("RESULT", res);
  } catch(e) {
    console.log("ERROR", e);
  }
}
run();
