with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

target = """            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-bold uppercase tracking-widest">Rental Receipt</h2>
              <p className="text-stone-500 mt-1">Transaction ID: {tx.id}</p>
              <p className="text-stone-500">Date: {new Date().toLocaleString()}</p>
            </div>"""

replacement = """            <div className="text-center border-b pb-5">
              <h1 className="text-3xl font-black tracking-tight text-stone-900 mb-1">SoreAja</h1>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-4">Rental Receipt</h2>
              <div className="flex justify-between items-end text-left text-xs">
                <div>
                  <p className="text-stone-400 mb-0.5 uppercase tracking-wider text-[10px] font-bold">Transaction ID</p>
                  <p className="font-medium text-stone-800 font-mono">{tx.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-stone-400 mb-0.5 uppercase tracking-wider text-[10px] font-bold">Date</p>
                  <p className="font-medium text-stone-800">{new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/pages/TransactionDetail.tsx', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Target not found")
