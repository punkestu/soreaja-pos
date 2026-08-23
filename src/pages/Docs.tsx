import React from 'react';
import { BookOpen, Camera, Package, RefreshCw, Wallet, HandCoins, Settings, Cloud } from 'lucide-react';

export function Docs() {
  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 pb-32 md:pb-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-orange-500" />
          Documentation
        </h1>
        <p className="text-stone-500 mt-2 text-lg">Learn how to use the Rental POS system.</p>
      </header>

      <div className="space-y-8">
        
        <section className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-orange-500" />
            Inventory & Assets
          </h2>
          <div className="space-y-4 text-stone-600 leading-relaxed">
            <p>
              The <strong>Inventory</strong> page is where you manage all your rental equipment. You can categorize items as either <strong>Cameras</strong> or <strong>Tools/Accessories</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Add new assets by specifying their name, type, and total quantity.</li>
              <li>The system automatically tracks how many items are currently rented out.</li>
              <li>You can update the "Bad/Broken" quantity if an item needs maintenance.</li>
            </ul>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-orange-500" />
            Packages
          </h2>
          <div className="space-y-4 text-stone-600 leading-relaxed">
            <p>
              <strong>Packages</strong> allow you to bundle multiple assets together. For example, a "Vlogging Kit" might contain 1 Camera, 1 Tripod, and 2 SD Cards.
            </p>
            <p>
              When creating a new rental transaction, you can quickly add a Package, and the system will automatically include all the associated assets in the correct quantities.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2 mb-4">
            <RefreshCw className="w-5 h-5 text-orange-500" />
            Rentals (Transactions)
          </h2>
          <div className="space-y-4 text-stone-600 leading-relaxed">
            <p>
              The <strong>Rentals</strong> page tracks all customer bookings and active rentals.
            </p>
            <ol className="list-decimal pl-5 space-y-2">
              <li><strong>Booked:</strong> A new transaction starts here. You record customer details, dates, and selected items.</li>
              <li><strong>Active:</strong> Once the customer picks up the items, you move the status to Active. The system updates your inventory's rented quantities.</li>
              <li><strong>Completed:</strong> When items are returned and verified, mark as Completed. Quantities are restored.</li>
            </ol>
            <p className="mt-4">
              <strong>Checklists & Google Drive:</strong> Inside a transaction, you can check off Give/Take tasks (e.g., ID Card taken, Tutorial given). You can also click "Create GDrive Folder" to automatically generate a cloud folder for the customer's files!
            </p>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-orange-500" />
            Cash-Flow (Mutations)
          </h2>
          <div className="space-y-4 text-stone-600 leading-relaxed">
            <p>
              Track all your income and expenses in the <strong>Cash-Flow</strong> page.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Record inflows (rentals, investments) and outflows (maintenance, purchases).</li>
              <li>Specify the source (e.g., Customer Name) and location (e.g., Cash, BCA, Mandiri).</li>
              <li>If you make a mistake, use the "Correct" button to automatically create a reversing entry.</li>
            </ul>
          </div>
        </section>
        
        <section className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2 mb-4">
            <HandCoins className="w-5 h-5 text-orange-500" />
            Loans
          </h2>
          <div className="space-y-4 text-stone-600 leading-relaxed">
            <p>
              Manage debts or borrowed money using the <strong>Loans</strong> feature.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Track who borrowed money, the reason, and the total amount.</li>
              <li>Record partial or full payments over time.</li>
              <li>Payments are automatically synced as income entries in your Cash-Flow page!</li>
            </ul>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-stone-200 p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2 mb-4">
            <Cloud className="w-5 h-5 text-orange-500" />
            Cloud Sync
          </h2>
          <div className="space-y-4 text-stone-600 leading-relaxed">
            <p>
              Your data is stored locally in your browser to keep the app blazing fast. However, it's crucial to backup your data!
            </p>
            <p>
              <strong>Auto-Sync:</strong> When you connect your Google Account via the Floating Action Button (FAB) at the bottom right, the app will automatically sync your transactions and cash-flow updates to a Google Sheet in your Drive every time you save a change.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
