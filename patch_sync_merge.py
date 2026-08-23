import re

with open('src/lib/sync.ts', 'r') as f:
    content = f.read()

old = """export async function performSyncMerge(currentToken: string, folderId: string) {
  // 1. Download database.json"""

new = """export async function performSyncMerge(currentToken: string, folderId: string) {
  // Upload images first so local transactions have GDrive IDs before merge
  await uploadImagesToDrive(currentToken, folderId);

  // 1. Download database.json"""

content = content.replace(old, new)

with open('src/lib/sync.ts', 'w') as f:
    f.write(content)
print("Patched performSyncMerge")
