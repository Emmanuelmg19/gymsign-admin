import { useState, useRef, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";
import type { Plan, Socio, TipoIdentificacion, Tutor } from "./types";
import { buildAvisoPrivacidad, buildConsentimientoAdulto, buildConsentimientoMenor, fechaContratoMX, nombreCompletoSocio } from "./contrato";

const STEPS = ["Datos del Socio", "Contrato & T&C", "Firma Digital", "Confirmación"];
const PLANES: Plan[] = ["Mensual", "Inscripción", "Promoción por pago puntual", "Semana", "Quincena", "Visita"];
const IDENTIFICACIONES: TipoIdentificacion[] = ["INE", "CURP", "Pasaporte", "Licencia", "Visa"];
const ESTADOS_MX = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Guanajuato",
  "Guerrero", "Hidalgo", "Jalisco", "México", "Michoacán", "Morelos", "Nayarit",
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
];
const MESES = [
  ["01", "Enero"], ["02", "Febrero"], ["03", "Marzo"], ["04", "Abril"],
  ["05", "Mayo"], ["06", "Junio"], ["07", "Julio"], ["08", "Agosto"],
  ["09", "Septiembre"], ["10", "Octubre"], ["11", "Noviembre"], ["12", "Diciembre"],
] as const;
const ANIO_ACTUAL = new Date().getFullYear();
const DIAS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const ANIOS = Array.from({ length: 100 }, (_, i) => String(ANIO_ACTUAL - i));

interface FieldProps {
  label: string; name: string; type?: string; options?: string[]; required?: boolean;
  value: string; onChange: (name: string, value: string) => void; onBlur?: () => void; error?: string;
}
const Field = ({ label, name, type = "text", options, required, value, onChange, onBlur, error }: FieldProps) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
    </label>
    {options ? (
      <select value={value} onChange={e => onChange(name, e.target.value)}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${error ? "#ef4444" : "#e5e7eb"}`, fontSize: 15, background: "#fff", color: "#111827", outline: "none" }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={e => onChange(name, e.target.value)} onBlur={onBlur}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${error ? "#ef4444" : "#e5e7eb"}`, fontSize: 15, background: "#fff", color: "#111827", outline: "none", boxSizing: "border-box" }} />
    )}
    {error && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 3 }}>{error}</p>}
  </div>
);

interface FormState {
  nombre: string; apellidoPaterno: string; apellidoMaterno: string;
  email: string; telefono: string;
  fechaDia: string; fechaMes: string; fechaAnio: string; fechaNacimiento: string;
  tipoIdentificacion: TipoIdentificacion; numeroIdentificacion: string;
  direccion: string; estado: string; municipio: string;
  contactoEmergencia: string; telefonoEmergencia: string;
  plan: Plan; padecimiento: string;
  tutorNombre: string; tutorApellido: string; tutorTelefono: string; tutorParentesco: string;
  tutorTipoIdentificacion: TipoIdentificacion; tutorNumeroIdentificacion: string;
}
const initialForm: FormState = {
  nombre: "", apellidoPaterno: "", apellidoMaterno: "", email: "", telefono: "",
  fechaDia: "", fechaMes: "", fechaAnio: "", fechaNacimiento: "",
  tipoIdentificacion: "INE", numeroIdentificacion: "",
  direccion: "", estado: "Hidalgo", municipio: "",
  contactoEmergencia: "", telefonoEmergencia: "", plan: "Mensual", padecimiento: "",
  tutorNombre: "", tutorApellido: "", tutorTelefono: "", tutorParentesco: "",
  tutorTipoIdentificacion: "INE", tutorNumeroIdentificacion: "",
};

