import json

with open('package.json', 'r') as f:
    data = json.load(f)

if 'vite' in data.get('dependencies', {}):
    del data['dependencies']['vite']

with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)
