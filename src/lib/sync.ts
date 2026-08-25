import { toTzString } from './tz';
import { getAccessToken } from '../auth';
import { db } from '../db';

export async function uploadPublicImage(accessToken: string, fileBlob: Blob, fileName: string) {
  const rootFolderId = await getOrCreateFolder(accessToken, 'SoreAja Backups');
  const brandingFolderId = await getOrCreateFolder(accessToken, 'Branding', rootFolderId);
  
  const metadata = {
    name: fileName,
    parents: [brandingFolderId]
  };
  
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', fileBlob);
  
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form
  });
  
  if (!res.ok) throw new Error('Failed to upload image');
  const data = await res.json();
  const fileId = data.id;
  
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'anyone',
      role: 'reader'
    })
  });
  
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}



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
    const [id, type, source, location, amountStr, description, dateStr, lastUpdatedStr, referenceId] = row;
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
    }
  });
  return sheetMutations;
}

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

export async function getOrCreateFolder(accessToken: string, folderName: string, parentId?: string) {
  let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  if (parentId) query += ` and '${parentId}' in parents`;
  
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=drive`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (!searchRes.ok) throw new Error('Failed to search for folder');
  const searchData = await searchRes.json();
  
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }
  
  const body: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  if (parentId) body.parents = [parentId];

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  if (!createRes.ok) throw new Error('Failed to create folder');
  const createData = await createRes.json();
  return createData.id;
}

export async function createCustomerFolder(accessToken: string, folderName: string) {
  const rootFolderId = await getOrCreateFolder(accessToken, 'SoreAja Backups');
  const customersFolderId = await getOrCreateFolder(accessToken, 'Customers', rootFolderId);
  const newFolderId = await getOrCreateFolder(accessToken, folderName, customersFolderId);
  
  // Make it public read-only
  await fetch(`https://www.googleapis.com/drive/v3/files/${newFolderId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'anyone',
      role: 'reader'
    })
  });
  
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${newFolderId}?fields=webViewLink`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await res.json();
  
  return { id: newFolderId, url: data.webViewLink };
}

export const sortTransactions = (arr: any[]) => arr.sort((a, b) => {
  const dateA = a.last_updated ? new Date(a.last_updated).getTime() : new Date(a.start_date).getTime();
  const dateB = b.last_updated ? new Date(b.last_updated).getTime() : new Date(b.start_date).getTime();
  return dateB - dateA;
});

export const sortMutations = (arr: any[]) => arr.sort((a, b) => {
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
});

export const sortStandard = (arr: any[]) => arr.sort((a, b) => {
  const dateA = a.last_updated ? new Date(a.last_updated).getTime() : 0;
  const dateB = b.last_updated ? new Date(b.last_updated).getTime() : 0;
  return dateB - dateA;
});

export async function performSyncUp(currentToken: string) {
  // Check settings for base64 brandLogo
  let settings = await db.settings.toArray();
  const brandLogoIdx = settings.findIndex(s => s.key === 'brandLogo');
  
  if (brandLogoIdx !== -1 && settings[brandLogoIdx].value.startsWith('data:image')) {
    try {
      const fetchRes = await fetch(settings[brandLogoIdx].value);
      const blob = await fetchRes.blob();
      const url = await uploadPublicImage(currentToken, blob, `brand_logo_${Date.now()}.png`);
      
      // Update local db so we don't upload again next time
      await db.settings.put({ key: 'brandLogo', value: url });
      
      // Update the payload for JSON
      settings[brandLogoIdx].value = url;
    } catch (e) {
      console.error('Failed to upload brand logo during sync', e);
    }
  }

  const rootFolderId = await getOrCreateFolder(currentToken, 'SoreAja Backups');
  const backupId = `Backup - ${toTzString(new Date()).replace(/[/:,]/g, '-')}`;
  const sessionFolderId = await getOrCreateFolder(currentToken, backupId, rootFolderId);

  // Upload images first so transactions have GDrive IDs
  await uploadImagesToDrive(currentToken, sessionFolderId);
  
  // Gather data
  const data = {
    assets: sortStandard(await db.assets.toArray()),
    transactions: sortTransactions(await db.transactions.toArray()),
    mutations: sortMutations(await db.mutations.toArray()), // Needed for Spreadsheet export
    packages: sortStandard(await db.packages.toArray()),
    settings: settings,
    loans: sortStandard(await db.loans.toArray())
  };
  
  const dataForJson = { ...data, mutations: [] }; // Ignore database.json
  const jsonString = JSON.stringify(dataForJson, null, 2);
  
  const metadata = {
    name: 'database.json',
    mimeType: 'application/json',
    parents: [sessionFolderId]
  };
  
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([jsonString], { type: 'application/json' }));

  const driveRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${currentToken}` },
    body: form
  });
  
  if (!driveRes.ok) throw new Error('Failed to upload to Drive');

  // Export Cash-flow to Spreadsheet
  await exportToSpreadsheet(
    currentToken, 
    sessionFolderId, 
    'Cash Flow - SoreAja', 
    ['ID', 'Type', 'Source', 'Location', 'Amount', 'Description', 'Date', 'Last Updated', 'Reference ID'],
    (m: any) => [m.id, m.type, m.source, m.location, m.amount, m.description, toTzString(m.timestamp), m.last_updated ? toTzString(m.last_updated) : toTzString(m.timestamp), m.reference_id || ''],
    data.mutations
  );

  // Export Rentals to Spreadsheet
  await exportToSpreadsheet(
    currentToken, 
    sessionFolderId, 
    'Rentals - SoreAja', 
    ['ID', 'Customer Name', 'Status', 'Asset IDs', 'Start Date', 'End Date', 'Total Price', 'Notes', 'Give Photo Link', 'Take Photo Link'],
    (t: any) => [t.id, t.customer_name, t.status, t.asset_ids ? t.asset_ids.join(', ') : '', toTzString(t.start_date), toTzString(t.end_date), t.total_price, t.notes || '', t.checklists?.give?.doc_gdrive_link || '', t.checklists?.take?.doc_take_gdrive_link || ''],
    data.transactions
  );

  return sessionFolderId;
}

