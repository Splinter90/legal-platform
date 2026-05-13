# LegalConnect — Plataforma Legal (contexto operativo)

Marketplace que conecta clientes con abogados verificados. Reservas con Mercado
Pago, calendario, videollamadas (Google Meet), mensajería con adjuntos, CRM
para el abogado y panel admin con métricas y comisiones.

> Este archivo es **el primer lugar que se lee al arrancar una sesión nueva**.
> Mantenelo actualizado. No incluyas secrets — viven en `.env` (gitignored).

## ⏯️ Última sesión (13/05/2026)

**Commits del día**:
- `fbd6613` — BookingCalendar mensual con slots disponibles + filtros de reseñas (1-5★) en perfil del abogado + mapa con geolocalización del cliente + marcadores con foto de perfil.
- `7954140` — Adjuntar imágenes y PDF en mensajes (clip + preview + render inline/pill). Cliente y abogado.
- `7930e7d` — Este CLAUDE.md como fuente operativa.
- `3c787b7` → `a3f7a55` — Intento Tier 0 #1 (adjuntos privados con Cloudinary `type: authenticated`). **Plan free de Cloudinary no entrega esos assets**, así que revertimos a `type: upload`. Quedaron implementados: el proxy `/api/messages/[id]/attachment` (con ACL por sesión), `Message.attachmentPublicId` en schema. La privacidad real espera la migración a hosting propio.

**Tier 0 cerrado** con commits `65ef05c` (idempotency MP), `38e54c2` (fix fallback), y configuración manual de Neon branching (branch `Abogados` para dev).

**Por dónde seguir**:
- Opción A: Tier 1 (seguridad endurecida) — headers CSP/HSTS, audit log admin, rate-limit más amplio.
- Opción B: Tier 3 (rediseño visual completo) — paleta Navy+Gold de UI/UX Pro Max, dark mode, dot grid, EB Garamond. Tenemos prototipo HTML aprobado en `Desktop/claude/prototipo-legalconnect-v2.html`.

Ver sección "Roadmap pendiente" más abajo para la lista completa priorizada.

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
> (afecta sólo `Abogados`), validar, y después aplicar a `producción` desde
> el dashboard de Neon (Branches → producción → "Restablecer desde rama hija"
> apuntando a `Abogados`) o configurando un job temporal con `DATABASE_URL`
> de producción.

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

Generadas por `npm run db:seed`:

| Rol | User / Email | Password |
|---|---|---|
| Admin | `ADMIN` | `123` |
| Cliente | `cliente@test.com` | `cliente123` |
| Abogado | `abogado@test.com` (María González, CABA, rating 4.8) | `abogado123` |
| Abogado | `abogado2@test.com` (Carlos Rodríguez, La Plata, rating 4.5) | `abogado123` |

Ambos abogados arrancan con `status=approved` y suscripción activa 60 días.

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

> Última sesión: 13/05/2026. Próxima vez: arrancar leyendo esto y preguntar al
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
