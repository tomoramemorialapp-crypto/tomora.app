# Tomora App — Project Status Report

**As of June 6, 2026 · v0.1.0**

---

## Executive Summary

Tomora is a **Supabase-backed Expo Router MVP** with a mature kinship engine, rich Life Profile editing, memories with media, invites/claiming, memorial pages, public profiles, dark mode, partial i18n, and a polished brand system. The README and onboarding path now match the real stack.

Recent work focused on **UX reliability** (mobile scroll, occasion modals, profile save speed), **Family Tree fidelity** (live profile photos, unknown-node materialization, memorial vs Life Profile separation), **Occasions tooling** (filter/sort), and **Companion transparency** (scripted demo with disclaimer).

Remaining gaps are **partial backend versioning** (only two SQL migrations in-repo), **OAuth still disabled** pending provider setup, **billing and push notifications**, and **broader test coverage** beyond `src/lib/`.

**Honest phase label:** *Backend-integrated MVP — web-first, demo-ready, not production-hardened.*

---

## What's Done

### Platform & Architecture

| Area | Status |
|------|--------|
| Expo SDK 56 + Expo Router | ✅ ~160 TypeScript source files |
| React Native Web (primary target) | ✅ |
| TypeScript strict mode | ✅ (`tsc --noEmit` clean) |
| Supabase client (auth + DB + storage) | ✅ |
| Generated DB types (`database.types.ts`) | ✅ |
| SQL migrations in-repo | ⚠️ Partial (2 migrations — see below) |
| GitHub Actions CI (`tsc` + `vitest`) | ✅ |
| Single `AppState` context (~940 lines, ~45 actions) | ✅ |
| Brand system (SVG logos, tokens, animations) | ✅ |
| Dark mode (light default; explicit Night only) | ✅ |
| i18n infrastructure (17 languages, partial coverage) | ✅ |
| Clear cache → sign out + `/welcome` | ✅ |
| App footer (version, copyright) | ✅ |
| Footer actions scroll with content (no fixed overlap) | ✅ |

### Auth & Onboarding

| Feature | Status |
|---------|--------|
| Email sign-up / sign-in | ✅ |
| Username login (`resolve_login_email` RPC + migration) | ✅ |
| Email verification + resend | ✅ |
| Onboarding draft persistence (web localStorage) | ✅ |
| Auto tree creation after onboarding | ✅ |
| Claim flow (`claim_node` RPC) | ✅ |
| Tree load via `tree_memberships` (claimed members) | ✅ |
| Auth hydration on `INITIAL_SESSION` / `SIGNED_IN` | ✅ |
| Google / Apple sign-in | ⚠️ Wired; disabled (`OAUTH_SIGN_IN_ENABLED = false`) |
| QR claim method | ❌ Stubbed |

### Family Tree & TKE (Tomora Kinship Engine)

| Feature | Status |
|---------|--------|
| Kinship layout, generation math, placeholders | ✅ Well-tested |
| `KinshipTreeCanvas` (pan/zoom, search, filters, drag) | ✅ Production route |
| Relationship path explanations | ✅ |
| Node avatars from Life Profile photos | ✅ |
| Node click → Life Profile; deceased → Memorial button | ✅ |
| Synthetic unknown nodes → **Create Life Profile** | ✅ (`materializeUnknown`) |
| Add relative, relationship editing | ✅ |
| Invite to claim (greyed out for deceased) | ✅ |
| Pet nodes (caretaker, no invite) | ✅ |

### Life Profiles

| Feature | Status |
|---------|--------|
| View profile (overview, privacy, actions) | ✅ |
| Edit profile (dropdowns, multi-select, dates) | ✅ |
| Profile photo upload + web crop (circle guide) | ✅ |
| Place fields with Nominatim geocoding | ✅ |
| Connections editor (incl. caretaker) | ✅ |
| Unified passing control + memorial voting UI | ✅ |
| Change history + suggested edits | ✅ |
| Node invite screen + QR | ✅ |
| Memorial vs Life Profile as separate routes | ✅ |
| Save performance (async change log, upload path) | ✅ Improved |

### Memories

| Feature | Status |
|---------|--------|
| List, create, edit, delete | ✅ |
| Text / media / link types | ✅ |
| Rich text + captions | ✅ |
| Multi-member tagging | ✅ |
| Visibility selector + client `canViewContent` filter | ✅ |
| Media upload to Supabase Storage | ✅ |
| Per-memory cap + storage quota migration | ✅ |
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
| Memorial voting UI (`PassingControl`) | ✅ |
| Privacy levels | ✅ |

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
| Occasion detail modal (scrollable) + calendar export | ✅ |
| Occasion **filter** (type, scope, family tags) + **sort** | ✅ |
| Occasion Pages route (`/occasion/[occasionId]`) | ✅ Basic (memories + guestbook placeholder) |
| Occasion notify/calendar prefs | ⚠️ localStorage only |

