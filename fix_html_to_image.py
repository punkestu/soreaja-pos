with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

content = content.replace("import html2canvas from 'html2canvas';", "import * as htmlToImage from 'html-to-image';")

old_capture_logic = """      const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const url = canvas.toDataURL('image/png');"""

new_capture_logic = """      const url = await htmlToImage.toPng(receiptRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });"""

content = content.replace(old_capture_logic, new_capture_logic)

with open('src/pages/TransactionDetail.tsx', 'w') as f:
    f.write(content)

print("Done")
