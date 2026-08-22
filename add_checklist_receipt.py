import re

with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

target = """            <div>
              <h4 className="font-bold text-stone-400 uppercase text-xs mb-2 border-b pb-1">Items Rented</h4>
              <ul className="space-y-1">
                {tx.items.map(item => {
                  const asset = assets?.find(a => a.id === item.asset_id);
                  return (
                    <li key={item.asset_id} className="flex justify-between">
                      <span>{asset?.name || 'Unknown Item'}</span>
                      <span className="font-medium">x{item.qty}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-stone-400 uppercase text-xs mb-2 border-b pb-1">Financials</h4>"""

replacement = """            <div>
              <h4 className="font-bold text-stone-400 uppercase text-xs mb-2 border-b pb-1">Items Rented</h4>
              <ul className="space-y-1">
                {tx.items.map(item => {
                  const asset = assets?.find(a => a.id === item.asset_id);
                  return (
                    <li key={item.asset_id} className="flex justify-between">
                      <span>{asset?.name || 'Unknown Item'}</span>
                      <span className="font-medium">x{item.qty}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold text-stone-400 uppercase text-xs mb-2 border-b pb-1">Start Phase Checklists</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {tx.checklists.give.items_given ? <CheckCircle2 className="w-3 h-3 text-stone-800" /> : <Circle className="w-3 h-3 text-stone-300" />} <span>Items Given</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.checklists.give.payment_fulfilled ? <CheckCircle2 className="w-3 h-3 text-stone-800" /> : <Circle className="w-3 h-3 text-stone-300" />} <span>Payment Fulfilled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.checklists.give.id_card_taken ? <CheckCircle2 className="w-3 h-3 text-stone-800" /> : <Circle className="w-3 h-3 text-stone-300" />} <span>ID Card Taken</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.checklists.give.tutorial_camera ? <CheckCircle2 className="w-3 h-3 text-stone-800" /> : <Circle className="w-3 h-3 text-stone-300" />} <span>Tutorial Camera</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-stone-400 uppercase text-xs mb-2 border-b pb-1">Return Phase Checklists</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {tx.checklists.take.id_card_returned ? <CheckCircle2 className="w-3 h-3 text-stone-800" /> : <Circle className="w-3 h-3 text-stone-300" />} <span>ID Card Returned</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.checklists.take.items_checked ? <CheckCircle2 className="w-3 h-3 text-stone-800" /> : <Circle className="w-3 h-3 text-stone-300" />} <span>Items Checked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.checklists.take.gdrive_uploaded ? <CheckCircle2 className="w-3 h-3 text-stone-800" /> : <Circle className="w-3 h-3 text-stone-300" />} <span>G-Drive Uploaded</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-stone-400 uppercase text-xs mb-2 border-b pb-1">Financials</h4>"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/pages/TransactionDetail.tsx', 'w') as f:
        f.write(content)
    print("Replaced!")
else:
    print("Target not found")
