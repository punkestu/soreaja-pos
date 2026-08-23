import re

with open('src/components/Layout.tsx', 'r') as f:
    content = f.read()

if "BookOpen" not in content:
    content = content.replace("Settings, Camera, Layers, ChevronLeft, ChevronRight, HandCoins } from 'lucide-react';", "Settings, Camera, Layers, ChevronLeft, ChevronRight, HandCoins, BookOpen } from 'lucide-react';")

# Add to navItems array
if "label: 'Docs'" not in content:
    old_nav = """  { to: '/settings', icon: Settings, label: 'Settings' },
];"""
    new_nav = """  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/docs', icon: BookOpen, label: 'Docs' },
];"""
    content = content.replace(old_nav, new_nav)

with open('src/components/Layout.tsx', 'w') as f:
    f.write(content)
print("Updated Layout.tsx")
