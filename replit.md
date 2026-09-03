# 돼홍존위

Supabase 기반 인증과 실시간 회원위원회 운영 기능을 제공하는 한국어 웹앱입니다.

## Run & Operate

- `pnpm install` — install workspace dependencies
- `pnpm --filter @workspace/dohongjonwi run dev` — run the web app locally
- `pnpm --filter @workspace/dohongjonwi run typecheck` — check the web app
- `pnpm --filter @workspace/api-server run dev` — run the generated API service when needed
- `pnpm run typecheck` — check all workspace packages
- `pnpm run build` — typecheck and build all packages
- Replit workflows: `artifacts/dohongjonwi: web`, `artifacts/api-server: API Server`, and `artifacts/mockup-sandbox: Component Preview Server`
- Required environment: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Do not add `service_role` or other privileged Supabase keys to the browser app.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9, React, Vite
- Data and authentication: Supabase JS client, Supabase Auth, PostgreSQL, and Realtime
- UI: Tailwind CSS, Radix UI, Lucide

## Where things live

- `artifacts/dohongjonwi/src/pages` — gate, authentication, member, and admin screens
- `artifacts/dohongjonwi/src/lib/data-services.ts` — Supabase-backed reads, writes, auth, and realtime helpers
- `artifacts/dohongjonwi/src/lib/supabase.ts` — browser Supabase client using only public environment variables
- `supabase/schema.sql` — tables, functions, triggers, grants, and RLS policies

## Architecture decisions

- Supabase is the source of truth for authentication, data mutations, and realtime updates.
- The browser receives only the public Supabase URL and anon key; privileged keys are never bundled.
- The entry screen does not send search terms or navigation to Google or other external services.
- Member and administrator access is enforced by Supabase profiles, roles, and RLS policies.

## Product

- Email/password signup, login, password reset, and sign out
- Announcements, realtime group chat, emergency meetings, notifications, profiles, and coin history
- Administrator controls for members, announcements, meetings, notifications, coins, and logs

## User preferences

- Keep dynamic functionality on Supabase.
- Treat the site as confidential and avoid sending user-entered search data to external services.
- The entry screen uses a Google-style wordmark, but its login button is intentionally disabled.

## Gotchas

- Run the web workflow after changing Supabase environment variables so Vite receives the new values.
- Apply `supabase/schema.sql` in the Supabase SQL Editor before using signup or member features.
- Promote the first administrator in Supabase by updating `profiles.role`; do not rely on display names.

## Pointers

- See `README.md` for Supabase setup, administrator initialization, and deployment notes.
