import re

with open('src/pages/Loans.tsx', 'r') as f:
    content = f.read()

content = content.replace("const [amount, setAmount] = useState('');", "const [amount, setAmount] = useState(0);")
content = content.replace("const [payAmount, setPayAmount] = useState('');", "const [payAmount, setPayAmount] = useState(0);")
content = content.replace("const numAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10) || 0;", "const numAmount = amount;")
content = content.replace("const numAmount = parseInt(payAmount.replace(/[^0-9]/g, ''), 10) || 0;", "const numAmount = payAmount;")
content = content.replace("setAmount('');", "setAmount(0);")
content = content.replace("setPayAmount('');", "setPayAmount(0);")
content = content.replace("setPayAmount((loan.amount - totalPaid).toString());", "setPayAmount(loan.amount - totalPaid);")

with open('src/pages/Loans.tsx', 'w') as f:
    f.write(content)
print("Fixed Loans.tsx")
