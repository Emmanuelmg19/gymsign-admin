import { useState, useMemo, useEffect, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { Plan, Socio, Tutor, UsuarioStaff } from "./types";
import { buildContractHTML } from "./contrato";
import NuevoSocio from "./NuevoSocio";

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const PLAN_COLOR: Record<Plan, string> = {
  "Mensual": "#3b82f6",
  "Inscripción": "#8b5cf6",
  "Promoción por pago puntual": "#f59e0b",
  "Semana": "#10b981",
  "Quincena": "#06b6d4",
  "Visita": "#6b7280",
};
const PLAN_BG: Record<Plan, string> = {
  "Mensual": "#eff6ff",
  "Inscripción": "#f5f3ff",
  "Promoción por pago puntual": "#fffbeb",
  "Semana": "#f0fdf4",
  "Quincena": "#ecfeff",
  "Visita": "#f3f4f6",
};
const PLANES: Plan[] = ["Mensual", "Inscripción", "Promoción por pago puntual", "Semana", "Quincena", "Visita"];

const nombreCompleto = (m: Pick<Socio, "nombre" | "apellido_paterno" | "apellido_materno">) =>
  [m.nombre, m.apellido_paterno, m.apellido_materno].filter(Boolean).join(" ");

const esNuevo = (m: Socio) => Date.now() - new Date(m.creado_en).getTime() < 24 * 60 * 60 * 1000;

const inicial = (nombre: string) => (nombre ? nombre[0].toUpperCase() : "?");

const fechaHoraRegistro = (creadoEn: string) => {
  const d = new Date(creadoEn);
  return {
    fecha: d.toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" }),
    hora: d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" }),
  };
};

export default function AdminPanel() {
  // ── Auth ──────────────────────────────────────────────────────
  const [session, setSession] = useState<Session | null>(null);
  const [staffProfile, setStaffProfile] = useState<UsuarioStaff | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setStaffProfile(null); return; }
    supabase.from("usuarios_staff").select("*").eq("id", session.user.id).single()
      .then(({ data }) => setStaffProfile(data as UsuarioStaff | null));
  }, [session]);

  const handleLogin = async () => {
    setLoginError("");
    setLoggingIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPass });
    if (error) setLoginError("Usuario o contraseña incorrectos.");
    setLoggingIn(false);
  };
  const handleLogout = async () => { await supabase.auth.signOut(); };

  // ── Members ──────────────────────────────────────────────────
  const [members, setMembers] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<"Todos" | Plan>("Todos");
  const [sortField, setSortField] = useState<keyof Socio>("creado_en");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedMember, setSelectedMember] = useState<Socio | null>(null);
  const [firmaUrl, setFirmaUrl] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Socio | null>(null);
  const [activeTab, setActiveTab] = useState<"socios" | "estadisticas" | "nuevo">("socios");
  const [actionError, setActionError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("socios").select("*").order("creado_en", { ascending: false });
    if (!includeDeleted) query = query.is("eliminado_en", null);
    const { data, error } = await query;
    if (!error && data) setMembers(data as Socio[]);
    setLastSync(new Date());
    setLoading(false);
  }, [includeDeleted]);

  useEffect(() => { if (session) loadMembers(); }, [session, loadMembers]);

  // Realtime: se actualiza solo cuando entra/cambia un socio, sin polling
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel("socios-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "socios" }, () => {
        loadMembers();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session, loadMembers]);

  useEffect(() => {
    if (!selectedMember?.firma_path) { setFirmaUrl(null); return; }
    supabase.storage.from("firmas").createSignedUrl(selectedMember.firma_path, 120)
      .then(({ data }) => setFirmaUrl(data?.signedUrl ?? null));
  }, [selectedMember]);

  const handleSort = (field: keyof Socio) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const confirmDelete = async (m: Socio) => {
    setActionError(null);
    const { error } = await supabase.rpc("eliminar_socio", { p_socio_id: m.id });
    if (error) { setActionError(`No se pudo eliminar: ${error.message}`); return; }
    setDeleteConfirm(null);
    if (selectedMember?.id === m.id) setSelectedMember(null);
    loadMembers();
  };

  const restaurar = async (m: Socio) => {
    setActionError(null);
    const { error } = await supabase.rpc("restaurar_socio", { p_socio_id: m.id });
    if (error) { setActionError(`No se pudo restaurar: ${error.message}`); return; }
    loadMembers();
  };

  const descargarContrato = async (m: Socio) => {
    setActionError(null);
    setDownloadingId(m.id);
    try {
      let tutor: Tutor | null = null;
      if (m.es_menor && m.tutor_id) {
        const { data, error } = await supabase.from("tutores").select("*").eq("id", m.tutor_id).single();
        if (error) throw new Error(`No se pudo obtener los datos del tutor: ${error.message}`);
        tutor = data as Tutor;
      }

      let firmaDataUrl: string | null = null;
      if (m.firma_path) {
        const { data, error } = await supabase.storage.from("firmas").download(m.firma_path);
        if (error) throw new Error(`No se pudo obtener la firma: ${error.message}`);
        firmaDataUrl = await blobToDataURL(data);
      }

      const html = buildContractHTML(m, tutor, firmaDataUrl);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Contrato_${m.nombre}_${m.apellido_paterno}_${m.folio}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setActionError(err.message || "No se pudo generar el contrato.");
    } finally {
      setDownloadingId(null);
    }
  };

  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  const descargarPDF = async (m: Socio) => {
    setActionError(null);
    setDownloadingPdfId(m.id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Sesión no válida. Vuelve a iniciar sesión.");

      const resp = await fetch("/api/generar-contrato-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ socio_id: m.id }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Error ${resp.status}`);
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Contrato_${m.folio}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setActionError(err.message || "No se pudo generar el PDF.");
    } finally {
      setDownloadingPdfId(null);
    }
  };


  const filtered = useMemo(() => {
    let list = [...members];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        nombreCompleto(m).toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.folio.toLowerCase().includes(q) ||
        m.telefono.includes(q)
      );
    }
    if (filterPlan !== "Todos") list = list.filter(m => m.plan === filterPlan);
    list.sort((a, b) => {
      let va: any = a[sortField] ?? "", vb: any = b[sortField] ?? "";
      if (typeof va === "string") { va = va.toLowerCase(); vb = String(vb).toLowerCase(); }
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return list;
  }, [members, search, filterPlan, sortField, sortDir]);

  const activos = members.filter(m => !m.eliminado_en);
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
  const registrosMes = activos.filter(m => fechaHoraRegistro(m.creado_en).fecha.startsWith(hoy.slice(0, 7))).length;
  const planCount = PLANES.map(p => ({ plan: p, count: activos.filter(m => m.plan === p).length }));
  const conPad = activos.filter(m => m.padecimiento).length;
  const nuevos = activos.filter(esNuevo);

  const SortIcon = ({ field }: { field: keyof Socio }) => (
    <span style={{ marginLeft: 4, opacity: sortField === field ? 1 : 0.3, fontSize: 10 }}>
      {sortField === field ? (sortDir === "asc" ? "▲" : "▼") : "▲"}
    </span>
  );

  // ── LOADING ──────────────────────────────────────────────────
  if (authLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif", color: "#6b7280" }}>
      Cargando…
    </div>
  );

  // ── LOGIN ────────────────────────────────────────────────────
  if (!session) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0f172a,#1e293b)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 380, boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, background: "#111827", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 14px" }}>🏋️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>GymSign</h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>Panel de Administración — Sport Platinium</p>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>Correo</label>
          <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="tu@correo.com"
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 15, outline: "none", boxSizing: "border-box", color: "#111827" }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>Contraseña</label>
          <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="••••••••"
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: `1.5px solid ${loginError ? "#ef4444" : "#e5e7eb"}`, fontSize: 15, outline: "none", boxSizing: "border-box", color: "#111827" }} />
        </div>
        {loginError && <p style={{ color: "#ef4444", fontSize: 12, margin: "-8px 0 12px" }}>{loginError}</p>}
        <button onClick={handleLogin} disabled={loggingIn}
          style={{ width: "100%", padding: "12px", background: loggingIn ? "#6b7280" : "#111827", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loggingIn ? "default" : "pointer" }}>
          {loggingIn ? "Entrando…" : "Iniciar Sesión"}
        </button>
      </div>
    </div>
  );

  // ── ADMIN PANEL ──────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Inter',system-ui,sans-serif" }}>

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
          {nuevos.length > 0 && (
            <div style={{ background: "#10b981", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>
              +{nuevos.length} nuevo{nuevos.length > 1 ? "s" : ""}
            </div>
          )}
          <button onClick={loadMembers} title="Actualizar"
            style={{ background: "#374151", border: "none", borderRadius: 6, color: "#9ca3af", padding: "5px 10px", cursor: "pointer", fontSize: 14 }}>⟳</button>
          <span style={{ color: "#9ca3af", fontSize: 12 }}>👤 {staffProfile ? `${staffProfile.nombre} ${staffProfile.apellido}` : session.user.email}</span>
          <button onClick={handleLogout}
            style={{ background: "none", border: "1px solid #374151", borderRadius: 6, color: "#9ca3af", fontSize: 12, padding: "4px 10px", cursor: "pointer" }}>
            Salir
          </button>
        </div>
      </div>

      {!staffProfile && (
        <div style={{ background: "#fef2f2", borderBottom: "1px solid #fecaca", padding: "10px 20px" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#991b1b" }}>⚠️ Tu cuenta inició sesión correctamente pero no tiene un perfil en <code>usuarios_staff</code>. Pide a un administrador que te dé de alta ahí para ver tu nombre y quedar registrado en la auditoría.</p>
        </div>
      )}

      {actionError && (
        <div style={{ background: "#fef2f2", borderBottom: "1px solid #fecaca", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#991b1b" }}>❌ {actionError}</p>
          <button onClick={() => setActionError(null)} style={{ background: "none", border: "none", color: "#991b1b", cursor: "pointer", fontSize: 13 }}>✕</button>
        </div>
      )}

      {nuevos.length > 0 && (
        <div style={{ background: "#f0fdf4", borderBottom: "1px solid #bbf7d0", padding: "10px 20px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>🟢</span>
          <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>
            {nuevos.length === 1
              ? `Nuevo registro: ${nombreCompleto(nuevos[0])} (${nuevos[0].folio})`
              : `${nuevos.length} nuevos socios registrados en las últimas 24 horas`}
          </span>
        </div>
      )}

      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 20px", display: "flex" }}>
        {(["socios", "estadisticas", "nuevo"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ padding: "14px 18px", border: "none", borderBottom: `2px solid ${activeTab === t ? "#111827" : "transparent"}`, background: "none", color: activeTab === t ? "#111827" : "#6b7280", fontWeight: activeTab === t ? 700 : 400, fontSize: 14, cursor: "pointer" }}>
            {t === "socios" ? "👥 Socios" : t === "estadisticas" ? "📊 Estadísticas" : "➕ Registrar Socio"}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>

        {activeTab === "estadisticas" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 18 }}>Resumen General</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
              {([
                ["Total Socios", activos.length, "#111827", "👥"],
                ["Registros este mes", registrosMes, "#3b82f6", "📅"],
                ["Nuevos (24h)", nuevos.length, "#10b981", "🆕"],
                ["Con padecimiento", conPad, "#f59e0b", "⚕️"],
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
                    <div style={{ width: `${activos.length > 0 ? (count / activos.length) * 100 : 0}%`, height: "100%", background: PLAN_COLOR[plan], borderRadius: 8 }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 5 }}>{activos.length > 0 ? Math.round((count / activos.length) * 100) : 0}% del total</div>
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Últimos 5 Registros</h3>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
              {[...activos].sort((a, b) => (b.creado_en ?? "").localeCompare(a.creado_en ?? "")).slice(0, 5).map((m, i, arr) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none", cursor: "pointer" }}
                  onClick={() => { setSelectedMember(m); setActiveTab("socios"); }}>
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
                    <span style={{ background: PLAN_BG[m.plan], color: PLAN_COLOR[m.plan], fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, display: "block", marginBottom: 2 }}>{m.plan}</span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{fechaHoraRegistro(m.creado_en).fecha}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "nuevo" && (
          <NuevoSocio onDone={() => setActiveTab("socios")} />
        )}

        {activeTab === "socios" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>Lista de Socios</h2>
                <p style={{ fontSize: 13, color: "#6b7280", margin: "2px 0 0" }}>{filtered.length} de {members.length} socios{includeDeleted ? " (incluye eliminados)" : ""}</p>
              </div>
              {loading && <span style={{ fontSize: 12, color: "#9ca3af" }}>⟳ Actualizando…</span>}
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Buscar por nombre, email, folio o teléfono…"
                style={{ flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", color: "#111827", background: "#fff" }} />
              <select value={filterPlan} onChange={e => setFilterPlan(e.target.value as any)}
                style={{ padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", background: "#fff", color: "#374151" }}>
                <option>Todos</option>
                {PLANES.map(p => <option key={p}>{p}</option>)}
              </select>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#374151", cursor: "pointer" }}>
                <input type="checkbox" checked={includeDeleted} onChange={e => setIncludeDeleted(e.target.checked)} />
                Incluir eliminados
              </label>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                      {([["nombre", "Nombre"], ["plan", "Plan"], ["email", "Email"], ["telefono", "Teléfono"], ["creado_en", "Registro"], ["folio", "Folio"]] as const).map(([f, l]) => (
                        <th key={f} onClick={() => handleSort(f as keyof Socio)}
                          style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}>
                          {l}<SortIcon field={f as keyof Socio} />
                        </th>
                      ))}
                      <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "#6b7280", fontSize: 11, textTransform: "uppercase" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 14 }}>No se encontraron socios.</td></tr>
                    ) : filtered.map((m, i) => {
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
                          <td style={{ padding: "11px 14px" }}>
                            <span style={{ background: PLAN_BG[m.plan], color: PLAN_COLOR[m.plan], fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{m.plan}</span>
                          </td>
                          <td style={{ padding: "11px 14px", color: "#374151" }}>{m.email}</td>
                          <td style={{ padding: "11px 14px", color: "#374151", whiteSpace: "nowrap" }}>{m.telefono}</td>
                          <td style={{ padding: "11px 14px", color: "#6b7280", whiteSpace: "nowrap" }}>{fechaHoraRegistro(m.creado_en).fecha}<br /><span style={{ fontSize: 11 }}>{fechaHoraRegistro(m.creado_en).hora}</span></td>
                          <td style={{ padding: "11px 14px", color: "#6b7280", fontFamily: "monospace", fontSize: 12 }}>{m.folio}</td>
                          <td style={{ padding: "11px 14px", textAlign: "center", whiteSpace: "nowrap" }}>
                            <button onClick={() => setSelectedMember(m)}
                              style={{ background: "#f3f4f6", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer", marginRight: 6 }}>
                              👁 Ver
                            </button>
                            <button onClick={() => descargarContrato(m)} disabled={downloadingId === m.id}
                              style={{ background: "#eff6ff", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "#1e40af", cursor: downloadingId === m.id ? "default" : "pointer", marginRight: 6, opacity: downloadingId === m.id ? 0.6 : 1 }}>
                              {downloadingId === m.id ? "⏳" : "📄"} HTML
                            </button>
                            <button onClick={() => descargarPDF(m)} disabled={downloadingPdfId === m.id}
                              style={{ background: "#f0fdf4", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "#166534", cursor: downloadingPdfId === m.id ? "default" : "pointer", marginRight: 6, opacity: downloadingPdfId === m.id ? 0.6 : 1 }}>
                              {downloadingPdfId === m.id ? "⏳" : "🖨️"} PDF
                            </button>
                            {eliminado ? (
                              <button onClick={() => restaurar(m)}
                                style={{ background: "#f0fdf4", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "#166534", cursor: "pointer" }}>
                                ↺ Restaurar
                              </button>
                            ) : (
                              <button onClick={() => setDeleteConfirm(m)}
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
            </div>
          </div>
        )}
      </div>

      {selectedMember && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
          onClick={e => e.target === e.currentTarget && setSelectedMember(null)}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,.25)" }}>
            <div style={{ background: "#111827", borderRadius: "16px 16px 0 0", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ color: "#fff", margin: 0, fontSize: 16, fontWeight: 700 }}>{nombreCompleto(selectedMember)}</h3>
                <p style={{ color: "#9ca3af", margin: "3px 0 0", fontSize: 12 }}>{selectedMember.folio}</p>
              </div>
              <button onClick={() => setSelectedMember(null)}
                style={{ background: "#374151", border: "none", borderRadius: 8, color: "#fff", width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ marginBottom: 16 }}>
                <span style={{ background: PLAN_BG[selectedMember.plan], color: PLAN_COLOR[selectedMember.plan], fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>{selectedMember.plan}</span>
                <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 10 }}>Alta: {fechaHoraRegistro(selectedMember.creado_en).fecha} — {fechaHoraRegistro(selectedMember.creado_en).hora}</span>
                {selectedMember.es_menor && <span style={{ fontSize: 11, color: "#1e40af", marginLeft: 10, background: "#eff6ff", padding: "2px 8px", borderRadius: 20 }}>Menor de edad</span>}
              </div>
              {([
                ["Identificación", `${selectedMember.tipo_identificacion} – ${selectedMember.numero_identificacion}`],
                ["Correo", selectedMember.email],
                ["Teléfono", selectedMember.telefono],
                ["Fecha de nacimiento", selectedMember.fecha_nacimiento],
                ["Dirección", selectedMember.direccion || "—"],
                ["Municipio / Estado", `${selectedMember.municipio}, ${selectedMember.estado}`],
                ["Nombre de contacto de emergencia", selectedMember.contacto_emergencia ? `${selectedMember.contacto_emergencia} – ${selectedMember.telefono_emergencia}` : "—"],
                ["Padecimiento", selectedMember.padecimiento || "Ninguno declarado"],
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
              {selectedMember.eliminado_en && (
                <div style={{ marginTop: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px" }}>
                  <p style={{ margin: 0, fontSize: 13, color: "#991b1b" }}>🗑️ Eliminado el {new Date(selectedMember.eliminado_en).toLocaleString("es-MX")}</p>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
                <button onClick={() => descargarContrato(selectedMember)} disabled={downloadingId === selectedMember.id}
                  style={{ flex: 1, minWidth: 130, padding: "11px 0", background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: downloadingId === selectedMember.id ? "default" : "pointer", opacity: downloadingId === selectedMember.id ? 0.6 : 1 }}>
                  {downloadingId === selectedMember.id ? "⏳ Generando…" : "📄 HTML"}
                </button>
                <button onClick={() => descargarPDF(selectedMember)} disabled={downloadingPdfId === selectedMember.id}
                  style={{ flex: 1, minWidth: 130, padding: "11px 0", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: downloadingPdfId === selectedMember.id ? "default" : "pointer", opacity: downloadingPdfId === selectedMember.id ? 0.6 : 1 }}>
                  {downloadingPdfId === selectedMember.id ? "⏳ Generando…" : "🖨️ PDF"}
                </button>
                {selectedMember.eliminado_en ? (
                  <button onClick={() => { restaurar(selectedMember); setSelectedMember(null); }}
                    style={{ flex: 1, padding: "11px 0", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    ↺ Restaurar
                  </button>
                ) : (
                  <button onClick={() => { setDeleteConfirm(selectedMember); setSelectedMember(null); }}
                    style={{ flex: 1, padding: "11px 0", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    🗑️ Eliminar
                  </button>
                )}
                <button onClick={() => setSelectedMember(null)}
                  style={{ flex: 1, padding: "11px 0", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "28px 28px 24px", width: "100%", maxWidth: 340, boxShadow: "0 20px 50px rgba(0,0,0,.2)" }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 38, marginBottom: 10 }}>⚠️</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>¿Eliminar socio?</h3>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Se marcará como eliminado el registro de <strong>{nombreCompleto(deleteConfirm)}</strong>. Podrás restaurarlo después si fue un error — no se borra permanentemente hasta pasados 2 años (política de retención).</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, padding: "11px 0", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
              <button onClick={() => confirmDelete(deleteConfirm)}
                style={{ flex: 1, padding: "11px 0", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
