import re

with open('src/lib/sync.ts', 'r') as f:
    content = f.read()

# Modify uploadImagesToDrive
old_upload = """    try {
      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` },
        body: form
      });
      if (res.ok) {
        const data = await res.json();
        await db.images.update(img.id, { gdrive_id: data.id });
      }
    } catch(e) { console.error('Image upload failed', e); }"""

new_upload = """    try {
      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` },
        body: form
      });
      if (res.ok) {
        const data = await res.json();
        await db.images.update(img.id, { gdrive_id: data.id });
        
        const tx = await db.transactions.get(img.transaction_id);
        if (tx) {
          let updated = false;
          if (tx.checklists.give.doc_image_id === img.id) {
            tx.checklists.give.doc_gdrive_id = data.id;
            tx.checklists.give.doc_gdrive_link = data.webViewLink;
            updated = true;
          }
          if (tx.checklists.take.doc_take_image_id === img.id) {
            tx.checklists.take.doc_take_gdrive_id = data.id;
            tx.checklists.take.doc_take_gdrive_link = data.webViewLink;
            updated = true;
          }
          if (updated) {
            await db.transactions.put(tx);
          }
        }
      }
    } catch(e) { console.error('Image upload failed', e); }"""
content = content.replace(old_upload, new_upload)

# Modify performSyncUp to call uploadImagesToDrive before constructing data
old_syncup = """  // Gather data
  const data = {"""
new_syncup = """  // Upload images first so transactions have GDrive IDs
  await uploadImagesToDrive(currentToken, sessionFolderId);
  
  // Gather data
  const data = {"""
content = content.replace(old_syncup, new_syncup)

# Modify performSyncMerge to call uploadImagesToDrive before merging
old_syncmerge = """  const remoteData = await downloadJson(currentToken, fileId);

  // 2. Merge data"""
new_syncmerge = """  // Upload images first so local transactions have GDrive IDs before merge
  await uploadImagesToDrive(currentToken, folderId);
  
  const remoteData = await downloadJson(currentToken, fileId);

  // 2. Merge data"""
content = content.replace(old_syncmerge, new_syncmerge)

# Modify performSyncMerge to remove the later uploadImagesToDrive
old_syncmerge_post = """  await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${currentToken}` },
    body: form
  });
  
  // 5. Images upload
  await uploadImagesToDrive(currentToken, folderId);

  // 6. Update spreadsheet"""
new_syncmerge_post = """  await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${currentToken}` },
    body: form
  });

  // 6. Update spreadsheet"""
content = content.replace(old_syncmerge_post, new_syncmerge_post)

# Modify triggerAutoSync to remove the redundant uploadImagesToDrive
old_auto = """    const folderId = localStorage.getItem('sync_folder_id');
    if (folderId) {
      await performSyncMerge(token, folderId);
      await uploadImagesToDrive(token, folderId);
    } else {
      const sessionFolderId = await performSyncUp(token);
      await uploadImagesToDrive(token, sessionFolderId);
      localStorage.setItem('sync_folder_id', sessionFolderId);
    }"""
new_auto = """    const folderId = localStorage.getItem('sync_folder_id');
    if (folderId) {
      await performSyncMerge(token, folderId);
    } else {
      const sessionFolderId = await performSyncUp(token);
      localStorage.setItem('sync_folder_id', sessionFolderId);
    }"""
content = content.replace(old_auto, new_auto)

with open('src/lib/sync.ts', 'w') as f:
    f.write(content)
print("Patched sync.ts")
