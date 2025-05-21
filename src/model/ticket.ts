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
}

export interface TicketItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}
