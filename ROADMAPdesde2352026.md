# SaciaTurno — Roadmap

> Documento de contexto para IDE / AI assistants. Define hacia dónde apunta el proyecto, qué decisiones técnicas están tomadas, y qué evitar.

---

## Estado actual

**Funciona:**
- Frontend React 19 + Vite + Router v7
- Google OAuth con `@react-oauth/google` + `jwt-decode`
- Sistema de roles: `owner` | `admin` | `client` (via `authorizedAdmins`)
- Auto-revalidación de permisos en `AuthContext`
- CRUDs completos en panel admin
- Motor de disponibilidad (`availabilityEngine.js`) — **no tocar, ya funciona**
- Stats calculator — **no tocar, ya funciona**
- Persistencia en `localStorage` (a migrar)
- Sistema de temas via CSS variables (`theme.js`)

**Pendiente:**
- Backend real (Firebase)
- Multi-tenancy por slug
- Aislamiento de datos (Security Rules)
- Panel super-admin
- Recordatorios WhatsApp
- Pagos Mercado Pago
- White-label dinámico desde DB
- PWA

---

## Decisiones técnicas tomadas

| Área | Stack | Notas |
|------|-------|-------|
| Frontend | React 19 + Vite + Tailwind | Migrar CSS puro a Tailwind progresivamente |
| Backend | Firebase (Firestore + Auth + Storage) | NO Supabase, NO Express custom para MVP |
| Auth | Firebase Auth + Google OAuth | Ya implementado el frontend, falta backend |
| Multi-tenancy | Slug en URL path | `/:businessSlug/...`, NO subdominios |
| Automatizaciones | n8n self-hosted (Hostinger) | NO Cloud Functions excepto webhooks |
| WhatsApp | WhatsApp Cloud API (Meta directo) | NO Twilio, NO Evolution API |
| Número WhatsApp | Único de SACIA para todos los tenants | NO el número del barbero |
| Pagos | Mercado Pago Checkout Pro | Webhook validado en Cloud Function |
| Email | Resend o Brevo | Solo confirmaciones y backup |
| Hosting | Firebase Hosting | SSL automático |

---

## Estructura Firestore objetivo

```
/businesses/{businessId}
  - name, slug, logoUrl, colors, settings, isFrozen, ...
  /professionals/{profId}
  /services/{srvId}
  /schedules/{schId}
  /appointments/{aptId}
  /admins/{adminId}  // reemplaza authorizedAdmins
  /notifications/{notifId}  // log de WhatsApp/email enviados

/users/{userId}
  - email, name, role, businessId (null si client), linkedBusinesses[]

/superAdmin/{config}  // solo accesible para owner global
```

**Regla de oro:** toda query lleva `where('businessId', '==', userBusinessId)`. Security Rules verifican lo mismo a nivel DB.

---

## Roadmap por sprints

### Sprint 0 — Fundación Firebase `[1-2 semanas]`
- [ ] Crear proyecto Firebase
- [ ] Configurar Firestore + Auth + Storage
- [ ] Migrar `mockData.js` como seed inicial
- [ ] Reemplazar persistencia de `BusinessContext` (localStorage → Firestore)
- [ ] Reemplazar `AuthContext` (login Google ya existe, solo falta atarlo a Firebase Auth con custom claims `{ businessId, role }`)
- [ ] **Mantener intactos** `availabilityEngine.js` y `statsCalculator.js`
- [ ] Iniciar trámite Meta WhatsApp (en paralelo, demora 1-2 semanas)

### Sprint 1 — Multi-tenancy `[1-2 semanas]`
- [ ] Routing `/:businessSlug/...` en `App.jsx`
- [ ] Hook `useCurrentBusiness()` resuelve slug → businessId
- [ ] Security Rules estrictas + tests con emulador
- [ ] Migrar `authorizedAdmins` a subcolección `/businesses/{id}/admins`
- [ ] Onboarding mínimo: crear barbería + slug auto-generado

### Sprint 2 — Super-admin `[3-5 días]`
- [ ] Ruta `/super-admin` accesible solo para email hardcodeado
- [ ] Listado de tenants con métricas básicas
- [ ] Acción "congelar cuenta" → flag `isFrozen` bloquea booking público

### Sprint 3 — White-label dinámico `[3-5 días]`
- [ ] Upload de logo a Firebase Storage
- [ ] `theme.js` lee colores/branding desde Firestore por slug
- [ ] Preview en vivo en `/admin/configuracion`

### Sprint 4 — Recordatorios WhatsApp `[1-2 semanas]` ⭐
- [ ] Workflow n8n con cron cada 30 min
- [ ] Buscar citas en T-24h y T-2h (status `pendiente`/`confirmada`)
- [ ] POST a WhatsApp Cloud API con template aprobado
- [ ] Log en `/businesses/{id}/notifications`
- [ ] Plantillas configurables por barbería

### Sprint 5 — Pagos y seña `[1-2 semanas]`
- [ ] Mercado Pago Checkout Pro
- [ ] Campos `requiresDeposit`, `depositPercent` en servicios
- [ ] Cloud Function `/webhook/mp` valida firma
- [ ] Estado `pendiente_pago` → `confirmada` al recibir pago

### Sprint 6 — Polish `[continuo]`
- [ ] PWA (manifest + service worker)
- [ ] Reportes mejorados
- [ ] Onboarding self-service end-to-end
- [ ] Landing pública de SaciaTurno (captación de barberos)

---

## Lo que NO hay que hacer

- ❌ NO escribir backend custom con Express. Firebase resuelve todo lo del MVP.
- ❌ NO crear subdominios por tenant. Slug en path es suficiente.
- ❌ NO usar Twilio para WhatsApp. WhatsApp Cloud API directo de Meta es más barato.
- ❌ NO permitir que cada barbero conecte su propio WhatsApp. Un número único SACIA.
- ❌ NO leer `db.collection()` directo desde componentes. Abstraer en hooks (`useProfessionals`, `useAppointments`, etc.) para poder migrar de Firebase en el futuro.
- ❌ NO romper `availabilityEngine.js` ni `statsCalculator.js`. Solo cambia la fuente de datos.
- ❌ NO mezclar lógica de tenants en queries. SIEMPRE filtrar por `businessId`.
- ❌ NO confiar solo en filtros en frontend. Security Rules son la red de seguridad real.
- ❌ NO crear UI de "elegir barbería" para clientes. Vienen por link directo (`/barberia-x`).
- ❌ NO storage de contraseñas. Solo Google OAuth.

---

## Convenciones de código

- **Componentes**: PascalCase, una responsabilidad
- **Hooks**: prefijo `use*`, retornan objeto o array tipado
- **Estado global**: solo lo que es realmente global (auth, business actual, booking wizard)
- **Estado local**: `useState` directo en el componente
- **Estilos**: Tailwind para nuevos componentes, CSS puro existente se mantiene hasta migración progresiva
- **Strings de IDs**: kebab-case (`biz-001`, `prof-001`)
- **Fechas**: ISO `YYYY-MM-DD` para fechas, `HH:MM` para horas

---

## Variables de entorno necesarias

```env
VITE_GOOGLE_CLIENT_ID=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# n8n (no expuesto al cliente)
N8N_WEBHOOK_URL=
WHATSAPP_PHONE_ID=
WHATSAPP_TOKEN=

# Mercado Pago
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=
```

---

## Prioridad actual

**→ Sprint 0**: arrancar por la migración a Firebase. Antes de escribir feature nueva, mover la persistencia.
