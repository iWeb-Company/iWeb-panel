export type ClientProduct = "Tranett" | "Foonett" | "A medida";

export type ClientStatus = "Activo" | "Inactivo";

export interface Client {
  id: string;
  name: string;
  responsible: string;
  monthly: string;
  product: ClientProduct;
  status: ClientStatus;
  slug?: string;
  folder_id?: number;
  cuit?: string | number;
  email?: string;
  login_url?: string;
  admin_username?: string;
  logo_xl?: string;
  logo_s?: string;
}

export interface ProvisioningResult {
  client: Client;
  admin_user: {
    id: string;
    username: string;
    name?: string;
    last_name?: string;
    initial_password?: string;
  };
  login_url: string;
  status: {
    database: string;
    storage: string;
    subdomain: string;
  };
}