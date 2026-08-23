import re

with open('src/lib/sync.ts', 'r') as f:
    content = f.read()

old_trigger = """export async function triggerAutoSync() {
  try {
    const token = await getAccessToken();
    if (!token) return; // Not logged in or no cached token
    const folderId = localStorage.getItem('sync_folder_id');
    if (folderId) {
      await performSyncMerge(token, folderId);
    } else {
      const sessionFolderId = await performSyncUp(token);
      localStorage.setItem('sync_folder_id', sessionFolderId);
    }
    // Update last sync time
    localStorage.setItem('last_sync', new Date().toLocaleString());
    window.dispatchEvent(new Event('sync-complete'));
  } catch (e) {
    console.error('Auto sync failed', e);
  }
}"""
new_trigger = """export function triggerAutoSync() {
  window.dispatchEvent(new Event('request-auto-sync'));
}"""
content = content.replace(old_trigger, new_trigger)

with open('src/lib/sync.ts', 'w') as f:
    f.write(content)
print("Patched sync.ts triggerAutoSync")
