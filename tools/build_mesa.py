"""Arma Mesa.dc.html: inserta en la plantilla los métodos del globo 3D.

Toma de Main.dc.html los métodos comunes (proyección, mapa, países, estrechos) y de
tools/mesa_globe.js el globo propio de la mesa (nodos, buques, aviones, camiones y selección).

Uso: python3 tools/build_mesa.py [carpeta_del_mockup]   (por defecto: mockup)
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MOCK = ROOT / (sys.argv[1] if len(sys.argv) > 1 else 'mockup')
main = (MOCK / 'Main.dc.html').read_text(encoding='utf-8')
template = (ROOT / 'tools' / 'Mesa.template.html').read_text(encoding='utf-8')
own = (ROOT / 'tools' / 'mesa_globe.js').read_text(encoding='utf-8').rstrip('\n')
script = main.split('class Component extends DCLogic {')[1]


def method(name):
    """Devuelve el texto completo de un método de la clase, contando llaves."""
    i = script.index('\n  ' + name + '(')
    depth, started, j = 0, False, i + 1
    while True:
        ch = script[j]
        if ch == '{':
            depth += 1
            started = True
        elif ch == '}':
            depth -= 1
            if started and depth == 0:
                return script[i:j + 1]
        j += 1


names = ['tryInit', 'll', 'slerp', 'gameCountries', 'chokepoints', 'alertCountries', 'paintMap']
globe = '\n'.join(method(n) for n in names)
globe = globe.replace(
    "if (act.tormenta || act.devaluacion) ids.push('170');",
    "if (act.tormenta || act.devaluacion || act.revaluacion || act.congestion) ids.push('170');")
out = template.replace('%%GLOBE%%', globe + '\n\n' + own)
(MOCK / 'Mesa.dc.html').write_text(out, encoding='utf-8')
print('Mesa.dc.html generado:', len(out), 'caracteres')
