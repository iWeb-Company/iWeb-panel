"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "ES" | "EN";

const translations = {
  ES: {
    // Login Page
    panelDeControl: "Panel de control",
    secureAccessGateway: "Secure access gateway",
    usuario: "Usuario",
    contrasena: "Contraseña",
    recordarAcceso: "Recordar acceso",
    ingresar: "Ingresar",
    ingresando: "Ingresando...",
    errorLogin: "Usuario o contraseña incorrectos.",
    errorNetwork: "Error de red. No se pudo conectar con el servidor.",

    // Sidebar
    analiticas: "Analíticas",
    clientes: "Clientes",
    proyectos: "Proyectos",
    rendimiento: "Rendimiento",
    marketing: "Agente Marketing",
    controlInterno: "Control interno",
    cerrarSesion: "Cerrar sesión",

    // Topbar
    buscarDatos: "Buscar datos...",
    notificaciones: "Notificaciones",
    centroAlertas: "Centro de alertas",
    cerrar: "Cerrar",

    // Analíticas
    panelInterno: "Panel interno",
    descGeneralOps: "Descripción general de las operaciones globales",
    ingresosEstimados: "Ingresos estimados para el próximo mes",
    previsionCrecimiento: "Previsión de crecimiento",
    tendenciaPositiva: "Tendencia positiva",
    evaluacionRiesgos: "Evaluación de riesgos",
    bajo: "Bajo",
    operacionEstable: "Operación estable",
    crecimientoIngresos: "Crecimiento de Ingresos",
    rendimientoAcumulado: "Rendimiento acumulado anual frente al período anterior",
    vistaMensual: "Vista Mensual",
    vistaAnual: "Vista Anual",
    proyeccionContratos: "Proyección basada en {contracts} contratos recurrentes y {newAcq} nuevas adquisiciones.",
    clientesActivos: "Clientes activos",
    proyectosActivos: "Proyectos activos",
    crecimientoMensual: "Crecimiento mensual",
    tasaRetencion: "Tasa de retención",
    alta: "Alta",
    estable: "Estable",

    // Clientes
    adminComercial: "Administración comercial",
    gestionClientes: "Gestión de Clientes",
    clientesDesc: "Administración de clientes, productos y mensualidades",
    exportarDatos: "Exportar Datos",
    nuevoCliente: "Nuevo Cliente",
    totalClientes: "Total clientes",
    clientesNuevos: "Clientes nuevos",
    facturacionEstimada: "Facturación estimada",
    esteMes: "este mes",
    estePeriodo: "este período",
    vsPreviousMonth: "vs mes anterior",
    todos: "Todos",
    aMedida: "A medida",
    buscarNombreId: "Buscar por nombre o ID...",
    mostrandoClientes: "Mostrando {count} clientes",
    cliente: "Cliente",
    responsable: "Responsable",
    mensualidad: "Mensualidad",
    producto: "Producto",
    estado: "Estado",
    categoria: "Categoría",
    acciones: "Acciones",
    eliminarCliente: "Eliminar cliente",
    eliminarClienteDesc: "Esta acción eliminará a {name}. En producción conviene desactivarlo en vez de borrarlo definitivamente.",
    guardarCliente: "Guardar cliente",
    cancelar: "Cancelar",
    nombre: "Nombre",
    activo: "Activo",
    inactivo: "Inactivo",
    editarCliente: "Editar cliente",
    datosComerciales: "Administrá los datos comerciales del cliente.",
    sinClientes: "No hay clientes registrados.",
    sinProyectos: "No hay proyectos registrados.",
    crearUno: "Crea uno nuevo para comenzar.",


    // Proyectos
    proyecto: "Proyecto",
    entrega: "Entrega",
    seguimientoOperativo: "Seguimiento operativo",
    gestionProyectos: "Gestión de Proyectos",
    proyectosDesc: "Seguimiento operativo de proyectos internos",
    nuevoProyecto: "Nuevo Proyecto",
    prioridad: "Prioridad",
    vencimientos: "Vencimientos",
    faseActual: "Fase actual",
    urgente: "Urgente",
    buscarProyecto: "Buscar proyecto...",
    estadoGeneral: "Estado General",
    proximasEntregas: "Próximas Entregas",
    verCalendario: "Ver Calendario Completo →",
    eliminarProyecto: "Eliminar proyecto",
    eliminarProyectoDesc: "Esta acción eliminará el proyecto {name}. En producción conviene pausarlo o archivarlo antes de borrarlo definitivamente.",
    guardarProyecto: "Guardar proyecto",
    cuit: "CUIT",
    fechaInicio: "Fecha de inicio",
    fechaCobro: "Fecha de cobro",
    fechaFinalizacion: "Fecha de finalización",
    presupuesto: "Presupuesto",
    anticipoPago: "% Anticipo de pago",
    saldoRestante: "Saldo restante",
    mantencion: "Mantención",
    pagoAlDia: "Pago al día",
    dominio: "Dominio",
    deudaDesde: "Deuda desde",
    notas: "Notas",
    contenedoresAsignados: "Contenedores Docker Asignados",
    propietario: "Propietario / Responsable",
    Completado: "Completado",
    "En desarrollo": "En desarrollo",
    Pendiente: "Pendiente",
    "En revisión": "En revisión",
    Pausado: "Pausado",
    FINALIZADO: "FINALIZADO",
    ALTA: "ALTA",
    MEDIA: "MEDIA",
    BAJA: "BAJA",


    // Rendimiento
    monitoreoTecnico: "Monitoreo técnico",
    rendimientoTecnico: "Rendimiento Técnico",
    rendimientoDesc: "Recursos, servicios, backend y contenedores por proyecto",
    exportarLogs: "Exportar Logs",
    cpuGlobal: "CPU Global",
    ramUtilizada: "RAM Utilizada",
    storageIo: "Storage I/O",
    apisActivas: "APIs Activas",
    promedio15m: "32 cores · Promedio 15m",
    historicoRendimiento: "Histórico de Rendimiento",
    historicoDesc: "Movimiento del consumo de CPU y memoria",
    consumidoresPrincipales: "Consumidores Principales",
    proyContAsignados: "Consumo por Proyecto",
    proyContAsignadosDesc: "Hacé click en un proyecto para ver sus contenedores asignados",
    verTodosCont: "Ver todos los contenedores",
    proyectoInstancia: "Proyecto / Instancia",
    cpu: "CPU",
    memoria: "Memoria",
    requests: "Requests",
    verTodo: "Ver todo",
    verLogs: "Ver logs",
    verRecursos: "Ver recursos",
    reiniciarContenedor: "Reiniciar contenedor",
    detenerContenedor: "Detener contenedor",
    reiniciarContenedorDesc: "Vas a reiniciar {name}. Durante unos segundos el servicio puede quedar inaccesible.",
    detenerContenedorDesc: "Vas a detener {name}. Esta acción puede dejar el servicio fuera de línea hasta que vuelva a iniciarse.",
    reiniciar: "Reiniciar",
    detener: "Detener"
  },
  EN: {
    // Login Page
    panelDeControl: "Control panel",
    secureAccessGateway: "Secure access gateway",
    usuario: "Username",
    contrasena: "Password",
    recordarAcceso: "Remember access",
    ingresar: "Log In",
    ingresando: "Logging in...",
    errorLogin: "Incorrect username or password.",
    errorNetwork: "Network error. Could not connect to the server.",

    // Sidebar
    analiticas: "Analytics",
    clientes: "Clients",
    proyectos: "Projects",
    rendimiento: "Performance",
    marketing: "Marketing Agent",
    controlInterno: "Internal control",
    cerrarSesion: "Log out",

    // Topbar
    buscarDatos: "Search data...",
    notificaciones: "Notifications",
    centroAlertas: "Alert center",
    cerrar: "Close",

    // Analíticas
    panelInterno: "Internal panel",
    descGeneralOps: "General overview of global operations",
    ingresosEstimados: "Estimated revenue for next month",
    previsionCrecimiento: "Growth forecast",
    tendenciaPositiva: "Positive trend",
    evaluacionRiesgos: "Risk assessment",
    bajo: "Low",
    operacionEstable: "Stable operation",
    crecimientoIngresos: "Revenue Growth",
    rendimientoAcumulado: "Year-to-date performance vs prior period",
    vistaMensual: "Monthly View",
    vistaAnual: "Annual View",
    proyeccionContratos: "Projection based on {contracts} recurring contracts and {newAcq} new acquisitions.",
    clientesActivos: "Active clients",
    proyectosActivos: "Active projects",
    crecimientoMensual: "Monthly growth",
    tasaRetencion: "Retention rate",
    alta: "High",
    estable: "Stable",

    // Clientes
    adminComercial: "Commercial administration",
    gestionClientes: "Client Management",
    clientesDesc: "Administration of clients, products, and monthly fees",
    exportarDatos: "Export Data",
    nuevoCliente: "New Client",
    totalClientes: "Total clients",
    clientesNuevos: "New clients",
    facturacionEstimada: "Estimated billing",
    esteMes: "this month",
    estePeriodo: "this period",
    vsPreviousMonth: "vs last month",
    todos: "All",
    aMedida: "Custom",
    buscarNombreId: "Search by name or ID...",
    mostrandoClientes: "Showing {count} clients",
    cliente: "Client",
    responsable: "Responsible",
    mensualidad: "Monthly fee",
    producto: "Product",
    status: "Status",
    categoria: "Category",
    acciones: "Actions",
    eliminarCliente: "Delete client",
    eliminarClienteDesc: "This action will delete {name}. In production, it is better to deactivate it instead of deleting it permanently.",
    guardarCliente: "Save client",
    cancelar: "Cancel",
    nombre: "Name",
    activo: "Active",
    inactivo: "Inactive",
    editarCliente: "Edit client",
    datosComerciales: "Manage client's commercial data.",
    sinClientes: "No clients registered.",
    sinProyectos: "No projects registered.",
    crearUno: "Create a new one to get started.",


    // Proyectos
    proyecto: "Project",
    entrega: "Delivery",
    estado: "Status",
    seguimientoOperativo: "Operational tracking",
    gestionProyectos: "Project Management",
    proyectosDesc: "Operational tracking of internal projects",
    nuevoProyecto: "New Project",
    prioridad: "Priority",
    vencimientos: "Expirations",
    faseActual: "Current phase",
    urgente: "Urgent",
    buscarProyecto: "Search project...",
    estadoGeneral: "General Status",
    proximasEntregas: "Upcoming Deliveries",
    verCalendario: "View Full Calendar →",
    eliminarProyecto: "Delete project",
    eliminarProyectoDesc: "This action will delete the project {name}. In production, it is better to pause or archive it before deleting permanently.",
    guardarProyecto: "Save project",
    cuit: "Tax ID (CUIT)",
    fechaInicio: "Start Date",
    fechaCobro: "Billing Date",
    fechaFinalizacion: "End Date",
    presupuesto: "Budget",
    anticipoPago: "Down payment %",
    saldoRestante: "Remaining balance",
    mantencion: "Maintenance fee",
    pagoAlDia: "Payment up to date",
    dominio: "Domain",
    deudaDesde: "Debt since",
    notes: "Notes",
    contenedoresAsignados: "Assigned Docker Containers",
    propietario: "Owner / Responsible",
    Completado: "Completed",
    "En desarrollo": "In development",
    Pendiente: "Pending",
    "En revisión": "In review",
    Pausado: "Paused",
    FINALIZADO: "FINISHED",
    ALTA: "HIGH",
    MEDIA: "MEDIUM",
    BAJA: "LOW",


    // Rendimiento
    monitoreoTecnico: "Technical monitoring",
    rendimientoTecnico: "Technical Performance",
    rendimientoDesc: "Resources, services, backend, and containers per project",
    exportarLogs: "Export Logs",
    cpuGlobal: "Global CPU",
    ramUtilizada: "Used RAM",
    storageIo: "Storage I/O",
    apisActivas: "Active APIs",
    promedio15m: "32 cores · 15m average",
    historicoRendimiento: "Performance History",
    historicoDesc: "CPU and memory consumption trends",
    consumidoresPrincipales: "Top Consumers",
    proyContAsignados: "Consumption by Project",
    proyContAsignadosDesc: "Click on a project to see its assigned containers",
    verTodosCont: "View all containers",
    proyectoInstancia: "Project / Instance",
    cpu: "CPU",
    memoria: "Memory",
    requests: "Requests",
    verTodo: "View all",
    verLogs: "View logs",
    verRecursos: "View resources",
    reiniciarContenedor: "Restart container",
    detenerContenedor: "Stop container",
    reiniciarContenedorDesc: "You are about to restart {name}. The service may become temporarily inaccessible.",
    detenerContenedorDesc: "You are about to stop {name}. This action may take the service offline until it is started again.",
    reiniciar: "Restart",
    detener: "Stop"
  }
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ES");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("iweb_panel_language");
    if (stored === "EN" || stored === "ES") {
      setLanguageState(stored);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("iweb_panel_language", lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === "ES" ? "EN" : "ES";
    setLanguage(nextLang);
  };

  const t = (key: string, replacements?: Record<string, string | number>) => {
    const dict = translations[language] || translations["ES"];
    let text = dict[key as keyof typeof dict];
    if (text === undefined) {
      // Fallback a ES si no está en EN
      const esDict = translations["ES"];
      text = esDict[key as keyof typeof esDict] || key;
    }
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  // Evitar desajustes de hidratación devolviendo un skeleton o hijos directamente
  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
