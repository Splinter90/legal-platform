# LegalConnect — Plataforma Legal (contexto operativo)

Marketplace que conecta clientes con abogados verificados. Reservas con Mercado
Pago, calendario, videollamadas (Google Meet), mensajería con adjuntos, CRM
para el abogado y panel admin con métricas y comisiones.

> Este archivo es **el primer lugar que se lee al arrancar una sesión nueva**.
> Mantenelo actualizado. No incluyas secrets — viven en `.env` (gitignored).

## ⏯️ Última sesión (20/05/2026)

Pulido de UI en landing + dashboard abogado + páginas de casos, y se cerró el feature de **foto de perfil para el admin** que había quedado a medias por un corte de luz en la sesión 19/05. Todo pusheado a `main` para auto-deploy en Vercel.

### Fixes UI (commit `95a17bb`)

- **Landing** (`src/app/page.tsx`):
  - El botón "Ver mapa interactivo" no redirigía porque el `<Link>` quedaba debajo del overlay `hero-rays` (`absolute inset-0`). Fix: `className="relative inline-block"` en el `<Link>` para que reciba el click.
  - Paso 2 del "Cómo funciona": "Recibís el link de Google Meet por correo." → "Recibís un link de Google Meet." (el Meet se ve en `/client/appointments`, no se manda por mail).
  - Footer y JSON-LD `schema.org`: email canónico ahora `plataformalegales@gmail.com` (antes `contacto@leyesdigital.com`).
- **Email de contacto** propagado a todas las páginas públicas:
  - `src/app/(public)/layout.tsx`, `(public)/contacto/page.tsx`, `(public)/terminos/page.tsx`, `(public)/privacidad/page.tsx`. El `User-Agent` del geocode (`api/geocode/search/route.ts`) sigue con el viejo porque no es visible al usuario.
- **Dashboard abogado** (`lawyer/dashboard/page.tsx`): card "Ingresos Totales" volvía a desbordar con montos grandes. Bajé el valor a `text-sm sm:text-base lg:text-lg`, achiqué el icono (`p-2.5`) y saqué el `truncate`. Ahora el monto entra completo en una línea sin puntos suspensivos.
- **Casos** (`lawyer/cases/page.tsx` y `client/cases/page.tsx`): los textos de descripción y actualizaciones desbordaban con palabras/URLs largas. Agregué `whitespace-pre-wrap break-words` a ambos `<p>`. Ahora respeta saltos de línea y corta palabras largas dentro del card.

### Foto de perfil del admin (commit `95a17bb` también)

Feature que había quedado a medio camino en la sesión 19/05 (corte de luz). El schema y el endpoint estaban listos pero el avatar del topbar seguía siendo estático. Cerré el ciclo end-to-end:

- **Schema** (`prisma/schema.prisma`): `Admin.image String?` opcional. `db push` aplicado a sandbox (`Abogados`) y a producción.
- **API** (`src/app/api/admin/settings/route.ts`): GET y PUT manejan `image` con validación de que sea URL de Cloudinary.
- **UI settings** (`src/app/admin/settings/page.tsx`): card "Mi cuenta" con `AvatarUpload`. Tras subir/quitar foto, llama a `PUT /api/admin/settings` y dispara `updateSession({ image })` para refrescar el avatar del topbar sin re-login.
- **Auth callback** (`src/lib/auth.ts`):
  - `authorize` del provider `admin-login` ahora devuelve `image` además de `id`/`name`/`role`.
  - Bloque nuevo en el callback `jwt` (gemelo a los de cliente/abogado): cada 5 min refresca `username` e `image` desde DB para el rol admin (`token.adminCheckedAt`). Si la fila del admin desaparece, el token se invalida.
- **Topbar dinámico**:
  - `components/layout/user-menu.tsx`: el componente ahora acepta `role: "client" | "lawyer" | "admin"`. El admin va a `/admin/settings` y muestra "Administrador" como rol en el dropdown.
  - `components/layout/dashboard-layout.tsx`: el avatar estático con iniciales se reemplazó por el `<UserMenu>` para los tres roles. Ahora el admin tiene el mismo dropdown que los demás (Actualizar perfil + Cerrar sesión).
  - `src/app/admin/layout.tsx`: pasa `userImage={session?.user?.image}` al `DashboardLayout`.

