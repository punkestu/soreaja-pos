import re

with open('src/lib/sync.ts', 'r') as f:
    content = f.read()

# Fix performSyncUp
# Gather data part
old_data_str = r"""const data = \{
    assets: sortStandard\(await db\.assets\.toArray\(\)\),
    transactions: sortTransactions\(await db\.transactions\.toArray\(\)\),
    mutations: sortMutations\(await db\.mutations\.toArray\(\)\),
    packages: sortStandard\(await db\.packages\.toArray\(\)\),
    settings: await db\.settings\.toArray\(\),
    loans: sortStandard\(await db\.loans\.toArray\(\)\)
  \};"""

new_data_str = """const data = {
    assets: sortStandard(await db.assets.toArray()),
    transactions: sortTransactions(await db.transactions.toArray()),
    mutations: [], // Ignored in database.json, only takes from spreadsheet
    packages: sortStandard(await db.packages.toArray()),
    settings: await db.settings.toArray(),
    loans: sortStandard(await db.loans.toArray())
  };"""

content = re.sub(old_data_str, new_data_str, content)

# Fix performSyncMerge
old_merge_str = r"""const sheetMutations = await fetchMutationsFromSpreadsheet\(currentToken, folderId\);
  const allRemoteMutations = mergeArrays\(remoteData\.mutations \|\| \[\], sheetMutations\);
  const mergedMutations = mergeArrays\(localMutations, allRemoteMutations\);"""

new_merge_str = """const sheetMutations = await fetchMutationsFromSpreadsheet(currentToken, folderId);
  // Only take from spreadsheet, ignore database.json
  const mergedMutations = mergeArrays(localMutations, sheetMutations);"""

content = re.sub(old_merge_str, new_merge_str, content)

# Fix performSyncMerge upload part
old_upload_str = r"""mutations: sortMutations\(mergedMutations\),
    packages: sortStandard\(mergedPackages\),"""

new_upload_str = """mutations: [], // Ignore database.json
    packages: sortStandard(mergedPackages),"""

content = re.sub(old_upload_str, new_upload_str, content)

with open('src/lib/sync.ts', 'w') as f:
    f.write(content)
print("Patched mutations sync")
