import re

with open('src/db.ts', 'r') as f:
    content = f.read()

# I will find all db.version calls and replace them entirely.
pattern = r"db\.version\(1\)\.stores\(\{.*?\}\);\s*db\.version\(2\)\.stores\(\{.*?\}\);\s*db\.version\(3\)\.stores\(\{.*?\}\);"

replacement = """db.version(1).stores({
  assets: 'id, name, type',
  transactions: 'id, customer_name, status, start_date, end_date',
  mutations: 'id, type, location, reference_id, timestamp',
  images: 'id, transaction_id'
});

db.version(2).stores({
  assets: 'id, name, type',
  transactions: 'id, customer_name, status, start_date, end_date',
  mutations: 'id, type, location, reference_id, timestamp',
  images: 'id, transaction_id',
  packages: 'id, name'
});

db.version(3).stores({
  assets: 'id, name, type',
  transactions: 'id, customer_name, status, start_date, end_date',
  mutations: 'id, type, location, reference_id, timestamp',
  images: 'id, transaction_id',
  packages: 'id, name',
  settings: 'key'
});

db.version(4).stores({
  assets: 'id, name, type',
  transactions: 'id, customer_name, status, start_date, end_date',
  mutations: 'id, type, location, reference_id, timestamp',
  images: 'id, transaction_id',
  packages: 'id, name',
  settings: 'key',
  loans: 'id, borrower, status, timestamp'
});"""

content = re.sub(r"db\.version\(1\)\.stores\(.*?\}\);.*?(?=\['assets')", replacement + "\n\n", content, flags=re.DOTALL)

with open('src/db.ts', 'w') as f:
    f.write(content)
print("Versions cleaned")
