import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add import
if "import { Docs }" not in content:
    content = content.replace("import { Settings } from './pages/Settings';", "import { Settings } from './pages/Settings';\nimport { Docs } from './pages/Docs';")

# Add route
if '<Route path="docs" element={<Docs />} />' not in content:
    content = content.replace('<Route path="settings" element={<Settings />} />', '<Route path="settings" element={<Settings />} />\n          <Route path="docs" element={<Docs />} />')

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Updated App.tsx")
