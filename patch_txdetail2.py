import re

with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

old_block = """        {tx.financials.notes && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-xl text-sm">
            <span className="font-semibold text-orange-800">Reason/Notes:</span> <span className="text-orange-700">{tx.financials.notes}</span>
          </div>
        )}
      </div>"""

new_block = """        {tx.financials.notes && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-xl text-sm">
            <span className="font-semibold text-orange-800">Reason/Notes:</span> <span className="text-orange-700">{tx.financials.notes}</span>
          </div>
        )}
        
        {mutations && mutations.length > 0 && (
          <div className="mt-6 border-t border-stone-200 pt-4">
            <h3 className="font-semibold text-sm text-stone-800 mb-3">Payment History</h3>
            <ul className="space-y-2">
              {mutations.map(m => (
                <li key={m.id} className="flex justify-between items-center text-sm bg-stone-50 px-3 py-2 rounded-lg">
                  <div>
                    <p className="font-medium text-stone-700 capitalize">{m.location} {m.description ? `(${m.description})` : ''}</p>
                    <p className="text-xs text-stone-500">{new Date(m.timestamp).toLocaleDateString()} {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  <span className={`font-mono font-bold ${m.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {m.amount > 0 ? '+' : ''}Rp {m.amount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>"""

if "Payment History" not in content[:6000]: # avoid matching the receipt one
    content = content.replace(old_block, new_block)

with open('src/pages/TransactionDetail.tsx', 'w') as f:
    f.write(content)
print("Patched TransactionDetail.tsx")
