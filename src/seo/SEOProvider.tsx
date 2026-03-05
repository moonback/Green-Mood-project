import { createContext, ReactNode, useMemo } from 'react';
import { localBusinessSchema, organizationSchema, websiteSchema } from '../lib/seo/schemaBuilder';

interface SEOProviderValue {
  defaultSchemas: object[];
}

export const SEOContext = createContext<SEOProviderValue>({ defaultSchemas: [] });

export function SEOProvider({ children }: { children: ReactNode }) {
  const value = useMemo(
    () => ({
      defaultSchemas: [organizationSchema(), websiteSchema(), localBusinessSchema()],
    }),
    [],
  );

  return <SEOContext.Provider value={value}>{children}</SEOContext.Provider>;
}
