import re

with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

# We need to only replace the second occurrence
parts = content.split("uploadPhaseRef.current = 'give';")
if len(parts) >= 3:
    # First is before first give, second is between give and take, third is after take
    content = parts[0] + "uploadPhaseRef.current = 'give';" + parts[1] + "uploadPhaseRef.current = 'take';" + parts[2]

with open('src/pages/TransactionDetail.tsx', 'w') as f:
    f.write(content)
print("Fixed take button")
