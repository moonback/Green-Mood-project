import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

async function check() {
    const { data: products } = await supabase.from('products').select('name, weight_grams, category:categories(slug)').limit(20);
    console.log('Products with categories:', products);
}

check();
