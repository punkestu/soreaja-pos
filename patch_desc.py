import re

with open('src/pages/Mutations.tsx', 'r') as f:
    content = f.read()

old_h3 = '<h3 className="font-semibold text-stone-900 truncate">{m.description || m.type}</h3>'
new_h3 = '<h3 className="font-semibold text-stone-900 break-words" title={m.description || m.type} style={{ wordBreak: "break-word" }}>{m.description || m.type}</h3>'

content = content.replace(old_h3, new_h3)

with open('src/pages/Mutations.tsx', 'w') as f:
    f.write(content)
print("Patched description to wrap and show full text")
