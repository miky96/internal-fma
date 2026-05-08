export interface Ticket {
  id: string;
  products: { id: number; name: string; quantity: number; price: number }[];
  total: number;
  createdAt: { seconds: number; nanoseconds: number };
  // Camps denormalitzats afegits per permetre queries directes per dia/any.
  // Poden no existir en tickets antics fins que s'hagi executat la migracio.
  businessDate?: string; // YYYY-MM-DD del dia de venda (tall a les 5h)
  year?: number;         // any del dia de venda
}

export interface AggregatedData {
  date: string;
  products: { [productName: string]: number };
  totalMoney: number;
}

export interface Product {
  id: string;
  // Camp legacy: ordre global del producte. Es mante com a fallback per a
  // documents creats abans de la separacio per tipus.
  order_id?: number;
  // Ordre dins de la pestanya de Barra. Nomes te sentit si type === BARRA.
  order_barra?: number;
  // Ordre dins de la pestanya de Merchandising. Nomes te sentit si type === MERCHANDISING.
  order_merch?: number;
  name: string;
  price: number;
  imageUrl: string;
  type: ProductTypes;
}

export enum ProductTypes {
  BARRA = 0,
  MERCHANDISING,
}

// The userfriendly names of ProductTypes
export const ProductTypesNames: { [key in ProductTypes]: string } = {
  [ProductTypes.BARRA]: 'BARRA',
  [ProductTypes.MERCHANDISING]: 'MERCHANDISING',
};

export const renderProjectStatus = (status: ProductTypes) => {
  const typeName = ProductTypesNames[status];
  return typeName !== undefined ? typeName : 'Unknown type';
};

export interface TicketItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}
