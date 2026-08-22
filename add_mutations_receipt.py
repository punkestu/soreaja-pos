with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

target = """                <div className="flex justify-between font-bold pt-1"><span className="text-stone-500">Remaining:</span> <span>Rp {remaining.toLocaleString()}</span></div>
              </div>
            </div>"""

replacement = """                <div className="flex justify-between font-bold pt-1"><span className="text-stone-500">Remaining:</span> <span>Rp {remaining.toLocaleString()}</span></div>
              </div>
            </div>

            {mutations && mutations.length > 0 && (
              <div className="mt-4 pt-4 border-t print:break-inside-avoid">
                <h4 className="font-bold text-stone-800 mb-2 text-sm">Payment History</h4>
                <div className="space-y-1">
                  {mutations.map(m => (
                    <div key={m.id} className="flex justify-between text-xs text-stone-600">
                      <span>
                        {new Date(m.timestamp).toLocaleDateString()} {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - <span className="capitalize">{m.location}</span> {m.description ? `(${m.description})` : ''}
                      </span>
                      <span className={m.amount > 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                        {m.amount > 0 ? '+' : ''}Rp {m.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/pages/TransactionDetail.tsx', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Target not found")
