import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supaUrl = process.env.VITE_SUPABASE_URL!;
const supaKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supaUrl, supaKey);

async function list() {
    const { data, error } = await supabase.rpc('match_products', {
        query_embedding: new Array(768).fill(0),
        match_threshold: 0,
        match_count: 1
    });
    console.log('match_products exists?', !error);
}

list();
