# Frontend Developer Agent Memory

Last updated: 2026-02-14

## Frontend Auth Sprint (P1-FRONT-01 to 04) -- DONE

### Stack confirmee
- Next.js 15.5.12 (App Router)
- shadcn/ui primitives manuels (pas npx shadcn init) dans src/components/ui/
- CVA (class-variance-authority) pour variants
- cn() = clsx + tailwind-merge dans src/lib/utils.ts
- React Hook Form + Zod + @hookform/resolvers
- SWR pour data fetching
- Jest + RTL pour tests (15 tests passing)

### Patterns implementes
- **API client** : src/lib/api.ts avec refresh token rotation (isRefreshing + subscribers)
- **Auth cookie** : dp_token cookie + localStorage (dual storage pour middleware edge runtime)
- **AuthContext** : src/contexts/AuthContext.tsx -- login/register/logout + hydratation via /me
- **Middleware** : src/middleware.ts lit le cookie dp_token pour proteger les routes (app)/
- **Zod schemas** : loginSchema, registerSchema avec password strength + confirmPassword refine
- **tenant_id** : auto-genere via crypto.randomUUID() au register

### Design
- Palette indigo : gray-950 fond, indigo-500/600 accent, gray-900 inputs
- Split-screen auth : left 60% branding + right 40% form, responsive (mobile: form only)

### Conventions
- Composants UI dans src/components/ui/ -- ne pas editer sauf via CVA variants
- Tous les appels API passent par src/lib/api.ts -- jamais de fetch direct
- Tests dans src/__tests__/ avec mocks de useAuth et useRouter
