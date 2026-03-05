import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

async function check() {
    const { data: categories } = await supabase.from('categories').select('*');
    console.log('Categories slugs:', categories?.map(c => c.slug));

    const { data: products } = await supabase.from('products').select('name, weight_grams, category_id');
    console.log('Products sample:', products?.slice(0, 5));
}

check();
