
export interface PredefinedClient {
  name: string;
  code: string | null;
}

export const PREDEFINED_CLIENTS: PredefinedClient[] = [
  { name: 'Ed. Beaumont', code: '1847' },
  { name: 'Ed. Bordeaux', code: '2037' },
  { name: 'Ed. Avenida Escritório', code: '2216' },
  { name: 'Jesuino CO.', code: '2344' },
  { name: 'Ed. Lile', code: null }, // Código a ser preenchido manualmente
  { name: 'Ed. Miami', code: '1490' },
  { name: 'Ed. Montpellier', code: '1112' },
  { name: 'R. Trade Center', code: '547' },
  { name: 'Cond. Terrazzo Residenziale', code: '596' },
  { name: 'Ed. Toulon', code: '586' },
  { name: 'Up. Residence', code: '426' },
];
