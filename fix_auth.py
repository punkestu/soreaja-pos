import re

with open('src/auth.ts', 'r') as f:
    content = f.read()

# Replace the env var config with importing firebase-applet-config.json
old_config = """const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  oAuthClientId: import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID,
};"""

new_config = """import firebaseConfig from '../firebase-applet-config.json';"""

# Add the import if not present
if "import firebaseConfig" not in content:
    content = content.replace(old_config, new_config)

with open('src/auth.ts', 'w') as f:
    f.write(content)
