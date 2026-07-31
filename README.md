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

## Qué NO incluye (queda para después)

- Registrar un socio manualmente desde el panel (asistido por staff) — puedes pedírmelo como siguiente entregable.
- Dar de alta nuevas cuentas de staff desde el panel (necesita el Edge Function pendiente de Fase 4; por ahora sigue siendo desde el Dashboard de Supabase + `alta_staff_perfil`, ver Fase 1).
- Edición de datos de un socio ya registrado (Fase 5 del plan original).

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
