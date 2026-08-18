import { useState, useMemo, useEffect, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { Socio, UsuarioStaff } from "./types";
import NuevoSocio from "./NuevoSocio";
import LoginScreen from "./components/LoginScreen";
import Topbar from "./components/Topbar";
import StatsTab from "./components/StatsTab";
import MembersTable from "./components/MembersTable";
import MemberDetailModal from "./components/MemberDetailModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import EditMemberModal, { type EditForm } from "./components/EditMemberModal";
import { nombreCompleto, esNuevo, fechaHoraRegistro } from "./lib/format";

const PAGE_SIZE = 20;

export default function AdminPanel() {
  // ── Auth ──────────────────────────────────────────────────────
  const [session, setSession] = useState<Session | null>(null);
  const [staffProfile, setStaffProfile] = useState<UsuarioStaff | null>(null);
  const [staffProfileLoading, setStaffProfileLoading] = useState(true);
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
    if (!session) { setStaffProfile(null); setStaffProfileLoading(false); return; }
    setStaffProfileLoading(true);
    supabase.from("usuarios_staff").select("*").eq("id", session.user.id).single()
      .then(({ data }) => { setStaffProfile(data as UsuarioStaff | null); setStaffProfileLoading(false); });
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
  const [sortField, setSortField] = useState<keyof Socio>("creado_en");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState<Socio | null>(null);
  const [firmaUrl, setFirmaUrl] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Socio | null>(null);
  const [activeTab, setActiveTab] = useState<"socios" | "estadisticas" | "nuevo">("socios");
  const [actionError, setActionError] = useState<string | null>(null);

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

  const [editingMember, setEditingMember] = useState<Socio | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    email: "", telefono: "", direccion: "", estado: "", municipio: "",
    contacto_emergencia: "", telefono_emergencia: "", padecimiento: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const abrirEdicion = (m: Socio) => {
    setEditError(null);
    setEditForm({
      email: m.email, telefono: m.telefono, direccion: m.direccion || "", estado: m.estado,
      municipio: m.municipio, contacto_emergencia: m.contacto_emergencia || "",
      telefono_emergencia: m.telefono_emergencia || "", padecimiento: m.padecimiento || "",
    });
    setEditingMember(m);
  };

  const guardarEdicion = async () => {
    if (!editingMember) return;
    setEditError(null);
    setSavingEdit(true);
    const { error } = await supabase.rpc("editar_socio_contacto", {
      p_socio_id: editingMember.id,
      p_email: editForm.email.trim(),
      p_telefono: editForm.telefono.trim(),
      p_direccion: editForm.direccion.trim() || null,
      p_estado: editForm.estado,
      p_municipio: editForm.municipio.trim(),
      p_contacto_emergencia: editForm.contacto_emergencia.trim() || null,
      p_telefono_emergencia: editForm.telefono_emergencia.trim() || null,
      p_padecimiento: editForm.padecimiento.trim() || null,
    });
    setSavingEdit(false);
    if (error) { setEditError(error.message || "No se pudo guardar la edición."); return; }
    if (selectedMember?.id === editingMember.id) setSelectedMember(null);
    setEditingMember(null);
    loadMembers();
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
    list.sort((a, b) => {
      let va: any = a[sortField] ?? "", vb: any = b[sortField] ?? "";
      if (typeof va === "string") { va = va.toLowerCase(); vb = String(vb).toLowerCase(); }
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return list;
  }, [members, search, sortField, sortDir]);

  // Volver a la página 1 cada vez que cambian los filtros, orden, o la fuente de datos —
  // evita quedarse en una página vacía tras filtrar.
  useEffect(() => { setPage(1); }, [search, sortField, sortDir, includeDeleted]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  const activos = members.filter(m => !m.eliminado_en);
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
  const registrosMes = activos.filter(m => fechaHoraRegistro(m.creado_en).fecha.startsWith(hoy.slice(0, 7))).length;
  const conPad = activos.filter(m => m.padecimiento).length;
  const nuevos = activos.filter(esNuevo);
  const ultimosRegistros = useMemo(
    () => [...activos].sort((a, b) => (b.creado_en ?? "").localeCompare(a.creado_en ?? "")).slice(0, 5),
    [activos],
  );

  // ── LOADING ──────────────────────────────────────────────────
  if (authLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif", color: "#6b7280" }}>
      Cargando…
    </div>
  );

  // ── LOGIN ────────────────────────────────────────────────────
  if (!session) return (
    <LoginScreen
      email={loginEmail} onEmailChange={setLoginEmail}
      password={loginPass} onPasswordChange={setLoginPass}
      error={loginError} loggingIn={loggingIn} onSubmit={handleLogin}
    />
  );

  // ── ADMIN PANEL ──────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Inter',system-ui,sans-serif" }}>

      <Topbar
        loading={loading} lastSync={lastSync} nuevosCount={nuevos.length}
        userLabel={staffProfile ? `${staffProfile.nombre} ${staffProfile.apellido}` : session.user.email ?? ""}
        onRefresh={loadMembers} onLogout={handleLogout}
      />

      {!staffProfile && !staffProfileLoading && (
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
          <StatsTab
            totalActivos={activos.length} registrosMes={registrosMes} nuevosCount={nuevos.length}
            conPadecimiento={conPad} ultimosRegistros={ultimosRegistros}
            onSelectMember={m => { setSelectedMember(m); setActiveTab("socios"); }}
          />
        )}

        {activeTab === "nuevo" && (
          <NuevoSocio onDone={() => setActiveTab("socios")} />
        )}

        {activeTab === "socios" && (
          <MembersTable
            members={members} filtered={filtered} paginated={paginated} loading={loading}
            includeDeleted={includeDeleted} onIncludeDeletedChange={setIncludeDeleted}
            search={search} onSearchChange={setSearch}
            sortField={sortField} sortDir={sortDir} onSort={handleSort}
            currentPage={currentPage} totalPages={totalPages} onPageChange={setPage}
            downloadingPdfId={downloadingPdfId}
            onView={setSelectedMember} onEdit={abrirEdicion} onDownloadPdf={descargarPDF}
            onDelete={setDeleteConfirm} onRestore={restaurar}
          />
        )}
      </div>

      {selectedMember && (
        <MemberDetailModal
          member={selectedMember} firmaUrl={firmaUrl} downloadingPdfId={downloadingPdfId}
          onClose={() => setSelectedMember(null)} onEdit={abrirEdicion} onDownloadPdf={descargarPDF}
          onDelete={setDeleteConfirm} onRestore={restaurar}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal member={deleteConfirm} onCancel={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />
      )}

      {editingMember && (
        <EditMemberModal
          member={editingMember} form={editForm} onFormChange={setEditForm}
          saving={savingEdit} error={editError}
          onCancel={() => setEditingMember(null)} onSave={guardarEdicion}
        />
      )}
    </div>
  );
}
