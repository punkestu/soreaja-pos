import { triggerAutoSync } from '../lib/sync';
import type { FormEvent, ChangeEvent } from 'react';
import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as htmlToImage from 'html-to-image';
import { QRCodeCanvas } from 'qrcode.react';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, Transaction, Mutation, DocImage } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, CheckCircle2, Circle, Camera, Upload, Trash2, Wallet, ExternalLink, FolderPlus, Edit2, FileText, Printer, X, Download } from 'lucide-react';
import { CurrencyInput } from '../components/CurrencyInput';
import { initAuth, googleSignIn } from '../auth';
import { createCustomerFolder } from '../lib/sync';

export function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tx = useLiveQuery(() => db.transactions.get(id!), [id]);
  const mutations = useLiveQuery(async () => {
    const data = await db.mutations.where('reference_id').equals(id!).toArray();
    return data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [id]);
  const images = useLiveQuery(() => db.images.where('transaction_id').equals(id!).toArray(), [id]);
  const assets = useLiveQuery(() => db.assets.toArray());

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentLocation, setPaymentLocation] = useState('Cash');
  const [paymentReason, setPaymentReason] = useState('');
  const [folderStatus, setFolderStatus] = useState<'idle' | 'creating' | 'error'>('idle');

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editGiveMethod, setEditGiveMethod] = useState<'self_pickup' | 'antar'>('self_pickup');
  const [editTakeMethod, setEditTakeMethod] = useState<'self_pickup' | 'antar'>('self_pickup');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const isInIframe = window.self !== window.top;

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);
    try {
      const url = await htmlToImage.toPng(receiptRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${tx?.customer_name.replace(/\s+/g, '_')}_${tx?.id.substring(0, 8)}.png`;
      a.click();
    } catch (error) {
      console.error('Failed to download receipt', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!tx || !assets) return <div className="p-10 text-center text-stone-500">Loading or not found...</div>;

  const totalPaid = mutations?.reduce((sum, m) => sum + (m.type === 'expense' ? -m.amount : m.amount), 0) || 0;
  const remaining = tx.financials.total_cost - totalPaid;

  function openEditDetails() {
    if (!tx) return;
    setEditPhone(tx.customer_phone || '');
    setEditAddress(tx.customer_address || '');
    setEditGiveMethod(tx.give_method || 'self_pickup');
    setEditTakeMethod(tx.take_method || 'self_pickup');
    setIsEditingDetails(true);
  }

  async function saveDetails(e: FormEvent) {
    e.preventDefault();
    if (!tx) return;
    await db.transactions.update(tx.id, {
      customer_phone: editPhone || undefined,
      customer_address: editAddress || undefined,
      give_method: editGiveMethod,
      take_method: editTakeMethod,
      last_updated: new Date()
    });
    setIsEditingDetails(false);
  }

  function handleExportReceipt() {
    setIsReceiptModalOpen(true);
  }

  function triggerCancelFlow() {
    setCancelReason('');
    setRefundAmount(totalPaid > 0 ? totalPaid : 0);
    setIsCancelModalOpen(true);
  }

  async function confirmCancel(e: FormEvent) {
    e.preventDefault();
    if (!tx) return;

    await db.transaction('rw', db.transactions, db.assets, db.mutations, async () => {
      if (tx.status === 'active') {
        for (const item of tx.items) {
          const asset = await db.assets.get(item.asset_id);
          if (asset) {
            await db.assets.update(asset.id, { qty_rented: Math.max(0, asset.qty_rented - item.qty) });
          }
        }
      }

      await db.transactions.update(tx.id, { 
        status: 'cancelled',
        cancel_reason: cancelReason
      });
      triggerAutoSync();

      if (refundAmount > 0) {
        await db.mutations.add({
          id: uuidv4(),
          type: 'expense',
          source: tx.customer_name,
          location: 'cash',
          amount: refundAmount,
          description: `Refund for cancelled rental: ${cancelReason}`,
          reference_id: tx.id,
          timestamp: new Date()
        });
      }
    });
    
    setIsCancelModalOpen(false);
  }

  async function toggleChecklist(phase: 'give' | 'take', field: string) {
    if (!tx) return;
    const currentVal = tx.checklists[phase][field as keyof typeof tx.checklists[typeof phase]];
    await db.transactions.update(tx.id, {
      [`checklists.${phase}.${field}`]: !currentVal
    } as any);
    triggerAutoSync();
  }

  async function handleStatusChange(newStatus: 'active' | 'completed') {
    if (!tx) return;
    
    await db.transaction('rw', db.transactions, db.assets, async () => {
      if (tx.status === 'booked' && newStatus === 'active') {
        for (const item of tx.items) {
          const asset = await db.assets.get(item.asset_id);
          if (asset) {
            await db.assets.update(asset.id, { qty_rented: asset.qty_rented + item.qty });
          }
        }
      } else if (tx.status === 'active' && newStatus === 'completed') {
        for (const item of tx.items) {
          const asset = await db.assets.get(item.asset_id);
          if (asset) {
            await db.assets.update(asset.id, { qty_rented: Math.max(0, asset.qty_rented - item.qty) });
          }
        }
      }
      await db.transactions.update(tx.id, { status: newStatus });
    });
    triggerAutoSync();
  }

  async function handlePayment(e: FormEvent) {
    e.preventDefault();
    if (!tx || paymentAmount <= 0) return;
    
    let description = `Payment for ${tx.customer_name}`;
    if (paymentAmount > remaining) {
      if (!paymentReason) return; // Prevent submission without reason
      description += ` - Reason: ${paymentReason}`;
    }

    await db.mutations.add({
      id: uuidv4(),
      type: 'rent',
      source: 'customer - ' + tx.customer_name,
      location: paymentLocation.toLowerCase(),
      amount: paymentAmount,
      description,
      reference_id: tx.id,
      timestamp: new Date()
    });

    setIsPaymentModalOpen(false);
    setPaymentAmount(0);
    setPaymentLocation('Cash');
    setPaymentReason('');
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !tx) return;
    
    // Convert to Blob
    const blob = new Blob([file], { type: file.type });
    const imgId = uuidv4();

    await db.images.add({
      id: imgId,
      transaction_id: tx.id,
      data: blob
    });

    // Assume for 'give' phase if not complete, otherwise 'take'
    if (tx.status !== 'completed') {
       await db.transactions.update(tx.id, { 'checklists.give.doc_image_id': imgId });
    } else {
       await db.transactions.update(tx.id, { 'checklists.take.doc_take_image_id': imgId });
    }
  }

  async function createFolder() {
    if (!tx) return;
    setFolderStatus('creating');
    try {
      await initAuth();
      const authResult = await googleSignIn();
      if (!authResult) throw new Error('Auth failed');
      const folderName = `${tx.customer_name} - ${new Date(tx.start_date).toISOString().slice(0, 10)} - ${tx.id.substring(0, 8)}`;
      const folderData = await createCustomerFolder(authResult.accessToken, folderName);
      await db.transactions.update(tx.id, { gdrive_folder_url: folderData.url });
      setFolderStatus('idle');
    } catch (error) {
      console.error(error);
      setFolderStatus('error');
    }
  }

  return (
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
          <div className="col-span-full">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Rental Periods</h3>
            <p className="text-sm text-stone-800"><span className="font-medium text-stone-500">From:</span> {tx.start_date.toLocaleString()}</p>
            <p className="text-sm text-stone-800 mt-1"><span className="font-medium text-stone-500">To:</span> {tx.end_date.toLocaleString()}</p>
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
        <div className="bg-stone-50 rounded-xl p-5 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-stone-500">Items Cost</span> <span className="font-mono">Rp {(tx.financials.total_cost - tx.financials.extra_fee + tx.financials.discount).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">Additional Cost</span> <span className="font-mono">Rp {tx.financials.extra_fee.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-stone-500">Discount</span> <span className="font-mono text-red-600">-Rp {tx.financials.discount.toLocaleString()}</span></div>
          <div className="flex justify-between font-bold text-base pt-3 border-t border-stone-200 mt-2"><span className="text-stone-700">Final Total</span> <span className="font-mono text-stone-900">Rp {tx.financials.total_cost.toLocaleString()}</span></div>
          <div className="flex justify-between font-medium pt-1"><span className="text-stone-500">Total Paid</span> <span className="font-mono text-emerald-600">Rp {totalPaid.toLocaleString()}</span></div>
          <div className="flex justify-between font-bold pt-1"><span className="text-stone-500">Remaining</span> <span className={`font-mono ${remaining > 0 ? 'text-red-600' : 'text-stone-900'}`}>Rp {Math.max(0, remaining).toLocaleString()}</span></div>
        </div>
        {tx.financials.notes && (
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
                <input 
                  list="payment-locations"
                  value={paymentLocation}
                  onChange={e => setPaymentLocation(e.target.value)}
                  placeholder="e.g. Cash, BCA, Transfer..."
                  className="w-full border border-stone-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <datalist id="payment-locations">
                  <option value="Cash" />
                  <option value="BCA" />
                  <option value="BRI" />
                  <option value="Mandiri" />
                </datalist>
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
        <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:w-full print:rounded-none">
          <div className="flex justify-between items-center p-6 sm:p-8 border-b border-stone-100 print:hidden shrink-0">
            <h3 className="text-xl font-bold text-stone-800">Receipt Preview</h3>
            <button onClick={() => setIsReceiptModalOpen(false)} className="text-stone-400 hover:text-stone-600"><X /></button>
          </div>
          
          <div className="overflow-y-auto print:overflow-visible">
            <div ref={receiptRef} className="bg-white p-6 sm:p-8">
              <div className="space-y-6 text-sm text-stone-800">
            <div className="text-center border-b pb-5">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold text-stone-400 uppercase text-xs mb-2 border-b pb-1">Start Phase Checklists</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {tx.checklists.give.items_given ? <CheckCircle2 className="w-3 h-3 text-stone-800" /> : <Circle className="w-3 h-3 text-stone-300" />} <span className={tx.checklists.give.items_given ? 'text-stone-800 font-medium' : 'text-stone-500'}>Items Given</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.checklists.give.payment_fulfilled ? <CheckCircle2 className="w-3 h-3 text-stone-800" /> : <Circle className="w-3 h-3 text-stone-300" />} <span className={tx.checklists.give.payment_fulfilled ? 'text-stone-800 font-medium' : 'text-stone-500'}>Payment Fulfilled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.checklists.give.id_card_taken ? <CheckCircle2 className="w-3 h-3 text-stone-800" /> : <Circle className="w-3 h-3 text-stone-300" />} <span className={tx.checklists.give.id_card_taken ? 'text-stone-800 font-medium' : 'text-stone-500'}>ID Card Taken</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.checklists.give.tutorial_camera ? <CheckCircle2 className="w-3 h-3 text-stone-800" /> : <Circle className="w-3 h-3 text-stone-300" />} <span className={tx.checklists.give.tutorial_camera ? 'text-stone-800 font-medium' : 'text-stone-500'}>Tutorial Camera</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.checklists.give.tutorial_card ? <CheckCircle2 className="w-3 h-3 text-stone-800" /> : <Circle className="w-3 h-3 text-stone-300" />} <span className={tx.checklists.give.tutorial_card ? 'text-stone-800 font-medium' : 'text-stone-500'}>Tutorial Mem. Card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.checklists.give.tutorial_charger ? <CheckCircle2 className="w-3 h-3 text-stone-800" /> : <Circle className="w-3 h-3 text-stone-300" />} <span className={tx.checklists.give.tutorial_charger ? 'text-stone-800 font-medium' : 'text-stone-500'}>Tutorial Charger</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-stone-400 uppercase text-xs mb-2 border-b pb-1">Return Phase Checklists</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {tx.checklists.take.id_card_returned ? <CheckCircle2 className="w-3 h-3 text-stone-800" /> : <Circle className="w-3 h-3 text-stone-300" />} <span className={tx.checklists.take.id_card_returned ? 'text-stone-800 font-medium' : 'text-stone-500'}>ID Card Returned</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.checklists.take.items_checked ? <CheckCircle2 className="w-3 h-3 text-stone-800" /> : <Circle className="w-3 h-3 text-stone-300" />} <span className={tx.checklists.take.items_checked ? 'text-stone-800 font-medium' : 'text-stone-500'}>Items Checked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.checklists.take.gdrive_uploaded ? <CheckCircle2 className="w-3 h-3 text-stone-800" /> : <Circle className="w-3 h-3 text-stone-300" />} <span className={tx.checklists.take.gdrive_uploaded ? 'text-stone-800 font-medium' : 'text-stone-500'}>G-Drive Uploaded</span>
                  </div>
                </div>
              </div>
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
                <div className="flex justify-between font-bold pt-1"><span className="text-stone-500">Remaining:</span> <span>Rp {Math.max(0, remaining).toLocaleString()}</span></div>
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
            )}

            {tx.gdrive_folder_url && (
              <div className="mt-6 pt-6 border-t print:break-inside-avoid">
                <h4 className="font-bold text-stone-400 uppercase text-xs mb-4 text-center">Google Drive Folder</h4>
                <div className="flex flex-col items-center justify-center space-y-3">
                  <QRCodeCanvas value={tx.gdrive_folder_url} size={140} level="M" />
                  <p className="text-[10px] text-stone-500 break-all text-center px-4 max-w-[90%]">{tx.gdrive_folder_url}</p>
                </div>
              </div>
            )}

            <div className="text-center pt-6 text-stone-500 italic border-t">
              Thank you for renting with us!
            </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 sm:p-8 border-t border-stone-100 flex flex-wrap justify-end gap-3 print:hidden shrink-0 bg-stone-50">
            <button onClick={() => setIsReceiptModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200">Close</button>
            <button onClick={handleDownloadReceipt} disabled={isDownloading} className="px-5 py-2.5 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
              <Download className="w-4 h-4" /> {isDownloading ? 'Saving...' : 'Save as Image'}
            </button>
            {!isInIframe && (
              <button onClick={() => window.print()} className="px-5 py-2.5 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
                <Printer className="w-4 h-4" /> Print
              </button>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
