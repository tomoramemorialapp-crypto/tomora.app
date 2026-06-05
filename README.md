# Tomora.app

> Always with you.

Tomora is a private **Family Tree** and memory platform that helps people stay
close — across life, distance, memory, and time. Every person is a node that can
become a Life Profile, an Occasion anchor, or a Memory Light memorial.

This repository is the **web-first Expo Router app**. It currently implements
**Phase 0 — Demo UI** from the developer brief: the brand system, onboarding
flow, the mini Family Tree reveal, the dashboard, a basic Life Profile, and an
add-text-memory flow — all on local/mock state, with architecture hooks left in
place for the backend, payments, AI, and livestreaming that come later.

## Tech stack

- [Expo](https://docs.expo.dev/) (SDK 56) + **Expo Router** (file-based routing)
- React Native + **react-native-web** (web is the primary target for now)
- TypeScript (strict)
- Local React Context state with seedable mock data (no backend yet)

## Getting started

```bash
npm install
npm run web      # start the web app at http://localhost:8081
# npm run ios / npm run android also work via Expo
```

Open the printed URL. The first run downloads Google Fonts (Cormorant Garamond +
Inter) for the premium serif/sans pairing; native falls back to system fonts.

## Demo path (under ~90 seconds)

1. **Welcome** → "Start my Family Tree"
2. **Add yourself** → just a name
3. **Add one loved one** → pick a relationship, give them a name
4. **Tree reveal** → two lights connect with a drawing gold line
5. **Save → Privacy (recommended) → Invite/skip**
6. **Dashboard** → open the Family Tree, tap a node, **Add a memory**

Use **You → Start over** to reset the demo.

## Project structure

```
src/
  app/                      # Expo Router routes
    _layout.tsx             # providers (state, safe area, gestures) + root stack
    index.tsx               # redirect: onboarded → tabs, else → welcome
    welcome.tsx
    (onboarding)/           # choose-path, add-self, add-loved-one, reveal, save, privacy, invite
    (tabs)/                 # dashboard, family-tree, memories, occasions, companion, profile
    node/[nodeId].tsx       # Life Profile
    memory/new.tsx          # Add text memory (modal)
  components/
    brand/                  # TomoraEmblem, TomoraLogo, GoldStar, LightDivider
    ui/                     # ScreenContainer, Button, Card, TextField, Avatar, Badge, Typography, ...
    family-tree/            # FamilyTreeCanvas, FamilyNodeCircle, MiniTreeReveal, RelationshipLine, AddRelativeCard
    onboarding/             # OnboardingProgress, PathSelectionCards, RelationshipPicker, PrivacyPresetCard
    memories/               # MemoryCard, MemoryVisibilitySelector
  constants/                # theme.ts (design tokens), copy.ts (UI copy library)
  data/mockData.ts          # seed demo data from the brief
  lib/                      # relationshipUtils, visibility (permission engine)
  state/AppState.tsx        # in-memory app store (account, tree, nodes, relationships, memories)
  types/models.ts           # TypeScript models (mirrors the future Supabase schema)
```

## Design system

Tokens live in `src/constants/theme.ts` — ivory/gold/black palette, soft
shadows, rounded radii, and serif/sans font tokens. The system is architected so
colors and fonts can be swapped without touching screens. Motion is intentionally
soft and slow (gentle fades, a drawing gold line) and respects
`prefers-reduced-motion`.

## Privacy model (MVP)

Visibility levels: `private`, `selected_people`, `family_tree`, `invite_link`,
`public`. Defaults are private/family-only; public sharing is always opt-in.
Privacy is never a paywalled feature. See `src/lib/visibility.ts` for the
permission check.

## Not yet built (intentional placeholders)

Per the brief's MVP scope, these are placeholders/coming-soon and ready to be
built in later phases: authentication + Supabase persistence, invitations &
node claiming, media uploads, Occasion Pages, Memory Light conversion,
subscriptions, the Tomora Companion (AI), and livestream/gift integrations.

## Source of truth

Product, UX, data model, and roadmap decisions follow
`tomora_developer_brief.md`. When in doubt, defer to the brief.
