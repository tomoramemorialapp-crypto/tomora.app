import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';

import { inferContextualRelationships } from '@/lib/contextualAdd';
import type {
  Account,
  FamilyTree,
  FamilyNode,
  MemorialRequest,
  Memory,
  MemoryMediaItem,
  MemoryType,
  Notification,
  Relationship,
  RelationshipType,
  TreeRole,
  VisibilityLevel,
} from '@/types/models';
import { canViewContent } from '@/lib/visibility';
import { defaultNameForPlaceholder, relationshipTypeForPlaceholder } from '@/lib/kinship/materializeIntent';
import type { NodeProfile, ProfileChangeLog, ProfileFieldKey, SuggestedEdit } from '@/types/profile';
import { supabase } from '@/lib/supabase';
import * as authService from '@/services/authService';
import * as treeService from '@/services/treeService';
import * as memoryService from '@/services/memoryService';
import * as profileService from '@/services/profileService';
import * as accountService from '@/services/accountService';
import * as inviteService from '@/services/inviteService';
import * as notificationService from '@/services/notificationService';
import * as memorialService from '@/services/memorialService';
import * as storageService from '@/services/storageService';
import {
  clearPasswordRecoveryPending,
  isPasswordRecoveryPending,
  isPasswordRecoveryPendingSync,
} from '@/lib/passwordRecovery';
import '@/lib/passwordRecovery';
import type { ExistingSignupStatus } from '@/lib/authVerification';
import { isAuthHydrationSuppressed } from '@/lib/authHydration';
import {
  clearOnboardingDraftStorage,
  emptyOnboardingDraft,
  hasOnboardingTreeDraft,
  isLikelyAutoDisplayName,
  loadOnboardingDraftFromStorage,
  resolveOnboardingDraft,
  storeOnboardingDraftToStorage,
  type OnboardingDraft,
} from '@/lib/onboardingDraft';
import { isOnboardingTreeComplete } from '@/lib/onboardingTree';
import { validateUsername } from '@/lib/username';
import { childIdForParentEdge, detectParentPairingOpportunity } from '@/lib/parentPairing';
import {
  inferSiblingParentEdges,
  tagsForSiblingBridgeMode,
  type SiblingBridgeMode,
} from '@/lib/siblingAdd';
import {
  activeNodes,
  activeRelationships,
  findTreeAnchorId,
  isActiveNode,
  reachableNodeIds,
  treeMemberNodes,
} from '@/lib/activeNodes';
import { editScopeFor } from '@/lib/profile';
import { pickPrimaryRelationship } from '@/lib/relationshipUtils';
import type { NodeInvite } from '@/services/inviteService';
import type { AccountSettingsPatch } from '@/services/accountService';
import type { ChangeLogEntryInput } from '@/services/profileService';
import type { MemorialPagePatch, RequestPassingResult } from '@/services/memorialService';

interface AppStateValue {
  loading: boolean;
  session: Session | null;
  account: Account | null;
  tree: FamilyTree | null;
  nodes: FamilyNode[];
  relationships: Relationship[];
  memories: Memory[];
  /** Memories the current viewer is allowed to see (visibility-filtered). */
  visibleMemories: Memory[];
  suggestedEdits: SuggestedEdit[];
  notifications: Notification[];
  unreadNotificationCount: number;
  isOnboarded: boolean;
  /** User opened a password-reset link — skip normal sign-in routing until password is saved. */
  passwordRecoveryPending: boolean;
  draft: OnboardingDraft;

  setDraft: (patch: Partial<OnboardingDraft>) => void;

  // auth + persistence
  signUpAndStart: (
    email: string,
    password: string,
    username: string,
  ) => Promise<{
    needsEmailConfirmation: boolean;
    alreadyRegistered?: boolean;
    existingSignupStatus?: ExistingSignupStatus;
  }>;
  signInAndLoad: (identifier: string, password: string) => Promise<void>;
  /** After a successful password reset — load tree data and clear recovery mode. */
  finishPasswordRecovery: () => Promise<boolean>;
  resetAll: () => Promise<void>;

  // account settings + lifecycle
  updateAccountSettings: (patch: AccountSettingsPatch) => Promise<void>;
  setUsername: (username: string) => Promise<void>;
  updatePublicProfile: (patch: Partial<import('@/types/models').PublicProfileConfig>) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  requestAccountDeletion: () => Promise<void>;
  undoAccountDeletion: () => Promise<void>;

  addRelative: (input: {
    name: string;
    relationshipType: RelationshipType;
    relationshipDetail?: import('@/lib/relationshipDetail').RelationshipDetail;
    isRemembered: boolean;
    tags?: string[];
    /** When set, the new person is added relative to this node (not only the anchor). */
    contextNodeId?: string;
    /** How to bridge a sibling when no shared parent exists yet (§1.2). */
    siblingBridgeMode?: SiblingBridgeMode;
  }) => Promise<{ node: FamilyNode; pairingOpportunity: import('@/lib/parentPairing').ParentPairingOpportunity | null }>;

  /** Turn a synthetic unknown tree node into a minimal, editable Life Profile. */
  materializeUnknown: (placeholder: import('@/lib/kinship/types').KinshipNode) => Promise<FamilyNode>;

