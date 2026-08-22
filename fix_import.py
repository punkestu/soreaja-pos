import re

with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

import_statement = "import { QRCodeSVG } from 'qrcode.react';\n"
if "qrcode.react" not in content:
    # Insert right after react-router-dom
    content = content.replace("import { useParams, useNavigate, Link } from 'react-router-dom';", "import { useParams, useNavigate, Link } from 'react-router-dom';\n" + import_statement)
    with open('src/pages/TransactionDetail.tsx', 'w') as f:
        f.write(content)
