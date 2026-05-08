import { describe, it, expect } from 'vitest';
import {
  productOrder,
  sortProductsByOrder,
  orderFieldFor,
} from '../productOrdering';
import { Product, ProductTypes } from '../ticket';

const mkProd = (overrides: Partial<Product>): Product => ({
  id: overrides.id ?? 'x',
  name: overrides.name ?? 'p',
  price: overrides.price ?? 1,
  imageUrl: '',
  type: overrides.type ?? ProductTypes.BARRA,
  ...overrides,
});

describe('productOrder', () => {
  it('per a BARRA usa order_barra si esta definit', () => {
    const p = mkProd({ type: ProductTypes.BARRA, order_barra: 3, order_id: 99 });
    expect(productOrder(p)).toBe(3);
  });

  it('per a MERCHANDISING usa order_merch si esta definit', () => {
    const p = mkProd({ type: ProductTypes.MERCHANDISING, order_merch: 7, order_id: 99 });
    expect(productOrder(p)).toBe(7);
  });

  it('fa fallback a order_id legacy si no hi ha order_barra (BARRA)', () => {
    const p = mkProd({ type: ProductTypes.BARRA, order_id: 5 });
    expect(productOrder(p)).toBe(5);
  });

  it('fa fallback a order_id legacy si no hi ha order_merch (MERCHANDISING)', () => {
    const p = mkProd({ type: ProductTypes.MERCHANDISING, order_id: 8 });
    expect(productOrder(p)).toBe(8);
  });

  it('retorna 0 si cap camp d\'ordre esta definit', () => {
    const p = mkProd({ type: ProductTypes.BARRA });
    expect(productOrder(p)).toBe(0);
  });

  it('NO usa order_merch quan el tipus es BARRA', () => {
    const p = mkProd({ type: ProductTypes.BARRA, order_merch: 99 });
    expect(productOrder(p)).toBe(0);
  });
});

describe('sortProductsByOrder', () => {
  it('ordena ascendent dins una llista de BARRA', () => {
    const list: Product[] = [
      mkProd({ id: 'a', type: ProductTypes.BARRA, order_barra: 3 }),
      mkProd({ id: 'b', type: ProductTypes.BARRA, order_barra: 1 }),
      mkProd({ id: 'c', type: ProductTypes.BARRA, order_barra: 2 }),
    ];
    expect(sortProductsByOrder(list).map((p) => p.id)).toEqual(['b', 'c', 'a']);
  });

  it('ordena ascendent dins una llista de MERCHANDISING', () => {
    const list: Product[] = [
      mkProd({ id: 'a', type: ProductTypes.MERCHANDISING, order_merch: 5 }),
      mkProd({ id: 'b', type: ProductTypes.MERCHANDISING, order_merch: 0 }),
    ];
    expect(sortProductsByOrder(list).map((p) => p.id)).toEqual(['b', 'a']);
  });

  it('no muta l\'array d\'entrada', () => {
    const list: Product[] = [
      mkProd({ id: 'a', order_barra: 2 }),
      mkProd({ id: 'b', order_barra: 1 }),
    ];
    const before = [...list];
    sortProductsByOrder(list);
    expect(list).toEqual(before);
  });

  it('barreja correctament order_barra i fallback order_id', () => {
    const list: Product[] = [
      mkProd({ id: 'a', type: ProductTypes.BARRA, order_id: 5 }),
      mkProd({ id: 'b', type: ProductTypes.BARRA, order_barra: 2 }),
      mkProd({ id: 'c', type: ProductTypes.BARRA, order_barra: 8 }),
    ];
    expect(sortProductsByOrder(list).map((p) => p.id)).toEqual(['b', 'a', 'c']);
  });
});

describe('orderFieldFor', () => {
  it('retorna order_barra per a BARRA', () => {
    expect(orderFieldFor(ProductTypes.BARRA)).toBe('order_barra');
  });
  it('retorna order_merch per a MERCHANDISING', () => {
    expect(orderFieldFor(ProductTypes.MERCHANDISING)).toBe('order_merch');
  });
});
