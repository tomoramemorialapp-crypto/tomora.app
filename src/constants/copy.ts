/**
 * Tomora UI copy library. Voice: a calm companion helping protect something
 * precious. Avoid cold technical language everywhere.
 */

import { getAnchorRelationshipChoices } from '@/lib/relationshipTaxonomy';

export const brand = {
  name: 'Tomora',
  tagline: 'Always with you.',
  oneLiner:
    'A private Family Tree for the people you love, the memories you share, and the lives that continue to guide you.',
};

export const footer = {
  clearCache: 'Clear cache to update',
  clearingCache: 'Clearing…',
};

export const copy = {
  welcome: {
    tagline: 'ALWAYS WITH YOU',
    body: 'Create a private Family Tree for the people, memories, and moments you want to keep close.',
    primaryCta: 'Start my Family Tree',
    secondaryCta: 'I was invited',
    login: 'Log in',
  },
  login: {
    prompt: 'Welcome back.',
    body: 'Log in with your email or username to return to your Family Tree.',
    cta: 'Log in',
    noAccount: 'New here? Start your Family Tree',
    forgotPassword: 'Forgot your password?',
  },
  passwordReset: {
    requestTitle: 'Reset your password',
    requestBody: 'Enter the email or username on your account. We’ll send a secure link to reset your password.',
    requestCta: 'Send reset link',
    requestError: 'Could not send the reset link. Please try again.',
    sentTitle: 'Check your email',
    sentBody: 'If an account exists for that address, a password reset link is on its way.',
    sentHint: 'The link opens Tomora and lets you choose a new password. Check spam if you don’t see it within a few minutes.',
    completeTitle: 'Choose a new password',
    completeBody: 'Your reset link is valid. Set a new password to return to your Family Tree.',
    completeCta: 'Save new password',
    completeError: 'Could not save your new password. The link may have expired.',
    expiredTitle: 'This reset link has expired',
    expiredBody: 'Password reset links are only valid for a short time. Request a new one to continue.',
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
    notMe: 'This is not me',
    needHelp: 'I need help',
    authSaved: 'Your invite is ready — we’ll continue as soon as you’re signed in.',
  },
  claimReveal: {
    title: 'You’ve joined the Family Tree.',
    body: 'Your place is now protected.',
    cta: 'View my Family Tree',
  },
  youClaim: {
    title: 'Claim a node',
    body: 'Have an invite code? Claim your place in a Family Tree.',
    enterCode: 'Enter code',
    scanQr: 'Scan QR',
  },
  transfer: {
    title: 'Transfer node ownership',
    body: 'Move {name} to another account. The original invite cannot be reused — transfers are the safe way to hand off a claimed node.',
    note: 'The new owner must sign in with the email you enter and accept the transfer within 14 days.',
    cta: 'Send transfer invite',
    rowLabel: 'Transfer node ownership',
    rowHint: 'Move to a new account',
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
    body: 'Add a loved one now. You can grow the rest later.',
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

/** Relationship choices for onboarding / add-relative — derived from the taxonomy. */
export const relationshipChoices = getAnchorRelationshipChoices();

/** Soft prompt when a child gains a second parent without a partnership edge. */
export const parentPairingCopy = {
  title: 'Connect these parents?',
  body: (parentA: string, parentB: string, child: string) =>
    `${parentA} and ${parentB} are both parents of ${child}. Would you like to show them as a couple on your Family Tree?`,
  note: 'Tomora never assumes marriage or partnership — you choose what fits your family.',
  spouses: 'Husband & wife',
  partners: 'Partners',
  formerPartner: 'Former partner',
  coParentsOnly: 'Co-parents only',
  notNow: 'Not now',
  husbandPrompt: 'Who is the husband?',
  statusPrompt: 'Partnership status',
  statusCurrent: 'Current',
  statusSeparated: 'Separated',
  statusDivorced: 'Divorced',
  statusWidowed: 'Widowed',
  statusUnknown: 'Unknown',
  separatedNote: 'They will still appear as connected for your tree layout; you can update details anytime.',
  confirm: 'Connect parents',
  preview: (from: string, to: string, type: string) =>
    `This will link ${from} and ${to} as ${type === 'spouse' ? 'spouses' : 'partners'}.`,
};

/** Warm copy for the disconnected / unclear-connection bridge prompt. */
export const bridgePrompt = {
  title: 'How is this person connected to your Family Tree?',
  body: 'We can trace the path now, or save them with an Unknown connection and complete it later.',
  indirectNote: (label: string) =>
    `Tomora will gently place an Unknown link between you and your ${label.toLowerCase()} so the branches connect correctly. You can complete it anytime.`,
  unknownNote:
    'They’ll be saved with an Unknown connection and tagged so you can find and complete it later.',
  trace: 'Trace connection now',
  saveUnknown: 'Save with Unknown link',
};

/** Human-friendly visibility labels. */
export const visibilityLabels: Record<string, string> = {
  private: 'Private',
  selected_people: 'Selected people',
  family_tree: 'Family Tree',
  invite_link: 'Invite link',
  public: 'Public',
};
