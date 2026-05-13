# LegalConnect — Plataforma Legal (contexto operativo)

Marketplace que conecta clientes con abogados verificados. Reservas con Mercado
Pago, calendario, videollamadas (Google Meet), mensajería con adjuntos, CRM
para el abogado y panel admin con métricas y comisiones.

> Este archivo es **el primer lugar que se lee al arrancar una sesión nueva**.
> Mantenelo actualizado. No incluyas secrets — viven en `.env` (gitignored).

---

## Stack

- **Framework**: Next.js **13.5** (App Router) + React 18 + TypeScript 5.
- **DB**: PostgreSQL en **Neon** (`neondb` / pooler `ep-aged-bar-am2j75to-pooler.c-5.us-east-1.aws.neon.tech`).
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

> **Importante**: el `.env` apunta al **mismo Neon que producción**. `db:push`
> y `db:reset` desde local impactan en prod. Crear una DB de staging es
> pendiente.

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

## Pendientes conocidos / cosas a tener en cuenta

- **Adjuntos privados de verdad**: cuando se migre el hosting a servidor propio, implementar almacenamiento privado real (S3 con signed URLs cortas, o filesystem con auth). Hoy las URLs de Cloudinary son técnicamente públicas — la única barrera es no conocer el publicId.
- **DB de staging**: actualmente local y prod comparten Neon. Riesgo: `db:push` desde local puede romper prod.
- **Reviews**: el cliente puede dejar UNA. No hay edición ni respuesta del abogado todavía.
- **MP webhook idempotency**: ver `src/app/api/payments/webhook/route.ts`. Verificar que no se procesen pagos duplicados.
- **Fallback confirm-without-payment**: si MP cae mid-payment, el código confirma la cita sin pago (`/appointments/[id]/confirm`). Útil para dev, peligroso para prod — gatear con env var.

---

## Memoria entre sesiones

Este proyecto usa **claude-mem** (instalado globalmente). Captura observaciones por archivo y las inyecta cuando se lee uno conocido. Para forzar una búsqueda manual:

```bash
npx claude-mem search "<tema>"
```

Si la "búsqueda semántica" falla con `chroma-mcp connection`, el fallback de keyword search funciona igual.

**Estrategia**: lo durable (stack, modelos, reglas, URLs, accounts) vive **acá**. Lo episódico (qué arreglamos ayer, qué decidimos sobre X) vive en claude-mem.
