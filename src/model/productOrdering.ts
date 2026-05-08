import { Product, ProductTypes } from './ticket';

// Retorna el valor d'ordre rellevant segons el tipus del producte.
// Fa fallback al camp legacy `order_id` per a documents anteriors a la
// separació per tipus, i finalment a 0 per evitar NaN dins el sort.
export const productOrder = (p: Product): number => {
  const typed = p.type === ProductTypes.BARRA ? p.order_barra : p.order_merch;
  if (typeof typed === 'number') return typed;
  if (typeof p.order_id === 'number') return p.order_id;
  return 0;
};

// Ordena estable per `productOrder` ascendent. No muta l'array d'entrada.
export const sortProductsByOrder = (products: Product[]): Product[] => (
  [...products].sort((a, b) => productOrder(a) - productOrder(b))
);

// Retorna el camp d'ordre que cal escriure segons el tipus.
export const orderFieldFor = (type: ProductTypes): 'order_barra' | 'order_merch' => (
  type === ProductTypes.BARRA ? 'order_barra' : 'order_merch'
);
