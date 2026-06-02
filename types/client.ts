export type ClientProduct = "Tranett" | "Foonett" | "A medida";

export type ClientStatus = "Activo" | "Inactivo";

export interface Client {
  id: string;
  name: string;
  responsible: string;
  monthly: string;
  product: ClientProduct;
  status: ClientStatus;
}