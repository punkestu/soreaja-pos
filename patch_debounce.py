import re

with open('src/lib/sync.ts', 'r') as f:
    content = f.read()

old_trigger = """export function triggerAutoSync() {
  window.dispatchEvent(new Event('request-auto-sync'));
}"""

new_trigger = """let autoSyncTimeout: ReturnType<typeof setTimeout> | null = null;

export function triggerAutoSync(debounceMs = 3000) {
  if (autoSyncTimeout) clearTimeout(autoSyncTimeout);
  autoSyncTimeout = setTimeout(() => {
    window.dispatchEvent(new Event('request-auto-sync'));
  }, debounceMs);
}"""

content = content.replace(old_trigger, new_trigger)

with open('src/lib/sync.ts', 'w') as f:
    f.write(content)
print("Debounced auto sync")
