import re

with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

# 1. Update Financials in the main UI (not receipt)
main_financials_target = """        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="col-span-full md:col-span-1 text-center md:text-left"><p className="text-stone-500">Final Total</p><p className="font-bold font-mono">Rp {tx.financials.total_cost.toLocaleString()}</p></div>
          <div><p className="text-stone-500">Paid</p><p className="font-bold font-mono text-emerald-600">Rp {totalPaid.toLocaleString()}</p></div>
          <div><p className="text-stone-500">Remaining</p><p className={`font-bold font-mono ${remaining > 0 ? 'text-red-600' : 'text-stone-900'}`}>Rp {remaining.toLocaleString()}</p></div>
          <div><p className="text-stone-500">Items Cost</p><p className="font-bold font-mono">Rp {(tx.financials.total_cost - tx.financials.extra_fee + tx.financials.discount).toLocaleString()}</p></div>
          <div><p className="text-stone-500">Add. Cost</p><p className="font-bold font-mono">Rp {tx.financials.extra_fee.toLocaleString()}</p></div>
          <div><p className="text-stone-500">Discount</p><p className="font-bold font-mono">Rp {tx.financials.discount.toLocaleString()}</p></div>
        </div>"""

main_financials_replacement = """        <div className="bg-stone-50 rounded-xl p-5 space-y-2 text-sm max-w-lg">
          <div className="flex justify-between"><span className="text-stone-500">Items Cost</span> <span className="font-mono">Rp {(tx.financials.total_cost - tx.financials.extra_fee + tx.financials.discount).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">Additional Cost</span> <span className="font-mono">Rp {tx.financials.extra_fee.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">Discount</span> <span className="font-mono text-red-600">-Rp {tx.financials.discount.toLocaleString()}</span></div>
          <div className="flex justify-between font-bold text-base pt-3 border-t border-stone-200 mt-2"><span className="text-stone-700">Final Total</span> <span className="font-mono text-stone-900">Rp {tx.financials.total_cost.toLocaleString()}</span></div>
          <div className="flex justify-between font-medium pt-1"><span className="text-stone-500">Total Paid</span> <span className="font-mono text-emerald-600">Rp {totalPaid.toLocaleString()}</span></div>
          <div className="flex justify-between font-bold pt-1"><span className="text-stone-500">Remaining</span> <span className={`font-mono ${remaining > 0 ? 'text-red-600' : 'text-stone-900'}`}>Rp {remaining.toLocaleString()}</span></div>
        </div>"""

if main_financials_target in content:
    content = content.replace(main_financials_target, main_financials_replacement)

# 2. Update Receipt Modal Padding
modal_target = """    {isReceiptModalOpen && (
      <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:static print:bg-transparent print:p-0 print:block">
        <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:w-full print:rounded-none">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <h3 className="text-xl font-bold text-stone-800">Receipt Preview</h3>
            <button onClick={() => setIsReceiptModalOpen(false)} className="text-stone-400 hover:text-stone-600"><X /></button>
          </div>
          
          <div ref={receiptRef} className="space-y-6 text-sm text-stone-800 bg-white p-4 sm:p-0">"""

modal_replacement = """    {isReceiptModalOpen && (
      <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:static print:bg-transparent print:p-0 print:block">
        <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:w-full print:rounded-none">
          <div className="flex justify-between items-center p-6 sm:p-8 border-b border-stone-100 print:hidden shrink-0">
            <h3 className="text-xl font-bold text-stone-800">Receipt Preview</h3>
            <button onClick={() => setIsReceiptModalOpen(false)} className="text-stone-400 hover:text-stone-600"><X /></button>
          </div>
          
          <div className="overflow-y-auto print:overflow-visible">
            <div ref={receiptRef} className="bg-white p-6 sm:p-8">
              <div className="space-y-6 text-sm text-stone-800">"""

# Close the new div wrapping in the modal footer
footer_target = """          </div>
          
          <div className="mt-8 pt-6 border-t flex flex-wrap justify-end gap-3 print:hidden">"""
footer_replacement = """              </div>
            </div>
          </div>
          
          <div className="p-6 sm:p-8 border-t border-stone-100 flex flex-wrap justify-end gap-3 print:hidden shrink-0 bg-stone-50">"""

if modal_target in content:
    content = content.replace(modal_target, modal_replacement)
    content = content.replace(footer_target, footer_replacement)
    
with open('src/pages/TransactionDetail.tsx', 'w') as f:
    f.write(content)

print("Done")
