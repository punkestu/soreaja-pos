import { toTzString } from '../lib/tz';
import { useState, useEffect } from 'react';
import { Save, RefreshCw, X, FolderSync, Plus } from 'lucide-react';
import { initAuth, googleSignIn } from '../auth';
import { fetchBackupFolders, performSyncMerge, performSyncUp } from '../lib/sync';

export function SyncFAB() {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [showFolderSelect, setShowFolderSelect] = useState(false);
  const [availableFolders, setAvailableFolders] = useState<any[]>([]);
  const [currentToken, setCurrentToken] = useState<string | null>(null);


  useEffect(() => {
    const onAutoSync = () => {
      if (syncStatus === 'idle' || syncStatus === 'error') {
        handleSync();
      }
    };
    window.addEventListener('request-auto-sync', onAutoSync);
    return () => window.removeEventListener('request-auto-sync', onAutoSync);
  }, [syncStatus]);

  const getToken = async () => {
    let token = null;
    await new Promise<void>((resolve) => {
      const unsubscribe = initAuth((user, cachedToken) => {
        token = cachedToken;
        unsubscribe();
        resolve();
      }, () => {
        unsubscribe();
        resolve();
      });
    });
    if (!token) {
      const res = await googleSignIn();
      if (res) token = res.accessToken;
    }
    return token;
  };

  const handleSync = async () => {
    setSyncStatus('syncing');
    try {
      const token = await getToken();
      if (!token) {
        setSyncStatus('error');
        return;
      }
      
      const savedFolderId = localStorage.getItem('sync_folder_id');
      
      if (savedFolderId) {
        await performSyncMerge(token, savedFolderId);
        finishSync();
      } else {
        const folders = await fetchBackupFolders(token);
        if (folders.length > 0) {
          setAvailableFolders(folders);
          setCurrentToken(token);
          setShowFolderSelect(true);
          setSyncStatus('idle');
        } else {
          const sessionFolderId = await performSyncUp(token);
          import('../lib/sync').then(m => m.uploadImagesToDrive(token, sessionFolderId));
          localStorage.setItem('sync_folder_id', sessionFolderId);
          finishSync();
        }
      }
    } catch (e) {
      console.error(e);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };
  
  const finishSync = () => {
      const now = toTzString(new Date());
      localStorage.setItem('last_sync', now);
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
      window.dispatchEvent(new Event('sync-complete'));
  };

  const handleSelectFolder = async (folderId: string) => {
    setShowFolderSelect(false);
    setSyncStatus('syncing');
    try {
      if (currentToken) {
        await performSyncMerge(currentToken, folderId);
        localStorage.setItem('sync_folder_id', folderId);
        finishSync();
      }
    } catch (e) {
      console.error(e);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleCreateNew = async () => {
    setShowFolderSelect(false);
    setSyncStatus('syncing');
    try {
      if (currentToken) {
        const sessionFolderId = await performSyncUp(currentToken);
        import('../lib/sync').then(m => m.uploadImagesToDrive(currentToken, sessionFolderId));
        localStorage.setItem('sync_folder_id', sessionFolderId);
        finishSync();
      }
    } catch (e) {
      console.error(e);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  return (
    <>
      <button 
        onClick={handleSync}
        disabled={syncStatus === 'syncing'}
        className={`fixed bottom-[80px] md:bottom-8 right-4 md:right-8 p-4 rounded-full shadow-lg shadow-orange-500/30 text-white flex items-center justify-center transition-all z-50 ${
          syncStatus === 'syncing' ? 'bg-orange-400 cursor-not-allowed scale-95' : 
          syncStatus === 'success' ? 'bg-emerald-500' :
          syncStatus === 'error' ? 'bg-red-500' :
          'bg-orange-600 hover:bg-orange-700 hover:scale-105'
        }`}
        title="Save & Sync"
      >
        {syncStatus === 'syncing' ? (
          <RefreshCw className="w-6 h-6 animate-spin" />
        ) : syncStatus === 'success' ? (
          <Save className="w-6 h-6" />
        ) : (
          <Save className="w-6 h-6" />
        )}
      </button>

      {showFolderSelect && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-stone-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                <FolderSync className="w-5 h-5 text-orange-500" />
                Select Backup
              </h2>
              <button onClick={() => setShowFolderSelect(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-stone-500 mb-4">
              It looks like you haven't synced this device yet. Please select an existing backup to merge with, or create a new one.
            </p>

            <div className="max-h-[60vh] overflow-y-auto space-y-2 mb-4">
              {availableFolders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => handleSelectFolder(folder.id)}
                  className="w-full text-left p-4 rounded-xl border border-stone-200 hover:border-orange-500 hover:bg-orange-50 transition-colors flex flex-col gap-1"
                >
                  <span className="font-semibold text-stone-900">{folder.name}</span>
                  <span className="text-xs text-stone-500">
                    Created: {toTzString(folder.createdTime)}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-stone-100">
              <button
                onClick={handleCreateNew}
                className="w-full p-4 rounded-xl border-2 border-dashed border-stone-300 hover:border-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 text-stone-600 hover:text-orange-700 font-medium"
              >
                <Plus className="w-5 h-5" />
                Create New Backup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
