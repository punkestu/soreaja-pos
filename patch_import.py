with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

content = content.replace("FolderPlus, Edit2, FileText, Printer, X, Download } from 'lucide-react';",
                          "FolderPlus, Edit2, FileText, Printer, X, Download, RefreshCw } from 'lucide-react';")

with open('src/pages/TransactionDetail.tsx', 'w') as f:
    f.write(content)