  /** Change a node's relationship type to its connected node (creator/guardian only). */
  updateRelationshipType: (relationshipId: string, relationshipType: RelationshipType) => Promise<void>;

  /** Change relationship type and/or gender-specific detail on an edge. */
  updateRelationship: (
    relationshipId: string,
    updates: { relationshipType?: RelationshipType; relationshipDetail?: import('@/lib/relationshipDetail').RelationshipDetail | null },
  ) => Promise<void>;

  /** Set or clear the wedding date on a spouse or partner connection. */
  updateRelationshipWeddingDate: (relationshipId: string, weddingDate: string | null) => Promise<void>;

  /** Create a new relationship edge between two existing nodes. */
  createRelationship: (input: {
    fromNodeId: string;
    toNodeId: string;
    relationshipType: RelationshipType;
    relationshipDetail?: import('@/lib/relationshipDetail').RelationshipDetail;
  }) => Promise<void>;

  /** Remove a single relationship edge. */
  deleteRelationship: (relationshipId: string) => Promise<void>;

  /** Permanently remove an unclaimed node the user created. */
  deleteNode: (nodeId: string) => Promise<void>;

  /** Create or refresh an invite (code + optional password + link) for a node. */
  generateNodeInvite: (
    nodeId: string,
    opts?: { password?: string | null; regenerate?: boolean },
  ) => Promise<NodeInvite>;
  /** Revoke a node's invite. */
  clearNodeInvite: (nodeId: string) => Promise<void>;
  /** Claim a node from an invite code (+ optional password), then reload. */
  claimNode: (code: string, password?: string) => Promise<inviteService.ClaimResult>;
  /** Resume a saved pending claim after sign-in (clears draft on success). */
  resumePendingClaim: () => Promise<inviteService.ClaimResult | null>;
  /** Set after a successful claim so reveal / callback can route without URL secrets. */
  pendingClaimReveal: inviteService.ClaimResult | null;
  clearPendingClaimReveal: () => void;
  /** Owner-initiated node ownership transfer (replaces reusing an invite). */
  requestNodeTransfer: (nodeId: string, toEmail: string) => Promise<inviteService.NodeTransferRequest>;

  updateTreePrivacy: (patch: {
    defaultVisibility: VisibilityLevel;
    publicSharingEnabled: boolean;
  }) => Promise<void>;

  updateNodeProfile: (input: {
    nodeId: string;
    profile: NodeProfile;
    tags?: string[];
    defaultVisibility?: VisibilityLevel;
    changeLog: ChangeLogEntryInput[];
  }) => Promise<FamilyNode>;

  submitSuggestedEdit: (input: {
    nodeId: string;
    fieldKey: ProfileFieldKey;
    currentValueSnapshot: unknown;
    suggestedValue: unknown;
    reason?: string;
  }) => Promise<SuggestedEdit>;

  reviewSuggestedEdit: (input: {
    editId: string;
    status: 'approved' | 'rejected' | 'needs_more_info';
    reviewNote?: string;
  }) => Promise<void>;

  fetchChangeLog: (nodeId: string) => Promise<ProfileChangeLog[]>;
  fetchTreeChangeLog: () => Promise<ProfileChangeLog[]>;
  getSuggestedEditsForNode: (nodeId: string) => SuggestedEdit[];

  addTextMemory: (input: {
    nodeId: string;
    title?: string;
    body: string;
    visibility: VisibilityLevel;
  }) => Promise<Memory>;

  createMemory: (input: {
    nodeId: string;
    type: MemoryType;
    title?: string;
    body?: string;
    caption?: string;
    mediaUrl?: string;
    media?: MemoryMediaItem[];
    taggedNodeIds?: string[];
    visibility: VisibilityLevel;
  }) => Promise<Memory>;

  updateMemory: (input: {
    id: string;
    title?: string;
    body?: string;
    caption?: string;
    taggedNodeIds?: string[];
    visibility?: VisibilityLevel;
  }) => Promise<Memory>;

  deleteMemory: (id: string) => Promise<void>;

  // notifications
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // memorial / passing lifecycle
  requestPassing: (input: { nodeId: string; deathDate?: string; reason?: string }) => Promise<RequestPassingResult>;
  finalizeMemorial: (requestId: string) => Promise<void>;
  disputeMemorial: (requestId: string, reason?: string) => Promise<void>;
  castMemorialVote: (requestId: string, vote: 'confirm' | 'dispute') => Promise<void>;
  fetchMemorialVotes: (requestId: string) => Promise<memorialService.MemorialVoteSummary>;
  fetchMemorialRequestForNode: (nodeId: string) => Promise<MemorialRequest | null>;
  updateMemorialPage: (nodeId: string, patch: MemorialPagePatch) => Promise<FamilyNode>;

  /** Total bytes of media this account has uploaded (for the storage tracker). */
  mediaUsageBytes: number;
  refreshMediaUsage: () => Promise<void>;

