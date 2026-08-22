import re

with open('src/lib/sync.ts', 'r') as f:
    content = f.read()

fetch_sheet_mutations = """
async function fetchMutationsFromSpreadsheet(currentToken: string, folderId: string) {
  let sheetQuery = encodeURIComponent(`name='Cash Flow - SoreAja' and '${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
  const sheetSearchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${sheetQuery}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${currentToken}` }
  });
  const sheetSearchData = await sheetSearchRes.json();
  if (!sheetSearchData.files || sheetSearchData.files.length === 0) return [];
  
  const sheetId = sheetSearchData.files[0].id;
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A1:Z`, {
    headers: { Authorization: `Bearer ${currentToken}` }
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.values || data.values.length <= 1) return [];
  
  const sheetMutations: any[] = [];
  data.values.slice(1).forEach((row: any[]) => {
    const [id, type, source, location, amountStr, description, dateStr, lastUpdatedStr] = row;
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
    }
  });
  return sheetMutations;
}
"""

if "fetchMutationsFromSpreadsheet" not in content:
    content = content.replace("async function exportToSpreadsheet", fetch_sheet_mutations + "\nasync function exportToSpreadsheet")

# Update syncMerge
merge_pattern = r"const localMutations = await db\.mutations\.toArray\(\);.*?const mergedMutations = mergeArrays\(localMutations, remoteData\.mutations \|\| \[\]\);"
merge_replacement = """const localMutations = await db.mutations.toArray();
  const localPackages = await db.packages.toArray();
  const localSettings = await db.settings.toArray();

  const mergedAssets = mergeArrays(localAssets, remoteData.assets || []);
  const mergedTransactions = mergeArrays(localTransactions, remoteData.transactions || []);
  
  const sheetMutations = await fetchMutationsFromSpreadsheet(currentToken, folderId);
  const allRemoteMutations = mergeArrays(remoteData.mutations || [], sheetMutations);
  const mergedMutations = mergeArrays(localMutations, allRemoteMutations);"""

content = re.sub(r"const localMutations = await db\.mutations\.toArray\(\);\s*const localPackages = await db\.packages\.toArray\(\);\s*const localSettings = await db\.settings\.toArray\(\);\s*const mergedAssets = mergeArrays\(localAssets, remoteData\.assets \|\| \[\]\);\s*const mergedTransactions = mergeArrays\(localTransactions, remoteData\.transactions \|\| \[\]\);\s*const mergedMutations = mergeArrays\(localMutations, remoteData\.mutations \|\| \[\]\);", merge_replacement, content)

# Also update the export mapper to include Last Updated
mapper_pattern = r"\['ID', 'Type', 'Source', 'Location', 'Amount', 'Description', 'Date'\],\s*\(m: any\) => \[m\.id, m\.type, m\.source, m\.location, m\.amount, m\.description, new Date\(m\.timestamp\)\.toLocaleString\(\)\]"
mapper_replacement = """['ID', 'Type', 'Source', 'Location', 'Amount', 'Description', 'Date', 'Last Updated'],
    (m: any) => [m.id, m.type, m.source, m.location, m.amount, m.description, new Date(m.timestamp).toLocaleString(), m.last_updated ? new Date(m.last_updated).toLocaleString() : new Date(m.timestamp).toLocaleString()]"""

content = re.sub(mapper_pattern, mapper_replacement, content)

with open('src/lib/sync.ts', 'w') as f:
    f.write(content)

print("Replaced!")
