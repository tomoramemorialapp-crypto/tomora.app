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
    login: 'Log in',
  },
  login: {
    prompt: 'Welcome back.',
    body: 'Log in to return to your Family Tree.',
    cta: 'Log in',
    noAccount: 'New here? Start your Family Tree',
  },
  claim: {
    prompt: 'Claim your place.',
    body: 'Someone saved a space for you. Choose how you’d like to claim your node.',
    methods: {
      code: { title: 'Invite code', subtitle: 'Paste the code from your invite link.' },
      password: { title: 'Node password', subtitle: 'Enter the password the creator gave you.' },
      qr: { title: 'Scan QR code', subtitle: 'Scan the QR code from your invitation.' },
    },
    codeLabel: 'Invite code',
    codePlaceholder: 'e.g. TOMORA-7F3A-9K2D',
    passwordLabel: 'Node password',
    passwordPlaceholder: 'Password from the creator',
    cta: 'Claim my node',
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
    reassurance: 'Nothing is public unless you choose to share it.',
    cta: 'Use recommended privacy',
    ctaChanged: 'Continue',
  },
  invite: {
    prompt: 'Would you like someone to claim their node?',
    body: 'They can claim their node and choose what to share.',
    inviteNow: 'Invite now',
    skip: 'Skip for now',
    shareTitle: 'Share your invite',
    shareMessage: 'Join our Family Tree on Tomora — a private place for our family’s memories.',
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

/** Relationship choices for the "add loved one" step, grouped by generation. */
export const relationshipChoices = [
  { id: 'mother', label: 'Mother', relationshipType: 'parent' },
  { id: 'father', label: 'Father', relationshipType: 'parent' },
  { id: 'grandparent', label: 'Grandparent', relationshipType: 'grandparent' },
  { id: 'aunt', label: 'Aunt', relationshipType: 'aunt_uncle' },
  { id: 'uncle', label: 'Uncle', relationshipType: 'aunt_uncle' },
  { id: 'sibling', label: 'Sibling', relationshipType: 'sibling' },
  { id: 'partner', label: 'Partner', relationshipType: 'partner' },
  { id: 'cousin', label: 'Cousin', relationshipType: 'cousin' },
  { id: 'child', label: 'Child', relationshipType: 'child' },
  { id: 'grandchild', label: 'Grandchild', relationshipType: 'grandchild' },
  { id: 'niece', label: 'Niece', relationshipType: 'niece_nephew' },
  { id: 'nephew', label: 'Nephew', relationshipType: 'niece_nephew' },
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
