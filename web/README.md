# OrbitClear — web

App de la garantía de desorbitado (hackathon Argentina Space, track Avalanche):
login propio con email + contraseña vía **Neon Managed Better Auth**, wallets
vinculadas por firma (EIP-191, sin gas) y un registro compartido de direcciones
de contratos en Avalanche Fuji. Persistencia en Neon Postgres con Drizzle ORM.

## Qué hace

- `/` landing; `/auth/*` vistas de login/registro/recupero (Better Auth UI).
- `/cuenta` panel del usuario:
  - `/cuenta/wallets` — vinculá tu wallet de Fuji firmando un mensaje (no cuesta gas).
  - `/cuenta/contratos` — registro de direcciones importantes (escrow, oráculo, token, tesorería).
- `/account/*` vistas de cuenta del SDK (perfil, seguridad).
- `proxy.ts` protege `/cuenta` y `/account`; `app/api/auth/[...path]` es el proxy del Auth server.

## Setup en Neon (una vez, una persona)

Sin CLI:

1. Creá un proyecto en <https://console.neon.tech> → rama → **Auth** → **Enable Auth**
   con **Email + contraseña**.
2. **Auth → Configuration**: copiá la **Auth URL** → `NEON_AUTH_BASE_URL`.
3. **Connect**: copiá la connection string **con pooling** → `DATABASE_URL`.
4. `openssl rand -base64 32` → `NEON_AUTH_COOKIE_SECRET`.
5. `cp .env.example .env.local` y completá las 3 variables.

Con CLI (opcional): `npx neonctl neon-auth enable` (o `neon config add auth`).

Las tres variables hacen falta también para `npm run dev` y `npm run build`:
`proxy.ts` y el handler de auth cargan el SDK al inicio.

## Correr

```bash
cd web
npm install
npm run db:migrate   # crea el enum y las tablas en public + FKs a neon_auth.user
npm run dev
```

## Producción

- **Auth → Configuration → Domains**: agregá la URL de producción, si no los
  redirects post-login fallan.
- `requireEmailVerification` está en `false` (`app/providers.tsx`): tiene que
  coincidir con **Verify email at signup** en Auth → Configuration.

## Notas y pendientes

- `neon_auth` lo administra Neon Auth: la migración solo crea tablas en `public`
  (`wallets`, `wallet_challenges`, `contract_addresses`, enum `contract_kind`)
  más las FKs a `neon_auth.user(id)`. Si `db:migrate` falla en una FK, verificá
  el tipo de `neon_auth.user.id` con `\d neon_auth.user` (asumimos `uuid`,
  como muestra la guía de Neon).
- **Registro abierto**: hoy cualquier usuario registrado ve todas las direcciones
  de contratos, con el email de quién las cargó. Para uso solo del equipo:
  restringir el registro en Neon Auth o con una allowlist de emails. Pendiente.
- Tip: una branch de Neon por rama de git — el estado de auth se clona con la
  branch, así probás sin tocar datos reales.
