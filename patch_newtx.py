import re

with open('src/pages/NewTransaction.tsx', 'r') as f:
    content = f.read()

# Need to import triggerAutoSync
if "triggerAutoSync" not in content:
    import_str = "import { triggerAutoSync } from '../lib/sync';\n"
    content = import_str + content

# In handleSubmit, after db.transactions.add
old_submit = """    await db.transactions.add({
      id: txId,
      customer_name: customerName,
      customer_phone: customerPhone || undefined,
      customer_address: customerAddress || undefined,
      start_date: new Date(startDate),
      end_date: new Date(endDate),
      give_method: giveMethod,
      take_method: takeMethod,
      items: selectedItems,
      status: 'booked',
      financials: {
        extra_fee: Number(extraFee),
        discount: Number(discount),
        total_cost: totalCost,
        notes: notes || undefined
      },
      checklists: {
        give: { items_given: false, payment_fulfilled: false, id_card_taken: false, tutorial_camera: false, tutorial_card: false, tutorial_charger: false },
        take: { id_card_returned: false, items_checked: false, gdrive_upload_needed: false, gdrive_uploaded: false }
      }
    });

    navigate('/transactions');"""

new_submit = """    await db.transactions.add({
      id: txId,
      customer_name: customerName,
      customer_phone: customerPhone || undefined,
      customer_address: customerAddress || undefined,
      start_date: new Date(startDate),
      end_date: new Date(endDate),
      give_method: giveMethod,
      take_method: takeMethod,
      items: selectedItems,
      status: 'booked',
      financials: {
        extra_fee: Number(extraFee),
        discount: Number(discount),
        total_cost: totalCost,
        notes: notes || undefined
      },
      checklists: {
        give: { items_given: false, payment_fulfilled: false, id_card_taken: false, tutorial_camera: false, tutorial_card: false, tutorial_charger: false },
        take: { id_card_returned: false, items_checked: false, gdrive_upload_needed: false, gdrive_uploaded: false }
      }
    });

    triggerAutoSync(); // Auto sync on save

    navigate('/transactions');"""

content = content.replace(old_submit, new_submit)

with open('src/pages/NewTransaction.tsx', 'w') as f:
    f.write(content)
print("Patched NewTransaction.tsx")
