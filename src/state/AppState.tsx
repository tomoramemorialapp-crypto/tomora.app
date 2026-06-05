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
  Memory,
  Relationship,
  RelationshipType,
  VisibilityLevel,
} from '@/types/models';
import type { NodeProfile, ProfileChangeLog, ProfileFieldKey, SuggestedEdit } from '@/types/profile';
import { supabase } from '@/lib/supabase';
import * as authService from '@/services/authService';
import * as treeService from '@/services/treeService';
import * as memoryService from '@/services/memoryService';
import * as profileService from '@/services/profileService';
import type { ChangeLogEntryInput } from '@/services/profileService';

interface OnboardingDraft {
  selfName: string;
  lovedOneName: string;
  lovedOneRelationship: RelationshipType;
  lovedOneIsRemembered: boolean;
}

interface AppStateValue {
  loading: boolean;
  session: Session | null;
  account: Account | null;
  tree: FamilyTree | null;
  nodes: FamilyNode[];
  relationships: Relationship[];
  memories: Memory[];
  suggestedEdits: SuggestedEdit[];
  isOnboarded: boolean;
  draft: OnboardingDraft;

  setDraft: (patch: Partial<OnboardingDraft>) => void;

  // auth + persistence
  signUpAndStart: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signInAndLoad: (email: string, password: string) => Promise<void>;
  resetAll: () => Promise<void>;

  addRelative: (input: {
    name: string;
    relationshipType: RelationshipType;
    isRemembered: boolean;
    tags?: string[];
  }) => Promise<FamilyNode>;

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
  getSuggestedEditsForNode: (nodeId: string) => SuggestedEdit[];

  addTextMemory: (input: {
    nodeId: string;
    title?: string;
    body: string;
    visibility: VisibilityLevel;
  }) => Promise<Memory>;

  getNode: (id: string) => FamilyNode | undefined;
  getMemoriesForNode: (id: string) => Memory[];
  getRelationshipForNode: (id: string) => Relationship | undefined;
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
      const acct = (await treeService.getAccount(userId)) ?? (await treeService.ensureAccount(userId, displayName));
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
    },
    [applyBundle],
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const current = await authService.getSession();
        if (!mounted) return;
        setSession(current);
        if (current) await loadForUser(current);
      } catch (e) {
        console.warn('[tomora] initial load failed', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setAccount(null);
        applyBundle(null);
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
    async (email, password) => {
      const result = await authService.signUpWithEmail(email, password);
      if (!result.session) {
        // email confirmation required — draft is persisted and will be saved
        // automatically once the user confirms and returns.
        return { needsEmailConfirmation: true };
      }
      setSession(result.session);
      await loadForUser(result.session);
      return { needsEmailConfirmation: false };
    },
    [loadForUser],
  );

  const signInAndLoad = useCallback<AppStateValue['signInAndLoad']>(
    async (email, password) => {
      const s = await authService.signInWithEmail(email, password);
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
    setDraftState(emptyDraft);
  }, []);

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

  const getSuggestedEditsForNode = useCallback(
    (nodeId: string) => suggestedEdits.filter((e) => e.targetNodeId === nodeId),
    [suggestedEdits],
  );

  const addTextMemory = useCallback<AppStateValue['addTextMemory']>(
    async ({ nodeId, title, body, visibility }) => {
      if (!tree || !account) throw new Error('No tree or account loaded.');
      const memory = await memoryService.addTextMemory({
        familyTreeId: tree.id,
        nodeId,
        accountId: account.id,
        title,
        body,
        visibility,
      });
      setMemories((prev) => [memory, ...prev]);
      return memory;
    },
    [account, tree],
  );

  const getNode = useCallback((id: string) => nodes.find((n) => n.id === id), [nodes]);
  const getMemoriesForNode = useCallback(
    (id: string) => memories.filter((m) => m.nodeId === id),
    [memories],
  );
  const getRelationshipForNode = useCallback(
    (id: string) => relationships.find((r) => r.toNodeId === id || r.fromNodeId === id),
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
      suggestedEdits,
      isOnboarded: !!session && !!tree,
      draft,
      setDraft,
      signUpAndStart,
      signInAndLoad,
      resetAll,
      addRelative,
      updateTreePrivacy,
      updateNodeProfile,
      submitSuggestedEdit,
      reviewSuggestedEdit,
      fetchChangeLog,
      getSuggestedEditsForNode,
      addTextMemory,
      getNode,
      getMemoriesForNode,
      getRelationshipForNode,
    }),
    [
      loading,
      session,
      account,
      tree,
      nodes,
      relationships,
      memories,
      suggestedEdits,
      draft,
      setDraft,
      signUpAndStart,
      signInAndLoad,
      resetAll,
      addRelative,
      updateTreePrivacy,
      updateNodeProfile,
      submitSuggestedEdit,
      reviewSuggestedEdit,
      fetchChangeLog,
      getSuggestedEditsForNode,
      addTextMemory,
      getNode,
      getMemoriesForNode,
      getRelationshipForNode,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
