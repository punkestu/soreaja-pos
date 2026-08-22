import re

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

import_pattern = r"Wallet, Settings, Camera, Layers, ChevronLeft, ChevronRight \} from 'lucide-react';"
import_replacement = r"Wallet, Settings, Camera, Layers, ChevronLeft, ChevronRight, HandCoins } from 'lucide-react';"
content = re.sub(import_pattern, import_replacement, content)

nav_pattern = r"\{ to: '/mutations', icon: Wallet, label: 'Cash-Flow' \},"
nav_replacement = r"{ to: '/mutations', icon: Wallet, label: 'Cash-Flow' },\n  { to: '/loans', icon: HandCoins, label: 'Loans' },"
content = re.sub(nav_pattern, nav_replacement, content)

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)
print("Updated Layout.tsx")
