import re

with open('src/components/SyncFAB.tsx', 'r') as f:
    content = f.read()

old_use_effect = """  const [currentToken, setCurrentToken] = useState<string | null>(null);"""
new_use_effect = """  const [currentToken, setCurrentToken] = useState<string | null>(null);

  import { useEffect } from 'react';
  useEffect(() => {
    const onAutoSync = () => {
      if (syncStatus === 'idle' || syncStatus === 'error') {
        handleSync();
      }
    };
    window.addEventListener('request-auto-sync', onAutoSync);
    return () => window.removeEventListener('request-auto-sync', onAutoSync);
  }, [syncStatus]);"""
content = content.replace(old_use_effect, new_use_effect)

with open('src/components/SyncFAB.tsx', 'w') as f:
    f.write(content)
print("Patched SyncFAB")
