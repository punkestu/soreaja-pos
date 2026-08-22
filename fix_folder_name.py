import re

with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

target = "const folderData = await createCustomerFolder(authResult.accessToken, tx.customer_name);"
replacement = """const folderName = `${tx.customer_name} - ${new Date(tx.start_date).toISOString().slice(0, 10)} - ${tx.id.substring(0, 8)}`;
      const folderData = await createCustomerFolder(authResult.accessToken, folderName);"""

if target in content:
    content = content.replace(target, replacement)
    
# Remove unused handleCreateFolder if it exists
# We will just replace it if needed, but it's fine to leave it or just remove it.
# Actually, let's remove handleCreateFolder completely to keep it clean.
handle_create_folder_pattern = r"  async function handleCreateFolder\(\) \{.*?\n  async function toggleChecklist"
content = re.sub(handle_create_folder_pattern, "  async function toggleChecklist", content, flags=re.DOTALL)

with open('src/pages/TransactionDetail.tsx', 'w') as f:
    f.write(content)

print("Done")
