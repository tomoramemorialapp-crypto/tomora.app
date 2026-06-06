# Tomora.app

> Always with you.

Tomora is a private **Family Tree** and memory platform that helps people stay
close — across life, distance, memory, and time. Every person is a node that can
become a Life Profile, an Occasion anchor, or a Memory Light memorial.

This repository is the **web-first Expo Router app** (v0.1.0). It implements a
**Supabase-backed MVP**: authentication, family trees, Life Profiles, memories
with media, invites/claiming, memorial pages, public profiles, notifications,
dark mode, and partial i18n.

## Tech stack

- [Expo](https://docs.expo.dev/) (SDK 56) + **Expo Router** (file-based routing)
- React Native + **react-native-web** (web is the primary target for now)
- TypeScript (strict)
- [Supabase](https://supabase.com/) — Auth, Postgres, Storage, RLS + RPCs
- React Context (`AppState`) for client state
- **Tomora Kinship Engine (TKE)** — generation-aware tree layout and relationship explanations

## Getting started

```bash
npm install
cp .env.example .env   # add your Supabase URL + anon key
npm run web            # http://localhost:8081
```

Set `EXPO_PUBLIC_APP_URL=http://localhost:8081` in `.env` for local invite/claim links.

Apply database migrations to your Supabase project:

```bash
# via Supabase CLI, from the project root
supabase db push
```

The first run downloads Google Fonts (Cormorant Garamond + Inter) on web; native
falls back to system fonts.

## Demo path

1. **Welcome** → "Start my Family Tree"
2. **Add yourself** → your name
3. **Add one loved one** → relationship + name
4. **Tree reveal** → two lights connect
5. **Save** → choose a **username**, email, and password
6. **Privacy → Invite/skip**
7. **Dashboard** → Family Tree, Life Profiles, memories

Log in later with your **email or username**. Use **You → Sign out** to end a session, or **Clear cache to update** in the footer after a deploy.

## Auth

- **Sign up** requires a unique username (3–30 chars, `a-z`, `0-9`, `_`), email, and password.
- Usernames are stored in `accounts.username` (via `set_username` RPC) and in Supabase Auth `user_metadata`.
- **Log in** accepts email or username — usernames resolve to the auth email via the `resolve_login_email` RPC.

## Project structure

```
src/
  app/                  # Expo Router routes (onboarding, tabs, settings, memorial, public profile)
  components/           # brand, ui, family-tree, memories, profile, onboarding
  constants/            # theme, copy, urls, options
  i18n/                 # LanguageProvider + translations
  lib/                  # kinship engine, media, geocoding, username helpers
  services/             # Supabase service layer
  state/AppState.tsx    # global app store
  theme/                # dark mode provider
  types/                # models, profile, database.types
supabase/migrations/    # SQL migrations (apply with Supabase CLI)
docs/PROJECT_STATUS.md  # detailed project audit
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run web` | Start Expo web dev server |
| `npm run ios` / `android` | Native dev builds |
| `npx tsc --noEmit` | Type-check |
| `npm test` | Kinship engine unit tests (Vitest) |

## Design system

Tokens live in `src/constants/theme.ts` — ivory/gold/black palette, soft
shadows, rounded radii, and serif/sans font tokens. Night mode swaps palettes
in place via `ThemeProvider`.

## Privacy model

Visibility levels: `private`, `selected_people`, `family_tree`, `invite_link`,
`public`. Defaults are private/family-only; public sharing is always opt-in.
Privacy is never a paywalled feature.

## Coming soon

Tomora Companion (AI), Occasion Pages, billing/subscriptions, Google/Apple
sign-in, push notifications, and full i18n coverage.

## Source of truth

Product, UX, data model, and roadmap decisions follow `tomora_developer_brief.md`.
For a detailed technical audit see `docs/PROJECT_STATUS.md`.
