import re

with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

# Import triggerAutoSync
if "triggerAutoSync" not in content:
    content = "import { triggerAutoSync } from '../lib/sync';\n" + content

# In saveDetails
old_save = """    await db.transactions.update(tx.id, {
      customer_phone: editPhone || undefined,
      customer_address: editAddress || undefined,
      give_method: editGiveMethod,
      take_method: editTakeMethod,
      last_updated: new Date()
    });
    setEditing(false);"""
new_save = """    await db.transactions.update(tx.id, {
      customer_phone: editPhone || undefined,
      customer_address: editAddress || undefined,
      give_method: editGiveMethod,
      take_method: editTakeMethod,
      last_updated: new Date()
    });
    setEditing(false);
    triggerAutoSync();"""
content = content.replace(old_save, new_save)

# In cancelTransaction
old_cancel = """      await db.transactions.update(tx.id, { 
        status: 'cancelled',
        cancel_reason: cancelReason
      });"""
new_cancel = """      await db.transactions.update(tx.id, { 
        status: 'cancelled',
        cancel_reason: cancelReason
      });
      triggerAutoSync();"""
content = content.replace(old_cancel, new_cancel)

# In handleStatusChange
old_status = """      await db.transactions.update(tx.id, { status: newStatus });
    });
  }"""
new_status = """      await db.transactions.update(tx.id, { status: newStatus });
    });
    triggerAutoSync();
  }"""
content = content.replace(old_status, new_status)

# In toggleChecklist
old_toggle = """    await db.transactions.update(tx.id, {
      [`checklists.${phase}.${field}`]: !currentVal
    } as any);"""
new_toggle = """    await db.transactions.update(tx.id, {
      [`checklists.${phase}.${field}`]: !currentVal
    } as any);
    triggerAutoSync();"""
content = content.replace(old_toggle, new_toggle)

with open('src/pages/TransactionDetail.tsx', 'w') as f:
    f.write(content)
print("Patched TransactionDetail.tsx")
