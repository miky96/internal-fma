
export interface Product {
  id: string;
  name: string;
  quantity: number;
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
}