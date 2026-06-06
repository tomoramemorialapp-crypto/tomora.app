import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';

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
import { validateUsername } from '@/lib/username';
import { pickPrimaryRelationship } from '@/lib/relationshipUtils';
import type { NodeInvite } from '@/services/inviteService';
import type { AccountSettingsPatch } from '@/services/accountService';
import type { ChangeLogEntryInput } from '@/services/profileService';
import type { MemorialPagePatch, RequestPassingResult } from '@/services/memorialService';

interface OnboardingDraft {
  selfName: string;
  lovedOneName: string;
  lovedOneRelationship: RelationshipType;
  lovedOneIsRemembered: boolean;
  /** Chosen at signup; applied via set_username once a session exists. */
  pendingUsername?: string;
  /** Invite code to auto-claim after the user creates an account. */
  pendingClaimCode?: string;
}

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
  draft: OnboardingDraft;

  setDraft: (patch: Partial<OnboardingDraft>) => void;

  // auth + persistence
  signUpAndStart: (email: string, password: string, username: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signInAndLoad: (identifier: string, password: string) => Promise<void>;
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
    isRemembered: boolean;
    tags?: string[];
  }) => Promise<FamilyNode>;

  /** Change a node's relationship type to its connected node (creator/guardian only). */
  updateRelationshipType: (relationshipId: string, relationshipType: RelationshipType) => Promise<void>;

  /** Create a new relationship edge between two existing nodes. */
  createRelationship: (input: {
    fromNodeId: string;
    toNodeId: string;
    relationshipType: RelationshipType;
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

  getNode: (id: string) => FamilyNode | undefined;
  getMemory: (id: string) => Memory | undefined;
  getMemoriesForNode: (id: string) => Memory[];
  getRelationshipForNode: (id: string) => Relationship | undefined;
  getRelationshipsForNode: (id: string) => Relationship[];
}

const emptyDraft: OnboardingDraft = {
  selfName: '',
  lovedOneName: '',
  lovedOneRelationship: 'parent',
  lovedOneIsRemembered: false,
};

const DRAFT_KEY = 'tomora.onboarding.draft';

function loadStoredDraft(): OnboardingDraft {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return emptyDraft;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? { ...emptyDraft, ...JSON.parse(raw) } : emptyDraft;
  } catch {
    return emptyDraft;
  }
}

function storeDraft(draft: OnboardingDraft) {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore storage failures
  }
}