### Iteración larga del 19/05/2026 (commits `5625301`, `4b27c12`, `46f7bc5`, `037f5e5`, `3f8c531`, `1f7130d`, `c81b835`)

### Panel abogado (commit `5625301` + `c81b835`)

- **Estados de Caso** (`src/lib/validations.ts`): `VALID_CASE_STATUSES` ahora es `["initiated", "in_progress", "waiting_docs", "in_court", "resolved"]` — antes el backend rechazaba `waiting_docs` e `in_court` por mismatch con el frontend.
- **Dashboard** (`lawyer/dashboard/page.tsx`):
  - Card "Ingresos Totales": `text-base sm:text-lg lg:text-xl whitespace-nowrap truncate` con `title` para tooltip (antes desbordaba o partía a dos líneas).
  - Nueva card **"Ingresos por Cliente"** (groupBy `Appointment.clientId` con `paymentStatus=completed`) entre stats y citas/reseñas.
  - **Banner ámbar de suscripción** cuando `subscriptionPaidUntil` está dentro de 7 días; botón "Renovar" hace POST a `/api/payments/subscription` y redirige a MP.
  - **Banner celeste "Conectá tu Google Calendar"** cuando `googleCalendarConnected === false`; botón dispara `signIn("google", { callbackUrl: "/lawyer/dashboard" })` con consent + scope calendar.
- **Casos** (`lawyer/cases/page.tsx` + `api/cases/route.ts`): botón mensaje (link a `/lawyer/messages?with=...`) y botón eliminar (papelera roja) visible solo cuando `status === "resolved"`. Nuevo `DELETE /api/cases?id=...` que valida ownership + status resolved y borra el `CaseTracking` (la cita y el pago quedan intactos).
- **Citas** (`lawyer/appointments/page.tsx`): botón eliminar (soft-delete `archivedByLawyer`) para citas completadas o canceladas. El campo y el endpoint `DELETE /api/appointments/[id]` ya existían en schema.
- **Perfil** (`lawyer/profile/page.tsx`):
  - Eliminado el bloque "Tu ubicación en el mapa".
  - **Especialidades editables**: chips con X para quitar, dropdown para agregar (lista canónica de 12 especialidades). `PUT /api/lawyers/profile` acepta `specialties` con validación.
  - **Nombre y apellido editables** (commit `c81b835`): inputs en la card "Información del Perfil"; endpoint valida 2-40 caracteres; tras guardar dispara `updateSession({ name })`.
  - `AvatarUpload` dispara `updateSession({ image })` tras subir foto.
- **API dashboard** (`api/lawyers/dashboard/route.ts`): expone `earningsByClient[]` y `lawyer.googleCalendarConnected` (sin filtrar el token).

### Cliente (commit `4b27c12` + `46f7bc5`)

- **Settings** (`client/settings/page.tsx`): card "Mi perfil" ahora editable (nombre, teléfono con `PhoneInputAR`). **Quitada la card "Privacidad/Exportar mis datos"**. Email queda deshabilitado (atado a Google). Tras guardar dispara `updateSession({ name, image })`. Endpoint PUT envuelto en try/catch global (commit `46f7bc5`); frontend normaliza teléfono a formato canónico antes de enviar y muestra status HTTP en toast si el body no es JSON.
- **Mapa** (`components/maps/lawyers-map.tsx` + `client/map/page.tsx`): `preferCanvas={true}`, `updateWhenIdle`, `keepBuffer={4}`, fotos con `loading="lazy"` + `decoding="async"`, iconos memoizados con `useMemo`, manejo de error en fetch.
- **Topbar — UserMenu** (`components/layout/user-menu.tsx` nuevo): foto/inicial con dropdown que tiene **"Actualizar perfil"** (→ `/client/settings` o `/lawyer/profile`) y **"Cerrar sesión"** (`signOut`). Aplica en `/client/*` y `/lawyer/*`. Admin queda con el avatar estático.

### Auth (commit `1f7130d`)

Propagación de cambios de perfil a la session sin re-login (`src/lib/auth.ts`):

