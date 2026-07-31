# GymSign — Panel de Administración (Fase 2, segundo entregable)

Panel de staff conectado directamente a Supabase. Reemplaza el prototipo
con login hardcodeado (`admin/gym2026`) y `window.storage`.

## Qué cambió respecto al prototipo

- **Login real**: usa las cuentas de staff que ya creaste en Supabase Auth (ya no hay usuario/contraseña visibles en el código ni en pantalla).
- **Datos reales**: el listado, la búsqueda y las estadísticas leen directamente de la tabla `socios` — son los mismos datos que llena el formulario de Registro.
- **Actualización en tiempo real**: en vez de recargar cada 8 segundos (polling), el panel escucha cambios vía Supabase Realtime — se actualiza solo cuando entra o cambia un socio, sin importar desde qué dispositivo se registró.
- **Eliminar es reversible**: "Eliminar" hace soft-delete (`eliminar_socio`), y ahora hay un botón **Restaurar** tanto en la tabla como en el detalle. El registro se purga físicamente hasta los 2 años (política de retención, Fase 1).
- **Firma digital real**: se trae desde el bucket privado `firmas` con una URL firmada temporal (120 segundos), no se guarda en el navegador.
- **Insignia "NUEVO"**: ahora significa "registrado en las últimas 24 horas", no "no está en la lista mock" como en el prototipo.
- **Catálogo de planes actualizado**: Mensual, Inscripción, Promoción por pago puntual, Semana, Quincena, Visita.

## Nuevo: registro asistido por staff (➕ Registrar Socio)

Nueva pestaña en el panel con el mismo asistente de 4 pasos del kiosco (datos, contrato real de Sport Platinium, firma, confirmación) — pensado para cuando el staff da de alta a un socio directamente (por ejemplo, en la recepción, sin pasar por el kiosco).

- Usa exactamente el mismo texto legal y las mismas validaciones que el formulario de Registro (comparten `src/contrato.ts`).
- Como corre con sesión de staff activa, el registro queda vinculado a esa cuenta en `creado_por` — a diferencia del kiosco, donde siempre queda `null` (autoregistro).
- Al terminar, se puede descargar el contrato de inmediato o registrar otro socio sin salir de la pestaña.

## Nuevo (Fase 4): PDF real generado en servidor

Igual que en el proyecto de Registro: `api/generar-contrato-pdf.ts` genera un PDF real con Chromium headless. Aquí la diferencia es que **sí exige sesión de staff activa** (manda el token de Supabase Auth en el header `Authorization`), porque desde el panel se puede pedir el contrato de cualquier socio, no sólo uno recién registrado.

Aparece como botón **🖨️ PDF** junto al ya existente **📄 HTML** en la tabla, el modal de detalle, y la pantalla de éxito de "Registrar Socio".

**⚠️ No se puede probar con `npm run dev`** — necesitas `vercel dev` o desplegar a Vercel (ver detalle en el README de Registro, aplica igual aquí).

### Variables de entorno adicionales (sólo servidor)

En Vercel → Settings → Environment Variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (se usa para verificar el token del staff, no para consultar datos)
- `SUPABASE_SERVICE_ROLE_KEY` (para leer los datos reales del socio sin restricción de RLS) — **nunca la expongas al cliente**.

## Qué NO incluye (queda para después)

- Registrar un socio manualmente desde el panel (asistido por staff) — puedes pedírmelo como siguiente entregable.
- Dar de alta nuevas cuentas de staff desde el panel (necesita el Edge Function pendiente de Fase 4; por ahora sigue siendo desde el Dashboard de Supabase + `alta_staff_perfil`, ver Fase 1).
- Edición de datos de un socio ya registrado (Fase 5 del plan original).

## Nuevo: descargar contrato desde el panel

Cada socio (activo o eliminado) tiene un botón **📄 Contrato** en la tabla y **📄 Descargar contrato** en el detalle. Al presionarlo:
1. Si el socio es menor de edad, trae los datos del tutor (incluyendo su identificación) desde la tabla `tutores`.
2. Descarga la firma real desde el bucket `firmas` y la embebe en el HTML (no depende de una URL que expire).
3. Genera el mismo contrato real de Sport Platinium (Consentimiento + Aviso de Privacidad) que ya usa el formulario de Registro, y descarga un archivo `.html` listo para abrir e imprimir/guardar como PDF con el botón que trae dentro.

Esto usa el mismo texto legal que el formulario de Registro (vive en `src/contrato.ts`, compartido conceptualmente entre ambos proyectos — si el gimnasio cambia el contrato en el futuro, hay que actualizarlo en los dos lugares).

## Antes de correrlo — habilita Realtime

Corre `10_habilitar_realtime.sql` (carpeta de Fase 1) en el SQL Editor de tu proyecto Supabase. Sin esto, el panel sigue funcionando pero no se actualiza solo — tendrías que usar el botón ⟳ manualmente.

## Cómo correrlo en tu máquina

1. `npm install`
2. `cp .env.example .env` y pega tu `VITE_SUPABASE_ANON_KEY` real (mismo valor que usaste en el proyecto de Registro).
3. `npm run dev` → ábrelo en `http://localhost:5173` (o el puerto que indique la terminal si ya tienes el de Registro corriendo).
4. Inicia sesión con la cuenta de staff que diste de alta en Fase 1.

## Cómo probarlo

1. Abre el panel en una pestaña y el formulario de Registro en otra.
2. Registra un socio nuevo en el formulario.
3. Sin recargar el panel, debería aparecer solo en la lista (gracias a Realtime) en unos segundos.
4. Abre el detalle de ese socio — deberías ver su firma.
5. Elimínalo — debe desaparecer de la lista por defecto, pero seguir visible si activas "Incluir eliminados", con un botón para restaurarlo.

## Cómo subirlo a Vercel

Igual que el proyecto de Registro: Framework Preset **Vite**, variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Recomendado desplegarlo en una URL distinta a la del formulario de Registro (por ejemplo `admin.tudominio.com` vs `registro.tudominio.com`), ya que uno es para el staff y el otro para el kiosco público.
