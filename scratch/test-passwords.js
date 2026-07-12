const { Client } = require('pg');

const host = 'db.avaopnovlvhkxoskcxiu.supabase.co';
const passwords = [
  'ArkaJain@2026',
  'ArkaJain@123',
  'aju@123',
  'AJU@123',
  'AJU@2026',
  'aju@2026',
  'Masterclass@2026',
  'Masterclass@123',
  'Mohitraj@2026',
  'Mohit@2026',
  'Mohitraj@1234',
  'Github@2026',
];

async function testPasswords() {
  for (const password of passwords) {
    console.log(`Trying password: ${password}...`);
    const client = new Client({
      host: host,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: password,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log(`🎉 SUCCESS! Password is: ${password}`);
      await client.end();
      return;
    } catch (err) {
      console.error(`Failed with password ${password}:`, err.message);
    }
  }
}

testPasswords();
