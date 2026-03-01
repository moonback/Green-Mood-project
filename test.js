import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
    const { data, error } = await supabase.from('orders').select('*, order_items(*), profile:profiles(*, addresses(*)), address:addresses(*)').limit(1);
    console.log(JSON.stringify({ data, error }, null, 2));
}
run();
