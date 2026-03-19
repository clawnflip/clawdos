import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://hgdaqhswimnltndrajeg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZGFxaHN3aW1ubHRuZHJhamVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDk4OTgsImV4cCI6MjA4NTk4NTg5OH0.SoC4vPIIgsEZ9QJWYz2LWQ-Ib4EtebAmNWCVKB3gsh4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('mini_apps').select('*');
  if (error) {
    fs.writeFileSync('apps_output.json', JSON.stringify({error}));
    return;
  }
  fs.writeFileSync('apps_output.json', JSON.stringify(data, null, 2));
}

main();
