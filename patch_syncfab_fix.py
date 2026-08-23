import re

with open('src/components/SyncFAB.tsx', 'r') as f:
    content = f.read()

content = content.replace("  import { useEffect } from 'react';", "")
content = content.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';")

with open('src/components/SyncFAB.tsx', 'w') as f:
    f.write(content)
print("Fixed SyncFAB imports")
