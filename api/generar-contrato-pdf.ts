// Vercel Serverless Function — corre en Node, NO en el navegador.
// Igual que la del proyecto de Registro, pero aquí SÍ exige una sesión
// de staff válida (Authorization: Bearer <access_token>), porque el panel
// puede pedir el contrato de CUALQUIER socio, no sólo uno recién creado.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { buildContractHTML } from "../src/contrato.js";
import type { Socio, Tutor } from "../src/types.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido." });
    return;
  }

  const { socio_id } = (req.body || {}) as { socio_id?: string };
  if (!socio_id || typeof socio_id !== "string") {
    res.status(400).json({ error: "Falta socio_id." });
    return;
  }

  const authHeader = req.headers.authorization || "";
  const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!accessToken) {
    res.status(401).json({ error: "No autorizado: falta sesión." });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    res.status(500).json({ error: "Configuración del servidor incompleta (faltan variables de entorno)." });
    return;
  }

  // Verifica el token con el cliente anon (no con service_role) — esto
  // valida que sea una sesión real de Supabase Auth, no un valor inventado.
  const supabaseAuth = createClient(supabaseUrl, anonKey);
  const { data: userData, error: userError } = await supabaseAuth.auth.getUser(accessToken);
  if (userError || !userData?.user) {
    res.status(401).json({ error: "Sesión inválida o expirada." });
    return;
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { data: staff } = await supabaseAdmin
    .from("usuarios_staff").select("id, activo").eq("id", userData.user.id).single();

  if (!staff || !staff.activo) {
    res.status(403).json({ error: "Tu cuenta no tiene permisos de staff activos." });
    return;
  }

  const { data: socioData, error: socioError } = await supabaseAdmin
    .from("socios").select("*").eq("id", socio_id).single();

  if (socioError || !socioData) {
    res.status(404).json({ error: "Socio no encontrado." });
    return;
  }
  const socio = socioData as Socio;

  let tutor: Tutor | null = null;
  if (socio.es_menor && socio.tutor_id) {
    const { data } = await supabaseAdmin.from("tutores").select("*").eq("id", socio.tutor_id).single();
    tutor = data as Tutor | null;
  }

  let firmaDataUrl: string | null = null;
  if (socio.firma_path) {
    const { data } = await supabaseAdmin.storage.from("firmas").download(socio.firma_path);
    if (data) {
      const buf = Buffer.from(await data.arrayBuffer());
      firmaDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
    }
  }

  const html = buildContractHTML(socio, tutor, firmaDataUrl);

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "letter",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Contrato_${socio.folio}.pdf"`);
    res.status(200).send(pdf);
  } catch (err: any) {
    res.status(500).json({ error: `No se pudo generar el PDF: ${err?.message || "error desconocido"}` });
  } finally {
    if (browser) await browser.close();
  }
}
