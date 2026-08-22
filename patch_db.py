import re

with open('src/db.ts', 'r') as f:
    content = f.read()

loan_interface = """
export interface LoanPayment {
  id: string;
  amount: number;
  payer: string;
  timestamp: Date;
  mutation_id: string;
}

export interface Loan {
  id: string;
  borrower: string;
  reason: string;
  amount: number;
  status: 'active' | 'paid';
  payments: LoanPayment[];
  wallet: string;
  mutation_id: string;
  timestamp: Date;
  last_updated?: Date;
}
"""

content = content.replace("export interface Asset", loan_interface + "\nexport interface Asset")

db_type_pattern = r"(export const db = new Dexie\('SoreAjaDatabase'\) as Dexie & \{.*?)(\s*\};\n)"
db_type_replacement = r"\1\n  loans: EntityTable<Loan, 'id'>;\2"
content = re.sub(db_type_pattern, db_type_replacement, content, flags=re.DOTALL)

db_version_pattern = r"(db\.version\(3\)\.stores\(\{.*?)(\}\);)"
db_version_replacement = r"\1\n  loans: 'id, borrower, status, timestamp',\2"
content = re.sub(db_version_pattern, db_version_replacement, content, flags=re.DOTALL)

db_hooks_pattern = r"\['assets', 'transactions', 'mutations', 'images', 'packages'\]"
db_hooks_replacement = r"['assets', 'transactions', 'mutations', 'images', 'packages', 'loans']"
content = content.replace(db_hooks_pattern, db_hooks_replacement)

with open('src/db.ts', 'w') as f:
    f.write(content)
print("Updated db.ts")
