import { removeMedia } from '@/lib/media';
import { extractStoragePath, isAccountOwnedStoragePath } from '@/lib/storagePaths';

export { extractStoragePath, isAccountOwnedStoragePath } from '@/lib/storagePaths';

/** Delete stored media objects owned by this account. Ignores external http(s) URLs. */
export async function removeAccountStorage(
  accountId: string,
  ...references: (string | null | undefined)[]
): Promise<void> {
  const paths = new Set<string>();
  for (const ref of references) {
    const path = extractStoragePath(ref);
    if (path && isAccountOwnedStoragePath(path, accountId)) paths.add(path);
  }
  await Promise.all([...paths].map((path) => removeMedia(path)));
}

/** Delete the previous object when a stored reference is cleared or replaced. */
export async function removeReplacedAccountStorage(
  accountId: string,
  previousRef: string | null | undefined,
  nextRef: string | null | undefined,
): Promise<void> {
  const previous = extractStoragePath(previousRef);
  const next = extractStoragePath(nextRef);
  if (!previous || previous === next) return;
  await removeAccountStorage(accountId, previous);
}
