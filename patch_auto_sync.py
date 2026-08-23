import re

with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

old_handle = """    if (uploadPhaseRef.current === 'give') {
       await db.transactions.update(tx.id, { 'checklists.give.doc_image_id': imgId });
    } else {
       await db.transactions.update(tx.id, { 'checklists.take.doc_take_image_id': imgId });
    }
  }"""
new_handle = """    if (uploadPhaseRef.current === 'give') {
       await db.transactions.update(tx.id, { 'checklists.give.doc_image_id': imgId });
    } else {
       await db.transactions.update(tx.id, { 'checklists.take.doc_take_image_id': imgId });
    }
    
    // Auto-sync so the image is immediately uploaded to Google Drive
    triggerAutoSync();
  }"""
content = content.replace(old_handle, new_handle)

with open('src/pages/TransactionDetail.tsx', 'w') as f:
    f.write(content)
print("Patched TransactionDetail.tsx for auto-sync on image upload")
