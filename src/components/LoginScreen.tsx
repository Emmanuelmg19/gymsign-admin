interface LoginScreenProps {
  email: string;
  onEmailChange: (v: string) => void;
  password: string;
  onPasswordChange: (v: string) => void;
  error: string;
  loggingIn: boolean;
  onSubmit: () => void;
}

export default function LoginScreen({ email, onEmailChange, password, onPasswordChange, error, loggingIn, onSubmit }: LoginScreenProps) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f172a,#1e293b)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 380, boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, background: "#111827", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 14px" }}>🏋️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>GymSign</h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>Panel de Administración — Sport Platinium</p>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>Correo</label>
          <input type="email" value={email} onChange={e => onEmailChange(e.target.value)} placeholder="tu@correo.com"
            onKeyDown={e => e.key === "Enter" && onSubmit()}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 15, outline: "none", boxSizing: "border-box", color: "#111827" }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>Contraseña</label>
          <input type="password" value={password} onChange={e => onPasswordChange(e.target.value)} placeholder="••••••••"
            onKeyDown={e => e.key === "Enter" && onSubmit()}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: `1.5px solid ${error ? "#ef4444" : "#e5e7eb"}`, fontSize: 15, outline: "none", boxSizing: "border-box", color: "#111827" }} />
        </div>
        {error && <p style={{ color: "#ef4444", fontSize: 12, margin: "-8px 0 12px" }}>{error}</p>}
        <button onClick={onSubmit} disabled={loggingIn}
          style={{ width: "100%", padding: "12px", background: loggingIn ? "#6b7280" : "#111827", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loggingIn ? "default" : "pointer" }}>
          {loggingIn ? "Entrando…" : "Iniciar Sesión"}
        </button>
      </div>
    </div>
  );
}
