interface TopbarProps {
  loading: boolean;
  lastSync: Date | null;
  nuevosCount: number;
  userLabel: string;
  onRefresh: () => void;
  onLogout: () => void;
}

export default function Topbar({ loading, lastSync, nuevosCount, userLabel, onRefresh, onLogout }: TopbarProps) {
  return (
    <div style={{ background: "#111827", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>🏋️</span>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>GymSign</span>
        <span style={{ color: "#4b5563", fontSize: 13 }}>/ Admin</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#1f2937", borderRadius: 20, padding: "4px 10px" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: loading ? "#f59e0b" : "#10b981" }} />
          <span style={{ fontSize: 11, color: "#9ca3af" }}>
            {loading ? "Sincronizando…" : lastSync ? `Sync ${lastSync.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}` : "Conectado"}
          </span>
        </div>
        {nuevosCount > 0 && (
          <div style={{ background: "#10b981", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>
            +{nuevosCount} nuevo{nuevosCount > 1 ? "s" : ""}
          </div>
        )}
        <button onClick={onRefresh} title="Actualizar"
          style={{ background: "#374151", border: "none", borderRadius: 6, color: "#9ca3af", padding: "5px 10px", cursor: "pointer", fontSize: 14 }}>⟳</button>
        <span style={{ color: "#9ca3af", fontSize: 12 }}>👤 {userLabel}</span>
        <button onClick={onLogout}
          style={{ background: "none", border: "1px solid #374151", borderRadius: 6, color: "#9ca3af", fontSize: 12, padding: "4px 10px", cursor: "pointer" }}>
          Salir
        </button>
      </div>
    </div>
  );
}
