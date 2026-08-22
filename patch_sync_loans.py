import re

with open('src/lib/sync.ts', 'r') as f:
    content = f.read()

# performSyncUp
syncup_find = r"const data = \{\n    assets: sortStandard\(await db\.assets\.toArray\(\)\),\n    transactions: sortTransactions\(await db\.transactions\.toArray\(\)\),\n    mutations: sortMutations\(await db\.mutations\.toArray\(\)\),\n    packages: sortStandard\(await db\.packages\.toArray\(\)\),\n    settings: await db\.settings\.toArray\(\)\n  \};"
syncup_replace = """const data = {
    assets: sortStandard(await db.assets.toArray()),
    transactions: sortTransactions(await db.transactions.toArray()),
    mutations: sortMutations(await db.mutations.toArray()),
    packages: sortStandard(await db.packages.toArray()),
    settings: await db.settings.toArray(),
    loans: sortStandard(await db.loans.toArray())
  };"""
content = re.sub(syncup_find, syncup_replace, content)

# performSyncMerge
local_vars_find = r"const localMutations = await db\.mutations\.toArray\(\);\n  const localPackages = await db\.packages\.toArray\(\);\n  const localSettings = await db\.settings\.toArray\(\);"
local_vars_replace = """const localMutations = await db.mutations.toArray();
  const localPackages = await db.packages.toArray();
  const localSettings = await db.settings.toArray();
  const localLoans = await db.loans.toArray();"""
content = re.sub(local_vars_find, local_vars_replace, content)

merged_vars_find = r"const mergedPackages = mergeArrays\(localPackages, remoteData\.packages \|\| \[\]\);"
merged_vars_replace = """const mergedPackages = mergeArrays(localPackages, remoteData.packages || []);
  const mergedLoans = mergeArrays(localLoans, remoteData.loans || []);"""
content = re.sub(merged_vars_find, merged_vars_replace, content)

db_rw_find = r"await db\.transaction\('rw', \[db\.assets, db\.transactions, db\.mutations, db\.packages, db\.settings\], async \(\) => \{"
db_rw_replace = r"await db.transaction('rw', [db.assets, db.transactions, db.mutations, db.packages, db.settings, db.loans], async () => {"
content = re.sub(db_rw_find, db_rw_replace, content)

db_clear_find = r"await db\.settings\.clear\(\);\n    if \(mergedSettings\.length\) await db\.settings\.bulkAdd\(mergedSettings\);"
db_clear_replace = """await db.settings.clear();
    if (mergedSettings.length) await db.settings.bulkAdd(mergedSettings);
    
    await db.loans.clear();
    if (mergedLoans.length) await db.loans.bulkAdd(mergedLoans);"""
content = re.sub(db_clear_find, db_clear_replace, content)

upload_find = r"packages: sortStandard\(mergedPackages\),\n    settings: mergedSettings,"
upload_replace = """packages: sortStandard(mergedPackages),
    settings: mergedSettings,
    loans: sortStandard(mergedLoans),"""
content = re.sub(upload_find, upload_replace, content)

with open('src/lib/sync.ts', 'w') as f:
    f.write(content)
print("Patched sync.ts")
