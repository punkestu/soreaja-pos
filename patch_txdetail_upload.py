import re

with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

# Add ref for upload phase
if 'const uploadPhaseRef = useRef<' not in content:
    content = content.replace("const fileInputRef = useRef<HTMLInputElement>(null);", "const fileInputRef = useRef<HTMLInputElement>(null);\n  const uploadPhaseRef = useRef<'give' | 'take'>('give');")

# Modify handleImageUpload
old_handle = """    // Assume for 'give' phase if not complete, otherwise 'take'
    if (tx.status !== 'completed') {
       await db.transactions.update(tx.id, { 'checklists.give.doc_image_id': imgId });
    } else {
       await db.transactions.update(tx.id, { 'checklists.take.doc_take_image_id': imgId });
    }"""
new_handle = """    if (uploadPhaseRef.current === 'give') {
       await db.transactions.update(tx.id, { 'checklists.give.doc_image_id': imgId });
    } else {
       await db.transactions.update(tx.id, { 'checklists.take.doc_take_image_id': imgId });
    }"""
content = content.replace(old_handle, new_handle)

# Modify Give button
old_give_btn = """<button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-2 rounded-xl text-sm font-medium transition-colors">"""
new_give_btn = """<button onClick={() => { uploadPhaseRef.current = 'give'; fileInputRef.current?.click(); }} className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-2 rounded-xl text-sm font-medium transition-colors">"""
content = content.replace(old_give_btn, new_give_btn)

# Modify Take button
old_take_btn = """<button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-2 rounded-xl text-sm font-medium transition-colors">"""
new_take_btn = """<button onClick={() => { uploadPhaseRef.current = 'take'; fileInputRef.current?.click(); }} className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-2 rounded-xl text-sm font-medium transition-colors">"""
content = content.replace(old_take_btn, new_take_btn)

with open('src/pages/TransactionDetail.tsx', 'w') as f:
    f.write(content)
print("Patched TransactionDetail.tsx for precise upload phase")
