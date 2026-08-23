import re

with open('src/pages/Mutations.tsx', 'r') as f:
    content = f.read()

if "triggerAutoSync" not in content:
    content = "import { triggerAutoSync } from '../lib/sync';\n" + content

# In handleCorrect
old_correct = """      timestamp: new Date()
    });
    setConfirmingCorrection(null);"""
new_correct = """      timestamp: new Date()
    });
    setConfirmingCorrection(null);
    triggerAutoSync();"""
content = content.replace(old_correct, new_correct)

# In handleAdd
old_add = """      timestamp: new Date()
    });

    setAmount(0);"""
new_add = """      timestamp: new Date()
    });
    triggerAutoSync();

    setAmount(0);"""
content = content.replace(old_add, new_add)

with open('src/pages/Mutations.tsx', 'w') as f:
    f.write(content)
print("Patched Mutations.tsx")