- Callback `jwt` soporta `trigger === "update"`: mergea `name`/`image` recibidos vía `useSession().update(...)` al token.
- Callback `jwt` refresca name/picture desde DB cada **5 min** (mismo patrón que `lawyerStatus`). Aplica a clientes (`token.clientCheckedAt`) y abogados (extiende el bloque `lawyerStatusCheckedAt` para incluir firstName/lastName/profilePhoto).
- Callback `session` pasa `token.name` → `session.user.name` y `token.picture` → `session.user.image`.

### Google Calendar (commit `5625301` + script + reconnect en prod)

- El scope `calendar` y `prompt: "consent"` ya estaban en `lib/auth.ts`. El problema en prod era que los `googleRefreshToken` viejos no tenían el scope nuevo.
- **Script `scripts/force-google-reconnect.ts`** (soporta `--dry-run`): vacía `googleRefreshToken` de todos los abogados con token guardado. Corrido en dev y en prod (`plataformalegales@gmail.com`, único abogado con token).
- **Cliente** (`client/appointments/page.tsx`): los dos botones `.ics` fueron reemplazados por **deep-link a `calendar.google.com/calendar/render`** (helper en `src/lib/calendar-link.ts`). Abre Google Calendar con el evento pre-llenado, sin OAuth, funciona también para usuarios de Outlook/Apple.
- **Abogado**: el banner del dashboard fuerza re-login con consent. Pendiente verificar que Google Calendar API esté habilitada en Google Cloud Console del proyecto del `GOOGLE_CLIENT_ID`.

### Pendiente / a confirmar

- **Imagen hero de la landing** (commit `3f8c531`): cambié el URL de Unsplash a `photo-1589829545856-d10d557cf95f` (Lady Justice). El usuario reportó que se había roto la imagen anterior. Si la nueva tampoco se ve, fallback: subir imagen propia a `public/images/justice.jpg`.
- **Google Calendar end-to-end**: queda verificar que al reservar una cita y procesarse el pago en prod, el evento se crea en el calendario del abogado. Si no, casi seguro es que **Google Calendar API no está habilitada** en Google Cloud Console.

**Commits (orden cronológico):**
- `5625301` — feat(lawyer): mejoras panel abogado + Google Calendar reconnect (P1–P9)
- `4b27c12` — feat(client): settings editables + avatar dropdown + mapa mas fluido
- `46f7bc5` — fix(client/settings): normalizar telefono + try/catch en PUT
- `037f5e5` — fix(lawyer/dashboard): stats en una sola linea con truncate
- `3f8c531` — fix(landing): restaurar imagen de la estatua de la justicia
- `1f7130d` — fix(auth): propagar cambios de perfil a la session sin re-login
- `c81b835` — feat(lawyer): editar nombre y apellido, propagar a la session
- `0f56245` — docs(CLAUDE.md): registrar sesion del 19/05/2026

## ⏮️ Sesión del 13/05/2026

**Commits del día**:
- `fbd6613` — BookingCalendar mensual con slots disponibles + filtros de reseñas (1-5★) en perfil del abogado + mapa con geolocalización del cliente + marcadores con foto de perfil.
- `7954140` — Adjuntar imágenes y PDF en mensajes (clip + preview + render inline/pill). Cliente y abogado.
- `7930e7d` — Este CLAUDE.md como fuente operativa.
- `3c787b7` → `a3f7a55` — Intento Tier 0 #1 (adjuntos privados con Cloudinary `type: authenticated`). **Plan free de Cloudinary no entrega esos assets**, así que revertimos a `type: upload`. Quedaron implementados: el proxy `/api/messages/[id]/attachment` (con ACL por sesión), `Message.attachmentPublicId` en schema. La privacidad real espera la migración a hosting propio.

**Tier 0 cerrado** con commits `65ef05c` (idempotency MP), `38e54c2` (fix fallback), y configuración manual de Neon branching (branch `Abogados` para dev).

---

## Stack

- **Framework**: Next.js **13.5** (App Router) + React 18 + TypeScript 5.
- **DB**: PostgreSQL en **Neon**. Proyecto `morning-haze-62906870`. Dos branches:
  - **`producción`** (compute `ep-aged-bar-am2j75to`) — usada por Vercel. **Nunca conectarse desde local.**
  - **`Abogados`** (compute `ep-shiny-mouse-amlo3gwe`) — usada en local vía `.env`. Sandbox de desarrollo.
