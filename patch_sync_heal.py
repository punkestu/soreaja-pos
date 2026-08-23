import re

with open('src/lib/sync.ts', 'r') as f:
    content = f.read()

old_upload = """  const imagesFolderId = await getOrCreateFolder(currentToken, 'Images', sessionFolderId);
  for (const img of images) {
    if (img.gdrive_id) continue; // Already uploaded
    const metadata = {"""

new_upload = """  const imagesFolderId = await getOrCreateFolder(currentToken, 'Images', sessionFolderId);
  for (const img of images) {
    if (img.gdrive_id) {
      // Heal transaction if it missed the link
      const tx = await db.transactions.get(img.transaction_id);
      if (tx) {
        let updated = false;
        if (tx.checklists.give.doc_image_id === img.id && !tx.checklists.give.doc_gdrive_link) {
          try {
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${img.gdrive_id}?fields=webViewLink`, {
              headers: { Authorization: `Bearer ${currentToken}` }
            });
            if (res.ok) {
              const data = await res.json();
              tx.checklists.give.doc_gdrive_id = img.gdrive_id;
              tx.checklists.give.doc_gdrive_link = data.webViewLink;
              updated = true;
            }
          } catch(e) {}
        }
        if (tx.checklists.take.doc_take_image_id === img.id && !tx.checklists.take.doc_take_gdrive_link) {
          try {
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${img.gdrive_id}?fields=webViewLink`, {
              headers: { Authorization: `Bearer ${currentToken}` }
            });
            if (res.ok) {
              const data = await res.json();
              tx.checklists.take.doc_take_gdrive_id = img.gdrive_id;
              tx.checklists.take.doc_take_gdrive_link = data.webViewLink;
              updated = true;
            }
          } catch(e) {}
        }
        if (updated) {
          await db.transactions.put(tx);
        }
      }
      continue;
    }
    
    const metadata = {"""
content = content.replace(old_upload, new_upload)

with open('src/lib/sync.ts', 'w') as f:
    f.write(content)
print("Patched sync.ts healing")
