import re

with open('src/pages/Mutations.tsx', 'r') as f:
    content = f.read()

# Add link imports
if "import { Link } from 'react-router-dom';" not in content:
    content = "import { Link } from 'react-router-dom';\n" + content

if "Link2" not in content:
    content = content.replace("Copy, Undo2 } from 'lucide-react';", "Copy, Undo2, Link2 } from 'lucide-react';")

# Add link to UI
old_line = "                    <span>{format(m.timestamp, 'MMM d, yyyy HH:mm')}</span>"
new_line = """                    <span>{format(m.timestamp, 'MMM d, yyyy HH:mm')}</span>
                    {m.reference_id && (
                      <>
                        <span>•</span>
                        <Link to={`/transactions/${m.reference_id}`} className="flex items-center gap-1 text-orange-600 hover:text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full transition-colors">
                          <Link2 className="w-3 h-3" />
                          Tx: {m.reference_id.substring(0,8)}
                        </Link>
                      </>
                    )}"""

content = content.replace(old_line, new_line)

with open('src/pages/Mutations.tsx', 'w') as f:
    f.write(content)
print("Patched Mutations.tsx")
