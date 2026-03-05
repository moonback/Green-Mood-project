import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

async function check() {
    console.log('--- DB VECTOR CHECK ---');

    // Check total products
    const { count: total, error: err1 } = await supabase.from('products').select('*', { count: 'exact', head: true });
    console.log('Total products:', total);
    if (err1) console.error('Error total:', err1);

    // Check with embedding
    // In PostgREST, filter for not null is .not('column', 'is', null) or .neq('column', null)
    const { data: withEmb, error: err2 } = await supabase.from('products').select('name').not('embedding', 'is', null).limit(5);
    console.log('Sample products WITH embedding:', withEmb?.map(p => p.name));
    if (err2) console.error('Error withEmb:', err2);

    const { count: withEmbCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).not('embedding', 'is', null);
    console.log('Total products WITH embedding:', withEmbCount);

    const { count: withoutEmbCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).is('embedding', null);
    console.log('Total products WITHOUT embedding:', withoutEmbCount);
}

check();
