import re

with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

old_header = """      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/transactions" className="p-2 -ml-2 rounded-full hover:bg-stone-200 transition-colors text-stone-600">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">{tx.customer_name}</h1>
            <p className="text-sm text-stone-500 font-medium">Status: <span className="uppercase text-orange-600">{tx.status}</span></p>
            {tx.status === 'cancelled' && tx.cancel_reason && <p className="text-xs text-red-500 font-medium mt-1">Reason: {tx.cancel_reason}</p>}
          </div>
        </div>
        <div className="flex gap-2">
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
      </header>"""

new_header = """      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/transactions" className="p-2 -ml-2 rounded-full hover:bg-stone-200 transition-colors text-stone-600 shrink-0">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 truncate">{tx.customer_name}</h1>
            <p className="text-sm text-stone-500 font-medium">Status: <span className="uppercase text-orange-600">{tx.status}</span></p>
            {tx.status === 'cancelled' && tx.cancel_reason && <p className="text-xs text-red-500 font-medium mt-1 truncate">Reason: {tx.cancel_reason}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
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
        </div>
      </header>"""

content = content.replace(old_header, new_header)

with open('src/pages/TransactionDetail.tsx', 'w') as f:
    f.write(content)
print("Patched TransactionDetail.tsx header to be responsive")
