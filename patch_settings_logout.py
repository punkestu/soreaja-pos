import re

with open('src/pages/Settings.tsx', 'r') as f:
    content = f.read()

old_header = """      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
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
             <div className="bg-stone-100 text-stone-600 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
               <XCircle className="w-4 h-4" /> <span className="md:block hidden">Not Connected</span>
             </div>
           )}
        </div>"""

new_header = """      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden mb-8">
         <div className="p-6 flex justify-between items-center bg-stone-50">
            <div>
              <p className="font-semibold text-stone-900">Google Account</p>
              <p className="text-sm text-stone-500 mt-1">
                {token ? 'You are securely signed in.' : 'Sign in to enable cloud backups.'}
              </p>
            </div>
            {token ? (
              <button 
                onClick={async () => { await firebaseLogout(); setToken(null); }}
                className="bg-stone-200 hover:bg-stone-300 text-stone-800 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                Log Out
              </button>
            ) : (
              <button 
                onClick={ensureToken}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                Log In
              </button>
            )}
         </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-start justify-between">
           <div>
             <h2 className="font-semibold text-lg flex items-center gap-2"><Cloud className="w-5 h-5 text-blue-500"/> Google Workspace Sync</h2>
             <p className="text-sm text-stone-500 mt-1">Backup your local data to Google Sheets & Drive.</p>
           </div>
           
           {token ? (
             <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
               <CheckCircle className="w-4 h-4" /> <span className="md:block hidden">Connected</span>
             </div>
           ) : (
             <div className="bg-stone-100 text-stone-600 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
               <XCircle className="w-4 h-4" /> <span className="md:block hidden">Not Connected</span>
             </div>
           )}
        </div>"""

content = content.replace(old_header, new_header)

with open('src/pages/Settings.tsx', 'w') as f:
    f.write(content)
print("Patched settings to add a prominent logout button")
