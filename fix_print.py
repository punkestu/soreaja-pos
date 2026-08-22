import re

with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace("import { QRCodeSVG } from 'qrcode.react';", "import { QRCodeCanvas } from 'qrcode.react';")
if "import html2canvas" not in content:
    content = content.replace("import { useParams, useNavigate, Link } from 'react-router-dom';", "import { useParams, useNavigate, Link } from 'react-router-dom';\nimport html2canvas from 'html2canvas';")

content = content.replace("FileText, Printer, X", "FileText, Printer, X, Download")

# 2. Update QRCodeSVG to QRCodeCanvas
content = content.replace("<QRCodeSVG ", "<QRCodeCanvas ")

# 3. Add states and ref
state_insert = """  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const isInIframe = window.self !== window.top;

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${tx?.customer_name.replace(/\s+/g, '_')}_${tx?.id.substring(0, 8)}.png`;
      a.click();
    } catch (error) {
      console.error('Failed to download receipt', error);
    } finally {
      setIsDownloading(false);
    }
  };"""

content = content.replace("  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);", state_insert)

# 4. Add the ref to the receipt body
receipt_body_target = '<div className="space-y-6 text-sm text-stone-800">'
receipt_body_replacement = '<div ref={receiptRef} className="space-y-6 text-sm text-stone-800 bg-white p-4 sm:p-0">'
content = content.replace(receipt_body_target, receipt_body_replacement)

# 5. Update the buttons
buttons_target = """          <div className="mt-8 pt-6 border-t flex justify-end gap-4 print:hidden">
            <button onClick={() => setIsReceiptModalOpen(false)} className="px-6 py-2.5 rounded-xl font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200">Close</button>
            <button onClick={() => window.print()} className="px-6 py-2.5 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
          </div>"""

buttons_replacement = """          <div className="mt-8 pt-6 border-t flex flex-wrap justify-end gap-3 print:hidden">
            <button onClick={() => setIsReceiptModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200">Close</button>
            <button onClick={handleDownloadReceipt} disabled={isDownloading} className="px-5 py-2.5 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
              <Download className="w-4 h-4" /> {isDownloading ? 'Saving...' : 'Save as Image'}
            </button>
            {!isInIframe && (
              <button onClick={() => window.print()} className="px-5 py-2.5 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
                <Printer className="w-4 h-4" /> Print
              </button>
            )}
          </div>"""

content = content.replace(buttons_target, buttons_replacement)

with open('src/pages/TransactionDetail.tsx', 'w') as f:
    f.write(content)

print("Done")
