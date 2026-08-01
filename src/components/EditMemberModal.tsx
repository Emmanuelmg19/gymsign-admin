import type { Plan, Socio } from "../types";
import { ESTADOS_MX } from "../types";
import { PLANES, nombreCompleto } from "../lib/format";

export interface EditForm {
  email: string;
  telefono: string;
  direccion: string;
  estado: string;
  municipio: string;
  contacto_emergencia: string;
  telefono_emergencia: string;
  padecimiento: string;
  plan: Plan;
  incluye_inscripcion: boolean;
  promocion_pago_puntual: boolean;
}

interface EditMemberModalProps {
  member: Socio;
  form: EditForm;
  onFormChange: (form: EditForm) => void;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSave: () => void;
}

const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, color: "#111827", outline: "none", boxSizing: "border-box" as const };
const labelStyle = { display: "block", fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.05em" };

export default function EditMemberModal({ member, form, onFormChange, saving, error, onCancel, onSave }: EditMemberModalProps) {
  const set = <K extends keyof EditForm>(key: K, value: EditForm[K]) => onFormChange({ ...form, [key]: value });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,.25)" }}>
        <div style={{ background: "#111827", borderRadius: "16px 16px 0 0", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ color: "#fff", margin: 0, fontSize: 16, fontWeight: 700 }}>Editar socio</h3>
            <p style={{ color: "#9ca3af", margin: "3px 0 0", fontSize: 12 }}>{nombreCompleto(member)} — {member.folio}</p>
          </div>
          <button onClick={onCancel}
            style={{ background: "#374151", border: "none", borderRadius: 8, color: "#fff", width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#1e40af" }}>Solo datos de contacto y plan. Nombre, identificación y fecha de nacimiento no son editables aquí porque ya están en el contrato firmado.</p>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Correo electrónico</label>
            <input type="text" value={form.email} onChange={e => set("email", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Teléfono</label>
            <input type="text" value={form.telefono} onChange={e => set("telefono", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Dirección</label>
            <input type="text" value={form.direccion} onChange={e => set("direccion", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Estado</label>
              <select value={form.estado} onChange={e => set("estado", e.target.value)}
                style={{ ...inputStyle, background: "#fff" }}>
                {ESTADOS_MX.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Municipio</label>
              <input type="text" value={form.municipio} onChange={e => set("municipio", e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Contacto de emergencia</label>
              <input type="text" value={form.contacto_emergencia} onChange={e => set("contacto_emergencia", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Teléfono de emergencia</label>
              <input type="text" value={form.telefono_emergencia} onChange={e => set("telefono_emergencia", e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Padecimiento médico</label>
            <input type="text" value={form.padecimiento} onChange={e => set("padecimiento", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Plan</label>
            <select value={form.plan} onChange={e => set("plan", e.target.value as Plan)}
              style={{ ...inputStyle, background: "#fff" }}>
              {PLANES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", cursor: "pointer" }}>
              <input type="checkbox" checked={form.incluye_inscripcion} onChange={e => set("incluye_inscripcion", e.target.checked)} />
              Incluye cuota de inscripción
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", cursor: "pointer" }}>
              <input type="checkbox" checked={form.promocion_pago_puntual} onChange={e => set("promocion_pago_puntual", e.target.checked)} />
              Aplica promoción por pago puntual
            </label>
          </div>
          {error && <p style={{ color: "#ef4444", fontSize: 12, margin: "0 0 14px" }}>{error}</p>}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onCancel}
              style={{ flex: 1, padding: "11px 0", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
            <button onClick={onSave} disabled={saving}
              style={{ flex: 1, padding: "11px 0", background: saving ? "#9ca3af" : "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: saving ? "default" : "pointer" }}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
