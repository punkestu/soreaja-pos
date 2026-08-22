import re

with open('src/lib/sync.ts', 'r') as f:
    content = f.read()

helper_function = """
async function exportToSpreadsheet(currentToken: string, folderId: string, title: string, headers: string[], rowMapper: (item: any) => any[], dataArray: any[]) {
  let sheetQuery = encodeURIComponent(`name='${title}' and '${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
  const sheetSearchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${sheetQuery}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${currentToken}` }
  });
  const sheetSearchData = await sheetSearchRes.json();
  
  let sheetId;
  if (sheetSearchData.files && sheetSearchData.files.length > 0) {
    sheetId = sheetSearchData.files[0].id;
  } else {
    const createSheetRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ properties: { title } })
    });
    const createSheetData = await createSheetRes.json();
    sheetId = createSheetData.spreadsheetId;
    
    await fetch(`https://www.googleapis.com/drive/v3/files/${sheetId}?addParents=${folderId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${currentToken}` }
    });
  }

  const valueData = [headers];
  dataArray.forEach(item => {
    valueData.push(rowMapper(item));
  });

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A1:Z:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${currentToken}` }
  }).catch(() => {
     fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Mutations!A1:Z:clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` }
     }).catch(() => {});
  });

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { 
       Authorization: `Bearer ${currentToken}`,
       'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: valueData })
  }).catch(async () => {
     await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Mutations!A1?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: { 
           Authorization: `Bearer ${currentToken}`,
           'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: valueData })
     }).catch(() => {});
  });
}
"""

# We need to replace the spreadsheet sections in performSyncUp and performSyncMerge
# In performSyncUp:
sync_up_pattern = r"// Export Cash-flow to Spreadsheet.*?return sessionFolderId;"
sync_up_repl = """// Export Cash-flow to Spreadsheet
  await exportToSpreadsheet(
    currentToken, 
    sessionFolderId, 
    'Cash Flow - SoreAja', 
    ['ID', 'Type', 'Source', 'Location', 'Amount', 'Description', 'Date'],
    (m: any) => [m.id, m.type, m.source, m.location, m.amount, m.description, new Date(m.timestamp).toLocaleString()],
    data.mutations
  );

  // Export Rentals to Spreadsheet
  await exportToSpreadsheet(
    currentToken, 
    sessionFolderId, 
    'Rentals - SoreAja', 
    ['ID', 'Customer Name', 'Status', 'Asset IDs', 'Start Date', 'End Date', 'Total Price', 'Notes'],
    (t: any) => [t.id, t.customer_name, t.status, t.asset_ids ? t.asset_ids.join(', ') : '', new Date(t.start_date).toLocaleString(), new Date(t.end_date).toLocaleString(), t.total_price, t.notes || ''],
    data.transactions
  );

  return sessionFolderId;"""

content = re.sub(sync_up_pattern, sync_up_repl, content, flags=re.DOTALL)


# In performSyncMerge:
sync_merge_pattern = r"// 6\. Update spreadsheet.*"
sync_merge_repl = """// 6. Update spreadsheet
  await exportToSpreadsheet(
    currentToken, 
    folderId, 
    'Cash Flow - SoreAja', 
    ['ID', 'Type', 'Source', 'Location', 'Amount', 'Description', 'Date'],
    (m: any) => [m.id, m.type, m.source, m.location, m.amount, m.description, new Date(m.timestamp).toLocaleString()],
    mergedDataToUpload.mutations
  );

  await exportToSpreadsheet(
    currentToken, 
    folderId, 
    'Rentals - SoreAja', 
    ['ID', 'Customer Name', 'Status', 'Asset IDs', 'Start Date', 'End Date', 'Total Price', 'Notes'],
    (t: any) => [t.id, t.customer_name, t.status, t.asset_ids ? t.asset_ids.join(', ') : '', new Date(t.start_date).toLocaleString(), new Date(t.end_date).toLocaleString(), t.total_price, t.notes || ''],
    mergedDataToUpload.transactions
  );
}
"""

content = re.sub(sync_merge_pattern, sync_merge_repl, content, flags=re.DOTALL)


# Add helper function at the top (after imports)
content = content.replace("export async function getOrCreateFolder", helper_function + "\nexport async function getOrCreateFolder")

with open('src/lib/sync.ts', 'w') as f:
    f.write(content)
