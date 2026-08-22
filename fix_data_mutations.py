import re

with open('src/lib/sync.ts', 'r') as f:
    content = f.read()

# I will revert `mutations: [], // Ignored in database.json` back to actual data,
# but change the JSON payload for upload.

old_data_gather = """  const data = {
    assets: sortStandard(await db.assets.toArray()),
    transactions: sortTransactions(await db.transactions.toArray()),
    mutations: [], // Ignored in database.json, only takes from spreadsheet
    packages: sortStandard(await db.packages.toArray()),
    settings: settings,
    loans: sortStandard(await db.loans.toArray())
  };"""

new_data_gather = """  const data = {
    assets: sortStandard(await db.assets.toArray()),
    transactions: sortTransactions(await db.transactions.toArray()),
    mutations: sortMutations(await db.mutations.toArray()), // Needed for Spreadsheet export
    packages: sortStandard(await db.packages.toArray()),
    settings: settings,
    loans: sortStandard(await db.loans.toArray())
  };"""

content = content.replace(old_data_gather, new_data_gather)

# Then for JSON upload in performSyncUp
old_json = r"const jsonString = JSON\.stringify\(data, null, 2\);"
new_json = """const dataForJson = { ...data, mutations: [] }; // Ignore database.json
  const jsonString = JSON.stringify(dataForJson, null, 2);"""

content = re.sub(old_json, new_json, content)

with open('src/lib/sync.ts', 'w') as f:
    f.write(content)
print("Fixed performSyncUp")