export async function uploadImagesToDrive(currentToken: string, sessionFolderId: string) {
  const images = await db.images.toArray();
  if (images.length === 0) return;
  
  const imagesFolderId = await getOrCreateFolder(currentToken, 'Images', sessionFolderId);
  for (const img of images) {
    if (img.gdrive_id) {
      // Heal transaction if it missed the link
      const tx = await db.transactions.get(img.transaction_id);
      if (tx) {
        let updated = false;
        if (tx.checklists.give.doc_image_id === img.id && !tx.checklists.give.doc_gdrive_link) {
          try {
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${img.gdrive_id}?fields=webViewLink`, {
              headers: { Authorization: `Bearer ${currentToken}` }
            });
            if (res.ok) {
              const data = await res.json();
              tx.checklists.give.doc_gdrive_id = img.gdrive_id;
              tx.checklists.give.doc_gdrive_link = data.webViewLink;
              updated = true;
            }
          } catch(e) {}
        }
        if (tx.checklists.take.doc_take_image_id === img.id && !tx.checklists.take.doc_take_gdrive_link) {
          try {
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${img.gdrive_id}?fields=webViewLink`, {
              headers: { Authorization: `Bearer ${currentToken}` }
            });
            if (res.ok) {
              const data = await res.json();
              tx.checklists.take.doc_take_gdrive_id = img.gdrive_id;
              tx.checklists.take.doc_take_gdrive_link = data.webViewLink;
              updated = true;
            }
          } catch(e) {}
        }
        if (updated) {
          await db.transactions.put(tx);
        }
      }
      continue;
    }
    
    const metadata = {
      name: `${img.transaction_id}_${img.id}.jpg`,
      parents: [imagesFolderId]
    };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', img.data, metadata.name);

    try {
      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` },
        body: form
      });
      if (res.ok) {
        const data = await res.json();
        await db.images.update(img.id, { gdrive_id: data.id });
        
        const tx = await db.transactions.get(img.transaction_id);
        if (tx) {
          let updated = false;
          if (tx.checklists.give.doc_image_id === img.id) {
            tx.checklists.give.doc_gdrive_id = data.id;
            tx.checklists.give.doc_gdrive_link = data.webViewLink;
            updated = true;
          }
          if (tx.checklists.take.doc_take_image_id === img.id) {
            tx.checklists.take.doc_take_gdrive_id = data.id;
            tx.checklists.take.doc_take_gdrive_link = data.webViewLink;
            updated = true;
          }
          if (updated) {
            await db.transactions.put(tx);
          }
        }
      }
    } catch(e) { console.error('Image upload failed', e); }
  }
}

export async function fetchBackupFolders(currentToken: string) {
  const rootFolderId = await getOrCreateFolder(currentToken, 'SoreAja Backups');
  let q = encodeURIComponent(`'${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime desc&fields=files(id,name,createdTime)`, {
    headers: { Authorization: `Bearer ${currentToken}` }
  });
  const listData = await listRes.json();
  return listData.files || [];
}

