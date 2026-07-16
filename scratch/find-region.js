const { Client } = require('pg');

const regions = [
  'ap-southeast-2',
  'ap-south-1',
  'us-east-1',
  'us-west-1',
  'ap-southeast-1',
  'eu-central-1',
  'eu-west-1'
];
const password = 'Github@2026';
const user = 'postgres.avaopnovlvhkxoskcxiu';
const port = 6543;

async function testRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  console.log(`Testing region ${region} (${host})...`);
  const client = new Client({
    host: host,
    port: port,
    database: 'postgres',
    user: user,
    password: password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000
  });

  try {
    await client.connect();
    console.log(`🎉 SUCCESS! Region ${region} connected!`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`❌ Region ${region} failed:`, err.message);
    await client.end().catch(() => {});
    return false;
  }
}

async function main() {
  for (const r of regions) {
    const ok = await testRegion(r);
    if (ok) {
      break;
    }
  }
}

main();
