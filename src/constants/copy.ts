/**
 * Tomora UI copy library. Voice: a calm companion helping protect something
 * precious. Avoid cold technical language everywhere.
 */

export const brand = {
  name: 'Tomora',
  tagline: 'Always with you.',
  oneLiner:
    'A private Family Tree for the people you love, the memories you share, and the lives that continue to guide you.',
};

export const copy = {
  welcome: {
    tagline: 'Always with you.',
    body: 'Create a private Family Tree for the people, memories, and moments you want to keep close.',
    primaryCta: 'Start my Family Tree',
    secondaryCta: 'I was invited',
  },
  choosePath: {
    prompt: 'What brings you to Tomora today?',
    cards: [
      { id: 'start_tree', title: 'Start a Family Tree', subtitle: 'Begin with you and one loved one.', enabled: true },
      { id: 'claim_node', title: 'Claim my node', subtitle: 'Someone saved a place for you.', enabled: true },
      { id: 'create_memorial', title: 'Create a memorial', subtitle: 'Keep a light on for someone.', enabled: false },
      { id: 'create_occasion', title: 'Create an occasion', subtitle: 'Gather family for a moment.', enabled: false },
    ],
  },
  addSelf: {
    prompt: 'Let’s begin with you.',
    body: 'You are the first light in this Family Tree.',
    cta: 'Place me in my Family Tree',
  },
  addLovedOne: {
    prompt: 'Who should stay close to you first?',
    body: 'Add one loved one now. You can grow the rest later.',
    namePrompt: 'What should we call them?',
    cta: 'Add to my Family Tree',
  },
  reveal: {
    title: 'Your Family Tree has begun.',
    body: 'Every branch can hold stories, occasions, and memories.',
    primaryCta: 'Continue',
    secondaryCta: 'Add another person',
  },
  save: {
    prompt: 'Keep this safe.',
    body: 'Save your Family Tree so it stays protected and always with you.',
    google: 'Continue with Google',
    apple: 'Continue with Apple',
    email: 'Continue with email',
  },
  privacy: {
    prompt: 'Who can see your Family Tree for now?',
    recommended: 'Invite-only family, public off.',
    reassurance: 'Nothing is public unless you choose to share it.',
    cta: 'Use recommended privacy',
    secondary: 'Customize',
  },
  invite: {
    prompt: 'Would you like someone to claim their node?',
    body: 'They can claim their node and choose what to share.',
    inviteNow: 'Invite now',
    copyLink: 'Copy private link',
    skip: 'Skip for now',
  },
  dashboard: {
    title: 'Welcome to Tomora.',
    subtitle: 'Your Family Tree has begun.',
  },
  emptyMemories: {
    title: 'No memories yet.',
    body: 'Add a photo, story, voice note, or video to keep this light close.',
  },
  privateContent: 'This memory is kept private by the family.',
} as const;

/** Relationship choices for the "add loved one" step. */
export const relationshipChoices = [
  { id: 'parent', label: 'Mother', relationshipType: 'parent' },
  { id: 'father', label: 'Father', relationshipType: 'parent' },
  { id: 'grandparent', label: 'Grandparent', relationshipType: 'grandparent' },
  { id: 'sibling', label: 'Sibling', relationshipType: 'sibling' },
  { id: 'partner', label: 'Partner', relationshipType: 'partner' },
  { id: 'child', label: 'Child', relationshipType: 'child' },
  { id: 'remembered', label: 'Someone remembered', relationshipType: 'other' },
  { id: 'pet', label: 'Pet', relationshipType: 'pet' },
] as const;

/** Human-friendly visibility labels. */
export const visibilityLabels: Record<string, string> = {
  private: 'Private',
  selected_people: 'Selected people',
  family_tree: 'Family Tree',
  invite_link: 'Invite link',
  public: 'Public',
};