- **ORM**: Prisma 5.22. Schema en `prisma/schema.prisma`.
- **Auth**: NextAuth 4 con dos providers — Google OAuth (clientes y abogados) y `CredentialsProvider` "admin-login" (admin + 2FA TOTP opcional).
- **Pagos**: Mercado Pago Checkout Pro (`MercadoPagoConfig` SDK). Webhook firmado.
- **Mail**: nodemailer + Gmail App Password (`plataformalegales@gmail.com`).
- **Uploads**: Cloudinary (cuenta `dfjoxibim`). Imágenes y PDF.
- **Mapa**: react-leaflet + tiles de CartoDB Voyager. Geocoding via `/api/geocode/search`.
- **Estilos**: Tailwind 3.4 + clases utilitarias.
- **Tests**: Vitest. Corridas: `npm test`. Carpeta `tests/`.
- **Deploy**: **Vercel** (`https://legal-platform-cristian1820.vercel.app/`). Auto-deploy desde push a `main` en GitHub `Splinter90/legal-platform`.
- **Cron jobs** (Vercel): suscripciones diarias 11:00 UTC y recordatorios de citas 12:00 UTC (`vercel.json`).

## Dominios / URLs importantes

- Producción: `https://legal-platform-cristian1820.vercel.app/`
- GitHub: `https://github.com/Splinter90/legal-platform.git` (rama `main`)
- Dev local (ngrok activo en `.env`): `https://scrambler-bobble-earplugs.ngrok-free.dev`
- Neon: ver `DATABASE_URL` en `.env`

## Comandos esenciales

```bash
npm run dev              # local en :3000
npm run build            # prisma generate + next build
npm run db:push          # aplicar schema.prisma a la DB (no destructivo si solo agregás campos opcionales)
npm run db:seed          # carga usuarios de prueba
npm run db:reset         # WIPE + reseed (destructivo)
npm run db:generate      # solo regenerar @prisma/client
npm test                 # vitest run
```

> **Importante**: el `.env` local apunta al branch `Abogados` de Neon, NO a
> producción. `db:push` y `db:reset` desde local solo afectan al sandbox de
> desarrollo. La DB de producción solo se modifica desde Vercel.
>
> **Cambios de schema en producción**: hacer `db:push` desde local primero
> (afecta sólo `Abogados`), validar, y después aplicar a `producción`. Para
> esto último ya tenés la URL guardada en `.env.prod` (gitignored, no se
> carga solo por Next.js). Comando:
>
> ```bash
> set -a && source .env.prod && set +a && npx prisma db push --skip-generate
> ```
>
> Alternativa destructiva: dashboard de Neon → Branches → producción →
> "Restablecer desde rama hija" apuntando a `Abogados` (pisa data de prod).

---

## Modelo de datos (resumido)

```
Admin              — username/password (hashed), 2FA TOTP, fees configurables (consulta, suscripción, comisión, MP fees)
Lawyer             — perfil completo, matricula, specialties (CSV), province/city/address/lat/lng, profilePhoto,
                     rating, reviewCount, status (incomplete|pending|approved|rejected|suspended),
                     subscriptionStatus + subscriptionPaidUntil, consultationDuration (min)
Availability       — lawyer × dayOfWeek × startTime → endTime
Client             — perfil básico, googleId opcional
Appointment        — lawyer × client × dateTime, status (pending_payment|confirmed|completed|cancelled),
                     paymentStatus, amount/platformFee/lawyerAmount, meetLink (Google Meet)
Review             — lawyer × client × rating(1-5) + comment, unique por par
CrmClient          — clientes del abogado (también offline), status (in_progress|...) + caseType
CaseTracking       — 1-a-1 con Appointment, status del trámite
Message            — content + (attachmentPublicId, attachmentType: "image"|"pdf", attachmentName);
                     attachmentUrl queda legacy (mensajes pre-13/05 con URL pública)
Notification       — userId/userType, type, title, message, link, appointmentId
Payment            — pago de cita o suscripción; mpPaymentId/mpPreferenceId/mpMerchantOrder + status
```

Schema canónico: `prisma/schema.prisma`.

---

## Roles y rutas

Middleware en `src/middleware.ts` exige rol matching:

