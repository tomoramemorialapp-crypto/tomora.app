import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type {
  Account,
  FamilyTree,
  FamilyNode,
  Memory,
  Relationship,
  RelationshipType,
  VisibilityLevel,
} from '@/types/models';
import { createId } from '@/lib/relationshipUtils';

type PrivacyPreset = 'recommended' | 'custom';

interface OnboardingDraft {
  selfName: string;
  lovedOneName: string;
  lovedOneRelationship: RelationshipType;
  lovedOneIsRemembered: boolean;
}

interface AppStateValue {
  account: Account | null;
  tree: FamilyTree | null;
  nodes: FamilyNode[];
  relationships: Relationship[];
  memories: Memory[];
  isOnboarded: boolean;
  draft: OnboardingDraft;

  // onboarding
  setDraft: (patch: Partial<OnboardingDraft>) => void;
  commitOnboarding: (override?: Partial<OnboardingDraft>) => { selfNodeId: string; lovedOneNodeId: string };
  completeOnboarding: () => void;
  resetAll: () => void;

  // memories
  addTextMemory: (input: {
    nodeId: string;
    title?: string;
    body: string;
    visibility: VisibilityLevel;
  }) => Memory;

  // selectors
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

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [tree, setTree] = useState<FamilyTree | null>(null);
  const [nodes, setNodes] = useState<FamilyNode[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [draft, setDraftState] = useState<OnboardingDraft>(emptyDraft);

  const setDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraftState((prev) => ({ ...prev, ...patch }));
  }, []);

  const commitOnboarding = useCallback((override?: Partial<OnboardingDraft>) => {
    // Merge any explicit values so a commit in the same handler as setDraft
    // doesn't read stale state.
    const d: OnboardingDraft = { ...draft, ...override };
    if (override) setDraftState(d);

    const ts = new Date().toISOString();
    const accountId = createId('account');
    const treeId = createId('tree');
    const selfNodeId = createId('node');
    const lovedOneNodeId = createId('node');

    const newAccount: Account = {
      id: accountId,
      displayName: d.selfName.trim() || 'You',
      createdAt: ts,
      updatedAt: ts,
    };
    const newTree: FamilyTree = {
      id: treeId,
      name: 'My Family Tree',
      createdByAccountId: accountId,
      defaultVisibility: 'family_tree',
      publicSharingEnabled: false,
      createdAt: ts,
      updatedAt: ts,
    };
    const selfNode: FamilyNode = {
      id: selfNodeId,
      familyTreeId: treeId,
      ownerAccountId: accountId,
      displayName: d.selfName.trim() || 'You',
      status: 'claimed',
      isLiving: true,
      defaultVisibility: 'family_tree',
      createdAt: ts,
      updatedAt: ts,
    };
    const lovedOneNode: FamilyNode = {
      id: lovedOneNodeId,
      familyTreeId: treeId,
      displayName: d.lovedOneName.trim() || 'Loved one',
      status: d.lovedOneIsRemembered ? 'managed' : 'placeholder',
      isLiving: !d.lovedOneIsRemembered,
      defaultVisibility: 'family_tree',
      createdAt: ts,
      updatedAt: ts,
    };
    const relationship: Relationship = {
      id: createId('rel'),
      familyTreeId: treeId,
      fromNodeId: selfNodeId,
      toNodeId: lovedOneNodeId,
      relationshipType: d.lovedOneRelationship,
      status: 'approved',
      visibility: 'family_tree',
      createdByAccountId: accountId,
      createdAt: ts,
      updatedAt: ts,
    };

    setAccount(newAccount);
    setTree(newTree);
    setNodes([selfNode, lovedOneNode]);
    setRelationships([relationship]);
    setMemories([]);

    return { selfNodeId, lovedOneNodeId };
  }, [draft]);

  const completeOnboarding = useCallback(() => setIsOnboarded(true), []);

  const resetAll = useCallback(() => {
    setAccount(null);
    setTree(null);
    setNodes([]);
    setRelationships([]);
    setMemories([]);
    setIsOnboarded(false);
    setDraftState(emptyDraft);
  }, []);

  const addTextMemory = useCallback<AppStateValue['addTextMemory']>(
    ({ nodeId, title, body, visibility }) => {
      const ts = new Date().toISOString();
      const memory: Memory = {
        id: createId('memory'),
        familyTreeId: tree?.id ?? 'tree_local',
        nodeId,
        createdByAccountId: account?.id ?? 'account_local',
        type: 'text',
        title: title?.trim() || undefined,
        body: body.trim(),
        visibility,
        approvalStatus: 'approved',
        createdAt: ts,
        updatedAt: ts,
      };
      setMemories((prev) => [memory, ...prev]);
      return memory;
    },
    [account?.id, tree?.id],
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
      account,
      tree,
      nodes,
      relationships,
      memories,
      isOnboarded,
      draft,
      setDraft,
      commitOnboarding,
      completeOnboarding,
      resetAll,
      addTextMemory,
      getNode,
      getMemoriesForNode,
      getRelationshipForNode,
    }),
    [
      account,
      tree,
      nodes,
      relationships,
      memories,
      isOnboarded,
      draft,
      setDraft,
      commitOnboarding,
      completeOnboarding,
      resetAll,
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
