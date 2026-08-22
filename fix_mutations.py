import re

with open('src/pages/Mutations.tsx', 'r') as f:
    content = f.read()

# Add imports
content = content.replace(
    "import { ArrowDownRight, ArrowUpRight, Plus, Wallet } from 'lucide-react';",
    "import { ArrowDownRight, ArrowUpRight, Plus, Wallet, Copy, Undo2 } from 'lucide-react';"
)

handle_corr = """
  async function handleCorrection(m: any) {
    if (!window.confirm('Are you sure you want to correct this mutation?')) return;
    
    await db.mutations.add({
      id: uuidv4(),
      type: m.type,
      source: m.source,
      location: m.location,
      amount: -m.amount,
      description: `Correction for ${m.id}`,
      timestamp: new Date()
    });
  }

  async function handleAdd(e: FormEvent) {"""

content = content.replace("async function handleAdd(e: FormEvent) {", handle_corr)

old_item = """                <div>
                  <h3 className="font-semibold text-stone-900">{m.description || m.type}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-stone-500 font-medium">
                    <span className="uppercase">{m.location}</span>
                    <span>•</span>
                    <span>{format(m.timestamp, 'MMM d, yyyy HH:mm')}</span>
                  </div>
                </div>"""

new_item = """                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-stone-900">{m.description || m.type}</h3>
                    <span className="text-[10px] font-mono bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer hover:bg-stone-200 transition-colors" onClick={() => navigator.clipboard.writeText(m.id)} title="Copy ID">
                      {m.id.substring(0, 8)}... <Copy className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-stone-500 font-medium flex-wrap">
                    <span className="uppercase px-2 py-0.5 bg-stone-100 rounded-full">{m.location}</span>
                    <span className="capitalize px-2 py-0.5 bg-stone-100 rounded-full">{m.type.replace('_', ' ')}</span>
                    <span className="capitalize px-2 py-0.5 bg-stone-100 rounded-full">{m.source}</span>
                    <span>•</span>
                    <span>{format(m.timestamp, 'MMM d, yyyy HH:mm')}</span>
                  </div>
                </div>"""

content = content.replace(old_item, new_item)

old_amount_div = """<div className={`font-bold font-mono text-lg ${m.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {m.amount > 0 ? '+' : ''}{m.amount.toLocaleString()}
              </div>"""

new_amount_div = """<div className="flex items-center gap-4">
                <div className={`font-bold font-mono text-lg ${m.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {m.amount > 0 ? '+' : ''}{m.amount.toLocaleString()}
                </div>
                <button onClick={() => handleCorrection(m)} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors" title="Correct this mutation">
                  <Undo2 className="w-4 h-4" />
                </button>
              </div>"""

content = content.replace(old_amount_div, new_amount_div)

with open('src/pages/Mutations.tsx', 'w') as f:
    f.write(content)

print("Done")
