const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Parse .env
const envPath = path.join(__dirname, '..', '.env');
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

// Extract project ref from SUPABASE_URL: https://<project-ref>.supabase.co
const supabaseUrl = env['SUPABASE_URL'] || '';
const projectRefMatch = supabaseUrl.match(/https:\/\/([\w-]+)\.supabase\.co/);
const projectRef = projectRefMatch ? projectRefMatch[1] : '';

if (!projectRef) {
  console.error("Could not parse project reference from SUPABASE_URL");
  process.exit(1);
}

const host = `db.${projectRef}.supabase.co`;
const password = 'Mohit@123'; // Password used in the create-table script

async function run() {
  console.log(`Connecting to postgres://${host}:5432/postgres...`);
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
    console.log("Connected successfully!");

    // 1. Create unique index on xp_transactions
    console.log("Creating unique index on xp_transactions...");
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS xp_transactions_unique_action
      ON xp_transactions (enrollment_number, action_type, COALESCE(reference_id, ''));
    `);
    console.log("Unique index created successfully.");

    // 2. Create increment_xp RPC function
    console.log("Creating increment_xp RPC function...");
    await client.query(`
      CREATE OR REPLACE FUNCTION increment_xp(p_enrollment text, p_amount int)
      RETURNS void AS $$
        UPDATE registrations
        SET total_xp = COALESCE(total_xp, 0) + p_amount
        WHERE UPPER(TRIM(enrollment_number)) = UPPER(TRIM(p_enrollment));
      $$ LANGUAGE sql;
    `);
    console.log("increment_xp RPC function created successfully.");

    await client.end();
    console.log("Database update completed!");
  } catch (err) {
    console.error("Database update failed:", err.message);
  }
}

run();
