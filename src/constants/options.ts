import type { Option } from '@/components/ui/Dropdown';

/** Common spoken languages for the Life Profile (free "Other" still allowed). */
export const WORLD_LANGUAGES: string[] = [
  'English', 'Filipino', 'Tagalog', 'Cebuano', 'Ilocano', 'Hiligaynon', 'Bicolano', 'Waray',
  'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Dutch', 'Greek', 'Polish', 'Romanian',
  'Russian', 'Ukrainian', 'Turkish', 'Arabic', 'Hebrew', 'Persian', 'Hindi', 'Urdu', 'Bengali',
  'Punjabi', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Malayalam', 'Kannada', 'Nepali',
  'Mandarin Chinese', 'Cantonese', 'Japanese', 'Korean', 'Vietnamese', 'Thai', 'Khmer', 'Lao',
  'Burmese', 'Indonesian', 'Malay', 'Javanese', 'Swahili', 'Hausa', 'Yoruba', 'Amharic', 'Zulu',
  'Afrikaans', 'Sign Language',
];

/** Country list for "current country" tags and place fields. */
export const COUNTRIES: string[] = [
  'Philippines', 'United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'United Kingdom',
  'Ireland', 'France', 'Germany', 'Spain', 'Portugal', 'Italy', 'Netherlands', 'Belgium',
  'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Greece',
  'Russia', 'Ukraine', 'Turkey', 'Saudi Arabia', 'United Arab Emirates', 'Israel', 'Egypt',
  'Nigeria', 'Kenya', 'South Africa', 'Ethiopia', 'Morocco', 'India', 'Pakistan', 'Bangladesh',
  'Sri Lanka', 'Nepal', 'China', 'Hong Kong', 'Taiwan', 'Japan', 'South Korea', 'Vietnam',
  'Thailand', 'Cambodia', 'Laos', 'Myanmar', 'Malaysia', 'Singapore', 'Indonesia', 'Australia',
  'New Zealand',
];

/** Gender / identity options. "Other" is handled by the dropdown's free text. */
export const GENDER_OPTIONS: Option[] = [
  { value: 'Woman', label: 'Woman' },
  { value: 'Man', label: 'Man' },
  { value: 'Non-binary', label: 'Non-binary' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

/** Sex options. "Other" is handled by the dropdown's free text. */
export const SEX_OPTIONS: Option[] = [
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
  { value: 'Intersex', label: 'Intersex' },
];

/** Built-in family tags offered before any custom ones. */
export const SUGGESTED_TAGS: string[] = ["Father's side", "Mother's side"];

export const toOptions = (items: string[]): Option[] => items.map((i) => ({ value: i, label: i }));