  getNode: (id: string) => FamilyNode | undefined;
  getMemory: (id: string) => Memory | undefined;
  getMemoriesForNode: (id: string) => Memory[];
  getRelationshipForNode: (id: string) => Relationship | undefined;
  getRelationshipsForNode: (id: string) => Relationship[];
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [tree, setTree] = useState<FamilyTree | null>(null);
  const [nodes, setNodes] = useState<FamilyNode[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [suggestedEdits, setSuggestedEdits] = useState<SuggestedEdit[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mediaUsageBytes, setMediaUsageBytes] = useState(0);
  const [draft, setDraftState] = useState<OnboardingDraft>(() => loadOnboardingDraftFromStorage());
  const [passwordRecoveryPending, setPasswordRecoveryPending] = useState(
    () => isPasswordRecoveryPendingSync(),
  );
  const [pendingClaimReveal, setPendingClaimReveal] = useState<inviteService.ClaimResult | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    void isPasswordRecoveryPending().then((pending) => {
      if (pending) setPasswordRecoveryPending(true);
    });
  }, []);

  const applyBundle = useCallback((bundle: treeService.TreeBundle | null) => {
    if (!bundle) {
      setTree(null);
      setNodes([]);
      setRelationships([]);
      setMemories([]);
      setSuggestedEdits([]);
      setNotifications([]);
      return;
    }
    setTree(bundle.tree);
    const liveNodes = activeNodes(bundle.nodes);
    const anchorId = findTreeAnchorId(liveNodes);
    const treeNodes = treeMemberNodes(liveNodes, bundle.relationships, anchorId);
    const treeIds = new Set(treeNodes.map((n) => n.id));
    setNodes(treeNodes);
    setRelationships(activeRelationships(treeNodes, bundle.relationships));
    setMemories(bundle.memories.filter((m) => !!m.nodeId && treeIds.has(m.nodeId)));
    setSuggestedEdits(bundle.suggestedEdits);
  }, []);

  const setDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraftState((prev) => {
      const next = { ...prev, ...patch };
      storeOnboardingDraftToStorage(next);
      draftRef.current = next;
      return next;
    });
  }, []);

  const syncDraft = useCallback((next: OnboardingDraft) => {
    storeOnboardingDraftToStorage(next);
    draftRef.current = next;
    setDraftState(next);
  }, []);

  const clearPendingClaimDraft = useCallback(() => {
    setDraftState((prev) => {
      const next = { ...prev, pendingClaimCode: undefined, pendingClaimPassword: undefined };
      storeOnboardingDraftToStorage(next);
      draftRef.current = next;
      return next;
    });
  }, []);

  // Load the signed-in user's data. If they have no tree yet but a saved draft
  // exists (e.g. after an email-confirmation redirect), persist it now.
  const loadForUser = useCallback(
    async (activeSession: Session): Promise<boolean> => {
      const userId = activeSession.user.id;
      const resolvedDraft = resolveOnboardingDraft(draftRef.current, activeSession);
      if (resolvedDraft !== draftRef.current) {
        syncDraft(resolvedDraft);
      }

      const selfName = resolvedDraft.selfName.trim();
      const displayName = selfName || activeSession.user.email?.split('@')[0] || 'You';
      let acct = await treeService.getAccount(userId);
      if (!acct) {
        acct = await treeService.ensureAccount(userId, displayName);
      } else if (selfName && isLikelyAutoDisplayName(acct.displayName, activeSession.user.email)) {
        try {
          acct = await accountService.updateAccountSettings(userId, { displayName: selfName });
        } catch (e) {
          console.warn('[tomora] onboarding display name sync failed', e);
        }
      }
      setAccount(acct);

      const pendingUsername = resolvedDraft.pendingUsername?.trim();
      if (pendingUsername && !acct.username) {
        try {
          acct = await accountService.setUsername(pendingUsername);
          setAccount(acct);
          syncDraft({ ...resolvedDraft, pendingUsername: undefined });
        } catch (e) {
          console.warn('[tomora] pending username set failed', e);
        }
      }

      let bundle = await treeService.loadMyTreeBundle(userId);
      if (hasOnboardingTreeDraft(resolvedDraft) && !isOnboardingTreeComplete(bundle, userId)) {
        bundle = await treeService.ensureOnboardingTree(
          {
            accountId: userId,
            selfName: resolvedDraft.selfName,
            lovedOneName: resolvedDraft.lovedOneName,
            relationshipType: resolvedDraft.lovedOneRelationship,
            relationshipDetail: resolvedDraft.lovedOneRelationshipDetail,
            isRemembered: resolvedDraft.lovedOneIsRemembered,
          },
          bundle,
        );
        clearOnboardingDraftStorage();
        void authService.clearOnboardingDraftMetadata();
      }
      applyBundle(bundle);
      if (bundle) {
        const live = activeNodes(bundle.nodes);
        const anchorId = findTreeAnchorId(live);
        const connected = new Set(treeMemberNodes(live, bundle.relationships, anchorId).map((n) => n.id));
        for (const orphan of live) {
          if (connected.has(orphan.id)) continue;
          if (orphan.ownerAccountId === userId) continue;
          if (editScopeFor(orphan, userId) !== 'guardian') continue;
          void treeService.deleteNode(orphan.id, userId).catch((e) => {
            console.warn('[tomora] orphan cleanup failed', e);
          });
        }
      }

      const pendingClaim = draftRef.current.pendingClaimCode?.trim();
      if (pendingClaim) {
        try {
          const claimResult = await inviteService.claimNode(
            pendingClaim,
            draftRef.current.pendingClaimPassword,
          );
          clearPendingClaimDraft();
          setPendingClaimReveal(claimResult);
          const refreshed = await treeService.loadMyTreeBundle(userId);
          applyBundle(refreshed);
        } catch (e) {
          console.warn('[tomora] pending claim failed', e);
        }
      }

      try {
        setNotifications(await notificationService.fetchNotifications(userId));
      } catch (e) {
        console.warn('[tomora] notifications load failed', e);
        setNotifications([]);
      }

      return !!bundle?.tree;
    },
    [applyBundle, clearPendingClaimDraft, syncDraft],
  );

  const loadForUserRef = useRef(loadForUser);
  loadForUserRef.current = loadForUser;

  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);

      if (!newSession) {
        setAccount(null);
        applyBundle(null);
        setLoading(false);
        return;
      }

      // Recovery link — keep session but skip tree hydrate until /reset-password completes.
      if (
        event === 'PASSWORD_RECOVERY' ||
        isPasswordRecoveryPendingSync() ||
        (await isPasswordRecoveryPending())
      ) {
        setPasswordRecoveryPending(true);
        if (mounted) setLoading(false);
        return;
      }

      // Hydrate on cold start and after sign-in (e.g. email-confirmation redirect).
      const shouldHydrate =
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        (event === 'USER_UPDATED' && authService.isEmailVerified(newSession));

      if (shouldHydrate && !isAuthHydrationSuppressed()) {
        try {
          await loadForUserRef.current(newSession);
        } catch (e) {
          console.warn('[tomora] auth hydrate failed', e);
        } finally {
          if (mounted) setLoading(false);
        }
        return;
      }

      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [applyBundle]);

  const finishPasswordRecovery = useCallback(async (): Promise<boolean> => {
    await clearPasswordRecoveryPending();
    setPasswordRecoveryPending(false);
    const s = await authService.getSession();
    if (!s) return false;
    return loadForUser(s);
  }, [loadForUser]);

  const signUpAndStart = useCallback<AppStateValue['signUpAndStart']>(
    async (email, password, username) => {
      const normalized = username.trim().toLowerCase();
      const usernameErr = validateUsername(normalized);
      if (usernameErr) throw new Error(usernameErr);

      setDraftState((prev) => {
        const next = { ...prev, pendingUsername: normalized };
        storeOnboardingDraftToStorage(next);
        draftRef.current = next;
        return next;
      });

      const pendingClaim = draftRef.current.pendingClaimCode?.trim();
      const signupDraft = draftRef.current;
      const result = await authService.signUpWithEmail(
        email,
        password,
        normalized,
        pendingClaim ? { next: 'claim' } : { next: 'onboarding' },
        signupDraft,
      );
      if (!result.session) {
        return {
          needsEmailConfirmation: true,
          alreadyRegistered: result.alreadyRegistered,
          existingSignupStatus: result.existingSignupStatus,
        };
      }
      setSession(result.session);
      await loadForUser(result.session);
      return { needsEmailConfirmation: false };
    },
    [loadForUser],
  );

  const signInAndLoad = useCallback<AppStateValue['signInAndLoad']>(
    async (identifier, password) => {
      const s = await authService.signInWithIdentifier(identifier, password);
      setSession(s);
      await loadForUser(s);
    },
    [loadForUser],
  );

  const resetAll = useCallback(async () => {
    await clearPasswordRecoveryPending();
    await authService.signOut();
    clearOnboardingDraftStorage();
    setSession(null);
    setAccount(null);
    setTree(null);
    setNodes([]);
    setRelationships([]);
    setMemories([]);
    setSuggestedEdits([]);
    setNotifications([]);
    setDraftState(emptyOnboardingDraft());
  }, []);

  const updateAccountSettings = useCallback<AppStateValue['updateAccountSettings']>(
    async (patch) => {
      if (!account) throw new Error('No account loaded.');
      const updated = await accountService.updateAccountSettings(account.id, patch);
      setAccount((prev) => ({ ...updated, email: prev?.email }));
    },
    [account],
  );

  const setUsername = useCallback<AppStateValue['setUsername']>(
    async (username) => {
      const updated = await accountService.setUsername(username);
      setAccount((prev) => ({ ...updated, email: prev?.email }));
    },
    [],
  );

  const updatePublicProfile = useCallback<AppStateValue['updatePublicProfile']>(
    async (patch) => {
      if (!account) throw new Error('No account loaded.');
      const updated = await accountService.updatePublicProfile(account.id, patch);
      setAccount((prev) => ({ ...updated, email: prev?.email }));
    },
    [account],
  );

  const updateEmail = useCallback<AppStateValue['updateEmail']>(async (email) => {
    await accountService.updateEmail(email);
    setAccount((prev) => (prev ? { ...prev, email } : prev));
  }, []);

  const updatePassword = useCallback<AppStateValue['updatePassword']>(
    (password) => accountService.updatePassword(password),
    [],
  );

  const requestAccountDeletion = useCallback<AppStateValue['requestAccountDeletion']>(async () => {
    if (!account) throw new Error('No account loaded.');
    const { account: updated, nodes: updatedNodes } = await accountService.requestAccountDeletion(account.id);
    setAccount((prev) => ({ ...updated, email: prev?.email }));
    setNodes((prev) => prev.map((n) => updatedNodes.find((u) => u.id === n.id) ?? n));
  }, [account]);

  const undoAccountDeletion = useCallback<AppStateValue['undoAccountDeletion']>(async () => {
    if (!account) throw new Error('No account loaded.');
    const { account: updated, nodes: updatedNodes } = await accountService.undoAccountDeletion(account.id);
    setAccount((prev) => ({ ...updated, email: prev?.email }));
    setNodes((prev) => prev.map((n) => updatedNodes.find((u) => u.id === n.id) ?? n));
  }, [account]);

  const addRelative = useCallback<AppStateValue['addRelative']>(
    async ({ name, relationshipType, relationshipDetail, isRemembered, tags, contextNodeId, siblingBridgeMode }) => {
      if (!tree || !account) throw new Error('No tree or account loaded.');
      const selfNode =
        nodes.find((n) => n.ownerAccountId === account.id) ??
        nodes.find((n) => n.status === 'claimed') ??
        nodes[0];
      if (!selfNode) throw new Error('No anchor node to connect to.');

      const fromNodeId = contextNodeId ?? selfNode.id;
      if (!nodes.some((n) => n.id === fromNodeId)) {
        throw new Error('That family member is no longer in your tree.');
      }

      const bridgeTags = siblingBridgeMode ? tagsForSiblingBridgeMode(siblingBridgeMode) : undefined;
      const mergedTags = [...(tags ?? []), ...(bridgeTags ?? [])];

      const { node, relationship } = await treeService.addRelative({
        treeId: tree.id,
        accountId: account.id,
        fromNodeId,
        name,
        relationshipType,
        relationshipDetail,
        isRemembered,
        tags: mergedTags.length ? mergedTags : undefined,
      });

      const createdRelationships = [relationship];

      if (relationshipType === 'sibling' && siblingBridgeMode !== 'unbridged') {
        const parentEdges = inferSiblingParentEdges({
          childId: fromNodeId,
          newSiblingId: node.id,
          relationships: [...relationships, relationship],
        });
        for (const edge of parentEdges) {
          const extra = await treeService.createRelationship({
            treeId: tree.id,
            accountId: account.id,
            fromNodeId: edge.fromNodeId,
            toNodeId: edge.toNodeId,
            relationshipType: edge.relationshipType,
          });
          createdRelationships.push(extra);
        }
      }
      if (contextNodeId && contextNodeId !== selfNode.id) {
        const inferred = inferContextualRelationships({
          contextNodeId,
          newNodeId: node.id,
          relationshipToContext: relationshipType,
          relationships: [...relationships, relationship],
        });
        for (const edge of inferred) {
          const extra = await treeService.createRelationship({
            treeId: tree.id,
            accountId: account.id,
            fromNodeId: edge.fromNodeId,
            toNodeId: edge.toNodeId,
            relationshipType: edge.relationshipType,
          });
          createdRelationships.push(extra);
        }
      }

      setNodes((prev) => [...prev, node]);
      setRelationships((prev) => [...prev, ...createdRelationships]);

      const childId = childIdForParentEdge(relationshipType, fromNodeId);
      const pairingOpportunity = childId
        ? detectParentPairingOpportunity({
            childId,
            nodes: [...nodes, node],
            relationships: [...relationships, ...createdRelationships],
          })
        : null;

      return { node, pairingOpportunity };
    },
    [account, nodes, relationships, tree],
  );

  const materializeUnknown = useCallback<AppStateValue['materializeUnknown']>(
    async (placeholder) => {
      const { node } = await addRelative({
        name: defaultNameForPlaceholder(placeholder),
        relationshipType: relationshipTypeForPlaceholder(placeholder),
        isRemembered: false,
        tags: ['Unknown link'],
      });
      return node;
    },
    [addRelative],
  );

  const updateRelationshipType = useCallback<AppStateValue['updateRelationshipType']>(
    async (relationshipId, relationshipType) => {
      const updated = await treeService.updateRelationship(relationshipId, { relationshipType });
      setRelationships((prev) => prev.map((r) => (r.id === relationshipId ? updated : r)));
    },
    [],
  );

  const updateRelationship = useCallback<AppStateValue['updateRelationship']>(
    async (relationshipId, updates) => {
      const updated = await treeService.updateRelationship(relationshipId, updates);
      setRelationships((prev) => prev.map((r) => (r.id === relationshipId ? updated : r)));
    },
    [],
  );

  const updateRelationshipWeddingDate = useCallback<AppStateValue['updateRelationshipWeddingDate']>(
    async (relationshipId, weddingDate) => {
      const updated = await treeService.updateRelationshipWeddingDate(relationshipId, weddingDate);
      setRelationships((prev) => prev.map((r) => (r.id === relationshipId ? updated : r)));
    },
    [],
  );

  const createRelationship = useCallback<AppStateValue['createRelationship']>(
    async ({ fromNodeId, toNodeId, relationshipType, relationshipDetail }) => {
      if (!tree || !account) throw new Error('No tree or account loaded.');
      if (!nodes.some((n) => n.id === fromNodeId) || !nodes.some((n) => n.id === toNodeId)) {
        throw new Error('One of these family members is no longer in your tree.');
      }
      const created = await treeService.createRelationship({
        treeId: tree.id,
        accountId: account.id,
        fromNodeId,
        toNodeId,
        relationshipType,
        relationshipDetail,
      });
      setRelationships((prev) => [...prev, created]);
    },
    [tree, account],
  );

  const deleteRelationship = useCallback<AppStateValue['deleteRelationship']>(async (relationshipId) => {
    if (!account) throw new Error('Sign in to update connections.');
    await treeService.deleteRelationship(relationshipId);
    const nextRels = relationships.filter((r) => r.id !== relationshipId);
    const anchorId = findTreeAnchorId(nodes);
    const reachable = anchorId ? reachableNodeIds(nodes, nextRels, anchorId) : new Set(nodes.map((n) => n.id));
    const orphans = nodes.filter((n) => !reachable.has(n.id));

    for (const orphan of orphans) {
      if (orphan.ownerAccountId === account.id) continue;
      if (editScopeFor(orphan, account.id) !== 'guardian') continue;
      try {
        await treeService.deleteNode(orphan.id, account.id);
      } catch (e) {
        console.warn('[tomora] orphan node prune failed', e);
      }
    }

    const remainingNodes = nodes.filter((n) => reachable.has(n.id));
    setNodes(remainingNodes);
    setRelationships(activeRelationships(remainingNodes, nextRels));
    setMemories((prev) => prev.filter((m) => !!m.nodeId && reachable.has(m.nodeId)));
    setSuggestedEdits((prev) => prev.filter((e) => reachable.has(e.targetNodeId)));
  }, [account, nodes, relationships]);

  const deleteNode = useCallback<AppStateValue['deleteNode']>(async (nodeId) => {
    if (!account) throw new Error('Sign in to remove a family member.');
    await treeService.deleteNode(nodeId, account.id);
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setRelationships((prev) => prev.filter((r) => r.fromNodeId !== nodeId && r.toNodeId !== nodeId));
    setMemories((prev) => prev.filter((m) => m.nodeId !== nodeId));
    setSuggestedEdits((prev) => prev.filter((e) => e.targetNodeId !== nodeId));
  }, [account]);

  const generateNodeInvite = useCallback<AppStateValue['generateNodeInvite']>(async (nodeId, opts) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error('Node not found.');
    const invite = await inviteService.ensureNodeInvite(node, opts);
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? invite.node : n)));
    return invite;
  }, [nodes]);

  const clearNodeInvite = useCallback<AppStateValue['clearNodeInvite']>(async (nodeId) => {
    const updated = await inviteService.clearNodeInvite(nodeId);
    setNodes((prev) => prev.map((n) => (n.id === nodeId ? updated : n)));
  }, []);

  const clearPendingClaimReveal = useCallback(() => setPendingClaimReveal(null), []);

  const requestNodeTransfer = useCallback<AppStateValue['requestNodeTransfer']>(
    (nodeId, toEmail) => inviteService.requestNodeTransfer(nodeId, toEmail),
    [],
  );

  const resumePendingClaim = useCallback<AppStateValue['resumePendingClaim']>(async () => {
    const code = draftRef.current.pendingClaimCode?.trim();
    if (!code || !session) return null;
    const result = await inviteService.claimNode(code, draftRef.current.pendingClaimPassword);
    clearPendingClaimDraft();
    setPendingClaimReveal(result);
    const refreshed = await treeService.loadMyTreeBundle(session.user.id);
    applyBundle(refreshed);
    return result;
  }, [session, applyBundle, clearPendingClaimDraft]);

  const claimNode = useCallback<AppStateValue['claimNode']>(
    async (code, password) => {
      const result = await inviteService.claimNode(code, password);
      clearPendingClaimDraft();
      setPendingClaimReveal(result);
      if (session) {
        const refreshed = await treeService.loadMyTreeBundle(session.user.id);
        applyBundle(refreshed);
      }
      return result;
    },
    [session, applyBundle, clearPendingClaimDraft],
  );

  const updateTreePrivacy = useCallback<AppStateValue['updateTreePrivacy']>(
    async (patch) => {
      if (!tree) return;
      const updated = await treeService.updateTreePrivacy(tree.id, patch);
      setTree(updated);
    },
    [tree],
  );

  const updateNodeProfile = useCallback<AppStateValue['updateNodeProfile']>(
    async ({ nodeId, profile, tags, defaultVisibility, changeLog }) => {
      if (!tree || !account) throw new Error('No tree or account loaded.');
      const updated = await profileService.updateNodeProfile({
        treeId: tree.id,
        nodeId,
        accountId: account.id,
        profile,
        tags,
        defaultVisibility,
        changeLog,
      });
      setNodes((prev) => prev.map((n) => (n.id === nodeId ? updated : n)));
      return updated;
    },
    [account, tree],
  );

  const submitSuggestedEdit = useCallback<AppStateValue['submitSuggestedEdit']>(
    async ({ nodeId, fieldKey, currentValueSnapshot, suggestedValue, reason }) => {
      if (!tree || !account) throw new Error('No tree or account loaded.');
      const edit = await profileService.createSuggestedEdit({
        treeId: tree.id,
        nodeId,
        accountId: account.id,
        fieldKey,
        currentValueSnapshot,
        suggestedValue,
        reason,
      });
      setSuggestedEdits((prev) => [edit, ...prev]);
      return edit;
    },
    [account, tree],
  );

  const reviewSuggestedEdit = useCallback<AppStateValue['reviewSuggestedEdit']>(
    async ({ editId, status, reviewNote }) => {
      if (!account) throw new Error('No account loaded.');
      const updated = await profileService.reviewSuggestedEdit({
        editId,
        reviewerAccountId: account.id,
        status,
        reviewNote,
      });
      setSuggestedEdits((prev) => prev.map((e) => (e.id === editId ? updated : e)));
    },
    [account],
  );

  const fetchChangeLog = useCallback<AppStateValue['fetchChangeLog']>(
    (nodeId) => profileService.fetchChangeLog(nodeId),
    [],
  );

  const fetchTreeChangeLog = useCallback<AppStateValue['fetchTreeChangeLog']>(
    () => (tree ? profileService.fetchTreeChangeLog(tree.id) : Promise.resolve([])),
    [tree],
  );

  const getSuggestedEditsForNode = useCallback(
    (nodeId: string) => suggestedEdits.filter((e) => e.targetNodeId === nodeId),
    [suggestedEdits],
  );

  const refreshMediaUsage = useCallback(async () => {
    if (!account?.id) {
      setMediaUsageBytes(0);
      return;
    }
    try {
      const bytes = await storageService.getAccountStorageUsage(account.id);
      setMediaUsageBytes(bytes);
    } catch (e) {
      console.warn('[tomora] storage usage refresh failed', e);
      setMediaUsageBytes(
        memories.reduce(
          (sum, m) => (m.createdByAccountId === account.id ? sum + (m.mediaSizeBytes ?? 0) : sum),
          0,
        ),
      );
    }
  }, [account?.id, memories]);

  useEffect(() => {
    void refreshMediaUsage();
  }, [refreshMediaUsage]);

  const createMemory = useCallback<AppStateValue['createMemory']>(
    async (input) => {
      if (!tree || !account) throw new Error('No tree or account loaded.');
      const memory = await memoryService.createMemory({
        familyTreeId: tree.id,
        accountId: account.id,
        ...input,
      });
      setMemories((prev) => [memory, ...prev]);
      void refreshMediaUsage();
      return memory;
    },
    [account, tree, refreshMediaUsage],
  );

  const addTextMemory = useCallback<AppStateValue['addTextMemory']>(
    ({ nodeId, title, body, visibility }) =>
      createMemory({ nodeId, type: 'text', title, body, visibility }),
    [createMemory],
  );

  const updateMemory = useCallback<AppStateValue['updateMemory']>(
    async (input) => {
      const updated = await memoryService.updateMemory(input);
      setMemories((prev) => prev.map((m) => (m.id === input.id ? updated : m)));
      return updated;
    },
    [],
  );

  const deleteMemory = useCallback<AppStateValue['deleteMemory']>(
    async (id) => {
      const target = memories.find((m) => m.id === id);
      await memoryService.deleteMemory({ id, storagePath: target?.storagePath, media: target?.media ?? [] });
      setMemories((prev) => prev.filter((m) => m.id !== id));
      void refreshMediaUsage();
    },
    [memories, refreshMediaUsage],
  );

  const refreshNotifications = useCallback<AppStateValue['refreshNotifications']>(async () => {
    if (!account) return;
    setNotifications(await notificationService.fetchNotifications(account.id));
  }, [account]);

  const markNotificationRead = useCallback<AppStateValue['markNotificationRead']>(async (id) => {
    await notificationService.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback<AppStateValue['markAllNotificationsRead']>(async () => {
    if (!account) return;
    await notificationService.markAllNotificationsRead(account.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, [account]);

  const requestPassing = useCallback<AppStateValue['requestPassing']>(
    async (input) => {
      const result = await memorialService.requestPassing(input);
      if (session) await loadForUser(session);
      return result;
    },
    [session, loadForUser],
  );

  const finalizeMemorial = useCallback<AppStateValue['finalizeMemorial']>(
    async (requestId) => {
      await memorialService.finalizeMemorial(requestId);
      if (session) await loadForUser(session);
    },
    [session, loadForUser],
  );

  const disputeMemorial = useCallback<AppStateValue['disputeMemorial']>(
    async (requestId, reason) => {
      await memorialService.disputeMemorial(requestId, reason);
      if (session) await loadForUser(session);
    },
    [session, loadForUser],
  );

  const castMemorialVote = useCallback<AppStateValue['castMemorialVote']>(
    async (requestId, vote) => {
      await memorialService.castMemorialVote(requestId, vote);
    },
    [],
  );

  const fetchMemorialVotes = useCallback<AppStateValue['fetchMemorialVotes']>(
    (requestId) => memorialService.fetchMemorialVotes(requestId),
    [],
  );

  const fetchMemorialRequestForNode = useCallback<AppStateValue['fetchMemorialRequestForNode']>(
    (nodeId) => memorialService.fetchMemorialRequestForNode(nodeId),
    [],
  );

  const updateMemorialPage = useCallback<AppStateValue['updateMemorialPage']>(
    async (nodeId, patch) => {
      const updated = await memorialService.updateMemorialPage(nodeId, patch);
      setNodes((prev) => prev.map((n) => (n.id === nodeId ? updated : n)));
      return updated;
    },
    [],
  );

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const familyTreeMembership = useMemo(() => {
    if (!account || !tree) return null;
    const role: TreeRole = tree.createdByAccountId === account.id ? 'creator' : 'member';
    return { role };
  }, [account, tree]);

  const canViewMemory = useCallback(
    (memory: Memory) =>
      canViewContent({
        viewer: account,
        content: { visibility: memory.visibility, createdByAccountId: memory.createdByAccountId },
        familyTreeMembership,
      }),
    [account, familyTreeMembership],
  );

  const visibleMemories = useMemo(
    () => memories.filter(canViewMemory),
    [memories, canViewMemory],
  );

  const getNode = useCallback(
    (id: string) => {
      const node = nodes.find((n) => n.id === id);
      return node && isActiveNode(node) ? node : undefined;
    },
    [nodes],
  );
  const getMemory = useCallback(
    (id: string) => {
      const memory = memories.find((m) => m.id === id);
      return memory && canViewMemory(memory) ? memory : undefined;
    },
    [memories, canViewMemory],
  );
  const getMemoriesForNode = useCallback(
    (id: string) => visibleMemories.filter((m) => m.nodeId === id),
    [visibleMemories],
  );
  const getRelationshipForNode = useCallback(
    (id: string) => {
      if (!getNode(id)) return undefined;
      const selfNode = nodes.find((n) => n.ownerAccountId === account?.id);
      return pickPrimaryRelationship(relationships, id, selfNode?.id);
    },
    [relationships, nodes, account?.id, getNode],
  );
  const getRelationshipsForNode = useCallback(
    (id: string) => {
      if (!getNode(id)) return [];
      return relationships.filter((r) => r.toNodeId === id || r.fromNodeId === id);
    },
    [relationships, getNode],
  );

  const value = useMemo<AppStateValue>(
    () => ({
      loading,
      session,
      account,
      tree,
      nodes,
      relationships,
      memories,
      visibleMemories,
      suggestedEdits,
      notifications,
      unreadNotificationCount,
      isOnboarded: !!session && !!tree,
      passwordRecoveryPending,
      draft,
      setDraft,
      signUpAndStart,
      signInAndLoad,
      finishPasswordRecovery,
      resetAll,
      updateAccountSettings,
      setUsername,
      updatePublicProfile,
      updateEmail,
      updatePassword,
      requestAccountDeletion,
      undoAccountDeletion,
      addRelative,
      materializeUnknown,
      updateRelationshipType,
      updateRelationship,
      updateRelationshipWeddingDate,
      createRelationship,
      deleteRelationship,
      deleteNode,
      generateNodeInvite,
      clearNodeInvite,
      claimNode,
      resumePendingClaim,
      pendingClaimReveal,
      clearPendingClaimReveal,
      requestNodeTransfer,
      updateTreePrivacy,
      updateNodeProfile,
      submitSuggestedEdit,
      reviewSuggestedEdit,
      fetchChangeLog,
      fetchTreeChangeLog,
      getSuggestedEditsForNode,
      addTextMemory,
      createMemory,
      updateMemory,
      deleteMemory,
      refreshNotifications,
      refreshMediaUsage,
      markNotificationRead,
      markAllNotificationsRead,
      requestPassing,
      finalizeMemorial,
      disputeMemorial,
      castMemorialVote,
      fetchMemorialVotes,
      fetchMemorialRequestForNode,
      updateMemorialPage,
      mediaUsageBytes,
      getNode,
      getMemory,
      getMemoriesForNode,
      getRelationshipForNode,
      getRelationshipsForNode,
    }),
    [
      loading,
      session,
      account,
      tree,
      nodes,
      relationships,
      memories,
      visibleMemories,
      suggestedEdits,
      notifications,
      unreadNotificationCount,
      passwordRecoveryPending,
      draft,
      setDraft,
      signUpAndStart,
      signInAndLoad,
      finishPasswordRecovery,
      resetAll,
      updateAccountSettings,
      setUsername,
      updatePublicProfile,
      updateEmail,
      updatePassword,
      requestAccountDeletion,
      undoAccountDeletion,
      addRelative,
      materializeUnknown,
      updateRelationshipType,
      updateRelationship,
      updateRelationshipWeddingDate,
      createRelationship,
      deleteRelationship,
      deleteNode,
      generateNodeInvite,
      clearNodeInvite,
      claimNode,
      resumePendingClaim,
      pendingClaimReveal,
      clearPendingClaimReveal,
      requestNodeTransfer,
      updateTreePrivacy,
      updateNodeProfile,
      submitSuggestedEdit,
      reviewSuggestedEdit,
      fetchChangeLog,
      fetchTreeChangeLog,
      getSuggestedEditsForNode,
      addTextMemory,
      createMemory,
      updateMemory,
      deleteMemory,
      refreshNotifications,
      refreshMediaUsage,
      markNotificationRead,
      markAllNotificationsRead,
      requestPassing,
      finalizeMemorial,
      disputeMemorial,
      castMemorialVote,
      fetchMemorialVotes,
      fetchMemorialRequestForNode,
      updateMemorialPage,
      mediaUsageBytes,
      getNode,
      getMemory,
      getMemoriesForNode,
      getRelationshipForNode,
      getRelationshipsForNode,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
