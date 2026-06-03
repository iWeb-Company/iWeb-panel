-- Schema and seed data for iWeb Control Panel SQLite Database

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  responsible TEXT NOT NULL,
  monthly TEXT NOT NULL,
  product TEXT NOT NULL,
  status TEXT NOT NULL
);

-- Seed initial clients
INSERT OR IGNORE INTO clients (id, name, responsible, monthly, product, status) VALUES 
('c1', 'Tranett SRL', 'Valentín', 'ARS 250.000', 'Tranett', 'Activo'),
('c2', 'Foonett Corp', 'Facundo', 'ARS 180.000', 'Foonett', 'Activo'),
('c3', 'Vitalis Group', 'Tomás', 'ARS 320.000', 'A medida', 'Activo');

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  priority TEXT NOT NULL,
  responsible TEXT NOT NULL,
  cuit TEXT NOT NULL,
  status TEXT NOT NULL,
  startDate TEXT NOT NULL,
  billingDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  budget TEXT NOT NULL,
  advancePercent TEXT NOT NULL,
  remainingBalance TEXT NOT NULL,
  maintenance TEXT NOT NULL,
  paymentUpToDate TEXT NOT NULL,
  domain TEXT NOT NULL,
  debtSince TEXT NOT NULL,
  notes TEXT NOT NULL,
  containerIds TEXT NOT NULL,
  category TEXT NOT NULL
);

-- Seed initial projects
INSERT OR IGNORE INTO projects (
  id, name, priority, responsible, cuit, status, startDate, billingDate, endDate,
  budget, advancePercent, remainingBalance, maintenance, paymentUpToDate, domain,
  debtSince, notes, containerIds, category
) VALUES 
(
  'p1', 
  'Tranett Web', 
  'ALTA', 
  'Valentín', 
  '30-71584930-9', 
  'En desarrollo', 
  '2026-01-15', 
  '2026-06-05', 
  '2026-08-30', 
  'ARS 1.500.000', 
  '60', 
  'ARS 600.000', 
  'ARS 45.000', 
  'SI', 
  'tranett.com.ar', 
  '', 
  'Migración completa de frontend y base de datos.', 
  '["tranett-web","tranett-api","tranett-db"]', 
  'Web/App'
),
(
  'p2', 
  'Foonett API', 
  'MEDIA', 
  'Facundo', 
  '30-58473920-5', 
  'En desarrollo', 
  '2026-02-10', 
  '2026-06-12', 
  '2026-07-20', 
  'ARS 1.200.000', 
  '80', 
  'ARS 240.000', 
  'ARS 35.000', 
  'SI', 
  'foonett.io', 
  '', 
  'Desarrollo de API de integración bancaria.', 
  '["foonett-frontend","foonett-backend"]', 
  'API Service'
),
(
  'p3', 
  'Vitalis Portal', 
  'ALTA', 
  'Tomás', 
  '27-48392019-3', 
  'En revisión', 
  '2026-03-01', 
  '2026-05-10', 
  '2026-06-15', 
  'ARS 2.000.000', 
  '75', 
  'ARS 500.000', 
  'ARS 50.000', 
  'NO', 
  'vitalis.com', 
  '2026-05-10', 
  'Falta cobro de hito de entrega de diseño y pruebas.', 
  '["vitalis-web","vitalis-api"]', 
  'Portal Médico'
);