function clearStoredDraft() {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
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
  const [draft, setDraftState] = useState<OnboardingDraft>(() => loadStoredDraft());
  const draftRef = useRef(draft);
  draftRef.current = draft;

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
    setNodes(bundle.nodes);
    setRelationships(bundle.relationships);
    setMemories(bundle.memories);
    setSuggestedEdits(bundle.suggestedEdits);
  }, []);

  // Load the signed-in user's data. If they have no tree yet but a saved draft
  // exists (e.g. after an email-confirmation redirect), persist it now.
  const loadForUser = useCallback(
    async (activeSession: Session) => {
      const userId = activeSession.user.id;
      const displayName = draftRef.current.selfName || activeSession.user.email?.split('@')[0] || 'You';
      let acct = (await treeService.getAccount(userId)) ?? (await treeService.ensureAccount(userId, displayName));

      const pendingUsername = draftRef.current.pendingUsername?.trim();
      if (pendingUsername && !acct.username) {
        try {
          acct = await accountService.setUsername(pendingUsername);
          setDraftState((prev) => {
            const next = { ...prev, pendingUsername: undefined };
            storeDraft(next);
            return next;
          });
        } catch (e) {
          console.warn('[tomora] pending username set failed', e);
        }
      }
      setAccount(acct);

      let bundle = await treeService.loadMyTreeBundle(userId);
      if (!bundle && draftRef.current.lovedOneName.trim()) {
        bundle = await treeService.createInitialTree({
          accountId: userId,
          selfName: draftRef.current.selfName,
          lovedOneName: draftRef.current.lovedOneName,
          relationshipType: draftRef.current.lovedOneRelationship,
          isRemembered: draftRef.current.lovedOneIsRemembered,
        });
        clearStoredDraft();
      }
      applyBundle(bundle);

      const pendingClaim = draftRef.current.pendingClaimCode?.trim();
      if (pendingClaim) {
        try {
          await inviteService.claimNode(pendingClaim);
          setDraftState((prev) => {
            const next = { ...prev, pendingClaimCode: undefined };
            storeDraft(next);
            return next;
          });
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
    },
    [applyBundle],
  );

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

      // Hydrate on cold start and after sign-in (e.g. email-confirmation redirect).
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        try {
          await loadForUser(newSession);
        } catch (e) {
          console.warn('[tomora] auth hydrate failed', e);
        } finally {
          if (mounted) setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [applyBundle, loadForUser]);

  const setDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraftState((prev) => {
      const next = { ...prev, ...patch };
      storeDraft(next);
      return next;
    });
  }, []);

  const signUpAndStart = useCallback<AppStateValue['signUpAndStart']>(
    async (email, password, username) => {
      const normalized = username.trim().toLowerCase();
      const usernameErr = validateUsername(normalized);
      if (usernameErr) throw new Error(usernameErr);

      setDraftState((prev) => {
        const next = { ...prev, pendingUsername: normalized };
        storeDraft(next);
        return next;
      });

      const result = await authService.signUpWithEmail(email, password, normalized);
      if (!result.session) {
        // Email confirmation required — username is kept in draft until hydrate.
        return { needsEmailConfirmation: true };
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
    await authService.signOut();
    clearStoredDraft();
    setSession(null);
    setAccount(null);
    setTree(null);
    setNodes([]);
    setRelationships([]);
    setMemories([]);
    setSuggestedEdits([]);
    setNotifications([]);
    setDraftState(emptyDraft);
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
    async ({ name, relationshipType, isRemembered, tags }) => {
      if (!tree || !account) throw new Error('No tree or account loaded.');
      const selfNode =
        nodes.find((n) => n.ownerAccountId === account.id) ??
        nodes.find((n) => n.status === 'claimed') ??
        nodes[0];
      if (!selfNode) throw new Error('No anchor node to connect to.');
      const { node, relationship } = await treeService.addRelative({
        treeId: tree.id,
        accountId: account.id,
        fromNodeId: selfNode.id,
        name,
        relationshipType,
        isRemembered,
        tags,
      });
      setNodes((prev) => [...prev, node]);
      setRelationships((prev) => [...prev, relationship]);
      return node;
    },
    [account, nodes, tree],
  );

  const updateRelationshipType = useCallback<AppStateValue['updateRelationshipType']>(
    async (relationshipId, relationshipType) => {
      const updated = await treeService.updateRelationshipType(relationshipId, relationshipType);
      setRelationships((prev) => prev.map((r) => (r.id === relationshipId ? updated : r)));
    },
    [],
  );

  const createRelationship = useCallback<AppStateValue['createRelationship']>(
    async ({ fromNodeId, toNodeId, relationshipType }) => {
      if (!tree || !account) throw new Error('No tree or account loaded.');
      const created = await treeService.createRelationship({
        treeId: tree.id,
        accountId: account.id,
        fromNodeId,
        toNodeId,
        relationshipType,
      });
      setRelationships((prev) => [...prev, created]);
    },
    [tree, account],
  );

  const deleteRelationship = useCallback<AppStateValue['deleteRelationship']>(async (relationshipId) => {
    await treeService.deleteRelationship(relationshipId);
    setRelationships((prev) => prev.filter((r) => r.id !== relationshipId));
  }, []);

  const deleteNode = useCallback<AppStateValue['deleteNode']>(async (nodeId) => {
    await treeService.deleteNode(nodeId);
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setRelationships((prev) => prev.filter((r) => r.fromNodeId !== nodeId && r.toNodeId !== nodeId));
    setMemories((prev) => prev.filter((m) => m.nodeId !== nodeId));
    setSuggestedEdits((prev) => prev.filter((e) => e.targetNodeId !== nodeId));
  }, []);

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

  const claimNode = useCallback<AppStateValue['claimNode']>(
    async (code, password) => {
      const result = await inviteService.claimNode(code, password);
      if (session) await loadForUser(session);
      return result;
    },
    [session, loadForUser],
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

  const createMemory = useCallback<AppStateValue['createMemory']>(
    async (input) => {
      if (!tree || !account) throw new Error('No tree or account loaded.');
      const memory = await memoryService.createMemory({
        familyTreeId: tree.id,
        accountId: account.id,
        ...input,
      });
      setMemories((prev) => [memory, ...prev]);
      return memory;
    },
    [account, tree],
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
    },
    [memories],
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

  const mediaUsageBytes = useMemo(
    () =>
      memories.reduce(
        (sum, m) => (m.createdByAccountId === account?.id ? sum + (m.mediaSizeBytes ?? 0) : sum),
        0,
      ),
    [memories, account?.id],
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

  const getNode = useCallback((id: string) => nodes.find((n) => n.id === id), [nodes]);
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
      const selfNode = nodes.find((n) => n.ownerAccountId === account?.id);
      return pickPrimaryRelationship(relationships, id, selfNode?.id);
    },
    [relationships, nodes, account?.id],
  );
  const getRelationshipsForNode = useCallback(
    (id: string) => relationships.filter((r) => r.toNodeId === id || r.fromNodeId === id),
    [relationships],
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
      draft,
      setDraft,
      signUpAndStart,
      signInAndLoad,
      resetAll,
      updateAccountSettings,
      setUsername,
      updatePublicProfile,
      updateEmail,
      updatePassword,
      requestAccountDeletion,
      undoAccountDeletion,
      addRelative,
      updateRelationshipType,
      createRelationship,
      deleteRelationship,
      deleteNode,
      generateNodeInvite,
      clearNodeInvite,
      claimNode,
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
      draft,
      setDraft,
      signUpAndStart,
      signInAndLoad,
      resetAll,
      updateAccountSettings,
      setUsername,
      updatePublicProfile,
      updateEmail,
      updatePassword,
      requestAccountDeletion,
      undoAccountDeletion,
      addRelative,
      updateRelationshipType,
      createRelationship,
      deleteRelationship,
      deleteNode,
      generateNodeInvite,
      clearNodeInvite,
      claimNode,
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
