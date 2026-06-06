# Tomora App — Project Status Report

**As of June 6, 2026 · v0.1.0**

---

## Executive Summary

Tomora has moved well past its README's "Phase 0 mock UI" description. The app is a **Supabase-backed Expo Router MVP** with a mature kinship engine, rich Life Profile editing, memories with media, invites/claiming, memorial pages, public profiles, dark mode, partial i18n, and a polished brand system.

The biggest gaps are **not in UI polish** — they are in **backend operability** (no SQL migrations in-repo), **test coverage** (kinship only), **invite/claim tree loading**, and several **placeholder product pillars** (Companion, billing, Occasion Pages, OAuth).

**Honest phase label:** *Backend-integrated MVP — web-first, not production-hardened.*

---

## What's Done

### Platform & Architecture

| Area | Status |
|------|--------|
| Expo SDK 56 + Expo Router | ✅ 137 TypeScript source files |
| React Native Web (primary target) | ✅ |
| TypeScript strict mode | ✅ |
| Supabase client (auth + DB + storage) | ✅ |
| Generated DB types (`database.types.ts`, ~893 lines) | ✅ |
| Single `AppState` context (~823 lines, ~40 actions) | ✅ |
| Brand system (SVG logos, tokens, animations) | ✅ |
| Dark mode (light / night / system) | ✅ |
| i18n infrastructure (17 languages, partial coverage) | ✅ |
| Clear-cache footer control | ✅ |
| App footer (version, copyright) | ✅ |

### Auth & Onboarding

| Feature | Status |
|---------|--------|
| Email sign-up / sign-in | ✅ |
| Email verification + resend | ✅ |
| Onboarding draft persistence (web localStorage) | ✅ |
| Auto tree creation after onboarding | ✅ |
| Claim flow (`claim_node` RPC) | ✅ |
| Google / Apple sign-in | ❌ UI shows "Soon" |
| QR claim method | ❌ Stubbed (`false`) |

### Family Tree & TKE (Tomora Kinship Engine)

| Feature | Status |
|---------|--------|
| Kinship layout, generation math, placeholders | ✅ Well-tested |
| `KinshipTreeCanvas` (pan/zoom, search, filters) | ✅ Production route |
| Relationship path explanations | ✅ |
| Ephemeral node drag (local only) | ✅ |
| Node click → full Life Profile | ✅ |
| Add relative, relationship editing | ✅ |
| Invite to claim (non-pets) | ✅ |
| Pet nodes (caretaker, no invite) | ✅ |
| Legacy `FamilyTreeCanvas` | ⚠️ Unused |

### Life Profiles

| Feature | Status |
|---------|--------|
| View profile (overview, privacy, actions) | ✅ |
| Edit profile (dropdowns, multi-select, dates) | ✅ |
| Profile photo upload | ✅ |
| Place fields with Nominatim geocoding | ✅ |
| Connections editor (incl. caretaker) | ✅ |
| Unified passing control | ✅ |
| Change history + suggested edits | ✅ |
| Node invite screen + QR | ✅ |
| Context-aware buttons per node | ✅ |

### Memories

| Feature | Status |
|---------|--------|
| List, create, edit, delete | ✅ |
| Text / media / link types | ✅ |
| Rich text + captions | ✅ |
| Multi-member tagging | ✅ |
| Visibility selector | ✅ |
| Media upload to Supabase Storage | ✅ |
| 110MB per-memory cap | ✅ |
| Detail page + media lightbox | ✅ |
| Thumbnails in home feed | ✅ |
| Storage usage indicator (You tab) | ✅ (approximate) |

### Memorial & Passing

| Feature | Status |
|---------|--------|
| Report passing (`request_passing` RPC) | ✅ |
| Finalize / dispute memorial | ✅ |
| Memorial page view + password gate | ✅ |
| Memorial editing + banner upload | ✅ |
| Privacy levels | ✅ |
| Memorial voting UI | ❌ Table exists, no UI |

### Public Profile & Social

| Feature | Status |
|---------|--------|
| Username (`set_username` RPC, rate-limited) | ✅ |
| Public profile config (bio, social, memories) | ✅ |
| `/u/[username]` public page | ✅ |
| Branded social icons | ✅ |

### Home, Occasions, Notifications

| Feature | Status |
|---------|--------|
| Home dashboard + notification bell | ✅ |
| Notifications feed | ✅ |
| Occasions derived from dates/holidays | ✅ |
| Occasion detail modal + calendar export | ✅ |
| Occasion notify/calendar prefs | ⚠️ localStorage only |
| Occasion Pages product | ❌ "Coming soon" |

