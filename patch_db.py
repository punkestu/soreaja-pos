import re

with open('src/db.ts', 'r') as f:
    content = f.read()

old_give = """      id_card_taken: boolean;
      doc_image_id?: string;
      tutorial_camera: boolean;"""

new_give = """      id_card_taken: boolean;
      doc_image_id?: string;
      doc_gdrive_id?: string;
      doc_gdrive_link?: string;
      tutorial_camera: boolean;"""
content = content.replace(old_give, new_give)

old_take = """      items_checked: boolean;
      doc_take_image_id?: string;
      gdrive_upload_needed: boolean;"""

new_take = """      items_checked: boolean;
      doc_take_image_id?: string;
      doc_take_gdrive_id?: string;
      doc_take_gdrive_link?: string;
      gdrive_upload_needed: boolean;"""
content = content.replace(old_take, new_take)

with open('src/db.ts', 'w') as f:
    f.write(content)
print("Patched db.ts")
