import re

# Fix App.tsx duplicates
with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace multiple instances of Loans import
content = re.sub(r"import \{ Loans \} from '\./pages/Loans';\n?", "", content)
# Add it back once
content = content.replace("import { Mutations } from './pages/Mutations';", "import { Mutations } from './pages/Mutations';\nimport { Loans } from './pages/Loans';")

# Replace multiple instances of Loans route
content = re.sub(r'<Route path="loans" element=\{<Loans />\} />\n?', '', content)
# Add it back once
content = content.replace('<Route path="mutations" element={<Mutations />} />', '<Route path="mutations" element={<Mutations />} />\n          <Route path="loans" element={<Loans />} />')

with open('src/App.tsx', 'w') as f:
    f.write(content)

# Fix Loans.tsx React import
with open('src/pages/Loans.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { useState } from 'react';", "import React, { useState } from 'react';")

with open('src/pages/Loans.tsx', 'w') as f:
    f.write(content)

print("Fixed")
