const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("Fetching all emails...");
  const { data: regs, error } = await supabase
    .from('registrations')
    .select('email, name')
    .order('name', { ascending: true });
    
  if (error) {
    console.error("Error fetching registrations:", error);
    process.exit(1);
  }
  
  const emails = regs.map(r => `${r.email} (${r.name})`).join('\n');
  const pureEmails = regs.map(r => r.email).filter(Boolean);
  
  fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'emails_with_names.txt'), emails, 'utf8');
  fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'emails.txt'), pureEmails.join('\n'), 'utf8');
  
  console.log(`\nExtracted ${pureEmails.length} emails successfully!`);
}

main();
