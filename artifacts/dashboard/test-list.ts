import { listCustomers } from './src/lib/crm-api';

async function run() {
  const params = { skip: 0, take: 5 };
  try {
    const res = await listCustomers(params, () => Promise.resolve('test'));
    console.log("Customers length:", res.length);
    console.log("Total Count attached:", (res as any).totalCount);
  } catch (err) {
    console.error(err);
  }
}
run();
