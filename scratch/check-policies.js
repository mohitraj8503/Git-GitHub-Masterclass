const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const host = 'db.avaopnovlvhkxoskcxiu.supabase.co';
const password = 'Mohit@123';

async function run() {
  console.log(`Connecting to pg host...`);
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
    console.log("Connected successfully!\n");

    // Check table RLS status
    console.log("Checking RLS status of tables:");
    const tablesRes = await client.query(`
      SELECT schemaname, tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename IN ('attendance', 'attendance_windows', 'registrations');
    `);
    console.table(tablesRes.rows);

    // Check policies
    console.log("\nChecking Policies on tables:");
    const policiesRes = await client.query(`
      SELECT tablename, policyname, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename IN ('attendance', 'attendance_windows', 'registrations');
    `);
    console.table(policiesRes.rows);

    await client.end();
  } catch (err) {
    console.error("Failed:", err.message);
  }
}

run();
