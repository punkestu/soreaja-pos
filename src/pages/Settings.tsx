import { toTzString } from '../lib/tz';
import { useState, useEffect } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Cloud, CheckCircle, UploadCloud, Database, XCircle, DownloadCloud, GitMerge, FileText, X, Folder, Palette } from 'lucide-react';
import { initAuth, googleSignIn, getAccessToken, logout as firebaseLogout } from '../auth';

export function Settings() {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<string | null>(localStorage.getItem('last_sync'));
  const [token, setToken] = useState<string | null>(null);
  
  const [backupFiles, setBackupFiles] = useState<any[]>([]);
  const [isSelectingFile, setIsSelectingFile] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'down' | 'merge' | null>(null);

  const brandNameSetting = useLiveQuery(() => db.settings.get('brandName'));
  const brandName = brandNameSetting?.value || 'SoreAja';
  
  const brandLogoSetting = useLiveQuery(() => db.settings.get('brandLogo'));
  const brandLogo = brandLogoSetting?.value || '';

  const [editBrandName, setEditBrandName] = useState('');
  const [editBrandLogo, setEditBrandLogo] = useState('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (brandNameSetting) setEditBrandName(brandNameSetting.value);
    if (brandLogoSetting) setEditBrandLogo(brandLogoSetting.value);
  }, [brandNameSetting, brandLogoSetting]);

  async function handleSaveBranding(e: any) {
    e.preventDefault();
    setSaveStatus('saving');
    
    await db.settings.put({ key: 'brandName', value: editBrandName });
    await db.settings.put({ key: 'brandLogo', value: editBrandLogo });
    
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  }

  function handleLogoFileChange(e: any) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setEditBrandLogo(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  const sortTransactions = (arr: any[]) => arr.sort((a, b) => {
    const dateA = a.last_updated ? new Date(a.last_updated).getTime() : new Date(a.start_date).getTime();
    const dateB = b.last_updated ? new Date(b.last_updated).getTime() : new Date(b.start_date).getTime();
    return dateB - dateA;
  });

  const sortMutations = (arr: any[]) => arr.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const sortStandard = (arr: any[]) => arr.sort((a, b) => {
    const dateA = a.last_updated ? new Date(a.last_updated).getTime() : 0;
    const dateB = b.last_updated ? new Date(b.last_updated).getTime() : 0;
    return dateB - dateA;
  });


  useEffect(() => {
    const unsubscribe = initAuth(
      (user, cachedToken) => setToken(cachedToken),
      () => setToken(null)
    );
    return () => unsubscribe();
  }, []);

  const ensureToken = async (): Promise<string | null> => {
    if (token) return token;
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        return result.accessToken;
      }
    } catch (err) {
      console.error('Login failed', err);
    }
    return null;
  };

  async function getOrCreateFolder(accessToken: string, folderName: string, parentId?: string) {
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

  const handleSyncUp = async () => {
    const currentToken = await ensureToken();
    if (!currentToken) return;
    
    setSyncStatus('syncing');
    try {
      // Gather data
      const data = {
        assets: sortStandard(await db.assets.toArray()),
        transactions: sortTransactions(await db.transactions.toArray()),
        mutations: sortMutations(await db.mutations.toArray()),
        packages: sortStandard(await db.packages.toArray()),
      };
      
      const rootFolderId = await getOrCreateFolder(currentToken, 'SoreAja Backups');
      const backupId = `Backup - ${toTzString(new Date()).replace(/[/:,]/g, '-')}`;
      const sessionFolderId = await getOrCreateFolder(currentToken, backupId, rootFolderId);
      
      const jsonString = JSON.stringify(data, null, 2);
      
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
      const rows: any[] = [
        { values: [
          { userEnteredValue: { stringValue: 'ID' } },
          { userEnteredValue: { stringValue: 'Type' } },
          { userEnteredValue: { stringValue: 'Source' } },
          { userEnteredValue: { stringValue: 'Location' } },
          { userEnteredValue: { stringValue: 'Amount' } },
          { userEnteredValue: { stringValue: 'Description' } },
          { userEnteredValue: { stringValue: 'Date' } }
        ]}
      ];

      data.mutations.forEach(m => {
        rows.push({
          values: [
            { userEnteredValue: { stringValue: m.id } } as any,
            { userEnteredValue: { stringValue: m.type } } as any,
            { userEnteredValue: { stringValue: m.source } } as any,
            { userEnteredValue: { stringValue: m.location } } as any,
            { userEnteredValue: { numberValue: m.amount } } as any,
            { userEnteredValue: { stringValue: m.description } } as any,
            { userEnteredValue: { stringValue: toTzString(m.timestamp) } } as any
          ]
        });
      });

      const sheetRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: { title: `Cash Flow - ${backupId}` },
          sheets: [{
            properties: { title: 'Mutations' },
            data: [{ rowData: rows }]
          }]
        })
      });
      
      if (!sheetRes.ok) throw new Error('Failed to create Sheet');

      const sheetData = await sheetRes.json();
      const sheetId = sheetData.spreadsheetId;

      // Move spreadsheet to the session folder
      const getFileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${sheetId}?fields=parents`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (getFileRes.ok) {
         const fileData = await getFileRes.json();
         const previousParents = fileData.parents ? fileData.parents.join(',') : '';
         await fetch(`https://www.googleapis.com/drive/v3/files/${sheetId}?addParents=${sessionFolderId}&removeParents=${previousParents}`, {
           method: 'PATCH',
           headers: { Authorization: `Bearer ${currentToken}` }
         });
      }

      const now = toTzString(new Date());
      setLastSync(now);
      localStorage.setItem('last_sync', now);
      setSyncStatus('success');
    } catch (error) {
      console.error(error);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const startFileSelection = async (action: 'down' | 'merge') => {
    const currentToken = await ensureToken();
    if (!currentToken) return;
    
    setSelectedAction(action);
    setSyncStatus('syncing');
    try {
      const rootFolderId = await getOrCreateFolder(currentToken, 'SoreAja Backups');
      const query = encodeURIComponent(`'${rootFolderId}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder'`);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime)&orderBy=createdTime desc`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (!res.ok) throw new Error('Failed to list folders');
      const data = await res.json();
      setBackupFiles(data.files || []);
      setIsSelectingFile(true);
      setSyncStatus('idle');
    } catch (error) {
      console.error(error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleFileSelected = async (folderId: string) => {
    setIsSelectingFile(false);
    const currentToken = await ensureToken();
    if (!currentToken) return;

    setSyncStatus('syncing');
    try {
      const query = encodeURIComponent(`'${folderId}' in parents and name='database.json' and trashed=false`);
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      const searchData = await searchRes.json();
      if (!searchData.files || searchData.files.length === 0) {
        throw new Error('database.json not found in this backup folder');
      }
      
      const fileId = searchData.files[0].id;

      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (!res.ok) throw new Error('Failed to download JSON file');
      const data = await res.json();

      let mergedDataToUpload: any = null;

      if (selectedAction === 'down') {
        await db.transaction('rw', db.assets, db.transactions, db.mutations, db.packages, async () => {
          await db.assets.clear();
          await db.transactions.clear();
          await db.mutations.clear();
          await db.packages.clear();

          if (data.assets) await db.assets.bulkPut(data.assets);
          if (data.transactions) await db.transactions.bulkPut(data.transactions);
          if (data.mutations) await db.mutations.bulkPut(data.mutations);
          if (data.packages) await db.packages.bulkPut(data.packages);
        });
      } else if (selectedAction === 'merge') {
        const localData = {
          assets: await db.assets.toArray(),
          transactions: await db.transactions.toArray(),
          mutations: await db.mutations.toArray(),
          packages: await db.packages.toArray()
        };

        const mergeLogic = (localItems: any[], remoteItems: any[]) => {
          const mergedMap = new Map();
          for (const remote of (remoteItems || [])) {
            mergedMap.set(remote.id, remote);
          }
          for (const local of localItems) {
            const remote = mergedMap.get(local.id);
            if (!remote) {
              mergedMap.set(local.id, local);
            } else {
              const remoteDate = remote.last_updated ? new Date(remote.last_updated).getTime() : 0;
              const localDate = local.last_updated ? new Date(local.last_updated).getTime() : 0;
              if (localDate > remoteDate) {
                mergedMap.set(local.id, local);
              }
            }
          }
          return Array.from(mergedMap.values());
        };

        const mergedData = {
          assets: sortStandard(mergeLogic(localData.assets, data.assets)),
          transactions: sortTransactions(mergeLogic(localData.transactions, data.transactions)),
          mutations: sortMutations(mergeLogic(localData.mutations, data.mutations)),
          packages: sortStandard(mergeLogic(localData.packages, data.packages))
        };

        await db.transaction('rw', db.assets, db.transactions, db.mutations, db.packages, async () => {
          await db.assets.clear();
          await db.transactions.clear();
          await db.mutations.clear();
          await db.packages.clear();

          if (mergedData.assets.length) await db.assets.bulkPut(mergedData.assets);
          if (mergedData.transactions.length) await db.transactions.bulkPut(mergedData.transactions);
          if (mergedData.mutations.length) await db.mutations.bulkPut(mergedData.mutations);
          if (mergedData.packages.length) await db.packages.bulkPut(mergedData.packages);
        });

        mergedDataToUpload = mergedData;
      }

      if (mergedDataToUpload) {
        // 1. Update the JSON file
        const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(mergedDataToUpload, null, 2)
        });
        if (!updateRes.ok) throw new Error('Failed to update JSON backup in Google Drive');

        // 2. Update the Spreadsheet
        const sheetQuery = encodeURIComponent(`'${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
        const sheetSearchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${sheetQuery}&fields=files(id)`, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        const sheetSearchData = await sheetSearchRes.json();
        
        if (sheetSearchData.files && sheetSearchData.files.length > 0) {
          const sheetId = sheetSearchData.files[0].id;
          
          const valueData = [
            ['ID', 'Type', 'Source', 'Location', 'Amount', 'Description', 'Date']
          ];
          mergedDataToUpload.mutations.forEach((m: any) => {
            valueData.push([
              m.id,
              m.type,
              m.source,
              m.location,
              m.amount,
              m.description,
              toTzString(m.timestamp)
            ]);
          });
          
          await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Mutations!A1:Z:clear`, {
             method: 'POST',
             headers: { Authorization: `Bearer ${currentToken}` }
          });
          
          await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Mutations!A1?valueInputOption=USER_ENTERED`, {
             method: 'PUT',
             headers: { 
               Authorization: `Bearer ${currentToken}`,
               'Content-Type': 'application/json'
             },
             body: JSON.stringify({ values: valueData })
          });
        }
      }

      const now = toTzString(new Date());
      setLastSync(now);
      localStorage.setItem('last_sync', now);
      setSyncStatus('success');
    } catch (error) {
      console.error(error);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8 pb-24 md:pb-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Settings & Sync</h1>
        <p className="text-stone-500 mt-1">Configure your app and backup data.</p>
      </header>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-start justify-between">
           <div>
             <h2 className="font-semibold text-lg flex items-center gap-2"><Cloud className="w-5 h-5 text-blue-500"/> Google Workspace Sync</h2>
             <p className="text-sm text-stone-500 mt-1">Backup your local data to Google Sheets & Drive.</p>
           </div>
           
           {token ? (
             <div className="flex flex-col items-end gap-2">
               <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                 <CheckCircle className="w-4 h-4" /> <span className="md:block hidden">Connected</span>
               </div>
               <button onClick={async () => { await firebaseLogout(); setToken(null); }} className="text-xs text-stone-500 hover:text-stone-700 underline">Disconnect</button>
             </div>
           ) : (
             <div className="bg-stone-100 text-stone-500 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
               <XCircle className="w-4 h-4" /> <span className="md:block hidden">Not Connected</span>
             </div>
           )}
        </div>
        <div className="p-6 bg-stone-50 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button 
              onClick={handleSyncUp}
              disabled={syncStatus === 'syncing'}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <UploadCloud className={`w-5 h-5 ${syncStatus === 'syncing' ? 'animate-bounce' : ''}`} />
              <span>Sync Up</span>
            </button>

            <button 
              onClick={() => startFileSelection('merge')}
              disabled={syncStatus === 'syncing'}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <GitMerge className="w-5 h-5" />
              <span>Sync Merge</span>
            </button>

            <button 
              onClick={() => startFileSelection('down')}
              disabled={syncStatus === 'syncing'}
              className="w-full bg-stone-800 hover:bg-stone-900 disabled:bg-stone-500 text-white py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <DownloadCloud className="w-5 h-5" />
              <span>Sync Down</span>
            </button>
          </div>
          
          {syncStatus === 'success' && <p className="text-center text-sm text-emerald-600 font-medium">Sync Complete!</p>}
          {syncStatus === 'error' && <p className="text-center text-sm text-red-600 font-medium">Sync Failed. Try Again.</p>}
          
          <p className="text-center text-xs text-stone-400 mt-3 font-medium">
            {lastSync ? `Last synced: ${lastSync}` : 'Never synced'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-stone-100 flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-lg flex items-center gap-2"><Palette className="w-5 h-5 text-orange-500"/> Branding</h2>
              <p className="text-sm text-stone-500 mt-1">Configure your app's brand name and logo.</p>
            </div>
         </div>
         <form onSubmit={handleSaveBranding} className="p-6 bg-stone-50 space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Brand Name</label>
              <input 
                type="text" 
                value={editBrandName}
                onChange={(e) => setEditBrandName(e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g. SoreAja"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Brand Logo</label>
              <div className="flex items-center gap-4">
                {editBrandLogo ? (
                   <img src={editBrandLogo} alt="Logo Preview" className="w-12 h-12 rounded-full object-cover border border-stone-200" />
                ) : (
                   <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center border border-stone-300">
                     <Palette className="w-5 h-5 text-stone-400" />
                   </div>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="w-full text-sm text-stone-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                type="submit"
                disabled={saveStatus === 'saving'}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-bold transition-colors"
              >
                {saveStatus === 'saving' ? 'Uploading & Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Failed!' : 'Save Branding'}
              </button>
            </div>
         </form>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-stone-100">
             <h2 className="font-semibold text-lg flex items-center gap-2"><Database className="w-5 h-5 text-stone-500"/> Local Storage</h2>
             <p className="text-sm text-stone-500 mt-1">Manage offline data stored in your browser.</p>
         </div>
         <div className="p-6 flex justify-between items-center gap-2 bg-stone-50">
            <div>
              <p className="font-medium text-stone-800">Clear All Data</p>
              <p className="text-xs text-stone-500 mt-1">Warning: Unsynced data will be lost forever.</p>
            </div>
            <button 
              onClick={() => setIsResetConfirmOpen(true)}
              className="text-red-600 font-bold text-sm bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg transition-colors"
            >
              Reset
            </button>
         </div>
      </div>

      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-2 text-red-600">Factory Reset</h3>
            <p className="text-stone-600 mb-6">DANGER: Are you sure you want to delete ALL local data? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsResetConfirmOpen(false)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 py-3 rounded-xl font-semibold">Cancel</button>
              <button 
                onClick={async () => {
                  await db.transaction('rw', [db.assets, db.transactions, db.mutations, db.packages, db.settings, db.images], async () => {
                    await db.assets.clear();
                    await db.transactions.clear();
                    await db.mutations.clear();
                    await db.packages.clear();
                    await db.settings.clear();
                    await db.images.clear();
                  });
                  window.location.reload();
                }} 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {isSelectingFile && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Select Backup File</h3>
              <button onClick={() => setIsSelectingFile(false)} className="p-2 hover:bg-stone-100 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
              {backupFiles.length === 0 ? (
                <p className="text-center text-stone-500 py-8">No backup files found.</p>
              ) : (
                backupFiles.map(f => (
                  <button 
                    key={f.id} 
                    onClick={() => handleFileSelected(f.id)}
                    className="w-full flex items-center justify-between p-4 bg-stone-50 hover:bg-orange-50 border border-stone-200 rounded-xl transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Folder className="w-6 h-6 text-stone-400 shrink-0" />
                      <div className="overflow-hidden">
                        <p className="font-semibold text-stone-800 truncate">{f.name}</p>
                        <p className="text-xs text-stone-500">{toTzString(f.createdTime)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
