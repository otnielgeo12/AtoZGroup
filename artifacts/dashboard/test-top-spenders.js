require('ts-node').register({
  compilerOptions: {
    module: 'commonjs'
  }
});
const { fetchTopSpenders } = require('./src/lib/crm-api.ts');

async function test() {
  try {
    const res = await fetchTopSpenders('2026-06-01', '2026-06-30');
    console.log(res);
  } catch (e) {
    console.error("ERROR", e);
  }
}
test();
