
export interface Ticket {
  id: string;
  products: { id: number; name: string; quantity: number; price: number }[];
  total: number;
  createdAt: { seconds: number; nanoseconds: number };
}

export interface TicketLine {
  
}

export interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}