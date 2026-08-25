import re

with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace("if (grouping === 'day') label = formatTz(date, 'MMM dd');", "if (grouping === 'day') label = format(date, 'MMM dd');")
content = content.replace("else if (grouping === 'week') label = formatTz(date, 'MMM dd');", "else if (grouping === 'week') label = format(date, 'MMM dd');")
content = content.replace("else if (grouping === 'month') label = formatTz(date, 'MMM yyyy');", "else if (grouping === 'month') label = format(date, 'MMM yyyy');")

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)
print("Fixed Dashboard.tsx labels")
