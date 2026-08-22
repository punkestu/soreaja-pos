import re

with open('src/pages/Mutations.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "const [type, setType] = useState('maintenance');",
    "const [type, setType] = useState('maintenance');\n  const [confirmingCorrection, setConfirmingCorrection] = useState<string | null>(null);"
)

old_handle = """  async function handleCorrection(m: any) {
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
  }"""

new_handle = """  async function handleCorrection(m: any) {
    await db.mutations.add({
      id: uuidv4(),
      type: m.type,
      source: m.source,
      location: m.location,
      amount: -m.amount,
      description: `Correction for ${m.id}`,
      timestamp: new Date()
    });
    setConfirmingCorrection(null);
  }"""

content = content.replace(old_handle, new_handle)

old_button = """                <button onClick={() => handleCorrection(m)} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors" title="Correct this mutation">
                  <Undo2 className="w-4 h-4" />
                </button>"""

new_button = """                {confirmingCorrection === m.id ? (
                  <div className="flex items-center gap-2 bg-red-50 p-1.5 rounded-xl border border-red-100">
                    <span className="text-xs font-medium text-red-600 px-2">Correct?</span>
                    <button onClick={() => handleCorrection(m)} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors">Yes</button>
                    <button onClick={() => setConfirmingCorrection(null)} className="px-3 py-1 bg-white border border-stone-200 text-stone-600 rounded-lg text-xs font-medium hover:bg-stone-50 transition-colors">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmingCorrection(m.id)} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors" title="Correct this mutation">
                    <Undo2 className="w-4 h-4" />
                  </button>
                )}"""

content = content.replace(old_button, new_button)

with open('src/pages/Mutations.tsx', 'w') as f:
    f.write(content)
