import type { Socio } from "../types";
import { inicial, nombreCompleto, fechaHoraRegistro, esNuevo } from "../lib/format";

interface MembersTableProps {
  members: Socio[];
  filtered: Socio[];
  paginated: Socio[];
  loading: boolean;
  includeDeleted: boolean;
  onIncludeDeletedChange: (v: boolean) => void;
  search: string;
  onSearchChange: (v: string) => void;
  sortField: keyof Socio;
  sortDir: "asc" | "desc";
  onSort: (field: keyof Socio) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  downloadingPdfId: string | null;
  onView: (m: Socio) => void;
  onEdit: (m: Socio) => void;
  onDownloadPdf: (m: Socio) => void;
  onDelete: (m: Socio) => void;
  onRestore: (m: Socio) => void;
}

const COLUMNS = [["nombre", "Nombre"], ["email", "Email"], ["telefono", "Teléfono"], ["creado_en", "Registro"], ["folio", "Folio"]] as const;

export default function MembersTable({
  members, filtered, paginated, loading, includeDeleted, onIncludeDeletedChange,
  search, onSearchChange,
  sortField, sortDir, onSort, currentPage, totalPages, onPageChange,
  downloadingPdfId, onView, onEdit, onDownloadPdf, onDelete, onRestore,
}: MembersTableProps) {
  const SortIcon = ({ field }: { field: keyof Socio }) => (
    <span style={{ marginLeft: 4, opacity: sortField === field ? 1 : 0.3, fontSize: 10 }}>
      {sortField === field ? (sortDir === "asc" ? "▲" : "▼") : "▲"}
    </span>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>Lista de Socios</h2>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "2px 0 0" }}>{filtered.length} de {members.length} socios{includeDeleted ? " (incluye eliminados)" : ""}</p>
        </div>
        {loading && <span style={{ fontSize: 12, color: "#9ca3af" }}>⟳ Actualizando…</span>}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => onSearchChange(e.target.value)} placeholder="🔍  Buscar por nombre, email, folio o teléfono…"
          style={{ flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", color: "#111827", background: "#fff" }} />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", cursor: "pointer" }}>
          <input type="checkbox" checked={includeDeleted} onChange={e => onIncludeDeletedChange(e.target.checked)} />
          Incluir eliminados
        </label>
      </div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                {COLUMNS.map(([f, l]) => (
                  <th key={f} onClick={() => onSort(f as keyof Socio)}
                    style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}>
                    {l}<SortIcon field={f as keyof Socio} />
                  </th>
                ))}
                <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "#6b7280", fontSize: 11, textTransform: "uppercase" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 14 }}>No se encontraron socios.</td></tr>
              ) : paginated.map((m, i) => {
                const nuevo = esNuevo(m);
                const eliminado = !!m.eliminado_en;
                return (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f3f4f6", background: eliminado ? "#fef2f2" : nuevo ? "#f0fdf4" : i % 2 === 0 ? "#fff" : "#fafafa", opacity: eliminado ? 0.7 : 1 }}>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: nuevo ? "#dcfce7" : "#f3f4f6", border: nuevo ? "2px solid #10b981" : "none", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#374151", fontSize: 12, flexShrink: 0 }}>
                          {inicial(m.nombre)}{inicial(m.apellido_paterno)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#111827" }}>
                            {nombreCompleto(m)}
                            {nuevo && !eliminado && <span style={{ marginLeft: 6, background: "#10b981", color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>NUEVO</span>}
                            {eliminado && <span style={{ marginLeft: 6, background: "#dc2626", color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>ELIMINADO</span>}
                          </div>
                          {m.padecimiento && <div style={{ fontSize: 11, color: "#f59e0b" }}>⚕️ {m.padecimiento}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px", color: "#374151" }}>{m.email}</td>
                    <td style={{ padding: "11px 14px", color: "#374151", whiteSpace: "nowrap" }}>{m.telefono}</td>
                    <td style={{ padding: "11px 14px", color: "#6b7280", whiteSpace: "nowrap" }}>{fechaHoraRegistro(m.creado_en).fecha}<br /><span style={{ fontSize: 11 }}>{fechaHoraRegistro(m.creado_en).hora}</span></td>
                    <td style={{ padding: "11px 14px", color: "#6b7280", fontFamily: "monospace", fontSize: 12 }}>{m.folio}</td>
                    <td style={{ padding: "11px 14px", textAlign: "center", whiteSpace: "nowrap" }}>
                      <button onClick={() => onView(m)}
                        style={{ background: "#f3f4f6", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer", marginRight: 6 }}>
                        👁 Ver
                      </button>
                      {!eliminado && (
                        <button onClick={() => onEdit(m)}
                          style={{ background: "#fffbeb", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "#92400e", cursor: "pointer", marginRight: 6 }}>
                          ✏️ Editar
                        </button>
                      )}
                      <button onClick={() => onDownloadPdf(m)} disabled={downloadingPdfId === m.id}
                        style={{ background: "#f0fdf4", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "#166534", cursor: downloadingPdfId === m.id ? "default" : "pointer", marginRight: 6, opacity: downloadingPdfId === m.id ? 0.6 : 1 }}>
                        {downloadingPdfId === m.id ? "⏳" : "🖨️"} PDF
                      </button>
                      {eliminado ? (
                        <button onClick={() => onRestore(m)}
                          style={{ background: "#f0fdf4", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "#166534", cursor: "pointer" }}>
                          ↺ Restaurar
                        </button>
                      ) : (
                        <button onClick={() => onDelete(m)}
                          style={{ background: "#fef2f2", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "#dc2626", cursor: "pointer" }}>
                          🗑
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #e5e7eb", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Página {currentPage} de {totalPages} · {filtered.length} socio{filtered.length === 1 ? "" : "s"}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: currentPage <= 1 ? "#f3f4f6" : "#fff", color: currentPage <= 1 ? "#9ca3af" : "#374151", fontSize: 12, fontWeight: 600, cursor: currentPage <= 1 ? "default" : "pointer" }}>
                ← Anterior
              </button>
              <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: currentPage >= totalPages ? "#f3f4f6" : "#fff", color: currentPage >= totalPages ? "#9ca3af" : "#374151", fontSize: 12, fontWeight: 600, cursor: currentPage >= totalPages ? "default" : "pointer" }}>
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
