"""Extrae el texto de un .docx párrafo por párrafo (incluye tablas y controles de contenido)."""
import re
import sys
import zipfile


def extract(path):
    with zipfile.ZipFile(path) as z:
        xml = z.read('word/document.xml').decode('utf8')
    out = []
    for para in re.findall(r'<w:p[ >].*?</w:p>', xml, flags=re.S):
        texts = re.findall(r'<w:t[^>]*>([^<]*)</w:t>', para)
        line = ''.join(texts).strip()
        if line:
            out.append(line)
    return '\n'.join(out)


if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    txt = extract(src)
    with open(dst, 'w', encoding='utf8') as f:
        f.write(txt)
    print(dst, len(txt.split()))
