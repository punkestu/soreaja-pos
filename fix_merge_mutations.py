import re

with open('src/lib/sync.ts', 'r') as f:
    content = f.read()

old_merged_data = """  const mergedDataToUpload = {
    assets: sortStandard(mergedAssets),
    transactions: sortTransactions(mergedTransactions),
    mutations: [], // Ignore database.json
    packages: sortStandard(mergedPackages),
    settings: mergedSettings,
    loans: sortStandard(mergedLoans),
  };
  const jsonString = JSON.stringify(mergedDataToUpload, null, 2);"""

new_merged_data = """  const mergedDataToUpload = {
    assets: sortStandard(mergedAssets),
    transactions: sortTransactions(mergedTransactions),
    mutations: sortMutations(mergedMutations), // Keep for Spreadsheet export
    packages: sortStandard(mergedPackages),
    settings: mergedSettings,
    loans: sortStandard(mergedLoans),
  };
  const mergedDataForJson = { ...mergedDataToUpload, mutations: [] }; // Ignore database.json
  const jsonString = JSON.stringify(mergedDataForJson, null, 2);"""

content = content.replace(old_merged_data, new_merged_data)

with open('src/lib/sync.ts', 'w') as f:
    f.write(content)
print("Fixed performSyncMerge")
