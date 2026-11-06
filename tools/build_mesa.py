"""Arma mockup/Mesa.dc.html: inserta en la plantilla los métodos del globo 3D tomados de mockup/Main.dc.html.

Uso: python3 tools/build_mesa.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
main = (ROOT / 'mockup' / 'Main.dc.html').read_text(encoding='utf-8')
template = (ROOT / 'tools' / 'Mesa.template.html').read_text(encoding='utf-8')
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


names = ['tryInit', 'll', 'slerp', 'initGlobe', 'gameCountries', 'chokepoints', 'alertCountries', 'paintMap']
globe = '\n'.join(method(n) for n in names)
# Eventos propios del juego de cartas que también se ven en el globo.
globe = globe.replace(
    "const alert = { CTG: !!act.tormenta, RTM: !!act.huelga, PAN: !!act.sequia, SUE: !!act.marrojo };",
    "const alert = { CTG: !!act.tormenta || !!act.congestion, RTM: !!act.huelga, PAN: !!act.sequia, SUE: !!act.marrojo };")
globe = globe.replace("(act.pandemia ? 0.5 : 1);", "(act.pandemia ? 0.5 : 1) * (act.ciber ? 0.6 : 1);")
globe = globe.replace(
    "if (act.tormenta || act.devaluacion) ids.push('170');",
    "if (act.tormenta || act.devaluacion || act.revaluacion || act.congestion) ids.push('170');")
out = template.replace('%%GLOBE%%', globe)
(ROOT / 'mockup' / 'Mesa.dc.html').write_text(out, encoding='utf-8')
print('Mesa.dc.html generado:', len(out), 'caracteres')