### Settings & Account

| Feature | Status |
|---------|--------|
| Account settings (email, password, language, theme) | ✅ |
| Privacy settings (You tab) | ✅ |
| Account deletion (30-day grace) | ✅ |
| Billing / subscriptions | ❌ Mock UI |
| Persistent bottom tabs | ✅ |

### Testing

| Area | Status |
|------|--------|
| Kinship engine unit tests (4 files) | ✅ |
| Services, UI, integration, E2E | ❌ None |
| CI/CD workflows | ❌ None |

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│  UI Layer                                                   │
│  Expo Router (~40 screens) · Components (53 files)          │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  State                                                      │
│  AppState Context · ThemeProvider · LanguageProvider        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Services (10 modules)                                      │
│  auth · tree · memory · profile · account · invite ·        │
│  memorial · publicProfile · notifications · mappers         │
└──────────────┬───────────────────────────┬──────────────────┘
               │                           │
┌──────────────▼──────────┐   ┌────────────▼─────────────────┐
│  TKE (lib/kinship/*)    │   │  Supabase (remote)           │
│  layout, resolver,      │   │  11 tables · 8 RPCs · storage  │
│  placeholders, adapter  │   │  (no migrations in repo)     │
└─────────────────────────┘   └──────────────────────────────┘
```

### Supabase Tables (from generated types)

`accounts`, `family_trees`, `tree_memberships`, `nodes`, `relationships`, `memories`, `node_change_log`, `suggested_edits`, `notifications`, `memorial_requests`, `memorial_votes`

### RPCs in Use

| RPC | Used by |
|-----|---------|
| `claim_node` | `inviteService.ts` |
| `set_username` | `accountService.ts` |
| `get_public_profile` | `publicProfileService.ts` |
| `get_memorial_page` | `memorialService.ts` |
| `request_passing` | `memorialService.ts` |
| `finalize_memorial` | `memorialService.ts` |
| `dispute_memorial` | `memorialService.ts` |

### RPCs Typed but Not Called from App

- `is_tree_member`
- `process_due_account_deletions` (likely cron/edge function)

### Not in Repository

- `supabase/migrations/` — schema and RLS policies live only in the remote Supabase project.

---

## Potential Issues & Bugs

### High Severity (fix before real users)

#### 1. Claimed users may not see their tree

`loadMyTreeBundle` only loads trees where the user is `created_by_account_id`:

```typescript
// src/services/treeService.ts
export async function loadMyTreeBundle(accountId: string): Promise<TreeBundle | null> {
  const { data: trees, error: treeErr } = await supabase
    .from('family_trees')
    .select()
    .eq('created_by_account_id', accountId)
    .order('created_at', { ascending: true })
    .limit(1);
```

Someone who joins via `claim_node` / `tree_memberships` may land on an empty app after login.

#### 2. Auth state change doesn't reload data

`onAuthStateChange` clears state on sign-out but never calls `loadForUser` on sign-in:

```typescript
// src/state/AppState.tsx
const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
  setSession(newSession);
  if (!newSession) {
    setAccount(null);
    applyBundle(null);
  }
});
```

Email-confirmation redirects and token refresh edge cases may leave the UI without tree data until a manual re-login.

#### 3. No schema/migrations in repository

RLS policies, triggers, and RPC definitions cannot be reviewed, reproduced, or version-controlled. This is the single biggest operational risk.

#### 4. Visibility enforcement is unclear

`canViewContent()` exists in `src/lib/visibility.ts` but is **never imported**. The app assumes Supabase RLS handles visibility — but that cannot be verified without SQL in-repo.

---

### Medium Severity

| Issue | Detail |
|-------|--------|
| Theme not synced from account | `theme_preference` saved to DB in account settings, but `ThemeProvider` only reads `localStorage` — cross-device theme breaks |
| `getRelationshipForNode` uses `.find()` | Nodes with multiple relationships may show the wrong label |
| `deleteNode` manual cascade | Separate deletes for memories/relationships/node — partial failure risk without DB CASCADE |
| Storage quota is approximate | `mediaUsageBytes` sums in-memory memories only; no server-side enforcement visible |
| Password length mismatch | Sign-up/login: ≥6 chars; account password change: ≥8 chars |
| Hardcoded claim URL | `https://tomora.app/claim` in `inviteService.ts` — breaks local/staging |
| Errors swallowed silently | 13 `console.warn('[tomora] …')` sites with no user-facing feedback |
| README is stale | Still says "local/mock state, no backend yet" |

---

### Low Severity

| Issue | Detail |
|-------|--------|
| `mockData.ts` orphaned | Not imported anywhere — dead code |
| `FamilyTreeCanvas.tsx` unused | Legacy canvas still in repo |
| `package.json` name is `"scaffold"` | Template leftover |
| Tree badge hardcoded | "Private · Family Tree" doesn't reflect actual visibility |
| No `TODO`/`FIXME` comments | Good hygiene, but issues aren't tracked in code |

---

## Bloat & Tech Debt

### Dependency Bloat (likely unused)

| Package | Notes |
|---------|-------|
| `@expo/ui` | Zero imports |
| `expo-glass-effect` | Zero imports |
| `expo-web-browser` | Zero imports |
| `expo-device` | Zero imports |
| `expo-symbols` | Zero imports |

These add install size and SDK coupling without benefit. Safe to remove after confirming no dynamic imports.

### Code Bloat

| Item | Recommendation |
|------|----------------|
| `src/data/mockData.ts` | Delete or move to test fixtures |
| `FamilyTreeCanvas.tsx` | Delete or archive if `KinshipTreeCanvas` is canonical |
| `AppState.tsx` at 823 lines | Consider splitting by domain when it grows further |
| Duplicate path entries (Windows) | Normalize `src\app` vs `src/app` references |

### Documentation Drift

The README, project structure comments, and demo path ("You → Start over") no longer match the Supabase-backed app. This will confuse new contributors and mislead status reporting.

### Test Debt

```
Coverage estimate:
  Kinship engine  ████████░░  ~80%
  Services        ░░░░░░░░░░   0%
  AppState        ░░░░░░░░░░   0%
  UI / routes     ░░░░░░░░░░   0%
  Integration     ░░░░░░░░░░   0%
```

`vitest.config.ts` explicitly limits tests to `src/lib/kinship/**/*.test.ts`.

### i18n Debt

- **~6 screens** use `useT()` (tabs, home, occasions, partial settings)
- **Most screens** still use hardcoded English or `constants/copy.ts`
- 17 languages declared; non-English locales are partial overrides with English fallback

---

## Feature Completeness Matrix

| Pillar | UI | Backend | Tests | Production-ready? |
|--------|----|---------|-------|-------------------|
| Onboarding + auth | ✅ | ✅ | ❌ | ⚠️ |
| Family tree (TKE) | ✅ | ✅ | ✅ | ⚠️ |
| Life profiles | ✅ | ✅ | ❌ | ⚠️ |
| Memories + media | ✅ | ✅ | ❌ | ⚠️ |
| Invites + claiming | ✅ | ✅ | ❌ | ❌ (tree load bug) |
| Memorial pages | ✅ | ✅ | ❌ | ⚠️ |
| Public profile | ✅ | ✅ | ❌ | ⚠️ |
| Notifications | ✅ | ✅ | ❌ | ⚠️ |
| Occasions (list) | ✅ | N/A (derived) | ❌ | ⚠️ |
| Occasion Pages | ❌ | ❌ | ❌ | ❌ |
| Companion (AI) | ❌ | ❌ | ❌ | ❌ |
| Billing | ❌ | ❌ | ❌ | ❌ |
| OAuth (Google/Apple) | ❌ | ❌ | ❌ | ❌ |
| Push notifications | ❌ | ❌ | ❌ | ❌ |
| Full i18n | ⚠️ | N/A | ❌ | ❌ |

---

## Stubbed / Coming Soon

| Feature | File | Status |
|---------|------|--------|
| Tomora Companion (AI) | `companion.tsx` | Static "coming soon" card |
| Occasion Pages | `occasions.tsx` | "Coming soon" badge |
| Billing / subscriptions | `settings/billing.tsx` | UI mock |
| Google / Apple sign-in | `save.tsx` | Disabled "· Soon" buttons |
| QR claim method | `claim.tsx` | `method === 'qr' ? false` |
| Occasion notify/calendar prefs | `occasionPrefs.ts` | localStorage only |

---

## Recommended Next Steps

### Phase 1 — Stabilize the Foundation (1–2 weeks)

These unblock real users and team collaboration:

1. **Export Supabase schema to repo** — add `supabase/migrations/`, document RLS policies, version RPCs
2. **Fix tree loading for claimed members** — query via `tree_memberships` or add a `get_my_tree_bundle` RPC
3. **Fix auth hydration** — call `loadForUser` in `onAuthStateChange` on `SIGNED_IN` / `TOKEN_REFRESHED`
4. **Update README** — reflect current Supabase-backed MVP, real demo path, env setup
5. **Add CI** — `tsc`, `vitest`, basic lint on every PR
6. **Environment-based URLs** — claim links, invite links, public profile base URL from env vars

### Phase 2 — Harden Core Flows (2–3 weeks)

1. **Service-layer tests** — tree load, memory CRUD, claim flow, mappers
2. **Wire `canViewContent` or document RLS trust model** — audit memory/profile visibility end-to-end
3. **Sync theme from account on login** — seed `ThemeProvider` from `account.themePreference`
4. **Server-side storage quota** — enforce caps in Supabase, not just client sums
5. **Error surfacing** — replace silent `console.warn` with user-visible toasts/messages
6. **Remove dead code** — `mockData.ts`, `FamilyTreeCanvas.tsx`, unused Expo packages

### Phase 3 — Complete MVP Features (3–6 weeks)

1. **Invite/claim polish** — QR claim, email invite deep links, claimed-user onboarding
2. **Memorial voting UI** — wire `memorial_votes` table
3. **Occasion Pages** — dedicated pages, notify toggle → real push/calendar integration
4. **Expand i18n** — migrate `copy.ts` strings to translation keys screen by screen
5. **Mobile responsiveness pass** — audit all screens on narrow viewports
6. **Native builds** — test iOS/Android beyond web-first assumptions

### Phase 4 — Product Expansion (post-MVP)

1. **Tomora Companion** — AI guide with strict privacy boundaries (memory/relationship context only)
2. **OAuth** — Google / Apple sign-in
3. **Billing** — subscriptions, storage tiers
4. **Push notifications** — occasions, memorial events, invite activity
5. **Multi-tree / merge UX** — disconnected node bridges, tree joining
6. **E2E tests** — Playwright for web critical paths

---

## Quick Wins

| Action | Effort | Impact |
|--------|--------|--------|
| Fix `loadMyTreeBundle` membership query | Small | Unblocks claim flow |
| Add `loadForUser` to auth listener | Small | Fixes email-confirm redirect |
| Update README | Small | Accurate onboarding for devs |
| Delete `mockData.ts` + unused deps | Small | Less confusion |
| Add GitHub Actions CI (tsc + test) | Small | Catch regressions |
| Export Supabase migrations | Medium | Reproducible backend |

---

## Bottom Line

Tomora has a **strong UI/UX foundation** and a **genuinely sophisticated kinship engine**. The app feels like a real product in the browser. What is holding it back from production is **backend operability** (no in-repo schema), **a critical tree-loading bug for claimed users**, **minimal testing**, and **several product pillars still marked "coming soon."**

The most valuable next move is **Phase 1**: fix tree loading + auth hydration, get migrations into the repo, and add CI. Everything else — Companion, billing, Occasion Pages — should wait until the core family-tree loop works reliably for both tree creators and invited claimants.

---

## Project Structure Reference

```
src/
  app/                      # Expo Router routes
    _layout.tsx             # providers + root stack
    index.tsx               # session gate
    welcome.tsx, login.tsx
    (onboarding)/           # add-self, add-loved-one, reveal, save, privacy, invite, claim
    (tabs)/                 # home, family-tree, memories, occasions, companion, profile
    node/                   # Life Profile view, edit, history, invite
    memory/                 # create/edit, detail
    memorial/               # memorial page, edit
    u/[username]            # public profile
    settings/               # account, billing, delete
  components/
    brand/                  # logos, icons, footer
    ui/                     # design system
    family-tree/            # KinshipTreeCanvas, filters, edges
    memories/               # cards, lightbox, visibility
    profile/                # PassingControl, ConnectionsEditor
  constants/                # theme, copy, options, app metadata
  data/mockData.ts          # orphaned — not imported
  i18n/                     # LanguageProvider, translations
  lib/
    kinship/                # Tomora Kinship Engine (tested)
    media.ts, geocoding.ts, clearCache.ts, ...
  services/                 # Supabase service layer (10 modules)
  state/AppState.tsx        # global app store
  theme/ThemeProvider.tsx   # dark mode
  types/                    # models, profile, database.types
```

---

*Generated from codebase audit on June 6, 2026.*