export async function performSyncMerge(currentToken: string, folderId: string) {
  // Upload images first so local transactions have GDrive IDs before merge
  await uploadImagesToDrive(currentToken, folderId);

  // 1. Download database.json
  let qFile = encodeURIComponent(`'${folderId}' in parents and name='database.json' and trashed=false`);
  const fileSearchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${qFile}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${currentToken}` }
  });
  const fileSearchData = await fileSearchRes.json();
  
  if (!fileSearchData.files || fileSearchData.files.length === 0) {
    throw new Error('No database.json found in backup folder');
  }
  const fileId = fileSearchData.files[0].id;
  
  const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${currentToken}` }
  });
  
  if (!fileRes.ok) throw new Error('Failed to download database.json');
  const remoteData = await fileRes.json();

  // 2. Merge local and remote
  const mergeArrays = (local: any[], remote: any[]) => {
    const map = new Map();
    remote.forEach(r => map.set(r.id, r));
    local.forEach(l => {
      const r = map.get(l.id);
      if (!r) {
        map.set(l.id, l);
      } else {
        const localT = l.last_updated ? new Date(l.last_updated).getTime() : 0;
        const remoteT = r.last_updated ? new Date(r.last_updated).getTime() : 0;
        if (localT > remoteT) {
          map.set(l.id, l);
        }
      }
    });
    return Array.from(map.values());
  };

  const localAssets = await db.assets.toArray();
  const localTransactions = await db.transactions.toArray();
  const localMutations = await db.mutations.toArray();
  const localPackages = await db.packages.toArray();
  const localSettings = await db.settings.toArray();
  const localLoans = await db.loans.toArray();

  const mergedAssets = mergeArrays(localAssets, remoteData.assets || []);
  const mergedTransactions = mergeArrays(localTransactions, remoteData.transactions || []);
  
  const sheetMutations = await fetchMutationsFromSpreadsheet(currentToken, folderId);
  // Only take from spreadsheet, ignore database.json
  const mergedMutations = mergeArrays(localMutations, sheetMutations);
  const mergedPackages = mergeArrays(localPackages, remoteData.packages || []);
  const mergedLoans = mergeArrays(localLoans, remoteData.loans || []);
  
  const mapSettings = new Map();
  (remoteData.settings || []).forEach((r: any) => mapSettings.set(r.key, r));
  localSettings.forEach(l => {
     // Local settings override remote if they exist, or remote overrides local?
     // We will just let remote overwrite, UNLESS we want local to take precedence.
     // Let's just merge by taking remote and overriding with local if local exists? 
     // Actually, if we're merging, let's keep local, but add missing from remote.
     const r = mapSettings.get(l.key);
     if (!r) {
       mapSettings.set(l.key, l);
     } else {
       // local wins
       mapSettings.set(l.key, l);
     }
  });
  const mergedSettings = Array.from(mapSettings.values());

  // 3. Save to local DB
  await db.transaction('rw', [db.assets, db.transactions, db.mutations, db.packages, db.settings, db.loans], async () => {
    await db.assets.clear();
    if (mergedAssets.length) await db.assets.bulkAdd(mergedAssets);
    
    await db.transactions.clear();
    if (mergedTransactions.length) await db.transactions.bulkAdd(mergedTransactions);
    
    await db.mutations.clear();
    if (mergedMutations.length) await db.mutations.bulkAdd(mergedMutations);
    
    await db.packages.clear();
    if (mergedPackages.length) await db.packages.bulkAdd(mergedPackages);

    await db.settings.clear();
    if (mergedSettings.length) await db.settings.bulkAdd(mergedSettings);
    
    await db.loans.clear();
    if (mergedLoans.length) await db.loans.bulkAdd(mergedLoans);
  });

  // 4. Upload merged back to the same folder
  const mergedDataToUpload = {
    assets: sortStandard(mergedAssets),
    transactions: sortTransactions(mergedTransactions),
    mutations: sortMutations(mergedMutations), // Keep for Spreadsheet export
    packages: sortStandard(mergedPackages),
    settings: mergedSettings,
    loans: sortStandard(mergedLoans),
  };
  const mergedDataForJson = { ...mergedDataToUpload, mutations: [] }; // Ignore database.json
  const jsonString = JSON.stringify(mergedDataForJson, null, 2);
  const metadata = { name: 'database.json', mimeType: 'application/json' };
  
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([jsonString], { type: 'application/json' }));

  await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${currentToken}` },
    body: form
  });

  // 6. Update spreadsheet
  await exportToSpreadsheet(
    currentToken, 
    folderId, 
    'Cash Flow - SoreAja', 
    ['ID', 'Type', 'Source', 'Location', 'Amount', 'Description', 'Date', 'Last Updated', 'Reference ID'],
    (m: any) => [m.id, m.type, m.source, m.location, m.amount, m.description, toTzString(m.timestamp), m.last_updated ? toTzString(m.last_updated) : toTzString(m.timestamp), m.reference_id || ''],
    mergedDataToUpload.mutations
  );

  await exportToSpreadsheet(
    currentToken, 
    folderId, 
    'Rentals - SoreAja', 
    ['ID', 'Customer Name', 'Status', 'Asset IDs', 'Start Date', 'End Date', 'Total Price', 'Notes', 'Give Photo Link', 'Take Photo Link'],
    (t: any) => [t.id, t.customer_name, t.status, t.asset_ids ? t.asset_ids.join(', ') : '', toTzString(t.start_date), toTzString(t.end_date), t.total_price, t.notes || '', t.checklists?.give?.doc_gdrive_link || '', t.checklists?.take?.doc_take_gdrive_link || ''],
    mergedDataToUpload.transactions
  );
}



let autoSyncTimeout: ReturnType<typeof setTimeout> | null = null;

export function triggerAutoSync(debounceMs = 3000) {
  if (autoSyncTimeout) clearTimeout(autoSyncTimeout);
  autoSyncTimeout = setTimeout(() => {
    window.dispatchEvent(new Event('request-auto-sync'));
  }, debounceMs);
}
