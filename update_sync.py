import re

with open('src/lib/sync.ts', 'r') as f:
    content = f.read()

new_func = """
import { getAccessToken } from '../auth';

export async function triggerAutoSync() {
  try {
    const token = await getAccessToken();
    if (!token) return; // Not logged in or no cached token
    const folderId = localStorage.getItem('sync_folder_id');
    if (folderId) {
      await performSyncMerge(token, folderId);
      await uploadImagesToDrive(token, folderId);
    } else {
      const sessionFolderId = await performSyncUp(token);
      await uploadImagesToDrive(token, sessionFolderId);
      localStorage.setItem('sync_folder_id', sessionFolderId);
    }
    // Update last sync time
    localStorage.setItem('last_sync', new Date().toLocaleString());
    window.dispatchEvent(new Event('sync-complete'));
  } catch (e) {
    console.error('Auto sync failed', e);
  }
}
"""

# Insert import at the top
if "import { getAccessToken }" not in content:
    content = "import { getAccessToken } from '../auth';\n" + content

# Insert func at the bottom
if "triggerAutoSync" not in content:
    content += "\n" + new_func

with open('src/lib/sync.ts', 'w') as f:
    f.write(content)
