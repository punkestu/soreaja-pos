import re

with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

# Add MoreVertical import
content = content.replace("FolderPlus, Edit2, FileText, Printer, X, Download, RefreshCw", "FolderPlus, Edit2, FileText, Printer, X, Download, RefreshCw, MoreVertical")

# Add isMobileMenuOpen state
if 'const [isMobileMenuOpen' not in content:
    content = content.replace("const [isDownloading, setIsDownloading] = useState(false);", "const [isDownloading, setIsDownloading] = useState(false);\n  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);")

# Replace header actions
old_header = """        <div className="flex flex-wrap gap-2 w-full md:w-auto">
           <button onClick={() => setIsReceiptModalOpen(true)} className="flex-1 md:flex-none justify-center bg-stone-100 text-stone-700 hover:bg-stone-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
             <FileText className="w-4 h-4" /> Export
           </button>
           {tx.status !== 'completed' && tx.status !== 'cancelled' && (
             <button onClick={triggerCancelFlow} className="flex-1 md:flex-none justify-center bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors">Cancel</button>
           )}
           {tx.status === 'booked' && (
             <button onClick={() => handleStatusChange('active')} className="flex-1 md:flex-none justify-center bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold w-full sm:w-auto">Mark Active (Give)</button>
           )}
           {tx.status === 'active' && (
             <button onClick={() => handleStatusChange('completed')} className="flex-1 md:flex-none justify-center bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold w-full sm:w-auto">Mark Complete (Take)</button>
           )}
        </div>"""

new_header = """        {/* Actions - Desktop */}
        <div className="hidden md:flex gap-2">
           <button onClick={() => setIsReceiptModalOpen(true)} className="bg-stone-100 text-stone-700 hover:bg-stone-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
             <FileText className="w-4 h-4" /> Export
           </button>
           {tx.status !== 'completed' && tx.status !== 'cancelled' && (
             <button onClick={triggerCancelFlow} className="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors">Cancel</button>
           )}
           {tx.status === 'booked' && (
             <button onClick={() => handleStatusChange('active')} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Mark Active (Give)</button>
           )}
           {tx.status === 'active' && (
             <button onClick={() => handleStatusChange('completed')} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Mark Complete (Take)</button>
           )}
        </div>

        {/* Actions - Mobile Dropdown */}
        <div className="md:hidden relative">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors flex items-center justify-center"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {isMobileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
               <button onClick={() => { setIsMobileMenuOpen(false); setIsReceiptModalOpen(true); }} className="w-full text-left px-4 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50 flex items-center gap-2 border-b border-stone-100">
                 <FileText className="w-4 h-4" /> Export
               </button>
               {tx.status !== 'completed' && tx.status !== 'cancelled' && (
                 <button onClick={() => { setIsMobileMenuOpen(false); triggerCancelFlow(); }} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 border-b border-stone-100">
                   Cancel
                 </button>
               )}
               {tx.status === 'booked' && (
                 <button onClick={() => { setIsMobileMenuOpen(false); handleStatusChange('active'); }} className="w-full text-left px-4 py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 border-b border-stone-100">
                   Mark Active (Give)
                 </button>
               )}
               {tx.status === 'active' && (
                 <button onClick={() => { setIsMobileMenuOpen(false); handleStatusChange('completed'); }} className="w-full text-left px-4 py-3 text-sm font-bold text-emerald-600 hover:bg-emerald-50 border-b border-stone-100">
                   Mark Complete (Take)
                 </button>
               )}
            </div>
          )}
        </div>"""

content = content.replace(old_header, new_header)

with open('src/pages/TransactionDetail.tsx', 'w') as f:
    f.write(content)
print("Patched TransactionDetail.tsx to use a mobile More menu")
