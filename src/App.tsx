/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Assets } from './pages/Assets';
import { Packages } from './pages/Packages';
import { Transactions } from './pages/Transactions';
import { NewTransaction } from './pages/NewTransaction';
import { TransactionDetail } from './pages/TransactionDetail';
import { Mutations } from './pages/Mutations';
import { Loans } from './pages/Loans';
import { Settings } from './pages/Settings';
import { Docs } from './pages/Docs';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="assets" element={<Assets />} />
          <Route path="packages" element={<Packages />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="transactions/new" element={<NewTransaction />} />
          <Route path="transactions/:id" element={<TransactionDetail />} />
          <Route path="mutations" element={<Mutations />} />
          <Route path="loans" element={<Loans />} />
                              <Route path="settings" element={<Settings />} />
          <Route path="docs" element={<Docs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
