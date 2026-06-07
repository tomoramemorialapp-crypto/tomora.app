import {
  formatDateValue,
  formatGenderSex,
  formatPersonName,
  formatPlace,
} from '@/lib/profile';
import type {
  DateValue,
  GenderSexField,
  NodeProfile,
  NodeProfileHistoryFields,
  PersonName,
  PlaceReference,
  PreviousName,
} from '@/types/profile';
import { PROFILE_FIELD_KEYS, PROFILE_FIELD_LABELS, type ProfileFieldKey } from '@/types/profile';

export interface PublicLifeField {
  key: ProfileFieldKey;
  label: string;
  value: string;
}

/** Format Life Profile fields the owner marked `public` for the shareable page. */
export function publicLifeProfileFields(profile: NodeProfile): PublicLifeField[] {
  const out: PublicLifeField[] = [];

  for (const key of PROFILE_FIELD_KEYS) {
    const field = profile[key];
    if (!field || field.visibility !== 'public') continue;

    const label = PROFILE_FIELD_LABELS[key];
    let value = '';

    switch (key) {
      case 'profilePhoto':
        continue;
      case 'name':
        value = formatPersonName(field.value as PersonName);
        break;
      case 'alternateNames':
        value = ((field.value as string[] | undefined) ?? []).join(', ');
        break;
      case 'previousNames':
        value = ((field.value as PreviousName[] | undefined) ?? [])
          .map((n) => n.name)
          .filter(Boolean)
          .join(', ');
        break;
      case 'dateOfBirth':
      case 'dateOfDeath':
        value = formatDateValue(field.value as DateValue);
        break;
      case 'placeOfBirth':
      case 'placeOfDeath':
        value = formatPlace(field.value as PlaceReference, false);
        break;
      case 'genderSex':
        value = formatGenderSex(field.value as GenderSexField);
        break;
      case 'languages':
        value = ((field.value as string[] | undefined) ?? []).join(', ');
        break;
      case 'notesHistory': {
        const h = field.value as NodeProfileHistoryFields;
        const bits = [h?.occupationOrRole?.join(', '), h?.lifeHistory, h?.notes].filter(Boolean);
        value = bits.join('\n\n');
        break;
      }
      default:
        value = String(field.value ?? '');
    }

    if (value.trim()) out.push({ key, label, value: value.trim() });
  }

  return out;
}
