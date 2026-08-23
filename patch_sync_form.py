import re

with open('src/lib/sync.ts', 'r') as f:
    content = f.read()

content = content.replace(
    "form.append('file', img.data);",
    "form.append('file', img.data, metadata.name);"
)

with open('src/lib/sync.ts', 'w') as f:
    f.write(content)
print("Patched sync.ts form append")