| Prefijo URL | Rol requerido | Lo más relevante |
|---|---|---|
| `/` `/login` `/abogados` `/mapa` `/contacto` `/terminos` `/privacidad` | público | Landing + búsqueda pública + mapa público |
| `/register-client` `/register-lawyer` | público | Alta (Google-only para clientes y abogados) |
| `/client/*` | `client` | dashboard, lawyers (listado), lawyers/[id] (perfil + reservar), appointments, messages, cases, map |
| `/lawyer/*` | `lawyer` | dashboard, profile (completar al ser approved), availability, appointments, messages, crm, cases |
| `/admin/*` | `admin` | dashboard (métricas + MP fees), lawyers (aprobar/rechazar/suspender), clients, payments, settings |

### APIs clave

- **Auth**: `/api/auth/[...nextauth]` (Google + admin-login con TOTP)
- **Citas**: `/api/appointments`, `[id]/confirm`, `[id]/cancel`, `/manage`
- **Pagos**: `/api/payments` (preference), `/callback`, `/webhook` (firmado), `/subscription`
- **Slots**: `/api/lawyers/[id]/slots?days=30` — devuelve slots disponibles para el calendario
- **Mensajes**: `/api/messages` (GET conversación, POST acepta `attachmentUrl/Type/Name`)
- **Upload**: `/api/upload` — carpetas autorizadas: `lawyer-applications` (pública), `lawyers`/`general`/`message-attachments` (auth). PDF solo en `message-attachments` (10MB), imágenes 5MB. **Nota**: hoy sube como `type: "upload"` (técnicamente público) porque Cloudinary plan free no entrega bien los `authenticated`. La privacidad real se va a resolver cuando se migre a servidor propio. Mientras tanto el publicId es aleatorio y nunca aparece en la API pública.
- **Adjunto de mensaje (proxy)**: `/api/messages/[id]/attachment` — verifica sesión + que el usuario sea cliente o abogado del mensaje, y redirige a la URL de Cloudinary. Da una capa de control de acceso (hay que estar logueado y ser parte del chat para obtener la URL), aunque no impide que la URL sea reutilizada luego. `?download=1` fuerza descarga.
- **Reviews**: `/api/reviews` — POST exige una `Appointment.status === "completed"` y unicidad por par
- **Notificaciones**: `/api/notifications`
- **Geo**: `/api/geocode/search`, `/api/lawyers/map`
- **Cron** (token en header `Authorization: Bearer $CRON_SECRET`): `/api/cron/subscriptions`, `/api/cron/appointments-reminder`
- **Admin**: `/api/admin/{dashboard,settings,lawyers,clients,payments,2fa/*}`

---

## Reglas de negocio que NO obvian

1. **Chat gate** (`src/lib/messaging.ts`): cliente y abogado solo se pueden escribir si tienen ≥1 cita con status `confirmed` o `completed` entre ellos. Mensaje de error: `CHAT_GATE_MESSAGE`.
2. **Cancelación de cita por cliente** (`src/lib/appointment-policy.ts`):
   - `pending_payment` → siempre.
   - `confirmed` → solo si faltan ≥ **24h** (`CLIENT_CANCELLATION_CUTOFF_HOURS`). Si estaba pagada, dispara reembolso vía MP (`refundMpPayment`).
   - Cualquier otro status → no.
3. **Acceso del abogado a features** (`src/lib/lawyer-access.ts`): requiere `status === "approved"` **y** `subscriptionStatus === "active"` **y** `subscriptionPaidUntil` futuro. Si falta algo, los endpoints devuelven 403 con mensaje específico, y la UI muestra `<LockedFeature>`.
4. **Reseñas**: una sola por par cliente-abogado, solo después de cita `completed`. Recalcula `rating` y `reviewCount` en `Lawyer`.
5. **Cálculo de comisión** (`src/lib/mp-fees.ts`): `calculateMPBreakdown(gross, commission%, mpConfig)` devuelve `{mpBaseFee, mpIva, mpTotalFee, marketplaceReceives, platformCommission, lawyerReceives}`. Configurable desde `/admin/settings`.
6. **Slots del calendario**: combina `Availability` del abogado con `consultationDuration` y resta las citas existentes. Devuelto por `/api/lawyers/[id]/slots`.
7. **Subscriptions cron**: a las 11 UTC marca abogados con `subscriptionPaidUntil` vencida como inactivos.

