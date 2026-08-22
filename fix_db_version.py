import re

with open('src/db.ts', 'r') as f:
    content = f.read()

# Add version 4 with loans
v4_block = """
db.version(4).stores({
  assets: 'id, name, type',
  transactions: 'id, customer_name, status, start_date, end_date',
  mutations: 'id, type, location, reference_id, timestamp',
  images: 'id, transaction_id',
  packages: 'id, name',
  settings: 'key',
  loans: 'id, borrower, status, timestamp'
});
"""

# replace db.version(3) to remove loans, and add version 4
v3_orig = """db.version(3).stores({
  assets: 'id, name, type',
  transactions: 'id, customer_name, status, start_date, end_date',
  mutations: 'id, type, location, reference_id, timestamp',
  images: 'id, transaction_id',
  packages: 'id, name',
  settings: 'key',
  loans: 'id, borrower, status, timestamp'
});"""

v3_fixed = """db.version(3).stores({
  assets: 'id, name, type',
  transactions: 'id, customer_name, status, start_date, end_date',
  mutations: 'id, type, location, reference_id, timestamp',
  images: 'id, transaction_id',
  packages: 'id, name',
  settings: 'key'
});"""

content = content.replace(v3_orig, v3_fixed + "\n" + v4_block)

with open('src/db.ts', 'w') as f:
    f.write(content)
print("Updated db version to 4")
