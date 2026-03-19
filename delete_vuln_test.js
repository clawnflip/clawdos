import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hgdaqhswimnltndrajeg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZGFxaHN3aW1ubHRuZHJhamVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDk4OTgsImV4cCI6MjA4NTk4NTg5OH0.SoC4vPIIgsEZ9QJWYz2LWQ-Ib4EtebAmNWCVKB3gsh4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Fetching mini apps to find vuln_test...");
  const { data, error } = await supabase.from('mini_apps').select('*').ilike('name', '%vuln%');
  
  if (error) {
    console.error("Error fetching:", error);
    return;
  }
  
  console.log("Found:", data.map(d => ({id: d.id, name: d.name})));
  
  if (data && data.length > 0) {
    console.log(`Deleting ${data.length} records...`);
    for (let record of data) {
       const { error: delError } = await supabase.from('mini_apps').delete().eq('id', record.id);
       if (delError) {
         console.error(`Failed to delete ID ${record.id}:`, delError);
       } else {
         console.log(`Deleted ID ${record.id} (${record.name})`);
       }
    }
  } else {
    console.log("No vuln_test found in mini_apps name.");
  }
}

main();
