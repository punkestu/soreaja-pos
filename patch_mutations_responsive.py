import re

with open('src/pages/Mutations.tsx', 'r') as f:
    content = f.read()

old_li = """            <li key={m.id} className="flex items-center justify-between p-4 sm:p-6 hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full shrink-0 ${m.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  {m.amount > 0 ? <ArrowDownRight className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                </div>
                <div>
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
                    {m.reference_id && (
                      <>
                        <span>•</span>
                        <Link to={`/transactions/${m.reference_id}`} className="flex items-center gap-1 text-orange-600 hover:text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full transition-colors">
                          <Link2 className="w-3 h-3" />
                          Tx: {m.reference_id.substring(0,8)}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`font-bold font-mono text-lg ${m.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {m.amount > 0 ? '+' : ''}{m.amount.toLocaleString()}
                </div>
                {confirmingCorrection === m.id ? (
                  <div className="flex items-center gap-2 bg-red-50 p-1.5 rounded-xl border border-red-100">
                    <span className="text-xs font-medium text-red-600 px-2">Correct?</span>
                    <button onClick={() => handleCorrection(m)} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors">Yes</button>
                    <button onClick={() => setConfirmingCorrection(null)} className="px-3 py-1 bg-white border border-stone-200 text-stone-600 rounded-lg text-xs font-medium hover:bg-stone-50 transition-colors">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmingCorrection(m.id)} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors" title="Correct this mutation">
                    <Undo2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </li>"""

new_li = """            <li key={m.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-6 hover:bg-stone-50 transition-colors gap-4">
              <div className="flex items-start md:items-center gap-3 sm:gap-4 flex-1 overflow-hidden">
                <div className={`p-3 rounded-full shrink-0 ${m.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  {m.amount > 0 ? <ArrowDownRight className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0 pt-0.5 md:pt-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-stone-900 truncate">{m.description || m.type}</h3>
                    <span className="text-[10px] font-mono bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer hover:bg-stone-200 transition-colors shrink-0" onClick={() => navigator.clipboard.writeText(m.id)} title="Copy ID">
                      {m.id.substring(0, 8)}... <Copy className="w-3 h-3" />
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 md:mt-1 text-xs text-stone-500 font-medium flex-wrap">
                    <span className="uppercase px-2 py-0.5 bg-stone-100 rounded-full">{m.location}</span>
                    <span className="capitalize px-2 py-0.5 bg-stone-100 rounded-full">{m.type.replace('_', ' ')}</span>
                    <span className="capitalize px-2 py-0.5 bg-stone-100 rounded-full">{m.source}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="w-full sm:w-auto mt-1 sm:mt-0">{format(m.timestamp, 'MMM d, yyyy HH:mm')}</span>
                    {m.reference_id && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <Link to={`/transactions/${m.reference_id}`} className="flex items-center gap-1 text-orange-600 hover:text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full transition-colors w-full sm:w-auto mt-1 sm:mt-0">
                          <Link2 className="w-3 h-3" />
                          Tx: {m.reference_id.substring(0,8)}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-4 md:w-auto w-full border-t border-stone-100 md:border-0 pt-4 md:pt-0 pl-14 md:pl-0">
                <div className={`font-bold font-mono text-lg ${m.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {m.amount > 0 ? '+' : ''}{m.amount.toLocaleString()}
                </div>
                {confirmingCorrection === m.id ? (
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-red-50 p-1 sm:p-1.5 rounded-xl border border-red-100 shrink-0">
                    <span className="text-[10px] sm:text-xs font-medium text-red-600 px-1 sm:px-2">Correct?</span>
                    <button onClick={() => handleCorrection(m)} className="px-2 sm:px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] sm:text-xs font-medium hover:bg-red-700 transition-colors">Yes</button>
                    <button onClick={() => setConfirmingCorrection(null)} className="px-2 sm:px-3 py-1 bg-white border border-stone-200 text-stone-600 rounded-lg text-[10px] sm:text-xs font-medium hover:bg-stone-50 transition-colors">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmingCorrection(m.id)} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors shrink-0" title="Correct this mutation">
                    <Undo2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </li>"""

content = content.replace(old_li, new_li)

with open('src/pages/Mutations.tsx', 'w') as f:
    f.write(content)
print("Patched Mutations.tsx list items")
