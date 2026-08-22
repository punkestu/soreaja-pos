with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

# find "return (" at line ~226
return_index = content.find("  return (\n    <>")
if return_index == -1:
    print("Could not find return")
    
# find the end of the first modal
end_marker = "  );\n}"
end_index = content.find(end_marker, return_index)

if end_index != -1:
    clean_content = content[:end_index + len(end_marker)] + "\n"
    with open('src/pages/TransactionDetail.tsx', 'w') as f:
        f.write(clean_content)
    print("Fixed!")
else:
    print("Could not find end marker")

