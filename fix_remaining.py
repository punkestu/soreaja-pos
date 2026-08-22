with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

content = content.replace("Rp {remaining.toLocaleString()}", "Rp {Math.max(0, remaining).toLocaleString()}")

with open('src/pages/TransactionDetail.tsx', 'w') as f:
    f.write(content)

print("Done")
