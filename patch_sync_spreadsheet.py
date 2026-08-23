import re

with open('src/lib/sync.ts', 'r') as f:
    content = f.read()

# Update fetchMutationsFromSpreadsheet parsing
old_parse = """    const [id, type, source, location, amountStr, description, dateStr, lastUpdatedStr] = row;
    if (id) {
      sheetMutations.push({
        id,
        type: type || 'income',
        source: source || '',
        location: location || '',
        amount: Number(amountStr) || 0,
        description: description || '',
        timestamp: dateStr ? new Date(dateStr).getTime() : Date.now(),
        last_updated: lastUpdatedStr ? new Date(lastUpdatedStr).getTime() : Date.now()
      });
    }"""
new_parse = """    const [id, type, source, location, amountStr, description, dateStr, lastUpdatedStr, referenceId] = row;
    if (id) {
      sheetMutations.push({
        id,
        type: type || 'income',
        source: source || '',
        location: location || '',
        amount: Number(amountStr) || 0,
        description: description || '',
        timestamp: dateStr ? new Date(dateStr).getTime() : Date.now(),
        last_updated: lastUpdatedStr ? new Date(lastUpdatedStr).getTime() : Date.now(),
        reference_id: referenceId || undefined
      });
    }"""
content = content.replace(old_parse, new_parse)

# Update exportToSpreadsheet headers for mutations (performSyncUp)
old_export1 = """    ['ID', 'Type', 'Source', 'Location', 'Amount', 'Description', 'Date', 'Last Updated'],
    (m: any) => [m.id, m.type, m.source, m.location, m.amount, m.description, new Date(m.timestamp).toLocaleString(), m.last_updated ? new Date(m.last_updated).toLocaleString() : new Date(m.timestamp).toLocaleString()],"""
new_export1 = """    ['ID', 'Type', 'Source', 'Location', 'Amount', 'Description', 'Date', 'Last Updated', 'Reference ID'],
    (m: any) => [m.id, m.type, m.source, m.location, m.amount, m.description, new Date(m.timestamp).toLocaleString(), m.last_updated ? new Date(m.last_updated).toLocaleString() : new Date(m.timestamp).toLocaleString(), m.reference_id || ''],"""
content = content.replace(old_export1, new_export1)

with open('src/lib/sync.ts', 'w') as f:
    f.write(content)
print("Patched sync.ts")
