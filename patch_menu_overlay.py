import re

with open('src/pages/TransactionDetail.tsx', 'r') as f:
    content = f.read()

old_menu = """          {isMobileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">"""

new_menu = """          {isMobileMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsMobileMenuOpen(false)} 
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">"""

content = content.replace(old_menu, new_menu)
content = content.replace("            </div>\n          )}\n        </div>", "            </div>\n            </>\n          )}\n        </div>")

with open('src/pages/TransactionDetail.tsx', 'w') as f:
    f.write(content)
print("Patched menu overlay")
