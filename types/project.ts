export type ProjectPriority = "FINALIZADO" | "ALTA" | "MEDIA" | "BAJA";

export type ProjectStatus =
  | "Completado"
  | "En desarrollo"
  | "Pendiente"
  | "En revisión"
  | "Pausado";

export interface Project {
  id: string;
  name: string;
  priority: ProjectPriority;
  responsible: string;
  cuit: string;
  status: ProjectStatus;
  startDate: string;
  billingDate: string;
  endDate: string;
  budget: string;
  advancePercent: string;
  remainingBalance: string;
  maintenance: string;
  paymentUpToDate: "SI" | "NO";
  domain: string;
  debtSince: string;
  notes: string;
  containerIds: string[];
  category: string;
}

export interface GeneralStatusItem {
  label: string;
  value: number;
}

export interface Delivery {
  project: string;
  description: string;
  day: string;
  month: string;
  urgent: boolean;
}