function calcularEdad(fechaNacimiento: string): number | null {
  if (!fechaNacimiento) return null;
  const nacimiento = new Date(fechaNacimiento + "T00:00:00");
  if (Number.isNaN(nacimiento.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
}
function formatoFechaMX(fechaISO: string): string {
  if (!fechaISO) return "—";
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}

export default function NuevoSocio({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [accepted, setAccepted] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [duplicadoAviso, setDuplicadoAviso] = useState(false);
  const [checkingDup, setCheckingDup] = useState(false);
  const [savedSocio, setSavedSocio] = useState<Socio | null>(null);
  const [savedTutor, setSavedTutor] = useState<Tutor | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (form.fechaDia && form.fechaMes && form.fechaAnio) {
      const iso = `${form.fechaAnio}-${form.fechaMes}-${form.fechaDia}`;
      setForm(f => (f.fechaNacimiento === iso ? f : { ...f, fechaNacimiento: iso }));
    } else if (form.fechaNacimiento) {
      setForm(f => ({ ...f, fechaNacimiento: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.fechaDia, form.fechaMes, form.fechaAnio]);

  const esMenor = useMemo(() => {
    const edad = calcularEdad(form.fechaNacimiento);
    return edad !== null && edad < 18;
  }, [form.fechaNacimiento]);

  useEffect(() => {
    if (step !== 2) return;
    setTimeout(() => {
      const c = canvasRef.current; if (!c) return;
      const ctx = c.getContext("2d"); if (!ctx) return;
      ctx.fillStyle = "#f9fafb"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
    }, 100);
  }, [step]);

  const getPos = (e: any, canvas: HTMLCanvasElement) => {
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width, sy = canvas.height / r.height;
    if (e.touches) return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy };
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  };
  const startDraw = (e: any) => { e.preventDefault(); drawing.current = true; lastPos.current = getPos(e, canvasRef.current!); };
  const draw = (e: any) => {
    e.preventDefault(); if (!drawing.current) return;
    const c = canvasRef.current!, ctx = c.getContext("2d")!, p = getPos(e, c);
    ctx.beginPath(); ctx.moveTo(lastPos.current!.x, lastPos.current!.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    lastPos.current = p; setSigned(true);
  };
  const stopDraw = (e: any) => { e.preventDefault(); drawing.current = false; };
  const clearCanvas = () => {
    const c = canvasRef.current!, ctx = c.getContext("2d")!;
    ctx.fillStyle = "#f9fafb"; ctx.fillRect(0, 0, c.width, c.height); setSigned(false);
  };

  const nombreCompleto = () => [form.nombre, form.apellidoPaterno, form.apellidoMaterno].filter(Boolean).join(" ");

  const validateStep0 = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim()) e.nombre = "Requerido";
    if (!form.apellidoPaterno.trim()) e.apellidoPaterno = "Requerido";
    if (!form.email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Email inválido";
    if (!/^\d{10}$/.test(form.telefono.trim())) e.telefono = "Debe tener 10 dígitos";
    if (!form.fechaDia || !form.fechaMes || !form.fechaAnio) e.fechaNacimiento = "Requerido";
    else {
      const hoy = new Date().toISOString().split("T")[0];
      if (form.fechaNacimiento > hoy) e.fechaNacimiento = "No puede ser una fecha futura";
    }
    if (!form.numeroIdentificacion.trim()) e.numeroIdentificacion = "Requerido";
    if (!form.municipio.trim()) e.municipio = "Requerido";
    if (form.telefonoEmergencia.trim() && !/^\d{10}$/.test(form.telefonoEmergencia.trim())) e.telefonoEmergencia = "Debe tener 10 dígitos";
    if (esMenor) {
      if (!form.tutorNombre.trim()) e.tutorNombre = "Requerido para menores de edad";
      if (!form.tutorApellido.trim()) e.tutorApellido = "Requerido para menores de edad";
      if (!/^\d{10}$/.test(form.tutorTelefono.trim())) e.tutorTelefono = "Debe tener 10 dígitos";
      if (!form.tutorNumeroIdentificacion.trim()) e.tutorNumeroIdentificacion = "Requerido para menores de edad";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFieldChange = (name: string, val: string) => {
    setForm(f => ({ ...f, [name]: val }));
    setErrors(ev => ({ ...ev, [name]: "" }));
  };

  const checkDuplicado = async () => {
    if (!form.email.trim() && !form.telefono.trim()) return;
    setCheckingDup(true);
    try {
      const { data, error } = await supabase.rpc("verificar_duplicado_socio", {
        p_email: form.email.trim(), p_telefono: form.telefono.trim(),
      });
      if (!error) setDuplicadoAviso(!!data);
    } catch { /* aviso no crítico */ } finally { setCheckingDup(false); }
  };

  const handleNext = () => {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !accepted) return;
    if (step === 2) {
      if (!signed) return;
      setSignatureData(canvasRef.current!.toDataURL("image/png"));
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (!signatureData) throw new Error("Falta la firma digital.");

      const firmaBlob = await (await fetch(signatureData)).blob();
      const firmaPath = `firmas/${crypto.randomUUID()}.png`;
      const { error: uploadError } = await supabase.storage.from("firmas").upload(firmaPath, firmaBlob, { contentType: "image/png" });
      if (uploadError) throw new Error(`No se pudo guardar la firma: ${uploadError.message}`);

      const { data, error } = await supabase.rpc("registrar_socio", {
        p_nombre: form.nombre.trim(),
        p_apellido_paterno: form.apellidoPaterno.trim(),
        p_apellido_materno: form.apellidoMaterno.trim() || null,
        p_email: form.email.trim(),
        p_telefono: form.telefono.trim(),
        p_fecha_nacimiento: form.fechaNacimiento,
        p_tipo_identificacion: form.tipoIdentificacion,
        p_numero_identificacion: form.numeroIdentificacion.trim(),
        p_direccion: form.direccion.trim() || null,
        p_estado: form.estado,
        p_municipio: form.municipio.trim(),
        p_contacto_emergencia: form.contactoEmergencia.trim() || null,
        p_telefono_emergencia: form.telefonoEmergencia.trim() || null,
        p_padecimiento: form.padecimiento.trim() || null,
        p_plan: form.plan,
        p_contrato_aceptado: true,
        p_firma_path: firmaPath,
        p_tutor: esMenor ? {
          nombre: form.tutorNombre.trim(), apellido: form.tutorApellido.trim(),
          telefono: form.tutorTelefono.trim(), parentesco: form.tutorParentesco.trim() || null,
          tipo_identificacion: form.tutorTipoIdentificacion, numero_identificacion: form.tutorNumeroIdentificacion.trim(),
        } : null,
      });

      if (error) throw new Error(error.message);

      setSavedSocio(data as Socio);
      if (esMenor) {
        setSavedTutor({
          id: "local", nombre: form.tutorNombre.trim(), apellido: form.tutorApellido.trim(),
          telefono: form.tutorTelefono.trim(), email: null, parentesco: form.tutorParentesco.trim() || null,
          tipo_identificacion: form.tutorTipoIdentificacion, numero_identificacion: form.tutorNumeroIdentificacion.trim(),
        });
      }
    } catch (err: any) {
      setSubmitError(err.message || "Ocurrió un error al guardar el registro. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const descargarPDF = async () => {
    if (!savedSocio) return;
    setPdfError(null);
    setDescargandoPdf(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Sesión no válida. Vuelve a iniciar sesión.");

      const resp = await fetch("/api/generar-contrato-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ socio_id: savedSocio.id }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Error ${resp.status}`);
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Contrato_${savedSocio.folio}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setPdfError(err.message || "No se pudo generar el PDF.");
    } finally {
      setDescargandoPdf(false);
    }
  };


  const reset = () => {
    setStep(0); setForm(initialForm); setAccepted(false); setSigned(false);
    setSignatureData(null); setErrors({}); setSavedSocio(null); setSavedTutor(null);
    setSubmitError(null); setDuplicadoAviso(false);
  };

  // ── ÉXITO ────────────────────────────────────────────────────
  if (savedSocio) return (
    <div style={{ maxWidth: 480, margin: "40px auto", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "32px 28px", textAlign: "center" }}>
      <div style={{ fontSize: 46, marginBottom: 12 }}>✅</div>
      <h2 style={{ fontSize: 19, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Socio registrado</h2>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>{nombreCompletoSocio(savedSocio)}</p>
      <p style={{ fontSize: 13, color: "#9ca3af", fontFamily: "monospace", marginBottom: 24 }}>{savedSocio.folio}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={descargarPDF} disabled={descargandoPdf}
          style={{ padding: "12px 0", background: descargandoPdf ? "#9ca3af" : "#059669", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: descargandoPdf ? "default" : "pointer" }}>
          {descargandoPdf ? "⏳ Generando…" : "🖨️ Descargar PDF"}
        </button>
        {pdfError && <p style={{ color: "#ef4444", fontSize: 12, margin: 0 }}>{pdfError}</p>}

        <button onClick={reset}
          style={{ padding: "12px 0", background: "#111827", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          + Registrar otro socio
        </button>
        <button onClick={onDone}
          style={{ padding: "12px 0", background: "#fff", color: "#374151", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Volver a Socios
        </button>
      </div>
    </div>
  );

  // ── ASISTENTE ────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", maxWidth: 600, margin: "0 auto 24px" }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: i < step ? "#10b981" : i === step ? "#111827" : "#e5e7eb", color: i <= step ? "#fff" : "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                {i < step ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 10, color: i === step ? "#111827" : "#9ca3af", fontWeight: i === step ? 600 : 400, marginTop: 4, whiteSpace: "nowrap" }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? "#10b981" : "#e5e7eb", margin: "0 8px", marginBottom: 16 }} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Datos del Socio</h2>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>Captura los datos del socio que se está registrando.</p>

          <Field label="Nombre(s)" name="nombre" required value={form.nombre} onChange={handleFieldChange} error={errors.nombre} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="Apellido Paterno" name="apellidoPaterno" required value={form.apellidoPaterno} onChange={handleFieldChange} error={errors.apellidoPaterno} />
            <Field label="Apellido Materno" name="apellidoMaterno" value={form.apellidoMaterno} onChange={handleFieldChange} />
          </div>
          <Field label="Correo Electrónico" name="email" type="email" required value={form.email} onChange={handleFieldChange} onBlur={checkDuplicado} error={errors.email} />
          <Field label="Teléfono (10 dígitos)" name="telefono" required value={form.telefono} onChange={handleFieldChange} onBlur={checkDuplicado} error={errors.telefono} />

          {checkingDup && <p style={{ fontSize: 12, color: "#9ca3af", margin: "-8px 0 12px" }}>Verificando…</p>}
          {duplicadoAviso && !checkingDup && (
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#92400e" }}>⚠️ Ya existe un socio con este correo o teléfono. Puedes continuar si es correcto.</p>
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Fecha de Nacimiento<span style={{ color: "#ef4444" }}> *</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1fr", gap: 8 }}>
              <select value={form.fechaDia} onChange={e => handleFieldChange("fechaDia", e.target.value)}
                style={{ padding: "10px 8px", borderRadius: 8, border: `1.5px solid ${errors.fechaNacimiento ? "#ef4444" : "#e5e7eb"}`, fontSize: 15, background: "#fff", color: "#111827" }}>
                <option value="">Día</option>{DIAS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={form.fechaMes} onChange={e => handleFieldChange("fechaMes", e.target.value)}
                style={{ padding: "10px 8px", borderRadius: 8, border: `1.5px solid ${errors.fechaNacimiento ? "#ef4444" : "#e5e7eb"}`, fontSize: 15, background: "#fff", color: "#111827" }}>
                <option value="">Mes</option>{MESES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select value={form.fechaAnio} onChange={e => handleFieldChange("fechaAnio", e.target.value)}
                style={{ padding: "10px 8px", borderRadius: 8, border: `1.5px solid ${errors.fechaNacimiento ? "#ef4444" : "#e5e7eb"}`, fontSize: 15, background: "#fff", color: "#111827" }}>
                <option value="">Año</option>{ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            {errors.fechaNacimiento && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 3 }}>{errors.fechaNacimiento}</p>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "0 16px" }}>
            <Field label="Tipo de identificación" name="tipoIdentificacion" options={IDENTIFICACIONES} value={form.tipoIdentificacion} onChange={handleFieldChange} />
            <Field label="Número de identificación" name="numeroIdentificacion" required value={form.numeroIdentificacion} onChange={handleFieldChange} error={errors.numeroIdentificacion} />
          </div>

          {esMenor && (
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 16, marginBottom: 14 }}>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: "#1e40af", fontWeight: 700 }}>👤 Datos del tutor (requerido para menores de edad)</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <Field label="Nombre del tutor" name="tutorNombre" required value={form.tutorNombre} onChange={handleFieldChange} error={errors.tutorNombre} />
                <Field label="Apellido del tutor" name="tutorApellido" required value={form.tutorApellido} onChange={handleFieldChange} error={errors.tutorApellido} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <Field label="Teléfono del tutor" name="tutorTelefono" required value={form.tutorTelefono} onChange={handleFieldChange} error={errors.tutorTelefono} />
                <Field label="Parentesco" name="tutorParentesco" options={["Madre", "Padre", "Tutor legal", "Otro"]} value={form.tutorParentesco || "Madre"} onChange={handleFieldChange} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "0 16px" }}>
                <Field label="Tipo de identificación del tutor" name="tutorTipoIdentificacion" options={IDENTIFICACIONES} value={form.tutorTipoIdentificacion} onChange={handleFieldChange} />
                <Field label="Número de identificación del tutor" name="tutorNumeroIdentificacion" required value={form.tutorNumeroIdentificacion} onChange={handleFieldChange} error={errors.tutorNumeroIdentificacion} />
              </div>
            </div>
          )}

          <Field label="Plan" name="plan" options={PLANES} value={form.plan} onChange={handleFieldChange} />
          <Field label="Dirección (calle y número)" name="direccion" value={form.direccion} onChange={handleFieldChange} />
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "0 16px" }}>
            <Field label="Estado" name="estado" options={ESTADOS_MX} value={form.estado} onChange={handleFieldChange} />
            <Field label="Municipio" name="municipio" required value={form.municipio} onChange={handleFieldChange} error={errors.municipio} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="Nombre de contacto de emergencia" name="contactoEmergencia" value={form.contactoEmergencia} onChange={handleFieldChange} />
            <Field label="Teléfono de emergencia (10 dígitos)" name="telefonoEmergencia" value={form.telefonoEmergencia} onChange={handleFieldChange} error={errors.telefonoEmergencia} />
          </div>
          <Field label="Padecimiento o condición médica (opcional)" name="padecimiento" value={form.padecimiento} onChange={handleFieldChange} />
        </div>
      )}

      {step === 1 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Contrato & Términos</h2>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>El socio (o su tutor) debe leer esto antes de firmar.</p>
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, maxHeight: 360, overflowY: "auto", fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
            <p style={{ fontWeight: 700, textAlign: "center", fontSize: 11, marginBottom: 4, color: "#9ca3af" }}>{fechaContratoMX(new Date())}</p>
            <p style={{ fontWeight: 700, textAlign: "center", fontSize: 13, marginBottom: 14 }}>CONSENTIMIENTO INFORMADO Y EXONERACIÓN DE RESPONSABILIDAD</p>
            {(esMenor
              ? buildConsentimientoMenor(`${form.tutorNombre} ${form.tutorApellido}`.trim(), form.tutorTipoIdentificacion, form.tutorNumeroIdentificacion, form.direccion, form.municipio, form.estado, form.tutorTelefono, nombreCompleto())
              : buildConsentimientoAdulto(nombreCompleto(), form.tipoIdentificacion, form.numeroIdentificacion, form.direccion, form.municipio, form.estado, form.telefono)
            ).map((p, i) => <p key={i} style={{ marginBottom: 10 }}>{p}</p>)}
            <p style={{ fontWeight: 700, textAlign: "center", fontSize: 13, margin: "18px 0 14px" }}>AVISO DE PRIVACIDAD</p>
            {buildAvisoPrivacidad().map((p, i) => <p key={i} style={{ marginBottom: 10 }}>{p}</p>)}
          </div>
          <div style={{ marginTop: 14, display: "flex", alignItems: "flex-start", gap: 12, background: "#fff", border: `1.5px solid ${accepted ? "#10b981" : "#e5e7eb"}`, borderRadius: 10, padding: 14, cursor: "pointer" }}
            onClick={() => setAccepted(a => !a)}>
            <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${accepted ? "#10b981" : "#d1d5db"}`, background: accepted ? "#10b981" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
              {accepted && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#374151" }}>
              El socio (o su tutor, si es menor de edad) leyó y acepta el Consentimiento Informado y el Aviso de Privacidad de Sport Platinium.
            </p>
          </div>
          {!accepted && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>Debe aceptarse para continuar.</p>}
        </div>
      )}

      {step === 2 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Firma Digital</h2>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 8 }}>
            Pídele al socio{esMenor ? " o a su tutor" : ""} que firme aquí directamente en el dispositivo.
          </p>
          <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>{esMenor ? `${form.tutorNombre} ${form.tutorApellido}` : nombreCompleto()}</span>
              <button onClick={clearCanvas} style={{ fontSize: 12, color: "#6b7280", background: "none", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Borrar</button>
            </div>
            <canvas ref={canvasRef} width={560} height={200}
              style={{ width: "100%", height: 200, borderRadius: 8, background: "#f9fafb", border: "1px dashed #d1d5db", cursor: "crosshair", touchAction: "none", display: "block" }}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
          </div>
          {!signed && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>Falta la firma.</p>}
        </div>
      )}

      {step === 3 && (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Confirmar Registro</h2>
          <div style={{ padding: "12px 0" }}>
            {[
              ["Nombre", nombreCompleto()],
              ["Identificación", `${form.tipoIdentificacion} – ${form.numeroIdentificacion}`],
              ["Email", form.email], ["Teléfono", form.telefono],
              ["Fecha de nacimiento", formatoFechaMX(form.fechaNacimiento)],
              ["Municipio / Estado", `${form.municipio || "—"}, ${form.estado}`],
              ["Plan", form.plan],
              ...(esMenor ? [["Tutor", `${form.tutorNombre} ${form.tutorApellido}`]] : []),
            ].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>{l}</span>
                <span style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
          {signatureData && <img src={signatureData} alt="firma" style={{ maxWidth: "100%", height: 70, objectFit: "contain", background: "#f9fafb", borderRadius: 6, marginTop: 10 }} />}
          {submitError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: 12, marginTop: 14 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#991b1b", fontWeight: 600 }}>❌ {submitError}</p>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        {step > 0
          ? <button onClick={() => setStep(s => s - 1)} disabled={submitting} style={{ padding: "11px 22px", border: "1.5px solid #e5e7eb", borderRadius: 10, background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.6 : 1 }}>← Anterior</button>
          : <button onClick={onDone} style={{ padding: "11px 22px", border: "1.5px solid #e5e7eb", borderRadius: 10, background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>}
        {step < 3
          ? <button onClick={handleNext} style={{ padding: "11px 26px", border: "none", borderRadius: 10, background: "#111827", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Siguiente →</button>
          : <button onClick={handleSubmit} disabled={submitting} style={{ padding: "11px 26px", border: "none", borderRadius: 10, background: submitting ? "#9ca3af" : "linear-gradient(135deg,#10b981,#059669)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: submitting ? "default" : "pointer" }}>
              {submitting ? "Guardando…" : "✓ Registrar Socio"}
            </button>}
      </div>
    </div>
  );
}
