import re

with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

# Replace Give Image Logic
old_give = """                {tx.checklists.give.doc_image_id ? (
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

new_give = """                {tx.checklists.give.doc_gdrive_link ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                      <CheckCircle2 className="w-5 h-5" /> Backed Up to GDrive
                    </div>
                    <a href={tx.checklists.give.doc_gdrive_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      View Document
                    </a>
                  </div>
                ) : tx.checklists.give.doc_image_id ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-amber-600 font-medium text-sm">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Uploading to Drive...
                    </div>
                  </div>
                ) : ("""
content = content.replace(old_give, new_give)

# Replace Take Image Logic
old_take = """                {tx.checklists.take.doc_take_image_id ? (
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

new_take = """                {tx.checklists.take.doc_take_gdrive_link ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                      <CheckCircle2 className="w-5 h-5" /> Backed Up to GDrive
                    </div>
                    <a href={tx.checklists.take.doc_take_gdrive_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      View Document
                    </a>
                  </div>
                ) : tx.checklists.take.doc_take_image_id ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-amber-600 font-medium text-sm">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Uploading to Drive...
                    </div>
                  </div>
                ) : ("""
content = content.replace(old_take, new_take)

# Ensure RefreshCw is imported
if 'RefreshCw' not in content:
    content = content.replace("import { ArrowLeft, Edit2, Download, Printer, CheckCircle2, Camera } from 'lucide-react';",
                              "import { ArrowLeft, Edit2, Download, Printer, CheckCircle2, Camera, RefreshCw } from 'lucide-react';")

with open('src/pages/TransactionDetail.tsx', 'w') as f:
    f.write(content)
print("Patched UI for Image Sync Status")
