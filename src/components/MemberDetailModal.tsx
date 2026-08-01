import type { Socio } from "../types";
import { PLAN_COLOR, PLAN_BG, nombreCompleto, fechaHoraRegistro, formatoVencimiento, planLabel } from "../lib/format";

interface MemberDetailModalProps {
  member: Socio;
  firmaUrl: string | null;
  downloadingPdfId: string | null;
  onClose: () => void;
  onEdit: (m: Socio) => void;
  onDownloadPdf: (m: Socio) => void;
  onDelete: (m: Socio) => void;
  onRestore: (m: Socio) => void;
}

export default function MemberDetailModal({ member, firmaUrl, downloadingPdfId, onClose, onEdit, onDownloadPdf, onDelete, onRestore }: MemberDetailModalProps) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,.25)" }}>
        <div style={{ background: "#111827", borderRadius: "16px 16px 0 0", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ color: "#fff", margin: 0, fontSize: 16, fontWeight: 700 }}>{nombreCompleto(member)}</h3>
            <p style={{ color: "#9ca3af", margin: "3px 0 0", fontSize: 12 }}>{member.folio}</p>
          </div>
          <button onClick={onClose}
            style={{ background: "#374151", border: "none", borderRadius: 8, color: "#fff", width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ background: PLAN_BG[member.plan], color: PLAN_COLOR[member.plan], fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>{planLabel(member)}</span>
            <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 10 }}>Alta: {fechaHoraRegistro(member.creado_en).fecha} — {fechaHoraRegistro(member.creado_en).hora}</span>
            <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 10 }}>Vence: {formatoVencimiento(member)}</span>
            {member.es_menor && <span style={{ fontSize: 11, color: "#1e40af", marginLeft: 10, background: "#eff6ff", padding: "2px 8px", borderRadius: 20 }}>Menor de edad</span>}
          </div>
          {([
            ["Identificación", `${member.tipo_identificacion} – ${member.numero_identificacion}`],
            ["Correo", member.email],
            ["Teléfono", member.telefono],
            ["Fecha de nacimiento", member.fecha_nacimiento],
            ["Dirección", member.direccion || "—"],
            ["Municipio / Estado", `${member.municipio}, ${member.estado}`],
            ["Nombre de contacto de emergencia", member.contacto_emergencia ? `${member.contacto_emergencia} – ${member.telefono_emergencia}` : "—"],
            ["Padecimiento", member.padecimiento || "Ninguno declarado"],
          ] as const).map(([l, v]) => (
            <div key={l} style={{ display: "flex", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ width: "42%", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>{l}</span>
              <span style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 14, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#166534", fontWeight: 600 }}>✅ Términos aceptados y contrato firmado digitalmente</p>
          </div>
          {firmaUrl && (
            <div style={{ marginTop: 10, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6, fontWeight: 600 }}>FIRMA DIGITAL</p>
              <img src={firmaUrl} alt="Firma" style={{ maxWidth: "100%", height: 70, objectFit: "contain" }} />
            </div>
          )}
          {member.eliminado_en && (
            <div style={{ marginTop: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#991b1b" }}>🗑️ Eliminado el {new Date(member.eliminado_en).toLocaleString("es-MX")}</p>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            {!member.eliminado_en && (
              <button onClick={() => onEdit(member)}
                style={{ flex: 1, minWidth: 130, padding: "11px 0", background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                ✏️ Editar
              </button>
            )}
            <button onClick={() => onDownloadPdf(member)} disabled={downloadingPdfId === member.id}
              style={{ flex: 1, minWidth: 130, padding: "11px 0", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: downloadingPdfId === member.id ? "default" : "pointer", opacity: downloadingPdfId === member.id ? 0.6 : 1 }}>
              {downloadingPdfId === member.id ? "⏳ Generando…" : "🖨️ PDF"}
            </button>
            {member.eliminado_en ? (
              <button onClick={() => { onRestore(member); onClose(); }}
                style={{ flex: 1, padding: "11px 0", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                ↺ Restaurar
              </button>
            ) : (
              <button onClick={() => { onDelete(member); onClose(); }}
                style={{ flex: 1, padding: "11px 0", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                🗑️ Eliminar
              </button>
            )}
            <button onClick={onClose}
              style={{ flex: 1, padding: "11px 0", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