---

## Features implementadas (timeline reciente)

### Sesión 12/05/2026 (anterior — ya commiteada y deployada)
- 2FA TOTP para admin (`/api/admin/2fa/*`).
- Cron jobs (Vercel) + rate-limit en endpoints sensibles.
- Pruebas Vitest: `appointment-conflict`, `appointment-policy`, `lawyer-status-transitions`, `mp-webhook-signature`, `totp`.
- Admin Settings: panel de comisión MP (scheme + fees + IVA configurables).
- Admin Dashboard: contabilidad correcta con MP commission, payments con nombres cliente/abogado.
- Página pública `/abogados`, `/mapa`, `/contacto`, `/terminos`, `/privacidad`.
- SMTP test script (`scripts/test-smtp.ts`) + `npm run test:smtp`.
- Registro Google-only (cliente y abogado), chat gate, signout modal.

### Sesión 13/05/2026 (hoy — pusheada)
- **Commit `fbd6613`**: BookingCalendar (mes con slots disponibles) + filtros de reseñas (1-5★, recientes/mejor/peor) + mapa pide geolocalización del cliente y ordena por cercanía + marcadores usan foto de perfil del abogado.
- **Commit `7954140`**: adjuntos en mensajes — imágenes y PDF (hasta 10MB) vía Cloudinary, `Message.attachmentUrl/Type/Name`, UI con clip + preview + render inline para imágenes / pill descargable para PDFs. Espejado en cliente y abogado.
- **Tier 0 #1 (parcial)**: schema agrega `attachmentPublicId`, endpoint proxy `/api/messages/[id]/attachment` con ACL, UI usa el proxy. **Pero** `type: "authenticated"` no funcionó en el plan free de Cloudinary, así que volvimos a `type: "upload"`. La privacidad real queda para cuando se migre a servidor propio.

---

## Variables de entorno

Plantilla: `.env.example`. Real local: `.env` (gitignored). En Vercel: replicarlas en Settings → Environment Variables.

| Var | Para qué |
|---|---|
| `DATABASE_URL` | Neon postgres (pooled) |
| `NEXTAUTH_URL` | Base URL (en prod, la de Vercel; en local, ngrok o `localhost:3000`) |
| `NEXTAUTH_SECRET` | Random 32 bytes base64 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google. Redirect autorizado debe incluir `${NEXTAUTH_URL}/api/auth/callback/google` |
| `MERCADOPAGO_ACCESS_TOKEN` | **Empieza con `TEST-`** en sandbox, `APP_USR-` en prod. Actualmente: TEST activo |
| `MERCADOPAGO_PUBLIC_KEY` | Idem |
| `MERCADOPAGO_WEBHOOK_SECRET` | Firma del webhook (verificada en `src/lib/mp-webhook-signature.ts`) |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Cuenta `dfjoxibim` |
| `SMTP_HOST/PORT/SECURE/USER/PASS/FROM` | Gmail App Password. Dejar `SMTP_HOST=""` desactiva todos los envíos. |
| `CRON_SECRET` | Vercel Cron lo manda como Bearer al endpoint |

---

## Cuentas de prueba (seed)

> ⚠️ **Importante**: clientes y abogados son **Google-only** en login. Las
> passwords del seed existen en la DB pero el formulario de login no las
> usa (solo botón "Continuar con Google"). Para testear hay que loguearse
> con cuentas Gmail reales registradas como test users en Google Cloud
> Console del owner. Solo el admin usa user+password.

Generadas por `npm run db:seed`:

| Rol | Identidad en DB | Cómo se loguea |
|---|---|---|
| Admin | username `ADMIN` / pass `123` | Form `/login` (única ruta password) |
| Cliente | email `cliente@test.com` | **No usable** sin Google. Sirve solo para data fixture. |
| Abogado | `abogado@test.com` (María González, CABA, rating 4.8) | Idem. |
| Abogado | `abogado2@test.com` (Carlos Rodríguez, La Plata, rating 4.5) | Idem. |

**Para testear flows reales** (reservas, mensajes, pagos): usar cuentas Gmail
del owner agregadas como **Test users** en el OAuth Consent Screen de Google
Cloud (project del `GOOGLE_CLIENT_ID` actual). Cada login Google crea o
matchea un `Client` por email — si no existe, se crea automáticamente.

