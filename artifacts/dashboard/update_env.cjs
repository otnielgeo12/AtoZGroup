const fs = require('fs');

let env = fs.readFileSync('.env', 'utf8');
env = env.replace(/VITE_CRM_API_URL=.*/, 'VITE_CRM_API_URL=http://atozgroup.tech:3000');
if (!env.includes('VITE_OUTLET_ID=')) {
    env += '\nVITE_OUTLET_ID=atoz';
}
if (!env.includes('VITE_WA_API_URL=')) {
    env += '\nVITE_WA_API_URL=https://apiwa.atozgroupsemarang.com';
}
fs.writeFileSync('.env', env);

let envProd = fs.readFileSync('.env.production', 'utf8');
envProd = envProd.replace(/VITE_CRM_API_URL=.*/, 'VITE_CRM_API_URL=http://atozgroup.tech:3000');
if (!envProd.includes('VITE_OUTLET_ID=')) {
    envProd += '\nVITE_OUTLET_ID=atoz';
}
if (!envProd.includes('VITE_WA_API_URL=')) {
    envProd += '\nVITE_WA_API_URL=https://apiwa.atozgroupsemarang.com';
}
fs.writeFileSync('.env.production', envProd);
