import re

with open('src/pages/NewTransaction.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { useState, useMemo } from 'react';", "import { useState, useMemo } from 'react';\nimport { parseTz, getTzDateInput } from '../lib/tz';")

content = content.replace("const [startDate, setStartDate] = useState(now.toISOString().slice(0, 16));", "const [startDate, setStartDate] = useState(getTzDateInput(now));")
content = content.replace("const [endDate, setEndDate] = useState(tmr.toISOString().slice(0, 16));", "const [endDate, setEndDate] = useState(getTzDateInput(tmr));")

content = content.replace("const start = new Date(startDate);", "const start = parseTz(startDate);")
content = content.replace("const end = new Date(endDate);", "const end = parseTz(endDate);")

content = content.replace("start_date: new Date(startDate),", "start_date: parseTz(startDate),")
content = content.replace("end_date: new Date(endDate),", "end_date: parseTz(endDate),")

with open('src/pages/NewTransaction.tsx', 'w') as f:
    f.write(content)
print("Patched NewTransaction.tsx")
