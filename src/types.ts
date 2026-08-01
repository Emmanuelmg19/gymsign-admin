export type Plan = "Mensual" | "Semana" | "Quincena" | "Visita";

// Duración de cada plan en días, usada para calcular la fecha de vencimiento
// derivada de creado_en (no se guarda en la base de datos, igual que se hizo
// con fecha_registro/hora_registro — se deriva siempre de creado_en).
export const DURACION_PLAN_DIAS: Record<Plan, number> = {
  Mensual: 30,
  Quincena: 15,
  Semana: 7,
  Visita: 1,
};
export type EstadoMX =
  | "Aguascalientes" | "Baja California" | "Baja California Sur" | "Campeche" | "Chiapas"
  | "Chihuahua" | "Ciudad de México" | "Coahuila" | "Colima" | "Durango" | "Guanajuato"
  | "Guerrero" | "Hidalgo" | "Jalisco" | "México" | "Michoacán" | "Morelos" | "Nayarit"
  | "Nuevo León" | "Oaxaca" | "Puebla" | "Querétaro" | "Quintana Roo" | "San Luis Potosí"
  | "Sinaloa" | "Sonora" | "Tabasco" | "Tamaulipas" | "Tlaxcala" | "Veracruz" | "Yucatán" | "Zacatecas";
export const ESTADOS_MX: EstadoMX[] = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Guanajuato",
  "Guerrero", "Hidalgo", "Jalisco", "México", "Michoacán", "Morelos", "Nayarit",
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
];
export type TipoIdentificacion = "INE" | "CURP" | "Pasaporte" | "Licencia" | "Visa";

export interface Socio {
  id: string;
  folio: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  tipo_identificacion: TipoIdentificacion;
  numero_identificacion: string;
  direccion: string | null;
  estado: string;
  municipio: string;
  contacto_emergencia: string | null;
  telefono_emergencia: string | null;
  padecimiento: string | null;
  plan: Plan;
  incluye_inscripcion: boolean;
  promocion_pago_puntual: boolean;
  es_menor: boolean;
  tutor_id: string | null;
  firma_path: string | null;
  contrato_aceptado: boolean;
  contrato_aceptado_en: string | null;
  creado_por: string | null;
  creado_en: string;
  actualizado_en: string;
  eliminado_en: string | null;
  eliminado_por: string | null;
}

export interface Tutor {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string | null;
  parentesco: string | null;
  tipo_identificacion: TipoIdentificacion;
  numero_identificacion: string;
}

export interface UsuarioStaff {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: "staff" | "admin";
  activo: boolean;
}
