import re

with open('src/pages/Transactions.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { formatTz } from '../lib/tz';", "import { formatTz, parseTz } from '../lib/tz';")

old_filter = """    if (startDateFilter) {
      matchesDate = matchesDate && new Date(t.start_date).getTime() >= new Date(startDateFilter).getTime();
    }
    if (endDateFilter) {
      const endOfDay = new Date(endDateFilter);
      endOfDay.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(t.end_date).getTime() <= endOfDay.getTime();
    }"""

new_filter = """    if (startDateFilter) {
      const startOfDay = parseTz(startDateFilter + "T00:00");
      matchesDate = matchesDate && new Date(t.start_date).getTime() >= startOfDay.getTime();
    }
    if (endDateFilter) {
      const endOfDay = parseTz(endDateFilter + "T23:59:59.999");
      matchesDate = matchesDate && new Date(t.end_date).getTime() <= endOfDay.getTime();
    }"""

content = content.replace(old_filter, new_filter)

with open('src/pages/Transactions.tsx', 'w') as f:
    f.write(content)
print("Patched Transactions.tsx filter")
