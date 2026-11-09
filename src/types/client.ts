
export interface Client {
  _id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ClientInput = Omit<Client, "_id" | "createdAt" | "updatedAt">;
