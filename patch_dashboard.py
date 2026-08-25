import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { format,", "import { getJakartaLocal } from '../lib/tz';\nimport { format,")

content = content.replace("new Date()", "getJakartaLocal(new Date())")

content = content.replace("new Date(a.last_updated)", "getJakartaLocal(a.last_updated)")
content = content.replace("new Date(a.start_date)", "getJakartaLocal(a.start_date)")
content = content.replace("new Date(b.last_updated)", "getJakartaLocal(b.last_updated)")
content = content.replace("new Date(b.start_date)", "getJakartaLocal(b.start_date)")
content = content.replace("new Date(a.timestamp)", "getJakartaLocal(a.timestamp)")
content = content.replace("new Date(b.timestamp)", "getJakartaLocal(b.timestamp)")
content = content.replace("new Date(m.timestamp)", "getJakartaLocal(m.timestamp)")
content = content.replace("new Date(t.start_date)", "getJakartaLocal(t.start_date)")
content = content.replace("new Date(t.end_date)", "getJakartaLocal(t.end_date)")

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
print("Patched Dashboard.tsx")
