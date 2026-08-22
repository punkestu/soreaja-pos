import { useState } from 'react';
import { GitMerge, UploadCloud, RefreshCw } from 'lucide-react';
import { initAuth, googleSignIn } from '../auth';
import { fetchBackupFolders, performSyncMerge, performSyncUp } from '../lib/sync';

export function SyncFAB() {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const handleSync = async () => {
    setSyncStatus('syncing');
    try {
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
      
      if (!token) {
        setSyncStatus('error');
        return;
      }

      const folders = await fetchBackupFolders(token);
      
      if (folders.length > 0) {
        // Has backup, perform merge with the latest (first in the list since it's ordered by createdTime desc)
        await performSyncMerge(token, folders[0].id);
      } else {
        // No backup, perform sync up (create new)
        const sessionFolderId = await performSyncUp(token);
        import('../lib/sync').then(m => m.uploadImagesToDrive(token, sessionFolderId));
      }
      
      const now = new Date().toLocaleString();
      localStorage.setItem('last_sync', now);
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
      window.dispatchEvent(new Event('sync-complete'));
    } catch (e) {
      console.error(e);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  return (
    <button 
      onClick={handleSync}
      disabled={syncStatus === 'syncing'}
      className={`fixed bottom-[80px] md:bottom-8 right-4 md:right-8 p-4 rounded-full shadow-lg shadow-orange-500/30 text-white flex items-center justify-center transition-all z-50 ${
        syncStatus === 'syncing' ? 'bg-orange-400 cursor-not-allowed scale-95' : 
        syncStatus === 'success' ? 'bg-emerald-500' :
        syncStatus === 'error' ? 'bg-red-500' :
        'bg-orange-600 hover:bg-orange-700 hover:scale-105'
      }`}
      title="Sync Merge"
    >
      {syncStatus === 'syncing' ? (
        <RefreshCw className="w-6 h-6 animate-spin" />
      ) : syncStatus === 'success' ? (
        <GitMerge className="w-6 h-6" />
      ) : (
        <GitMerge className="w-6 h-6" />
      )}
    </button>
  );
}
