import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()
    
    text = text.replace('jǭ', 'já')
    text = text.replace('Nǜo', 'Não')
    text = text.replace('nǜo', 'não')
    text = text.replace('possvel', 'possível')
    text = text.replace('estǭ', 'está')
    text = text.replace('j', 'já')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(text)

fix_file('src/components/Movies/AddMovie.jsx')
