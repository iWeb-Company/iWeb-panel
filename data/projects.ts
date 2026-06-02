import type {
  Delivery,
  GeneralStatusItem,
  Project,
} from "@/types/project";

export const projects: Project[] = [];

export const generalStatus: GeneralStatusItem[] = [
  { label: "Diseño", value: 0 },
  { label: "Desarrollo", value: 0 },
  { label: "Completados", value: 0 },
];

export const deliveries: Delivery[] = [];