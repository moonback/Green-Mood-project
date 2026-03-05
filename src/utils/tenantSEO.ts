import { supabase } from '../lib/supabase';
import { generateCanonical, generateDescription, generateKeywords, generateTitle } from './seo';

export interface TenantStore {
  id: string;
  name: string;
  description: string;
  domain: string;
}

export interface TenantSEO {
  title: string;
  description: string;
  canonical: string;
  keywords: string;
}

export async function getTenantSEO(tenantId: string): Promise<TenantSEO | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('id,name,description,domain')
    .eq('id', tenantId)
    .maybeSingle();

  if (error || !data) return null;

  const store = data as TenantStore;

  return {
    title: generateTitle(`${store.name} | Premium CBD Shop`),
    description: generateDescription(store.description),
    canonical: generateCanonical('/', `https://${store.domain}`),
    keywords: generateKeywords([store.name, 'CBD store', 'CBD boutique']),
  };
}
