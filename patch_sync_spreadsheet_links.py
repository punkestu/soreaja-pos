import re

with open('src/lib/sync.ts', 'r') as f:
    content = f.read()

# Update performSyncUp
old_export1 = """    ['ID', 'Customer Name', 'Status', 'Asset IDs', 'Start Date', 'End Date', 'Total Price', 'Notes'],
    (t: any) => [t.id, t.customer_name, t.status, t.asset_ids ? t.asset_ids.join(', ') : '', new Date(t.start_date).toLocaleString(), new Date(t.end_date).toLocaleString(), t.total_price, t.notes || ''],"""

new_export1 = """    ['ID', 'Customer Name', 'Status', 'Asset IDs', 'Start Date', 'End Date', 'Total Price', 'Notes', 'Give Photo Link', 'Take Photo Link'],
    (t: any) => [t.id, t.customer_name, t.status, t.asset_ids ? t.asset_ids.join(', ') : '', new Date(t.start_date).toLocaleString(), new Date(t.end_date).toLocaleString(), t.total_price, t.notes || '', t.checklists?.give?.doc_gdrive_link || '', t.checklists?.take?.doc_take_gdrive_link || ''],"""
content = content.replace(old_export1, new_export1)

with open('src/lib/sync.ts', 'w') as f:
    f.write(content)
print("Patched sync.ts spreadsheet with photo links")
