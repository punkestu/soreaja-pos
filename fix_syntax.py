import re

with open('src/db.ts', 'r') as f:
    content = f.read()

v3_err = """  settings: 'key'
  loans: 'id, borrower, status, timestamp',
});"""

v3_fixed = """  settings: 'key'
});"""

content = content.replace(v3_err, v3_fixed)

hooks = """['assets', 'transactions', 'mutations', 'images', 'packages']"""
hooks_repl = """['assets', 'transactions', 'mutations', 'images', 'packages', 'loans']"""
content = content.replace(hooks, hooks_repl)

with open('src/db.ts', 'w') as f:
    f.write(content)
print("Syntax fixed")
