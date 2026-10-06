# -*- coding: utf-8 -*-
with open('scripts/build_full_safracafe_presentation.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('new_checklist_slide,', 'lambda m: new_checklist_slide,')
text = text.replace('new_slide8,', 'lambda m: new_slide8,')
text = text.replace('new_slide9,', 'lambda m: new_slide9,')
text = text.replace('new_slide10,', 'lambda m: new_slide10,')
text = text.replace('new_slide11,', 'lambda m: new_slide11,')
text = text.replace('new_slide12,', 'lambda m: new_slide12,')
text = text.replace('new_slide14,', 'lambda m: new_slide14,')
text = text.replace('new_slide15,', 'lambda m: new_slide15,')
text = text.replace('new_slide16,', 'lambda m: new_slide16,')
text = text.replace('new_slide20,', 'lambda m: new_slide20,')

with open('scripts/build_full_safracafe_presentation.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Builder script updated with lambda replacements!")