Ambos abogados del seed arrancan con `status=approved` y suscripción activa
60 días.

---

## Mercado Pago — Cómo testear

**Tenemos credenciales TEST cargadas en `.env` y en Vercel** (el access token empieza con `TEST-1916383597684354-...`). Se obtuvieron del panel de developers de la cuenta personal del owner.

### Tarjetas de prueba (AR)

| Resultado | Marca | Número | CVV | Vencim. |
|---|---|---|---|---|
| ✅ Aprobado | Mastercard | `5031 7557 3453 0604` | `123` | `11/30` |
| ✅ Aprobado | Visa | `4509 9535 6623 3704` | `123` | `11/30` |
| ❌ Rechazado | Visa | `4013 5406 8274 6260` | `123` | `11/30` |
| 🟡 Pendiente | Mastercard | `5031 4332 1540 6351` | `123` | `11/30` |

Titular: `APRO` aprueba, `OTHE` rechaza, `CONT` pendiente. DNI: `12345678`.

### Webhook local
Para que MP llegue al webhook en dev, el `.env` está apuntado a una URL de **ngrok** estática (`scrambler-bobble-earplugs.ngrok-free.dev`). Si vence o cambia, hay que actualizar `NEXTAUTH_URL` y el Webhook URL en el panel de MP.

---

## Convenciones del repo

- **Componentes UI** reusables en `src/components/ui/` (Card, Button, Badge, Modal, Stars, BookingCalendar, etc.).
- **Componentes específicos**: `src/components/maps/`, `src/components/lawyer/` (`LockedFeature`).
- **Lib (lógica pura, testeable)**: `src/lib/` — todo lo que no toque React.
- **APIs**: siempre con `getServerSession(authOptions)` y validación de rol. Errores `{error: "..."}`  con status apropiado.
- **Rate-limit**: helper `src/lib/rate-limit.ts`. Usado en mensajes (30/min/user), login admin (10/IP, 5/user), etc.
- **No documentación spam**: comentarios solo cuando el "por qué" no es obvio. Sin emojis salvo que el usuario los pida.
- **Edits chicos**: nada de refactors no pedidos. Preferir editar archivos existentes a crear nuevos.

---

## Roadmap pendiente (orden sugerido)

> Última sesión: 20/05/2026. Próxima vez: arrancar leyendo esto y preguntar al
> usuario por dónde sigue. **Lista corta y priorizada** del análisis completo
> que hicimos. Los Tier están ordenados de "más urgente" a "más diferenciador".

### Tier 0 — Riesgos que pueden romper el negocio

- [x] **#1 Adjuntos privados** — parcial. Proxy y publicId implementados. Cloudinary free no entrega `type: authenticated`; postergado para cuando se migre a servidor propio (S3 + signed URLs cortas, o filesystem con auth).
- [x] **#2 DB de staging** — Neon branching activado. `.env` local apunta al branch `Abogados`. Vercel sigue en `producción`.
- [x] **#3 Idempotency en webhook MP** — `Payment.mpPaymentId @unique` + `updateMany` atómico con guard `mpPaymentId: null` + captura de P2002. Commit `65ef05c`.
- [x] **#4 Confirm-without-payment fallback** — era código muerto. Eliminado. Si MP falla, error legible al usuario. Commit `38e54c2`.

**Tier 0 cerrado el 13/05/2026.** Próximo: Tier 1 (seguridad endurecida) o Tier 3 (rediseño visual).

### Tier 1 — Seguridad endurecida

- [ ] Headers de seguridad en `next.config.js`: `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options: DENY`, `Referrer-Policy`.
- [ ] Audit log del admin: tabla `AdminLog (adminId, action, target, ts, ip)`. Loguear cada acción de `/api/admin/*`.
- [ ] Rate limiting más amplio: agregar en `/api/reviews`, `/api/upload`, `/api/appointments`.
- [ ] Session timeout del admin: NextAuth default 30d. Bajar a 1h de inactividad solo para `role === "admin"`.
- [ ] MIME sniffing en uploads con magic bytes (paquete `file-type`).
- [ ] Reset password seguro del admin: hoy no existe flujo de recuperación.

