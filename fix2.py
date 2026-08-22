import os

with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

return_idx = content.find("  return (\n    <>")
before_return = content[:return_idx]

JSX = """  return (
    <>
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8 pb-24 md:pb-10 relative print:hidden">
      <header className="flex items-center justify-between">
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
      </header>

      {/* Details Card */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative">
        <button 
          onClick={openEditDetails}
          className="absolute top-6 right-6 text-stone-400 hover:text-blue-600 transition-colors"
          title="Edit Details"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Contact Info</h3>
            {tx.customer_phone ? <p className="text-sm font-medium text-stone-800">{tx.customer_phone}</p> : <p className="text-sm text-stone-400 italic">No phone provided</p>}
            {tx.customer_address && <p className="text-sm text-stone-600 mt-1">{tx.customer_address}</p>}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Delivery Methods</h3>
            <p className="text-sm text-stone-800"><span className="font-medium text-stone-500">Start (Give):</span> {tx.give_method === 'antar' ? 'Antar (Delivery)' : 'Self Pickup'}</p>
            <p className="text-sm text-stone-800 mt-1"><span className="font-medium text-stone-500">Return (Take):</span> {tx.take_method === 'antar' ? 'Jemput (Pickup)' : 'Self Drop-off'}</p>
          </div>
        </div>
      </div>

      {/* Rented Items */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <h2 className="font-semibold text-lg mb-4">Rented Items</h2>
        <div className="space-y-3">
          {tx.items.map((item, idx) => {
            const asset = assets.find(a => a.id === item.asset_id);
            return (
              <div key={idx} className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-100">
                <div className="font-medium text-stone-800">{asset ? asset.name : 'Unknown Item'}</div>
                <div className="text-sm font-bold text-stone-600 bg-stone-200 px-2 py-1 rounded-md">{item.qty}x</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financials & Payment */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Financials</h2>
          <button 
            onClick={() => {
              setPaymentAmount(remaining > 0 ? remaining : 0);
              setIsPaymentModalOpen(true);
            }}
            className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Wallet className="w-4 h-4" /> Add Payment
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="col-span-full md:col-span-1 text-center md:text-left"><p className="text-stone-500">Final Total</p><p className="font-bold font-mono">Rp {tx.financials.total_cost.toLocaleString()}</p></div>
          <div><p className="text-stone-500">Paid</p><p className="font-bold font-mono text-emerald-600">Rp {totalPaid.toLocaleString()}</p></div>
          <div><p className="text-stone-500">Remaining</p><p className={`font-bold font-mono ${remaining > 0 ? 'text-red-600' : 'text-stone-900'}`}>Rp {remaining.toLocaleString()}</p></div>
          <div><p className="text-stone-500">Items Cost</p><p className="font-bold font-mono">Rp {(tx.financials.total_cost - tx.financials.extra_fee + tx.financials.discount).toLocaleString()}</p></div>
          <div><p className="text-stone-500">Add. Cost</p><p className="font-bold font-mono">Rp {tx.financials.extra_fee.toLocaleString()}</p></div>
          <div><p className="text-stone-500">Discount</p><p className="font-bold font-mono">Rp {tx.financials.discount.toLocaleString()}</p></div>
        </div>
        {tx.financials.notes && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-xl text-sm">
            <span className="font-semibold text-orange-800">Reason/Notes:</span> <span className="text-orange-700">{tx.financials.notes}</span>
          </div>
        )}
      </div>

      {/* Checklists */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <h2 className="font-semibold text-lg mb-4">Checklists</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-stone-500 mb-3 uppercase tracking-wider text-xs">Start Phase (Give)</h3>
            <div className="space-y-3">
              {[
                { key: 'items_given', label: 'Items Given' },
                { key: 'payment_fulfilled', label: 'Payment Fulfilled' },
                { key: 'id_card_taken', label: 'ID Card Taken' },
                { key: 'tutorial_camera', label: 'Tutorial Camera' },
                { key: 'tutorial_card', label: 'Tutorial Memory Card' },
                { key: 'tutorial_charger', label: 'Tutorial Charger' }
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                  <div onClick={() => toggleChecklist('give', item.key as any)} className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors ${tx.checklists.give[item.key as keyof typeof tx.checklists.give] ? 'bg-blue-600 border-blue-600 text-white' : 'border-stone-300 group-hover:border-blue-400'}`}>
                    {tx.checklists.give[item.key as keyof typeof tx.checklists.give] && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <span className={tx.checklists.give[item.key as keyof typeof tx.checklists.give] ? 'text-stone-800 font-medium' : 'text-stone-600'}>{item.label}</span>
                </label>
              ))}
              <div className="pt-2">
                <p className="text-sm font-medium text-stone-700 mb-2">ID Card / Document Photo</p>
                {tx.checklists.give.doc_image_id ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                    <CheckCircle2 className="w-5 h-5" /> Image Saved
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-2 rounded-xl text-sm font-medium transition-colors">
                    <Camera className="w-4 h-4" /> Take / Upload
                  </button>
                )}
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-stone-500 mb-3 uppercase tracking-wider text-xs">Return Phase (Take)</h3>
            <div className="space-y-3">
              {[
                { key: 'id_card_returned', label: 'ID Card Returned' },
                { key: 'items_checked', label: 'Items Checked (No damage)' },
                { key: 'gdrive_uploaded', label: 'Files Uploaded to G-Drive' }
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                  <div onClick={() => toggleChecklist('take', item.key as any)} className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors ${tx.checklists.take[item.key as keyof typeof tx.checklists.take] ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-300 group-hover:border-emerald-400'}`}>
                    {tx.checklists.take[item.key as keyof typeof tx.checklists.take] && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <span className={tx.checklists.take[item.key as keyof typeof tx.checklists.take] ? 'text-stone-800 font-medium' : 'text-stone-600'}>{item.label}</span>
                </label>
              ))}
              <div className="pt-2">
                <p className="text-sm font-medium text-stone-700 mb-2">Return Condition Photo (Optional)</p>
                {tx.checklists.take.doc_take_image_id ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                    <CheckCircle2 className="w-5 h-5" /> Image Saved
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-2 rounded-xl text-sm font-medium transition-colors">
                    <Camera className="w-4 h-4" /> Take / Upload
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Google Drive Integration */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">Google Drive Folder</h2>
        {tx.gdrive_folder_url ? (
          <a href={tx.gdrive_folder_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl font-medium transition-colors">
            <ExternalLink className="w-5 h-5" /> Open Customer Folder
          </a>
        ) : (
          <div>
            <p className="text-stone-500 text-sm mb-4">Create a dedicated folder in Google Drive for this customer's files.</p>
            <button 
              onClick={createFolder}
              disabled={folderStatus === 'creating'}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
            >
              <FolderPlus className="w-5 h-5" />
              {folderStatus === 'creating' ? 'Creating...' : 'Create Folder'}
            </button>
            {folderStatus === 'error' && <p className="text-red-500 text-sm mt-2">Failed to create folder. Please try again or sign in.</p>}
          </div>
        )}
      </div>
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        accept="image/*"
        capture="environment"
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
      />

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold mb-4">Record Payment</h3>
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Amount (Rp)</label>
                <CurrencyInput 
                  required
                  value={paymentAmount}
                  onChange={setPaymentAmount}
                  className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Location</label>
                <select 
                  value={paymentLocation}
                  onChange={e => setPaymentLocation(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="cash">Cash</option>
                  <option value="bca">BCA</option>
                  <option value="bri">BRI</option>
                  <option value="mandiri">Mandiri</option>
                </select>
              </div>
              {paymentAmount > remaining && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Reason for Overpayment</label>
                  <input 
                    type="text"
                    required
                    value={paymentReason}
                    onChange={e => setPaymentReason(e.target.value)}
                    placeholder="e.g. Deposit, tip, etc."
                    className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 py-3 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-red-600">Cancel Rental</h3>
            <form onSubmit={confirmCancel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Reason for Cancellation</label>
                <input 
                  type="text"
                  required
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g. Customer changed mind"
                />
              </div>
              
              {totalPaid > 0 && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Refund Amount (Max: {totalPaid.toLocaleString()})
                  </label>
                  <CurrencyInput 
                    required
                    value={refundAmount}
                    onChange={setRefundAmount}
                    className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  />
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsCancelModalOpen(false)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 py-3 rounded-xl font-semibold">Keep</button>
                <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold">Confirm Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Details Modal */}
      {isEditingDetails && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-stone-800">Edit Details</h3>
            <form onSubmit={saveDetails} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
                <input 
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Address</label>
                <input 
                  type="text"
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Start (Give) Method</label>
                <select 
                  value={editGiveMethod}
                  onChange={e => setEditGiveMethod(e.target.value as 'self_pickup' | 'antar')}
                  className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="self_pickup">Self Pickup</option>
                  <option value="antar">Antar (Delivery)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Return (Take) Method</label>
                <select 
                  value={editTakeMethod}
                  onChange={e => setEditTakeMethod(e.target.value as 'self_pickup' | 'antar')}
                  className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="self_pickup">Self Drop-off</option>
                  <option value="antar">Jemput (Pickup)</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditingDetails(false)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 py-3 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

    {/* Receipt Modal */}
    {isReceiptModalOpen && (
      <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:static print:bg-transparent print:p-0 print:block">
        <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:w-full print:rounded-none">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <h3 className="text-xl font-bold text-stone-800">Receipt Preview</h3>
            <button onClick={() => setIsReceiptModalOpen(false)} className="text-stone-400 hover:text-stone-600"><X /></button>
          </div>
          
          <div className="space-y-6 text-sm text-stone-800">
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-bold uppercase tracking-widest">Rental Receipt</h2>
              <p className="text-stone-500 mt-1">Transaction ID: {tx.id}</p>
              <p className="text-stone-500">Date: {new Date().toLocaleString()}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold text-stone-400 uppercase text-xs mb-1">Customer</h4>
                <p className="font-medium">{tx.customer_name}</p>
                <p>{tx.customer_phone || '-'}</p>
                <p>{tx.customer_address || '-'}</p>
              </div>
              <div>
                <h4 className="font-bold text-stone-400 uppercase text-xs mb-1">Rental Period</h4>
                <p><span className="text-stone-500">Start:</span> {tx.start_date.toLocaleString()}</p>
                <p><span className="text-stone-500">End:</span> {tx.end_date.toLocaleString()}</p>
                <p className="mt-2"><span className="text-stone-500">Delivery:</span> {tx.give_method === 'antar' ? 'Antar (Delivery)' : 'Self Pickup'} <br/> <span className="text-stone-500">Return:</span> {tx.take_method === 'antar' ? 'Jemput (Pickup)' : 'Self Drop-off'}</p>
              </div>
            </div>

            <div>
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
              <h4 className="font-bold text-stone-400 uppercase text-xs mb-2 border-b pb-1">Financials</h4>
              <div className="space-y-1">
                <div className="flex justify-between"><span className="text-stone-500">Items Cost:</span> <span>Rp {(tx.financials.total_cost - tx.financials.extra_fee + tx.financials.discount).toLocaleString()}</span></div>
                {tx.financials.extra_fee > 0 && <div className="flex justify-between"><span className="text-stone-500">Additional Cost:</span> <span>Rp {tx.financials.extra_fee.toLocaleString()}</span></div>}
                {tx.financials.discount > 0 && <div className="flex justify-between"><span className="text-stone-500">Discount:</span> <span>-Rp {tx.financials.discount.toLocaleString()}</span></div>}
                {tx.financials.notes && <div className="text-stone-500 text-xs italic bg-stone-50 p-2 rounded">Notes: {tx.financials.notes}</div>}
                <div className="flex justify-between font-bold text-base pt-2 border-t mt-2"><span>Final Total:</span> <span>Rp {tx.financials.total_cost.toLocaleString()}</span></div>
                <div className="flex justify-between font-medium pt-1"><span className="text-stone-500">Total Paid:</span> <span className="text-emerald-600">Rp {totalPaid.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold pt-1"><span className="text-stone-500">Remaining:</span> <span>Rp {remaining.toLocaleString()}</span></div>
              </div>
            </div>

            <div className="text-center pt-6 text-stone-500 italic border-t">
              Thank you for renting with us!
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t flex justify-end gap-4 print:hidden">
            <button onClick={() => setIsReceiptModalOpen(false)} className="px-6 py-2.5 rounded-xl font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200">Close</button>
            <button onClick={() => window.print()} className="px-6 py-2.5 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
"""

with open('src/pages/TransactionDetail.tsx', 'w') as f:
    f.write(before_return + JSX)

