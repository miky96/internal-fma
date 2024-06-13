export interface Ticket {
  id: string;
  products: { id: number; name: string; quantity: number; price: number }[];
  total: number;
  createdAt: { seconds: number; nanoseconds: number };
}

export interface AggregatedData {
  date: string;
  products: { [productName: string]: number };
}


export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

export interface TicketItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}
