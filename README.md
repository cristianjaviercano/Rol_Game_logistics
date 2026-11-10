# LogiVerse · Rol Game Logistics

Laboratorio virtual de gestión y logística internacional que se juega por roles y con cartas. Cada equipo administra una empresa exportadora o importadora; seis roles (CEO, Comercial, Tráfico, Aduanas, CFO y Riesgos) toman decisiones por fases, y un Superusuario mueve el mundo con cartas de evento: tormentas, huelgas, devaluaciones, alzas de fletes o inspecciones sorpresa.

El proyecto integra tres módulos:

1. **Evaluación tipo Saber Pro (ECAES):** retos de selección múltiple que se responden al emitir documentos y en las inspecciones.
2. **Simulador multijugador:** Incoterms 2020, mesa de 6 tramos de la distribución física internacional (DFI), documentos de exportación, coberturas y eventos.
3. **Indicadores:** margen, OTIF, exactitud documental, Saber Pro y un puntaje de 0 a 100, más una bitácora de decisiones por rol.

**Estado:** mock-up funcional, versión 2 (juego de cartas con turno guiado). Las reglas R1–R20 están aprobadas; R21–R28 esperan aprobación. Siguiente paso: ronda 1 de pruebas con usuarios.

## Contenido

| Carpeta | Qué tiene |
| --- | --- |
| `docs/` | Documento técnico (17 dimensiones de diseño, PMV, costos y precios), alineación curricular con 5 asignaturas, pruebas de usabilidad y reglas del juego de cartas |
| `mockup/` | Las 9 pantallas del mock-up (`*.dc.html`) y el índice del lienzo (`canvas.json`) |
| `data/` | Fronteras de 231 países para el globo 3D, derivadas de world-atlas (Natural Earth) |
| `tests/` | Pruebas en vacío de la lógica de cada pantalla y auditoría de accesibilidad |
| `tools/` | Scripts de apoyo: generación de fronteras, armado de la mesa del Superusuario, escenas 3D de los nodos y extracción de texto de syllabus |
| `web/` | App del piloto con estudiantes (Vite + Preact): monta las pantallas del mock-up fuera del lienzo, con partidas en Supabase |
| `supabase/` | Migraciones SQL (salas, permisos RLS, liquidación oficial, banco de retos), pruebas de permisos y función opcional de IA |

### Pantallas del mock-up

| Archivo | Pantalla |
| --- | --- |
| `Mesa.dc.html` | v4 · Mesa del Superusuario: globo con nodos y animación de eventos; 7 empresas humanas o automáticas; liquidación oficial; cartas plegables |
| `Jugador.dc.html` | v4 · Mesa del jugador: 4 empresas jugables, roles por persona, reto de repaso adaptativo, mesa de 6 tramos, cartas y bitácora |
| `Mundo.dc.html` | v3 · Mundo de la partida: globo del jugador con eventos en vivo y su empresa centrada |
| `Main.dc.html` | v1 · Consola del Superusuario con globo 3D y eventos |
| `Trafico.dc.html` | v1 · Planificador multimodal de expo e impo |
| `Comercial.dc.html` | v1 · Matriz Incoterms y precio por término |
| `CFO.dc.html` | v1 · Tesorería multimoneda |
| `Aduana.dc.html` | v1 · Retos ECAES por eje temático |
| `Seleccion.dc.html` | v1 · Lobby: 17 empresas en 14 países |
| `Cadena.dc.html` | v1 · Cadena de suministro y negociación entre pares |
| `Puerto.dc.html` | Nodo 3D · terminal de contenedores (adaptado de puerto-animation) |
| `Aeropuerto.dc.html` | Nodo 3D · terminal de carga aérea |
| `Terminal.dc.html` | Nodo 3D · paso fronterizo terrestre con aduana y trasbordo |

## Cómo usarlo

### App web del piloto

```bash
cd web && npm install && npm run dev
```

Sin variables de Supabase funciona en modo local (pestañas del mismo navegador). La guía para conectar Supabase, desplegar en Vercel y conducir una sesión con estudiantes está en `docs/05_piloto_con_estudiantes.md`.

### Lienzo de diseño

Las pantallas son componentes del lienzo de diseño de Claude y también se sirven, sin cambios, en la app de `web/`.

Las pruebas sí corren localmente con Node.js 18 o superior:

```bash
npm test          # 63 casos de las pantallas v1, 13 del juego de cartas y revisión de plantillas
npm run audit     # botones sin acción, objetivos táctiles, tamaños de texto y contraste WCAG
npm run build:mesa  # regenera mockup/Mesa.dc.html a partir de la plantilla y del globo de Main
```

Para regenerar `data/world-borders.json`:

```bash
cd tools/geo && npm install && node convert.js 50m
```

## Arquitectura prevista del producto

Next.js (PWA) en Vercel, motor de simulación por rondas en Python/FastAPI, Supabase (Postgres con RLS, autenticación con Microsoft y Realtime) y bots de rol con Claude Haiku. El detalle está en `docs/01_documento_tecnico.md`.

## Autoría

Cristian Javier Cano Mogollón.
