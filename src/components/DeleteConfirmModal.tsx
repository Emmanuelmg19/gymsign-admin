import type { Socio } from "../types";
import { nombreCompleto } from "../lib/format";

interface DeleteConfirmModalProps {
  member: Socio;
  onCancel: () => void;
  onConfirm: (m: Socio) => void;
}

export default function DeleteConfirmModal({ member, onCancel, onConfirm }: DeleteConfirmModalProps) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: "28px 28px 24px", width: "100%", maxWidth: 340, boxShadow: "0 20px 50px rgba(0,0,0,.2)" }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 38, marginBottom: 10 }}>⚠️</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>¿Eliminar socio?</h3>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Se marcará como eliminado el registro de <strong>{nombreCompleto(member)}</strong>. Podrás restaurarlo después si fue un error — no se borra permanentemente hasta pasados 2 años (política de retención).</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: "11px 0", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
          <button onClick={() => onConfirm(member)}
            style={{ flex: 1, padding: "11px 0", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}
