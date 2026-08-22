import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

import_pattern = r"import \{ Mutations \} from './pages/Mutations';"
import_repl = r"import { Mutations } from './pages/Mutations';\nimport { Loans } from './pages/Loans';"
content = re.sub(import_pattern, import_repl, content)

route_pattern = r"<Route path=\"mutations\" element=\{<Mutations />\} />"
route_repl = r'<Route path="mutations" element={<Mutations />} />\n          <Route path="loans" element={<Loans />} />'
content = re.sub(route_pattern, route_repl, content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Updated App.tsx")
