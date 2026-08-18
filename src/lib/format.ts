import type { Socio } from "../types";

export const nombreCompleto = (m: Pick<Socio, "nombre" | "apellido_paterno" | "apellido_materno">) =>
  [m.nombre, m.apellido_paterno, m.apellido_materno].filter(Boolean).join(" ");

export const esNuevo = (m: Socio) => Date.now() - new Date(m.creado_en).getTime() < 24 * 60 * 60 * 1000;

export const inicial = (nombre: string) => (nombre ? nombre[0].toUpperCase() : "?");

export const fechaHoraRegistro = (creadoEn: string) => {
  const d = new Date(creadoEn);
  return {
    fecha: d.toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" }),
    hora: d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" }),
  };
};