### Tomora Companion

| Feature | Status |
|---------|--------|
| Companion tab + chat UI | ✅ |
| Scripted replies from tree/memories/occasions | ✅ |
| Demo disclaimer (not connected to AI) | ✅ |
| Real AI / LLM integration | ❌ |

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
| Kinship engine unit tests | ✅ 6 files |
| Lib helpers (username, claim, visibility, occasions, companion) | ✅ 5 files |
| **Total** | ✅ **56 tests** across 11 files |
| Services integration, UI, E2E | ❌ None |

---

## Recent Improvements (June 2026)

| Area | Change |
|------|--------|
| Profile photos | Web crop step with circular frame; native 1:1 pick |
| Mobile layout | `ScreenContainer` footers scroll with content; login page unblocked |
| Occasions modal | Scrollable overflow for long content |
| Family Tree | Nodes show updated profile photos; memorial button on deceased nodes |
| Unknown nodes | **Create Life Profile** materializes bridge nodes into editable profiles |
| Deceased nodes | Invite to claim disabled with explanation |
| Profile save | Change log fire-and-forget; faster photo upload path |
| Occasions tab | Filter by birthdays / remembrance / holidays / tags; sort options |
| Companion | Demo disclaimer; rule-based responses (not AI) |
| Auth / data | Username login migration; tree load via memberships; auth hydrate on sign-in |
| CI | GitHub Actions: `tsc` + `npm test` |

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│  UI Layer                                                   │
│  Expo Router (~45 screens) · Components (~60 files)         │
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
│  layout, resolver,      │   │  11 tables · RPCs · storage  │
│  placeholders, adapter  │   │  + 2 migrations in-repo      │
└─────────────────────────┘   └──────────────────────────────┘
```

### Supabase Tables (from generated types)

`accounts`, `family_trees`, `tree_memberships`, `nodes`, `relationships`, `memories`, `node_change_log`, `suggested_edits`, `notifications`, `memorial_requests`, `memorial_votes`

### Migrations in Repository

| File | Purpose |
|------|---------|
| `20260606100000_resolve_login_email.sql` | Username → auth email for login |
| `20260606110000_storage_quota_and_memorial_votes.sql` | Storage quota + memorial votes |

Apply with `supabase db push`. **Full baseline schema/RLS is still assumed to exist** in the remote project — these migrations are incremental, not a complete bootstrap.

### RPCs in Use

| RPC | Used by |
|-----|---------|
| `claim_node` | `inviteService.ts` |
| `set_username` | `accountService.ts` |
| `resolve_login_email` | `authService.ts` |
| `get_public_profile` | `publicProfileService.ts` |
| `get_memorial_page` | `memorialService.ts` |
| `request_passing` | `memorialService.ts` |
| `finalize_memorial` | `memorialService.ts` |
| `dispute_memorial` | `memorialService.ts` |

---

## Potential Issues & Bugs

### High Severity

| Issue | Detail |
|-------|--------|
| Incomplete schema in-repo | Only 2 incremental migrations; cannot fully reproduce DB/RLS from scratch |
| OAuth disabled | Providers must be configured in Supabase; flip `OAUTH_SIGN_IN_ENABLED` when ready |

### Medium Severity

| Issue | Detail |
|-------|--------|
| Theme not synced from account | `theme_preference` saved to DB; `ThemeProvider` reads localStorage only |
| `getRelationshipForNode` uses priority pick | Nodes with multiple edges may show a non-ideal label |
| `deleteNode` manual cascade | Separate deletes — partial failure risk without DB CASCADE |
| Storage quota approximate | Client sums; server enforcement depends on migration + policies |
| Password length mismatch | Sign-up/login ≥6 chars; account password change ≥8 chars |
| Hardcoded / env claim URLs | Invite links need `EXPO_PUBLIC_APP_URL` for local/staging |
| Occasion prefs local only | Notify/calendar toggles not synced across devices |
| Companion expectations | Users may assume AI — disclaimer mitigates; real engine still needed |

### Low Severity

| Issue | Detail |
|-------|--------|
| `package.json` name is `"scaffold"` | Template leftover |
| Tree badge hardcoded | "Private · Family Tree" doesn't reflect actual visibility |
| Occasion Pages guestbook | UI placeholder; not fully productized |
| Web profile crop | Mouse drag UX weaker than touch; pointer handlers TBD |
| i18n partial | Most screens still hardcoded English or `copy.ts` |

---

## Feature Completeness Matrix

| Pillar | UI | Backend | Tests | Production-ready? |
|--------|----|---------|-------|-------------------|
| Onboarding + auth | ✅ | ✅ | ⚠️ | ⚠️ |
| Family tree (TKE) | ✅ | ✅ | ✅ | ⚠️ |
| Life profiles | ✅ | ✅ | ❌ | ⚠️ |
| Memories + media | ✅ | ✅ | ❌ | ⚠️ |
| Invites + claiming | ✅ | ✅ | ⚠️ | ⚠️ |
| Memorial pages | ✅ | ✅ | ❌ | ⚠️ |
| Public profile | ✅ | ✅ | ❌ | ⚠️ |
| Notifications | ✅ | ✅ | ❌ | ⚠️ |
| Occasions (list + filter/sort) | ✅ | N/A (derived) | ⚠️ | ⚠️ |
| Occasion Pages | ⚠️ | ⚠️ | ❌ | ❌ |
| Companion | ⚠️ Demo | ❌ | ⚠️ | ❌ |
| Billing | ❌ | ❌ | ❌ | ❌ |
| OAuth (Google/Apple) | ⚠️ | ⚠️ | ❌ | ❌ |
| Push notifications | ❌ | ❌ | ❌ | ❌ |
| Full i18n | ⚠️ | N/A | ❌ | ❌ |

---

## Stubbed / Coming Soon

| Feature | Location | Status |
|---------|----------|--------|
| Google / Apple sign-in | `login.tsx`, `save.tsx` | Disabled · Soon (`OAUTH_SIGN_IN_ENABLED`) |
| Tomora Companion (AI) | `companion.tsx` | Scripted demo + disclaimer |
| Occasion Pages guestbook | `occasion/[occasionId].tsx` | "Coming soon" badge |
| Billing / subscriptions | `settings/billing.tsx` | UI mock |
| QR claim method | `claim.tsx` | Stubbed |
| Occasion notify/calendar prefs | `occasionPrefs.ts` | localStorage only |
| Real push / calendar sync | — | Not implemented |

---

## Recommended Next Steps

### Phase 1 — Backend completeness (1–2 weeks)

1. **Export full Supabase baseline** — initial migration with tables, RLS, and all RPCs
2. **Enable OAuth** — configure Google/Apple in Supabase; set `OAUTH_SIGN_IN_ENABLED = true`
3. **Environment docs** — claim URLs, storage buckets, required RPC grants
4. **Service-layer tests** — tree load, memory CRUD, claim flow, profile save

### Phase 2 — Harden core flows (2–3 weeks)

1. **Sync theme from account on login**
2. **Server-side storage quota enforcement** end-to-end
3. **Occasion prefs** — persist notify/calendar to account or local sync API
4. **Expand i18n** — migrate `copy.ts` strings screen by screen
5. **Native builds** — iOS/Android beyond web-first assumptions

### Phase 3 — Product expansion (post-MVP)

1. **Tomora Companion** — real AI with strict privacy boundaries (tree/memory context only)
2. **Occasion Pages** — guestbook, support flows, shareable links
3. **Billing** — subscriptions, storage tiers
4. **Push notifications** — occasions, memorial events, invites
5. **E2E tests** — Playwright for web critical paths

---

## Quick Wins

| Action | Effort | Impact |
|--------|--------|--------|
| Enable OAuth after Supabase provider setup | Small | Faster onboarding |
| Add baseline SQL migration | Medium | Reproducible backend |
| Service tests for `treeService` / `profileService` | Medium | Catch regressions |
| Sync theme from `account.themePreference` | Small | Cross-device consistency |
| Rename `package.json` to `tomora` | Trivial | Polish |

---

## Bottom Line

Tomora has a **strong UI/UX foundation**, a **sophisticated kinship engine**, and a **working Supabase loop** for creators and invited members. Recent passes fixed major mobile UX blockers, tree/profile consistency, and occasion usability.

What still blocks production: **incomplete in-repo schema**, **OAuth off**, **Companion/billing/push still placeholder**, and **thin integration test coverage**. The highest-leverage next move is a **full migration export + OAuth enablement**, then **service tests** before expanding AI and billing.

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
                              # node/, memory/, memorial/, occasion/, relative/, u/, settings/
  components/
    brand/                  # logos, icons, footer
    ui/                     # design system (ScreenContainer, Dropdown, …)
    family-tree/            # KinshipTreeCanvas, filters, edges
    memories/               # cards, lightbox, visibility
    occasions/              # OccasionDetailModal, OccasionToolbar, OccasionFilterSheet
    companion/              # CompanionChat
    media/                  # ProfilePhotoCropModal
    profile/                # PassingControl, ConnectionsEditor
  constants/                # theme, copy, options, app metadata
  i18n/                     # LanguageProvider, translations
  lib/
    kinship/                # Tomora Kinship Engine (tested)
    occasions.ts, occasionFilters.ts, companion/, media.ts, …
  services/                 # Supabase service layer (10 modules)
  state/AppState.tsx        # global app store
  theme/ThemeProvider.tsx   # dark mode
  types/                    # models, profile, database.types
supabase/migrations/        # incremental SQL (apply with Supabase CLI)
.github/workflows/ci.yml    # tsc + vitest on push/PR
docs/PROJECT_STATUS.md      # this file
```

---

*Last updated from codebase audit on June 6, 2026.*
