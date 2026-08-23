with open('src/pages/NewTransaction.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { triggerAutoSync } from '../lib/sync';\n", "")

with open('src/pages/NewTransaction.tsx', 'w') as f:
    f.write(content)
