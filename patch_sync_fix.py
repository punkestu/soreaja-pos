import re

with open('src/lib/sync.ts', 'r') as f:
    content = f.read()

# Fix the order in performSyncUp
old_syncup = """  // Upload images first so transactions have GDrive IDs
  await uploadImagesToDrive(currentToken, sessionFolderId);
  
  // Gather data
  const data = {
    assets: sortStandard(await db.assets.toArray()),
    transactions: sortTransactions(await db.transactions.toArray()),
    mutations: sortMutations(await db.mutations.toArray()), // Needed for Spreadsheet export
    packages: sortStandard(await db.packages.toArray()),
    settings: settings,
    loans: sortStandard(await db.loans.toArray())
  };
  
  const rootFolderId = await getOrCreateFolder(currentToken, 'SoreAja Backups');
  const backupId = `Backup - ${new Date().toLocaleString().replace(/[/:,]/g, '-')}`;
  const sessionFolderId = await getOrCreateFolder(currentToken, backupId, rootFolderId);"""

new_syncup = """  const rootFolderId = await getOrCreateFolder(currentToken, 'SoreAja Backups');
  const backupId = `Backup - ${new Date().toLocaleString().replace(/[/:,]/g, '-')}`;
  const sessionFolderId = await getOrCreateFolder(currentToken, backupId, rootFolderId);

  // Upload images first so transactions have GDrive IDs
  await uploadImagesToDrive(currentToken, sessionFolderId);
  
  // Gather data
  const data = {
    assets: sortStandard(await db.assets.toArray()),
    transactions: sortTransactions(await db.transactions.toArray()),
    mutations: sortMutations(await db.mutations.toArray()), // Needed for Spreadsheet export
    packages: sortStandard(await db.packages.toArray()),
    settings: settings,
    loans: sortStandard(await db.loans.toArray())
  };"""

content = content.replace(old_syncup, new_syncup)

with open('src/lib/sync.ts', 'w') as f:
    f.write(content)
print("Patched sync.ts fixing sessionFolderId order")
