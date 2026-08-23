import re

with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

# For the Give phase
old_give_img = """                {tx.checklists.give.doc_image_id ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                    <CheckCircle2 className="w-5 h-5" /> Image Saved
                  </div>
                ) : ("""

new_give_img = """                {tx.checklists.give.doc_image_id ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                      <CheckCircle2 className="w-5 h-5" /> Image Saved
                    </div>
                    {tx.checklists.give.doc_gdrive_link && (
                      <a href={tx.checklists.give.doc_gdrive_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                        View in Google Drive
                      </a>
                    )}
                  </div>
                ) : ("""
content = content.replace(old_give_img, new_give_img)

# For the Take phase
old_take_img = """                {tx.checklists.take.doc_take_image_id ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                    <CheckCircle2 className="w-5 h-5" /> Image Saved
                  </div>
                ) : ("""

new_take_img = """                {tx.checklists.take.doc_take_image_id ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                      <CheckCircle2 className="w-5 h-5" /> Image Saved
                    </div>
                    {tx.checklists.take.doc_take_gdrive_link && (
                      <a href={tx.checklists.take.doc_take_gdrive_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                        View in Google Drive
                      </a>
                    )}
                  </div>
                ) : ("""
content = content.replace(old_take_img, new_take_img)

with open('src/pages/TransactionDetail.tsx', 'w') as f:
    f.write(content)
print("Patched TransactionDetail.tsx with GDrive links")
