import re

with open('src/pages/Transactions.tsx', 'r') as f:
    content = f.read()

old_states = """  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = transactions?.filter(t => {
    const matchesSearch = t.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });"""

new_states = """  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const filtered = transactions?.filter(t => {
    const matchesSearch = t.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    let matchesDate = true;
    
    if (startDateFilter) {
      matchesDate = matchesDate && new Date(t.start_date).getTime() >= new Date(startDateFilter).getTime();
    }
    if (endDateFilter) {
      const endOfDay = new Date(endDateFilter);
      endOfDay.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(t.end_date).getTime() <= endOfDay.getTime();
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });"""
content = content.replace(old_states, new_states)

old_ui = """        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search customer name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-stone-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium text-stone-700"
          >
            <option value="all">All Statuses</option>
            <option value="booked">Booked</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>"""

new_ui = """        <div className="p-4 border-b border-stone-100 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input 
                type="text" 
                placeholder="Search customer name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-stone-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium text-stone-700"
            >
              <option value="all">All Statuses</option>
              <option value="booked">Booked</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-stone-500 font-medium">Start:</span>
              <input 
                type="date"
                value={startDateFilter}
                onChange={e => setStartDateFilter(e.target.value)}
                className="flex-1 sm:w-auto px-4 py-2 bg-stone-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium text-stone-700"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-stone-500 font-medium">End:</span>
              <input 
                type="date"
                value={endDateFilter}
                onChange={e => setEndDateFilter(e.target.value)}
                className="flex-1 sm:w-auto px-4 py-2 bg-stone-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium text-stone-700"
              />
            </div>
            {(startDateFilter || endDateFilter) && (
              <button 
                onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }}
                className="w-full sm:w-auto px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-sm font-medium transition-colors"
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>"""
content = content.replace(old_ui, new_ui)

with open('src/pages/Transactions.tsx', 'w') as f:
    f.write(content)
print("Patched filters in Transactions.tsx")
