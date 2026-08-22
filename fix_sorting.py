import re

# Update Transactions.tsx
with open('src/pages/Transactions.tsx', 'r') as f:
    content = f.read()

old_query = """  const transactions = useLiveQuery(() => db.transactions.toArray());
  const [search, setSearch] = useState('');

  const filtered = transactions?.filter(t => 
    t.customer_name.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const dateA = a.last_updated ? new Date(a.last_updated).getTime() : new Date(a.start_date).getTime();
    const dateB = b.last_updated ? new Date(b.last_updated).getTime() : new Date(b.start_date).getTime();
    return dateB - dateA;
  });"""

new_query = """  const transactions = useLiveQuery(async () => {
    const data = await db.transactions.toArray();
    return data.sort((a, b) => {
      const dateA = a.last_updated ? new Date(a.last_updated).getTime() : new Date(a.start_date).getTime();
      const dateB = b.last_updated ? new Date(b.last_updated).getTime() : new Date(b.start_date).getTime();
      return dateB - dateA;
    });
  });
  const [search, setSearch] = useState('');

  const filtered = transactions?.filter(t => 
    t.customer_name.toLowerCase().includes(search.toLowerCase())
  );"""

content = content.replace(old_query, new_query)

with open('src/pages/Transactions.tsx', 'w') as f:
    f.write(content)

# Update Dashboard.tsx
with open('src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

old_mutations_query = """  const mutations = useLiveQuery(async () => {
    const data = await db.mutations.toArray();
    return data.sort((a, b) => {
      const dateA = a.last_updated ? new Date(a.last_updated).getTime() : new Date(a.timestamp).getTime();
      const dateB = b.last_updated ? new Date(b.last_updated).getTime() : new Date(b.timestamp).getTime();
      return dateB - dateA;
    }).slice(0, 3);
  });"""

new_mutations_query = """  const mutations = useLiveQuery(async () => {
    const data = await db.mutations.toArray();
    return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 3);
  });"""

content = content.replace(old_mutations_query, new_mutations_query)

with open('src/pages/Dashboard.tsx', 'w') as f:
    f.write(content)

print("Done")
