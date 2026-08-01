import type { Socio, Tutor } from "./types";

// Todo dato capturado por un socio/tutor pasa por aquí antes de insertarse
// en el HTML del contrato — evita inyección de HTML/JS desde campos como
// nombre, dirección o padecimiento.
function esc(value: string | null | undefined): string {
  if (!value) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const GYM_NOMBRE = "Sport Platinium";
export const GYM_DIRECCION_LEGAL = "Boulevard Paseo del Bosque No. 202, Fraccionamiento Bosques del Peñar, Pachuca de Soto, Hidalgo, C.P. 42094";
export const GYM_EMAIL_PRIVACIDAD = "sportplatinium@gmail.com";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function fechaContratoMX(fecha: Date): string {
  return `Pachuca de Soto, Hidalgo, a ${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}.`;
}

export function formatoFechaMX(fechaISO: string): string {
  if (!fechaISO) return "—";
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}

export function nombreCompletoSocio(m: Pick<Socio, "nombre" | "apellido_paterno" | "apellido_materno">): string {
  return [m.nombre, m.apellido_paterno, m.apellido_materno].filter(Boolean).join(" ");
}

// Texto real proporcionado por el gimnasio ("Consentimiento Informado y
// Exoneración de Responsabilidad"), con los datos del socio insertados.
export function buildConsentimientoAdulto(nombreCompletoRaw: string, tipoIdRaw: string, numeroIdRaw: string, direccionRaw: string, municipioRaw: string, estadoRaw: string, telefonoRaw: string): string[] {
  const nombreCompleto = esc(nombreCompletoRaw), tipoId = esc(tipoIdRaw), numeroId = esc(numeroIdRaw);
  const direccion = esc(direccionRaw), municipio = esc(municipioRaw), estado = esc(estadoRaw), telefono = esc(telefonoRaw);
  return [
    `${GYM_NOMBRE} ofrece servicios para la práctica de la actividad física y ejercicio individualizado, para esto dispone de instalaciones, equipos de alta calidad y talento humano profesional idóneo para guiar dichas prácticas con el fin de brindar seguridad y comodidad a los afiliados.`,
    `Yo ${nombreCompleto || "________________"}, con número de identificación (${tipoId || "___"}) ${numeroId || "________________"}, en calidad de USUARIO y titular de los datos personales, con domicilio en la dirección ${direccion || "________________"}, del municipio de ${municipio || "________________"}, estado de ${estado || "________________"}, con número de contacto ${telefono || "________________"}.`,
    `Expreso mi libre deseo de practicar actividad física y ejercicio individualizado en el Centro de Acondicionamiento Físico de ${GYM_NOMBRE}, declaro, certifico y entiendo que la práctica de la actividad física implica la posibilidad de sufrir lesiones y/o riesgos en mi salud y por lo mismo manifiesto que mi estado de salud es adecuado para la práctica deportiva y declaro que no padezco de ninguna enfermedad que me ponga en situación de riesgo, tales como patologías cardiovasculares, respiratorias, presión arterial, entre otras; no cuento con lesiones previas ya sea musculares o articulares, o bien, de ningún tipo que pudieran agravarse con las actividades que voy a realizar pudiendo causarme lesiones en músculos y articulaciones, deshidratación, paro cardiaco, paro respiratorio, infarto, muerte, entre otros; y que no me encuentro en estado de enfermedad, ni presento síntomas relacionados con el virus COVID-19, ni ninguna otra enfermedad infecto contagiosa o ninguna otra circunstancia que me impida el ingreso al centro de ${GYM_NOMBRE} para la práctica de la actividad física.`,
    `Declaro que me comprometo en todo momento a seguir las recomendaciones que el equipo interdisciplinario de profesionales de ${GYM_NOMBRE} me indique respecto a la práctica deportiva antes, durante y después de la misma y cualquier omisión de ellas exonera y libera de toda responsabilidad civil, penal, contractual y extracontractual a ${GYM_NOMBRE}, por cualquier accidente, deficiencia, alteración, lesión, e incluso la muerte. Renuncio a cualquier derecho y/o demanda, indemnización y/o cualquier acción legal en contra de ${GYM_NOMBRE} y sus funcionarios como resultado de una práctica irresponsable de la actividad física en el centro de ${GYM_NOMBRE}.`,
    `Así mismo me obligo en todo momento a informar inmediatamente al personal asistencial o de profesores sobre dolor, incomodidad, fatiga u otro síntoma que considere que pueda afectar mi salud o la ponga en riesgo, los mismos que puedan presentarse antes, durante y después de mi participación en cualquiera de las actividades y servicios ofrecidos por ${GYM_NOMBRE}.`,
    `Entiendo que tengo a mi disposición la posibilidad de agendar una cita de valoración antes de iniciar mi entrenamiento, pero decido no hacer uso de esta. Por lo tanto, exonero de toda responsabilidad a ${GYM_NOMBRE}, por cualquier situación desencadenada.`,
    `Asumo que es de mi responsabilidad el consumo de cualquier tipo de suplementación, complementación, ayuda ergogénica y/o fármaco que ingiera y decida consumir dentro y fuera del gimnasio ${GYM_NOMBRE}. Por lo tanto, ${GYM_NOMBRE} no tiene responsabilidad civil, penal, contractual o extracontractual por el o los usuarios que hagan un consumo de los mismos y sufran un efecto adverso dentro y fuera de sus instalaciones si éste está bajo la influencia de estas sustancias.`,
    `En caso de sufrir cualquier accidente, eventualidad y/o enfermedad, autorizo al personal de ${GYM_NOMBRE} para dar aviso de dicha circunstancia al nombre de contacto de respaldo y número celular que se indican en la sección de contacto de emergencia de este registro.`,
    `Con el fin de minimizar al máximo los riesgos y potencializar los beneficios del ejercicio físico, ${GYM_NOMBRE} ofrece como centro de acondicionamiento físico, orientación y acompañamiento de: asesoría nutricional; equipos en óptimas condiciones; orientación y asesoramiento en el uso de las instalaciones; y orientación en programas de entrenamiento individualizado según la aptitud física del afiliado.`,
    `Declaraciones adicionales: que la información que suministro es totalmente verídica; que he sido informado acerca de los protocolos que debo seguir para entrenar en el centro ${GYM_NOMBRE}; reconozco que no se puede alterar la función o modificar el equipo del gimnasio para realizar ejercicios para los cuales no está diseñado; y que toda acción que yo realice incumpliendo con la función principal del equipo, alterando su funcionamiento, será bajo mi responsabilidad, exonerando y liberando de toda responsabilidad civil, penal, contractual y extracontractual a ${GYM_NOMBRE}, por cualquier accidente, deficiencia, alteración, lesión, e incluso la muerte.`,
    `Declaro que he leído, entiendo y acepto los términos de este acuerdo en su totalidad.`,
  ];
}

// Texto real del documento "Carta Responsiva — Menor de Edad".
export function buildConsentimientoMenor(tutorNombreCompletoRaw: string, tipoIdRaw: string, numeroIdRaw: string, direccionRaw: string, municipioRaw: string, estadoRaw: string, telefonoRaw: string, menorNombreCompletoRaw: string): string[] {
  const tutorNombreCompleto = esc(tutorNombreCompletoRaw), tipoId = esc(tipoIdRaw), numeroId = esc(numeroIdRaw);
  const direccion = esc(direccionRaw), municipio = esc(municipioRaw), estado = esc(estadoRaw), telefono = esc(telefonoRaw);
  const menorNombreCompleto = esc(menorNombreCompletoRaw);
  return [
    `${GYM_NOMBRE} ofrece servicios para la práctica de la actividad física y ejercicio individualizado, para esto dispone de instalaciones, equipos de alta calidad y talento humano profesional idóneo para guiar dichas prácticas con el fin de brindar seguridad y comodidad a los afiliados.`,
    `Yo ${tutorNombreCompleto || "________________"}, con número de identificación (${tipoId || "___"}) ${numeroId || "________________"}, y titular de los datos personales, con domicilio en la dirección ${direccion || "________________"}, del municipio de ${municipio || "________________"}, estado de ${estado || "________________"}, con número de contacto ${telefono || "________________"}, en calidad de Padre, Madre o Tutor del (la) menor de edad con nombre ${menorNombreCompleto || "________________"}.`,
    `Expreso mi libre deseo para que el menor de edad antes mencionado practique el deporte y/o actividad física de acondicionamiento físico, en el gimnasio ${GYM_NOMBRE} ubicado en ${GYM_DIRECCION_LEGAL}. Declarando y garantizando que mi hijo(a) se encuentra física y mentalmente capacitado(a) para practicar el deporte en mención.`,
    `Declaro, certifico y entiendo que la práctica de la actividad física y/o deporte implica la posibilidad de sufrir lesiones y/o riesgos en su salud y por lo mismo manifiesto que su estado de salud es adecuado para la práctica deportiva y declaro que no padece de ninguna enfermedad que ponga en situación de riesgo, tales como patologías cardiovasculares, respiratorias, presión arterial, entre otras; no cuenta con lesiones previas ya sea musculares o articulares, o de ningún tipo que pudieran agravarse con las actividades que va a realizar pudiendo causarle lesiones en músculos y articulaciones, deshidratación, paro cardiaco, paro respiratorio, infarto, muerte, entre otros; y que no se encuentra en estado de enfermedad, ni presenta síntomas relacionados con el virus COVID-19, ni ninguna otra enfermedad infecto contagiosa o ninguna otra circunstancia que impida su ingreso al centro de ${GYM_NOMBRE} para la práctica de la actividad física.`,
    `Declaro que el menor de edad se compromete en todo momento a seguir las recomendaciones que el equipo interdisciplinario de profesionales de ${GYM_NOMBRE} le indique respecto a la práctica deportiva antes, durante y después de la misma y cualquier omisión de ellas exonera y libera de toda responsabilidad civil, penal, contractual y extracontractual a ${GYM_NOMBRE}, por cualquier accidente, deficiencia, alteración, lesión, e incluso la muerte. Renuncio a cualquier derecho y/o demanda, indemnización y/o cualquier acción legal en contra de ${GYM_NOMBRE} y sus funcionarios como resultado de una práctica irresponsable de la actividad física en el centro de ${GYM_NOMBRE}.`,
    `Así mismo me responsabilizo de orientar al menor, quien tiene la obligación en todo momento de informar inmediatamente al personal asistencial o de profesores sobre dolor, incomodidad, fatiga u otro síntoma que considere que pueda afectar su salud o la ponga en riesgo, antes, durante y después de su participación en cualquiera de las actividades y servicios ofrecidos por ${GYM_NOMBRE}.`,
    `Entiendo que tiene a su disposición la posibilidad de agendar una cita de valoración antes de iniciar su entrenamiento, pero decido no hacer uso de esta. Por lo tanto, exonero de toda responsabilidad a ${GYM_NOMBRE}, por cualquier situación desencadenada.`,
    `Asumo que es responsabilidad del padre, madre o tutor la supervisión del consumo de cualquier tipo de suplementación, complementación, ayuda ergogénica y/o fármaco que decida consumir el menor de edad dentro y fuera del gimnasio ${GYM_NOMBRE}. Por lo tanto, ${GYM_NOMBRE} no tiene responsabilidad civil, penal, contractual o extracontractual por el o los usuarios que hagan un consumo de los mismos y sufran un efecto adverso dentro y fuera de sus instalaciones si éste está bajo la influencia de estas sustancias.`,
    `En caso de sufrir cualquier accidente, eventualidad y/o enfermedad, autorizo al personal de ${GYM_NOMBRE} para dar aviso de dicha circunstancia al nombre de contacto de respaldo y número celular que se indican en la sección de contacto de emergencia de este registro.`,
    `Con el fin de minimizar al máximo los riesgos y potencializar los beneficios del ejercicio físico, ${GYM_NOMBRE} ofrece como centro de acondicionamiento físico, orientación y acompañamiento de: asesoría nutricional; equipos en óptimas condiciones; orientación y asesoramiento en el uso de las instalaciones; y orientación en programas de entrenamiento individualizado según la aptitud física del afiliado.`,
    `Declaraciones adicionales: que la información que suministro es totalmente verídica; que he sido informado(a) acerca de los protocolos que debe seguir el menor para entrenar en el centro ${GYM_NOMBRE}; reconozco que no se puede alterar la función o modificar el equipo del gimnasio para realizar ejercicios para los cuales no está diseñado; y que toda acción que el menor de edad realice incumpliendo con la función principal del equipo, alterando su funcionamiento, será bajo mi responsabilidad como padre, madre o tutor, exonerando y liberando de toda responsabilidad civil, penal, contractual y extracontractual a ${GYM_NOMBRE}, por cualquier accidente, deficiencia, alteración, lesión, e incluso la muerte.`,
    `Declaro que he leído, entiendo y acepto los términos de este acuerdo en su totalidad.`,
  ];
}

// Texto real del "Aviso de Privacidad" de Sport Platinium.
export function buildAvisoPrivacidad(): string[] {
  return [
    `ESTIMADO CLIENTE, en ${GYM_NOMBRE.toUpperCase()} estamos conscientes de la importancia de proteger correctamente los datos personales de nuestros clientes, es por ello y de conformidad con lo establecido en los artículos 15, 16, y demás relativos y aplicables de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, "${GYM_NOMBRE.toUpperCase()}", con domicilio en ${GYM_DIRECCION_LEGAL}, que en su calidad de responsable pone a su disposición el siguiente Aviso de Privacidad, a fin de que tenga pleno conocimiento sobre el tratamiento que se le dará a sus datos personales, así como facilitarle el ejercicio de los derechos que la LFPDPPP le otorga.`,
    `1. Datos personales tratados. Los datos personales que recopilamos de nuestros clientes son: nombre, teléfono, dirección, número de identificación, correo electrónico y firma digital. Todos son indispensables para que ${GYM_NOMBRE} pueda brindarle los servicios que se ofrecen; en caso de revocación del consentimiento o ejercicio del derecho de cancelación, esto dará lugar a la rescisión del servicio contratado, sin responsabilidad para ${GYM_NOMBRE}. Trataremos los datos personales de menores de edad, proporcionados por sus padres y/o tutores, con el consentimiento de estos últimos en todos los casos.`,
    `2. Finalidades del tratamiento. Sus datos personales son utilizados para: (I) suscripción de servicios; (II) identificación y verificación; (III) contacto; y (IV) identificación al momento de acceso a las instalaciones. Asimismo, podrán usarse con fines comerciales y de promoción: (I) enviarle información sobre nuestros productos o servicios; (II) realizar encuestas de calidad; (III) hacerle llegar ofertas y promociones. Si no desea que sus datos se usen para estas finalidades comerciales, puede contactarnos en cualquier momento a través de ${GYM_EMAIL_PRIVACIDAD} o directamente en nuestras instalaciones.`,
    `3. Mecanismos de seguridad. ${GYM_NOMBRE} tiene implementadas las medidas de seguridad administrativas, técnicas y físicas necesarias y suficientes para la correcta protección de los datos. Los padres y/o tutores podrán ejercer en todo momento los derechos ARCO o revocar el consentimiento para el tratamiento de los datos de menores de edad.`,
    `4. Revocación del consentimiento. Usted podrá revocar en cualquier momento su consentimiento para el tratamiento de sus datos personales, mediante un documento presentado por escrito directamente en nuestras instalaciones (lunes a viernes de 8:00 a 13:00 y de 15:00 a 17:00 horas), o a través de ${GYM_EMAIL_PRIVACIDAD}, conforme al Capítulo IV de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.`,
    `5. Ejercicio de derechos ARCO. Usted puede ejercer ante ${GYM_NOMBRE}, en cualquier momento, sus derechos de acceso, rectificación, cancelación y oposición al tratamiento de sus datos personales, mediante solicitud por escrito enviada a nuestras instalaciones, conforme al mismo Capítulo IV.`,
    `6. En ningún caso ${GYM_NOMBRE} transferirá los datos personales de sus clientes a un tercero, sin el consentimiento previo de los titulares.`,
    `7. Cambios al aviso de privacidad. ${GYM_NOMBRE} se reserva el derecho de modificar o extender el contenido del presente Aviso de Privacidad en cualquier momento; cualquier cambio se comunicará a través de avisos directamente en nuestras instalaciones.`,
    `He leído el Aviso de Privacidad de Datos Personales y estoy de acuerdo.`,
  ];
}

function planLabelSocio(socio: Socio): string {
  const extras = [
    socio.incluye_inscripcion ? "Inscripción" : null,
    socio.promocion_pago_puntual ? "Promoción por pago puntual" : null,
  ].filter(Boolean);
  return extras.length ? `${socio.plan} (+ ${extras.join(", ")})` : socio.plan;
}

// Genera el HTML imprimible completo a partir de un socio ya guardado
// en la base de datos (usado por el botón "Descargar contrato" del panel).
export function buildContractHTML(socio: Socio, tutor: Tutor | null, firmaDataUrl: string | null): string {
  const nombreCompleto = esc(nombreCompletoSocio(socio));
  const fecha = new Date(socio.creado_en);
  const dateStr = fecha.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Mexico_City" });
  const timeStr = fecha.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });

  const rows: [string, string][] = [
    ["Nombre completo", nombreCompleto],
    ["Identificación", `${esc(socio.tipo_identificacion)} – ${esc(socio.numero_identificacion)}`],
    ["Correo electrónico", esc(socio.email)],
    ["Teléfono", esc(socio.telefono)],
    ["Fecha de nacimiento", formatoFechaMX(socio.fecha_nacimiento)],
    ["Plan contratado", esc(planLabelSocio(socio))],
    ["Dirección", esc(socio.direccion) || "—"],
    ["Municipio / Estado", `${esc(socio.municipio) || "—"}, ${esc(socio.estado)}`],
    ["Nombre de contacto de emergencia", socio.contacto_emergencia ? `${esc(socio.contacto_emergencia)} – ${esc(socio.telefono_emergencia)}` : "—"],
    ["Padecimiento médico", esc(socio.padecimiento) || "Ninguno declarado"],
  ];
  if (socio.es_menor && tutor) {
    rows.push(["Tutor / responsable", `${esc(tutor.nombre)} ${esc(tutor.apellido)} (${esc(tutor.parentesco) || "Tutor"}) – ${esc(tutor.telefono)}`]);
  }

  const tutorNombreCompleto = tutor ? `${tutor.nombre} ${tutor.apellido}` : "";
  const consentimiento = socio.es_menor
    ? buildConsentimientoMenor(tutorNombreCompleto, tutor?.tipo_identificacion || "", tutor?.numero_identificacion || "", socio.direccion || "", socio.municipio, socio.estado, tutor?.telefono || "", nombreCompletoSocio(socio))
    : buildConsentimientoAdulto(nombreCompletoSocio(socio), socio.tipo_identificacion, socio.numero_identificacion, socio.direccion || "", socio.municipio, socio.estado, socio.telefono);

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
<title>Contrato Sport Platinium – ${nombreCompleto}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;color:#1f2937;padding:32px;max-width:800px;margin:0 auto;background:#fff}
.hdr{background:#111827;color:#fff;padding:20px 28px;border-radius:10px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center}
.hdr h1{font-size:20px;font-weight:700}.hdr p{font-size:12px;color:#9ca3af;margin-top:4px}
.folio{font-size:11px;color:#d1d5db;background:#374151;padding:4px 10px;border-radius:6px}
.sec{background:#111827;color:#fff;padding:7px 14px;border-radius:6px 6px 0 0;font-size:11px;font-weight:700;letter-spacing:.06em}
table{width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;margin-bottom:20px}
td{padding:10px 14px;border-bottom:1px solid #f3f4f6;width:50%;vertical-align:top}
tr:nth-child(odd) td:first-child,tr:nth-child(even) td:last-child{background:#f9fafb}
td .l{display:block;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px}
td .v{font-size:13px;color:#111827;font-weight:500}
.clauses{border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:16px;margin-bottom:20px}
.accept{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;margin-bottom:20px;font-size:12px;color:#166534;font-weight:600}
.sig{width:100%;margin-bottom:24px}
.sig td{width:50%;padding:14px;background:#f9fafb;border:1px solid #e5e7eb;vertical-align:top}
.sig td:first-child{border-radius:8px 0 0 8px}.sig td:last-child{border-radius:0 8px 8px 0;border-left:none}
.sig .l{display:block;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
.sig img{width:100%;max-width:300px;height:80px;object-fit:contain;background:#fff;border:1px solid #e5e7eb;border-radius:4px;padding:4px}
.sig-name{border-top:1.5px solid #d1d5db;margin-top:10px;padding-top:6px;font-size:12px;color:#374151;font-weight:500}
.footer{text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:14px}
@media print{body{padding:16px}.print-btn{display:none!important}}
.print-btn{display:block;margin:20px auto;background:#111827;color:#fff;border:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer}
</style></head><body>
<div class="hdr"><div><h1>🏋️ Sport Platinium</h1><p>Consentimiento Informado y Exoneración de Responsabilidad</p></div><div class="folio">Folio: ${socio.folio}</div></div>
<div class="sec">DATOS DEL SOCIO</div>
<table>${rows.reduce((acc,_,i,arr)=>i%2===0?acc+`<tr><td><span class="l">${arr[i][0]}</span><span class="v">${arr[i][1]}</span></td>${arr[i+1]?`<td><span class="l">${arr[i+1][0]}</span><span class="v">${arr[i+1][1]}</span></td>`:'<td></td>'}</tr>`:acc,"")}</table>
<div class="sec">CONSENTIMIENTO INFORMADO Y EXONERACIÓN DE RESPONSABILIDAD</div>
<div class="clauses"><p style="font-size:11px;color:#9ca3af;margin-bottom:10px">${fechaContratoMX(fecha)}</p>${consentimiento.map(p=>`<p style="margin-bottom:10px">${p}</p>`).join("")}</div>
<div class="sec">AVISO DE PRIVACIDAD</div>
<div class="clauses">${buildAvisoPrivacidad().map(p=>`<p style="margin-bottom:10px">${p}</p>`).join("")}</div>
<div class="accept">✅ El socio${socio.es_menor ? " y su tutor declaran" : " declara"} haber leído, comprendido y aceptado en su totalidad el Consentimiento Informado y Exoneración de Responsabilidad y el Aviso de Privacidad.</div>
<table class="sig"><tr>
  <td><span class="l">Firma digital del socio</span>${firmaDataUrl?`<img src="${firmaDataUrl}" alt="Firma"/>`:"<p style='font-size:12px;color:#9ca3af'>Firma no disponible</p>"}<div class="sig-name">${nombreCompleto}</div></td>
  <td><span class="l">Fecha y hora de firma</span>
    <p style="font-size:15px;font-weight:700;color:#111827;margin-bottom:4px">${dateStr}</p>
    <p style="font-size:12px;color:#374151;margin-bottom:6px">${timeStr} hrs</p>
    <p style="font-size:11px;color:#6b7280">Plan: ${esc(planLabelSocio(socio))}</p></td>
</tr></table>
<div class="footer">Documento generado digitalmente por GymSign para Sport Platinium &nbsp;•&nbsp; Folio ${socio.folio} &nbsp;•&nbsp; ${dateStr}</div>
<button class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
</body></html>`;
}
