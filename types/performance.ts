export type TechnicalStatus =
  | "Running"
  | "Starting"
  | "Exited"
  | "Stopped";

export interface TechnicalContainer {
  id: string;
  name: string;
  hash: string;
  status: TechnicalStatus;
  cpu: string;
  memory: string;
  requests: string;
  image: string;
  lastDeploy: string;
}

export interface TechnicalProject {
  id: string;
  name: string;
  type: string;
  status: TechnicalStatus;
  cpu: string;
  memory: string;
  requests: string;
  containers: TechnicalContainer[];
}