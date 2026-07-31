export type Plan = "Mensual" | "Inscripción" | "Promoción por pago puntual" | "Semana" | "Quincena" | "Visita";
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
