import type { Socio } from "../types";
import { PLAN_COLOR, PLAN_BG, esNuevo, inicial, nombreCompleto, fechaHoraRegistro, planLabel } from "../lib/format";

interface PlanCount { plan: Socio["plan"]; count: number }

interface StatsTabProps {
  totalActivos: number;
  registrosMes: number;
  nuevosCount: number;
  conPadecimiento: number;
  planCount: PlanCount[];
  ultimosRegistros: Socio[];
  onSelectMember: (m: Socio) => void;
}

export default function StatsTab({ totalActivos, registrosMes, nuevosCount, conPadecimiento, planCount, ultimosRegistros, onSelectMember }: StatsTabProps) {
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 18 }}>Resumen General</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
        {([
          ["Total Socios", totalActivos, "#111827", "👥"],
          ["Registros este mes", registrosMes, "#3b82f6", "📅"],
          ["Nuevos (24h)", nuevosCount, "#10b981", "🆕"],
          ["Con padecimiento", conPadecimiento, "#f59e0b", "⚕️"],
        ] as const).map(([label, val, bg, icon]) => (
          <div key={label} style={{ background: bg, borderRadius: 12, padding: "18px 20px", color: "#fff" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 2 }}>{val}</div>
            <div style={{ fontSize: 12, opacity: .8 }}>{label}</div>
          </div>
        ))}
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Distribución por Plan</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 24 }}>
        {planCount.map(({ plan, count }) => (
          <div key={plan} style={{ background: "#fff", border: `1.5px solid ${PLAN_COLOR[plan]}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{plan}</span>
              <span style={{ background: PLAN_BG[plan], color: PLAN_COLOR[plan], fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{count}</span>
            </div>
            <div style={{ background: "#f3f4f6", borderRadius: 8, height: 8 }}>
              <div style={{ width: `${totalActivos > 0 ? (count / totalActivos) * 100 : 0}%`, height: "100%", background: PLAN_COLOR[plan], borderRadius: 8 }} />
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 5 }}>{totalActivos > 0 ? Math.round((count / totalActivos) * 100) : 0}% del total</div>
          </div>
        ))}
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Últimos 5 Registros</h3>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        {ultimosRegistros.map((m, i, arr) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none", cursor: "pointer" }}
            onClick={() => onSelectMember(m)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: esNuevo(m) ? "#f0fdf4" : "#f3f4f6", border: esNuevo(m) ? "2px solid #10b981" : "none", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#374151", fontSize: 12 }}>
                {inicial(m.nombre)}{inicial(m.apellido_paterno)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{nombreCompleto(m)}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{m.folio}</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ background: PLAN_BG[m.plan], color: PLAN_COLOR[m.plan], fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, display: "block", marginBottom: 2 }}>{planLabel(m)}</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{fechaHoraRegistro(m.creado_en).fecha}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