### Tier 2 — Funcionalidades modernas (alto impacto)

- [ ] **Mensajería real-time** con Server-Sent Events. Hoy hay polling cada 5s en `messages/page.tsx`. Endpoint `/api/messages/stream` + EventSource en el cliente.
- [ ] **Emails transaccionales** con SMTP ya configurado:
  - Cita confirmada con `.ics` adjunto
  - Recordatorio 24h antes (el cron existe, solo crea notif in-app — falta email)
  - Pedido de reseña post-cita
  - Suscripción del abogado por vencer en 7 días
  - Abogado aprobado/rechazado
- [ ] **Push notifications** (Web Push API + service worker)
- [ ] **Búsqueda avanzada en `/client/lawyers`**: radio km (slider, ya tenemos haversine), precio máx, idioma, género, rating mínimo, disponibilidad en fecha X.
- [ ] **Favoritos**: tabla `FavoriteLawyer (clientId, lawyerId)`, botón ❤ en cards y perfil.
- [ ] **ICS export**: endpoint `/api/appointments/[id]/ics` + botón "Agregar a calendario".
- [ ] **Plantillas de documentos legales** (el abogado las gestiona): modelo `DocumentTemplate`, librería de poderes/contratos.
- [ ] **Firma electrónica** (DocuSign o Firmar.online).

### Tier 3 — Diseño moderno

- [ ] Skeleton loaders en vez de spinners (Card, MessageBubble, AppointmentList).
- [ ] Toast notifications centralizadas (Sonner o Radix Toast). Hoy hay `setSendError` por componente.
- [ ] Framer Motion para microinteracciones (hoy hay `Reveal` casero).
- [ ] **Dark mode** real con Tailwind `dark:` + toggle en navbar.
- [ ] `<Image>` de Next en vez de `<img>` (lawyers-map.tsx, profile pages).
- [ ] Command palette (Cmd+K) con [cmdk](https://cmdk.paco.me/).
- [ ] Charts en admin dashboard (Recharts o Tremor): revenue mensual, citas por status, specialties más buscadas.
- [ ] Empty states con ilustraciones (unDraw, Storyset).
- [ ] Mobile bottom-nav para `/client/*` y `/lawyer/*`.

### Tier 4 — Modernización profunda

- [ ] PWA instalable (manifest + service worker).
- [ ] Modo offline básico.
- [ ] Presence real-time (cliente ve "Abogado en línea • escribiendo...").
- [ ] E2E con Playwright (flujo reserva + pago sandbox, mensaje con adjunto).
- [ ] Storybook para `components/ui/`.

### Tier 5 — Accesibilidad y legal (AR)

- [ ] Cookie banner (Ley 25.326).
- [ ] WCAG 2.1 AA: contrastes, aria-label en iconos, focus visible.
- [ ] Export de datos del cliente: `/api/clients/me/export` → ZIP.
- [ ] "Eliminar mi cuenta" con soft-delete + scrubbing PII.
- [ ] Verificación automática de matrícula contra padrones de colegios (CPACF, CALP).

### Tier 6 — Diferenciación / "wow"

- [ ] IA para clasificar consulta inicial → sugiere especialidades + abogados (Claude API, `claude-haiku-4-5`).
- [ ] Transcripción post-Meet con resumen (Whisper + GPT). Premium tier.
- [ ] Chatbot legal de pre-orientación en la landing pública.

### Otros pendientes menores (sin tier asignado)

- [ ] Reviews: edición + respuesta del abogado.
- [ ] CLAUDE.md: cuando confirme que ya no hay mensajes con `attachmentUrl` legacy en prod, quitar el fallback en `src/app/api/messages/[id]/attachment/route.ts:44-49`.

---

## Memoria entre sesiones

Este proyecto usa **claude-mem** (instalado globalmente). Captura observaciones por archivo y las inyecta cuando se lee uno conocido. Para forzar una búsqueda manual:

```bash
npx claude-mem search "<tema>"
```

Si la "búsqueda semántica" falla con `chroma-mcp connection`, el fallback de keyword search funciona igual.

**Estrategia**: lo durable (stack, modelos, reglas, URLs, accounts) vive **acá**. Lo episódico (qué arreglamos ayer, qué decidimos sobre X) vive en claude-mem.
