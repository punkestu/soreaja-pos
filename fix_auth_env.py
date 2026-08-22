import json

with open('firebase-applet-config.json', 'r') as f:
    config = json.load(f)

env_content = f"""VITE_FIREBASE_PROJECT_ID="{config.get('projectId', '')}"
VITE_FIREBASE_APP_ID="{config.get('appId', '')}"
VITE_FIREBASE_API_KEY="{config.get('apiKey', '')}"
VITE_FIREBASE_AUTH_DOMAIN="{config.get('authDomain', '')}"
VITE_FIREBASE_STORAGE_BUCKET="{config.get('storageBucket', '')}"
VITE_FIREBASE_MESSAGING_SENDER_ID="{config.get('messagingSenderId', '')}"
VITE_FIREBASE_OAUTH_CLIENT_ID="{config.get('oAuthClientId', '')}"
"""

with open('.env', 'w') as f:
    f.write(env_content)

with open('src/auth.ts', 'r') as f:
    auth_content = f.read()

old_import = "import firebaseConfig from '../firebase-applet-config.json';"
new_config = """const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};"""

if old_import in auth_content:
    auth_content = auth_content.replace(old_import, "")
    auth_content = auth_content.replace("const app = initializeApp(firebaseConfig);", new_config + "\n\nconst app = initializeApp(firebaseConfig);")
    
with open('src/auth.ts', 'w') as f:
    f.write(auth_content)
    
print("Done")
