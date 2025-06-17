export interface Ticket {
  id: string;
  products: { id: number; name: string; quantity: number; price: number }[];
  total: number;
  createdAt: { seconds: number; nanoseconds: number };
}

export interface AggregatedData {
  date: string;
  products: { [productName: string]: number };
  totalMoney: number;
}

export interface Product {
  id: string;
  order_id: number;
  name: string;
  price: number;
  imageUrl: string;
  type: ProductTypes;
}

export enum ProductTypes {
  BARRA = 0,
  MERCHANDISING,
}
/*
* The userfriendly names of \ref ProductTypes
*/
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
