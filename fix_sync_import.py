import re

with open('src/lib/sync.ts', 'r') as f:
    content = f.read()

# Replace all occurrences of "import { getAccessToken } from '../auth';\n"
content = content.replace("import { getAccessToken } from '../auth';\n", "")

# Add it just once at the top
content = "import { getAccessToken } from '../auth';\n" + content

with open('src/lib/sync.ts', 'w') as f:
    f.write(content)
print("Fixed sync.ts imports")
