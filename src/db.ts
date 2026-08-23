import Dexie, { type EntityTable } from 'dexie';


export interface LoanPayment {
  id: string;
  amount: number;
  payer: string;
  timestamp: Date;
  mutation_id: string;
}

export interface Loan {
  id: string;
  borrower: string;
  reason: string;
  amount: number;
  status: 'active' | 'paid';
  payments: LoanPayment[];
  wallet: string;
  mutation_id: string;
  timestamp: Date;
  last_updated?: Date;
}

export interface Asset {
  id: string;
  name: string;
  type: 'camera' | 'tool';
  qty_total: number;
  qty_bad: number;
  qty_rented: number;
  price?: number;
  last_updated?: Date;
}

export interface Package {
  id: string;
  name: string;
  items: { asset_id: string; qty: number }[];
  last_updated?: Date;
}


export interface Transaction {
  id: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  start_date: Date;
  end_date: Date;
  items: { asset_id: string; qty: number }[];
  financials: { extra_fee: number; discount: number; total_cost: number; notes?: string };
  status: 'booked' | 'active' | 'completed' | 'cancelled';
  cancel_reason?: string;
  last_updated?: Date;
  gdrive_folder_id?: string;
  gdrive_folder_url?: string;
  give_method?: 'self_pickup' | 'antar';
  take_method?: 'self_pickup' | 'antar';
  checklists: {
    give: {
      items_given: boolean;
      payment_fulfilled: boolean;
      id_card_taken: boolean;
      doc_image_id?: string;
      doc_gdrive_id?: string;
      doc_gdrive_link?: string;
      tutorial_camera: boolean;
      tutorial_card: boolean;
      tutorial_charger: boolean;
    };
    take: {
      id_card_returned: boolean;
      items_checked: boolean;
      doc_take_image_id?: string;
      doc_take_gdrive_id?: string;
      doc_take_gdrive_link?: string;
      gdrive_upload_needed: boolean;
      gdrive_uploaded: boolean;
    };
  };
}

export interface Mutation {
  id: string;
  type: string;
  source: string; // Customer name, investor name, or shop name
  location: string; // 'cash', 'bri', 'bca', 'mandiri', etc.
  amount: number;
  description: string;
  reference_id?: string;
  timestamp: Date;
  last_updated?: Date;
}

export interface DocImage {
  id: string; // uuid, usually used in doc_image_id
  transaction_id: string;
  data: Blob; // The actual image data
  gdrive_id?: string;
  last_updated?: Date;
}

export interface AppSetting {
  key: string;
  value: string;
}

export const db = new Dexie('SoreAjaDatabase') as Dexie & {
  assets: EntityTable<Asset, 'id'>;
  transactions: EntityTable<Transaction, 'id'>;
  mutations: EntityTable<Mutation, 'id'>;
  images: EntityTable<DocImage, 'id'>;
  packages: EntityTable<Package, 'id'>;
  settings: EntityTable<AppSetting, 'key'>;
  loans: EntityTable<Loan, 'id'>;
};

db.version(1).stores({
  assets: 'id, name, type',
  transactions: 'id, customer_name, status, start_date, end_date',
  mutations: 'id, type, location, reference_id, timestamp',
  images: 'id, transaction_id'
});

db.version(2).stores({
  assets: 'id, name, type',
  transactions: 'id, customer_name, status, start_date, end_date',
  mutations: 'id, type, location, reference_id, timestamp',
  images: 'id, transaction_id',
  packages: 'id, name'
});

db.version(3).stores({
  assets: 'id, name, type',
  transactions: 'id, customer_name, status, start_date, end_date',
  mutations: 'id, type, location, reference_id, timestamp',
  images: 'id, transaction_id',
  packages: 'id, name',
  settings: 'key'
});

db.version(4).stores({
  assets: 'id, name, type',
  transactions: 'id, customer_name, status, start_date, end_date',
  mutations: 'id, type, location, reference_id, timestamp',
  images: 'id, transaction_id',
  packages: 'id, name',
  settings: 'key',
  loans: 'id, borrower, status, timestamp'
});

['assets', 'transactions', 'mutations', 'images', 'packages', 'loans'].forEach(tableName => {
  db.table(tableName).hook('creating', function (primKey, obj, transaction) {
    obj.last_updated = new Date();
  });
  db.table(tableName).hook('updating', function (modifications, primKey, obj, transaction) {
    return { ...modifications, last_updated: new Date() };
  });
});
