import type { Plan, Socio } from "../types";
import { DURACION_PLAN_DIAS } from "../types";

export const PLAN_COLOR: Record<Plan, string> = {
  "Mensual": "#3b82f6",
  "Semana": "#10b981",
  "Quincena": "#06b6d4",
  "Visita": "#6b7280",
};

export const PLAN_BG: Record<Plan, string> = {
  "Mensual": "#eff6ff",
  "Semana": "#f0fdf4",
  "Quincena": "#ecfeff",
  "Visita": "#f3f4f6",
};

export const PLANES: Plan[] = ["Mensual", "Semana", "Quincena", "Visita"];

export const nombreCompleto = (m: Pick<Socio, "nombre" | "apellido_paterno" | "apellido_materno">) =>
  [m.nombre, m.apellido_paterno, m.apellido_materno].filter(Boolean).join(" ");

// Vencimiento derivado de creado_en + duración del plan — nunca se guarda en la BD,
// mismo patrón que ya se usó para dejar de guardar fecha_registro/hora_registro.
export const fechaVencimiento = (m: Pick<Socio, "creado_en" | "plan">): Date => {
  const inicio = new Date(m.creado_en);
  const dias = DURACION_PLAN_DIAS[m.plan];
  const venc = new Date(inicio);
  venc.setDate(venc.getDate() + dias);
  return venc;
};

export const formatoVencimiento = (m: Pick<Socio, "creado_en" | "plan">): string =>
  fechaVencimiento(m).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Mexico_City" });

export const planLabel = (m: Pick<Socio, "plan" | "incluye_inscripcion" | "promocion_pago_puntual">): string => {
  const extras = [
    m.incluye_inscripcion ? "Inscripción" : null,
    m.promocion_pago_puntual ? "Promoción por pago puntual" : null,
  ].filter(Boolean);
  return extras.length ? `${m.plan} (+ ${extras.join(", ")})` : m.plan;
};

export const esNuevo = (m: Socio) => Date.now() - new Date(m.creado_en).getTime() < 24 * 60 * 60 * 1000;

export const inicial = (nombre: string) => (nombre ? nombre[0].toUpperCase() : "?");

export const fechaHoraRegistro = (creadoEn: string) => {
  const d = new Date(creadoEn);
  return {
    fecha: d.toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" }),
    hora: d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" }),
  };
};
