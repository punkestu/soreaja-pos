import re

with open('src/lib/sync.ts', 'r') as f:
    content = f.read()

old_data = """  const data = {
    assets: sortStandard(await db.assets.toArray()),
    transactions: sortTransactions(await db.transactions.toArray()),
    mutations: sortMutations(await db.mutations.toArray()),
    packages: sortStandard(await db.packages.toArray()),
    settings: settings,
  };"""

new_data = """  const data = {
    assets: sortStandard(await db.assets.toArray()),
    transactions: sortTransactions(await db.transactions.toArray()),
    mutations: [], // Ignored in database.json, only takes from spreadsheet
    packages: sortStandard(await db.packages.toArray()),
    settings: settings,
    loans: sortStandard(await db.loans.toArray())
  };"""

if old_data in content:
    content = content.replace(old_data, new_data)
else:
    print("WARNING: Could not find old_data")

with open('src/lib/sync.ts', 'w') as f:
    f.write(content)
print("Done")
