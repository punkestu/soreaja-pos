import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Loan } from '../db';
import { Plus, HandCoins, ArrowRight, X, ArrowDownRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { formatTz } from '../lib/tz';
import { CurrencyInput } from '../components/CurrencyInput';

export function Loans() {
  const loans = useLiveQuery(() => db.loans.orderBy('timestamp').reverse().toArray());
  const mutations = useLiveQuery(() => db.mutations.toArray());

  // Derive unique locations for wallet selection
  const uniqueLocations = Array.from(new Set(mutations?.map(m => m.location) || [])).filter(Boolean);
  
  const [isAdding, setIsAdding] = useState(false);
  const [borrower, setBorrower] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState(0);
  const [wallet, setWallet] = useState('');

  const [payingLoan, setPayingLoan] = useState<Loan | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payer, setPayer] = useState('');
  const [payWallet, setPayWallet] = useState('');

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = amount;
    if (numAmount <= 0) return;

    const mutationId = uuidv4();
    const loanId = uuidv4();
    const now = new Date();

    // Create outward mutation
    await db.mutations.add({
      id: mutationId,
      type: 'loan',
      source: 'sore',
      location: wallet,
      amount: -numAmount,
      description: `Loan ${borrower} - ${reason}`,
      timestamp: now,
    });

    // Create loan
    await db.loans.add({
      id: loanId,
      borrower,
      reason,
      amount: numAmount,
      status: 'active',
      payments: [],
      wallet,
      mutation_id: mutationId,
      timestamp: now,
    });

    setIsAdding(false);
    setBorrower('');
    setReason('');
    setAmount(0);
    setWallet('');
  };

  const handlePayLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingLoan) return;

    const numAmount = payAmount;
    if (numAmount <= 0) return;

    const mutationId = uuidv4();
    const now = new Date();

    // Create inward mutation
    await db.mutations.add({
      id: mutationId,
      type: 'repayment',
      source: payer,
      location: payWallet,
      amount: numAmount,
      description: `Pay loan ${payingLoan.borrower} - pay by ${payer}`,
      timestamp: now,
    });

    // Update loan
    const newPayments = [
      ...payingLoan.payments,
      {
        id: uuidv4(),
        amount: numAmount,
        payer,
        timestamp: now,
        mutation_id: mutationId
      }
    ];

    const totalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
    const newStatus = totalPaid >= payingLoan.amount ? 'paid' : 'active';

    await db.loans.update(payingLoan.id, {
      payments: newPayments,
      status: newStatus
    });

    setPayingLoan(null);
    setPayAmount(0);
    setPayer('');
    setPayWallet('');
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 pb-24 md:pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
            <HandCoins className="w-8 h-8 text-orange-500" />
            Loans & Advances
          </h1>
          <p className="text-stone-500 font-medium mt-1">Manage cash advances and track repayments.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Issue Loan</span>
        </button>
      </header>

      {/* Loans List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <ul className="divide-y divide-stone-100">
          {loans?.length === 0 ? (
            <li className="px-6 py-12 text-center text-stone-500">No loans active.</li>
          ) : loans?.map(loan => {
            const totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
            return (
              <li key={loan.id} className="p-6 hover:bg-stone-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-lg text-stone-900">{loan.borrower}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        loan.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {loan.status}
                      </span>
                    </div>
                    <p className="text-stone-500 text-sm mt-1">{loan.reason}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-stone-500 font-medium">
                      <span className="flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        From {loan.wallet}
                      </span>
                      <span>•</span>
                      <span>{formatTz(loan.timestamp, 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-medium text-stone-500">Amount</p>
                      <p className="text-xl font-bold font-mono text-stone-800">Rp {loan.amount.toLocaleString()}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-medium text-stone-400">Paid: Rp {totalPaid.toLocaleString()}</p>
                    </div>
                    {loan.status === 'active' && (
                      <button
                        onClick={() => {
                          setPayingLoan(loan);
                          setPayer(loan.borrower);
                          setPayAmount(loan.amount - totalPaid);
                        }}
                        className="mt-2 bg-orange-100 hover:bg-orange-200 text-orange-700 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors w-fit"
                      >
                        Add Payment
                      </button>
                    )}
                  </div>
                </div>

                {/* Payments History */}
                {loan.payments.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-stone-100">
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Repayment History</h4>
                    <div className="space-y-2">
                      {loan.payments.map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-100">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                              <ArrowDownRight className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-stone-900">{p.payer}</p>
                              <p className="text-xs text-stone-500">{formatTz(p.timestamp, 'MMM d, yyyy HH:mm')}</p>
                            </div>
                          </div>
                          <p className="font-mono font-bold text-emerald-600">+Rp {p.amount.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Add Loan Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-stone-900">Issue Loan</h2>
              <button onClick={() => setIsAdding(false)} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddLoan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Borrower</label>
                <input required value={borrower} onChange={e => setBorrower(e.target.value)} className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500" placeholder="Who is borrowing?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Reason / Description</label>
                <input required value={reason} onChange={e => setReason(e.target.value)} className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500" placeholder="What is the loan for?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Amount (Rp)</label>
                <CurrencyInput required value={amount} onChange={setAmount} className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 font-mono focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Source Wallet</label>
                <input type="text" list="wallet-list" required value={wallet} onChange={e => setWallet(e.target.value)} className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500" placeholder="e.g., cash, bca" />
                <datalist id="wallet-list">
                  {uniqueLocations.map(l => <option key={l} value={l} />)}
                </datalist>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 px-4 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 px-4 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 transition-colors">Issue Loan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repay Loan Modal */}
      {payingLoan && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-stone-900">Record Payment</h2>
              <button onClick={() => setPayingLoan(null)} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handlePayLoan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Payer</label>
                <input required value={payer} onChange={e => setPayer(e.target.value)} className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500" placeholder="Who is paying?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Payment Amount (Rp)</label>
                <CurrencyInput required value={payAmount} onChange={setPayAmount} className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 font-mono focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Destination Wallet</label>
                <input type="text" list="pay-wallet-list" required value={payWallet} onChange={e => setPayWallet(e.target.value)} className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500" placeholder="e.g., cash, bca" />
                <datalist id="pay-wallet-list">
                  {uniqueLocations.map(l => <option key={l} value={l} />)}
                </datalist>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setPayingLoan(null)} className="flex-1 py-3 px-4 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 px-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
