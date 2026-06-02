import type { Client } from "@/types/client";
import type { Project } from "@/types/project";

const CLIENTS_KEY = "iweb_panel_clients";
const PROJECTS_KEY = "iweb_panel_projects";

// One-time cleanup to remove old mock data from the browser storage
if (typeof window !== "undefined") {
  const clearedKey = "iweb_mock_data_cleared_v3";
  if (!localStorage.getItem(clearedKey)) {
    localStorage.removeItem(CLIENTS_KEY);
    localStorage.removeItem(PROJECTS_KEY);
    localStorage.setItem(clearedKey, "true");
  }
}

export function getStoredClients(): Client[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(CLIENTS_KEY);
    if (!data) {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading clients from localStorage:", error);
    return [];
  }
}

export function setStoredClients(clients: Client[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  } catch (error) {
    console.error("Error writing clients to localStorage:", error);
  }
}

export function getStoredProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(PROJECTS_KEY);
    if (!data) {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading projects from localStorage:", error);
    return [];
  }
}

export function setStoredProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Error writing projects to localStorage:", error);
  }
}

