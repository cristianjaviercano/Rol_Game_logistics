# LogiVerse — Laboratorio Virtual de Comercio Global

Oct 26, 2026 · @Cristian Javier Cano Mogollon

## Síntesis y supuestos

LogiVerse (nombre de trabajo) es un simulador multijugador asimétrico en tiempo real para Logística y Comercio Internacional: N empresas (productoras y transportadoras) con 6 roles cada una, un Superusuario que dispara eventos, y retos tipo Saber Pro que alteran el estado financiero. El PMV ampliado (mundo de 14 países, 17 empresas con cadena de suministro, motor de exposición geopolítica, negociación entre pares, mapa político en 3D y 18 mecánicas alineadas con 5 syllabus) se construye en 19 semanas con una inversión de COP 106,9 M; opera con USD 35/mes en piloto académico y USD 126/mes en operación comercial, y se vende desde COP 90.000 por estudiante/semestre.

Supuestos de diseño:

- **Unidad de medida del juego:** partida = 90–120 min, dividida en rondas (ticks de simulación de 1 min reales ≈ 1 día simulado).
- **Escala objetivo PMV:** 1 partida simultánea con 6 a 10 de las 17 empresas del catálogo (14 países), 36–60 jugadores, 1 Superusuario.
- **Dispositivos:** PC y celular (PWA responsive); conexión universitaria de calidad variable.
- **Equipo:** 1 líder técnico (vibe engineering con IA) + 2–4 estudiantes de semillero; sin equipo DevOps dedicado → servicios gestionados (BaaS).
- **Determinismo:** el estado oficial vive en el servidor (servidor autoritativo); el cliente solo propone acciones. Es condición para que la evaluación y los informes de gestión sean auditables.
- **Inconsistencias detectadas en los insumos** (corregir antes de reutilizarlos como datos de prueba): las actas de sustentación del Equipo 4 se titulan “CorteMetal Optima Cutting Stock”, duplican integrantes e incluyen estudiantes de otro equipo; la nota E1 (2.5) difiere de la consolidada (3.38); y el mismo 3.38 aparece como “Aprobatorio” en un informe y “Crítico” en otro.

## 1. System Design

El sistema es una simulación de eventos discretos con reloj de ticks en servidor; cada acción de un jugador es un comando validado contra reglas antes de mutar el estado.

**Contextos de dominio (bounded contexts):**

| Contexto | Entidades principales | Rol dueño |
| --- | --- | --- |
| Mundo | Partida, Ronda, País, Puerto, Ruta, Evento | Superusuario |
| Mercado B2B | Oferta, Negociación, Contrato, Incoterm | Comercial, CEO |
| Logística DFI | Envío, Contenedor (TEU/FEU), Flota, Cubicaje | Tráfico, Transportadora |
| Aduanas | Documento (Factura, Packing List, BL/AWB, CO, DEX/DIM) | Aduanas |
| Finanzas | Cuenta multimoneda, Transacción, Tasa FX, Préstamo | CFO |
| Riesgo y evaluación | Póliza, Siniestro, Reto ECAES, KPI, Informe | Analista de Riesgos |

**Ciclo de un tick** (1 min real ≈ 1 día simulado):

1. Aplicar eventos del Superusuario en cola (FX, clima, cierres, aranceles).
2. Avanzar envíos: posición en ruta, ETA, cambios de estado.
3. Devengar costos: almacenamiento, demoras (demurrage), intereses, primas.
4. Resolver vencimientos: retos ECAES no respondidos, contratos incumplidos.
5. Recalcular KPIs y publicar solo el delta de estado a los clientes suscritos.

**Motor de reglas Incoterms 2020:** una matriz de datos (no código) define, para cada uno de los 11 términos, quién paga y quién asume el riesgo en 7 tramos: embalaje, carga en origen, aduana de exportación, flete principal, seguro, aduana de importación y entrega final. Así, cambiar de FOB a CIF reasigna costos y riesgos sin reprogramar.

**Fórmulas núcleo del costeo DFI** (prima de seguro sobre CIF + 10 %, convención usual de mercado):

```latex
\mathrm{CIF} = \frac{\mathrm{FOB} + F}{1 - 1.1\,r}, \qquad P_{seg} = 1.1\,r \cdot \mathrm{CIF}
```

donde F = flete principal y r = tasa de la póliza. KPIs de evaluación: OTIF = envíos a tiempo y completos / envíos totales; exactitud documental = documentos sin error / documentos emitidos; margen operativo = utilidad operativa / ingresos, en moneda base de la partida.

&#91;embedded content: máquina de estados del envío · 7 estados, 4 excepciones\]

Glosa, desvío y retención regresan al mismo estado con costo y tiempo añadidos; el siniestro abre un reclamo y solo se cubre si la póliza vigente lo ampara según el Incoterm pactado.

## 2. System Architecture

Arquitectura orientada a eventos con servidor autoritativo: el frontend envía comandos al motor, el motor persiste eventos en Supabase y Supabase Realtime difunde los cambios a todos los clientes de la partida.

&#91;embedded content: arquitectura de componentes del PMV · 7 componentes\]

El motor en Python permite reutilizar modelos de investigación de operaciones (SimPy, colas, inventarios) del semillero; el LLM queda fuera del camino crítico y nunca modifica estado por sí mismo.

## 3. Frontend

Una sola aplicación web progresiva (PWA) en Next.js + TypeScript sirve a PC y celular; la vista cambia según el rol asignado, no según el dispositivo.

| Capa | Elección PMV | Justificación |
| --- | --- | --- |
| Framework | Next.js (App Router) + TypeScript | Mejor cobertura de generación con IA y despliegue directo en Vercel |
| UI | Tailwind CSS + shadcn/ui | Componentes accesibles, diseño consistente con poco código |
| Mapa | MapLibre GL JS + teselas vectoriales libres (OpenFreeMap/Protomaps) | Sin costo por carga de mapa; buques y camiones como capa GeoJSON animada |
| Estado | Zustand (estado de juego) + TanStack Query (datos de servidor) | Separa el estado en vivo del cacheable |
| Tiempo real | Cliente de Supabase Realtime (Broadcast) | Recibe deltas por canal: mundo, empresa, rol |
| Gráficos KPI | Recharts | Tablero del Analista y del Superusuario |

**Vistas (8):** consola del Superusuario · lobby y asignación de roles · CEO (aprobación y chat gerencial) · Comercial (sala de negociación + matriz Incoterms) · Tráfico (mapa, cubicaje, fletes) · Aduanas (formularios documentales con validación) · CFO (tesorería multimoneda, costeo) · Riesgos (KPIs, pólizas, retos ECAES). En Modo Multirrol, la misma sesión muestra pestañas por cargo.

**Reglas de UX:** acciones críticas en ≤ 3 toques en celular; toda acción muestra su efecto financiero estimado antes de confirmar; las noticias del Superusuario llegan como banner bloqueante de 5 s; modo proyector para el aula (mapa a pantalla completa).

## 4. APIs y lógica de backend

Toda mutación del juego entra como comando al Motor de Simulación (Python/FastAPI); las lecturas simples van directo a Supabase con seguridad por filas.

**Patrón:** Command → Validación (rol, saldo, Incoterm, capacidad) → Evento persistido → Proyección de estado → Broadcast del delta. Cada comando lleva `idempotency_key` para tolerar reintentos desde redes móviles inestables.

| Método y ruta | Rol autorizado | Efecto |
| --- | --- | --- |
| `POST /games` · `POST /games/{id}/start` | Superusuario | Crea partida desde plantilla de escenario; arranca el reloj |
| `POST /games/{id}/join` | Estudiante | Ingresa con código; asigna empresa y rol(es) |
| `POST /negotiations` · `/{id}/offer` | Comercial | Abre negociación B2B; contraoferta de precio, cantidad e Incoterm |
| `POST /contracts/{id}/approve` | CEO | Firma el contrato; genera obligaciones por tramo |
| `POST /shipments` · `/{id}/book-freight` | Jefe de Tráfico | Crea envío, cubica, reserva flete con una transportadora |
| `POST /freight-offers` | Transportadora (Comercial) | Publica tarifa por ruta y capacidad TEU/FEU |
| `POST /documents/{id}/submit` | Aduanas | Envía documento; el validador devuelve errores o aprueba |
| `POST /treasury/fx` · `/payments` | CFO | Convierte divisas a la tasa vigente; paga obligaciones |
| `POST /policies` · `/claims` | Riesgos | Contrata póliza; reclama siniestro |
| `POST /challenges/{id}/answer` | Rol desafiado | Responde reto ECAES; dispara bonificación o sanción |
| `POST /gm/events` | Superusuario | Lanza evento: FX, clima, cierre de puerto, arancel, inspección |
| `GET /games/{id}/reports` | Superusuario, CEO | Informe de gestión por jugador y por empresa |

**Canales en tiempo real:** `game:{id}` (mapa, noticias, FX), `company:{id}` (estado interno de la empresa), `user:{id}` (retos y alertas personales).

**Bots de roles vacantes (Modo Asistido):** reglas deterministas para tareas rutinarias (pagos vencidos, documentos con datos completos) y un LLM ligero (Claude Haiku) solo para redactar ofertas y explicar retroalimentación. El LLM nunca muta estado directamente: propone un comando que pasa por la misma validación.

## 5. Base de datos y almacenamiento

PostgreSQL (Supabase) con un registro de eventos inmutable como fuente de verdad: los informes de gestión se reconstruyen reproduciendo eventos, lo que hace auditable cada nota.

| Grupo | Tablas | Nota |
| --- | --- | --- |
| Identidad | `users`, `institutions`, `courses` | Perfil académico; sin datos sensibles |
| Partida | `games`, `rounds`, `scenarios`, `world_params` | Escenario = plantilla JSON reutilizable (países, rutas, precios base) |
| Organización | `companies`, `memberships`, `role_grants` | Un usuario puede tener varios `role_grants` (multirrol) |
| Mercado | `negotiations`, `offers`, `contracts`, `incoterm_matrix` | Matriz Incoterms como datos de referencia |
| Logística | `ports`, `routes`, `fleets`, `shipments`, `shipment_legs` | Geometría de rutas en GeoJSON (PostGIS opcional) |
| Documental | `documents`, `document_errors` | Campos estructurados + PDF generado |
| Finanzas | `accounts`, `transactions`, `fx_rates`, `loans` | Saldos por moneda; `fx_rates` versionada por tick |
| Riesgo y evaluación | `policies`, `claims`, `challenges`, `answers`, `kpi_snapshots` | Banco ECAES etiquetado por rol y competencia |
| Auditoría | `game_events` (append-only) | `tick`, `actor`, `command`, `payload`, `hash` |

**Almacenamiento de objetos (Supabase Storage):** PDFs de documentos, informes finales y recursos del escenario. **Volumen estimado:** una partida de 60 jugadores genera del orden de 20.000 eventos y < 50 MB entre filas y PDFs; los 8 GB del plan Pro alcanzan para cientos de partidas.

**Retención:** eventos y KPIs se conservan por el periodo académico + 1 año; luego se anonimizan para investigación (datos para artículos indexados del semillero).

## 6. Autenticación y permisos

Autenticación con Supabase Auth (OAuth de Microsoft para cuentas institucionales + enlace mágico por correo como respaldo); autorización en dos niveles: rol de plataforma y cargo dentro de la partida.

- **Nivel plataforma:** `admin` (proveedor), `docente` (crea partidas, actúa como Superusuario, ve todas las empresas de su curso), `estudiante`.
- **Nivel partida:** los 6 cargos se guardan en `role_grants`; en Multirrol un usuario acumula 2–3 grants; en Modo Asistido los grants vacantes pertenecen a un bot.
- **Aislamiento:** políticas RLS de Postgres; un estudiante solo lee filas de su `company_id`. La información de otras empresas llega únicamente por el mercado (ofertas públicas) o por noticias del Superusuario: la asimetría de información es parte del juego.
- **Doble validación:** el Motor rechaza cualquier comando cuyo cargo no coincida con la matriz, aunque el cliente lo intente.

| Acción | CEO | Comercial | Tráfico | Aduanas | CFO | Riesgos |
| --- | --- | --- | --- | --- | --- | --- |
| Negociar y ofertar | Ver | Ejecutar | Ver | — | Ver | — |
| Aprobar contrato | Ejecutar | Proponer | — | — | Visto bueno | — |
| Reservar flete y cubicar | Ver | — | Ejecutar | — | Ver | — |
| Emitir documentos | Ver | — | Aportar datos | Ejecutar | — | — |
| Pagos y cambio de divisas | Ver | — | — | — | Ejecutar | — |
| Pólizas y siniestros | Ver | — | — | — | Pagar prima | Ejecutar |
| Responder reto ECAES | Si es desafiado | Si es desafiado | Si es desafiado | Si es desafiado | Si es desafiado | Ejecutar (por defecto) |

La matriz se guarda como datos, de modo que el Superusuario puede ajustarla por escenario.

## 7–15. Operación: hosting, CI/CD, seguridad, rendimiento y calidad

Todo es servicio gestionado con planes de entrada; cada fila declara el umbral medible que obliga a cambiar de nivel.

| # | Dimensión | Decisión PMV | Umbral para escalar |
| --- | --- | --- | --- |
| 7 | Hosting y nube | Frontend en Vercel; Motor Python en Railway; datos, auth, realtime y storage en Supabase (región us-east; medir latencia desde Montería en la semana 1) | > 3 partidas simultáneas o CPU del motor > 70 % sostenido |
| 8 | CI/CD y versiones | GitHub (monorepo `web/`, `engine/`, `db/`); GitHub Actions: lint, pruebas, migraciones; preview por pull request en Vercel; ramas `main` (producción) y `dev`; versionado semántico | Más de 3 desarrolladores → revisión obligatoria por pares |
| 9 | Seguridad | HTTPS, RLS en todas las tablas, secretos en variables de entorno, validación de esquema (Pydantic/Zod) en cada comando, dependencias auditadas (Dependabot), mínimos datos personales (Ley 1581 de 2012) | Venta a terceros → prueba de penetración y acuerdo de tratamiento de datos |
| 10 | Rate limiting | Por usuario: 10 comandos/s; por empresa: 30 comandos/s; reintentos con backoff; idempotencia evita duplicados | Picos de 429 > 1 % de solicitudes |
| 11 | Caché y CDN | CDN de Vercel para activos y teselas; escenario y matriz Incoterms en memoria del motor; el estado vivo nunca se cachea en cliente más de 1 tick | Tiempo de carga inicial > 3 s en 4G |
| 12 | Errores y logs | Sentry (frontend + motor); logs estructurados JSON con `game_id`, `tick`, `user_id` | > 50.000 errores/mes (cuota del plan) |
| 13 | Monitoreo y alertas | Monitor de disponibilidad del motor y del WebSocket; alerta si un tick tarda > 2 s o cae la conexión realtime; tablero de salud en la consola del Superusuario | SLA comercial firmado |
| 14 | Testing | Unitarias del motor (reglas Incoterms, costeo, FX) con pytest; pruebas de propiedad para conservación de dinero; E2E con Playwright de una partida completa; prueba de carga con 60 clientes simulados (k6) antes de cada piloto | Cobertura del motor < 80 % bloquea el despliegue |
| 15 | Escalado | Una instancia del motor por partida (partición natural por `game_id`); escalado horizontal agregando instancias; Postgres con pooler incluido | > 500 concurrentes → instancia de cómputo mayor en Supabase |

**Invariante crítico de prueba:** en cada tick, la suma de dinero del sistema (empresas + bancos + sumideros de costo) debe conservarse. Si falla, la partida se pausa y se alerta; es la principal defensa contra errores que invaliden la evaluación.

**Pruebas del mock-up:** 48 casos en vacío, auditoría de accesibilidad, recorrido cognitivo y plan de pruebas con usuarios en Pruebas de usuario.

## 16. Producto Mínimo Viable (PMV)

El PMV valida una sola hipótesis: una partida de 90 minutos con 6 empresas y 36 estudiantes produce decisiones logísticas medibles y un informe de gestión defendible, sin intervención técnica durante el juego.

**Dentro del PMV:**

- Mundo de 14 países con divisa, bloque comercial y reglas de importación y exportación; mapa político en el globo 3D con 7 pasos críticos; 3 modos de transporte y 14 divisas.
- Catálogo de 17 empresas con cadena de suministro (insumos con proveedores alternos, jugadores o bots) y selección en el lobby; los 6 roles, con Multirrol y Modo Asistido por reglas; sala de negociación B2B con 6 variables de contrato y reputación.
- 4 Incoterms jugables: EXW, FOB, CIF, DAP (los 11 en la matriz, 4 habilitados).
- 4 documentos: Factura Comercial, Packing List, BL/AWB, Certificado de Origen.
- 12 eventos del Superusuario con motor de exposición: devaluación/revaluación, tormenta, sequía en Panamá, huelga portuaria, alza de flete, inspección sorpresa, mar Rojo, pandemia, guerra comercial, tensión en Taiwán, alerta fitosanitaria y escasez de contenedores.
- Banco de 150 retos ECAES (30 por asignatura), etiquetados por resultado de aprendizaje y rol, validados por el docente; 18 mecánicas curriculares (sección 22) que ejercen 49 de los 55 temas exigidos.
- Informe de gestión automático por jugador y por empresa (PDF).

**Fuera del PMV (versión 2):** bots con LLM, los 11 Incoterms jugables, declaración aduanera completa, préstamos y tasas de interés variables, partidas entre universidades, aplicación nativa, cobertura cambiaria con forward, campañas históricas y los 6 temas de la versión full (sección 22).

**Criterios de éxito del piloto** (diseño cuasi-experimental con grupo de control, según la hoja de ruta del Corte 2):

| Métrica | Meta |
| --- | --- |
| Disponibilidad durante la partida | ≥ 99 % (sin caídas > 60 s) |
| Latencia de un comando, percentil 95 | ≤ 500 ms |
| Estudiantes que completan la partida | ≥ 90 % |
| Ganancia de aprendizaje en pre/post-test ECAES vs. grupo de control | Diferencia significativa (p < 0,05) |
| Satisfacción del docente (escala SUS) | ≥ 70 puntos |

&#91;embedded content: plan de trabajo del PMV con mecánicas curriculares · 7 fases, 19 semanas\]

El motor (semanas 4–7) es la ruta crítica: incorpora el mapa político y la exposición geopolítica, y de sus comandos dependen las vistas por rol, la cadena de suministro y la negociación.

## 17. Costos de producción y precios de venta

El PMV con alineación curricular cuesta COP 106,9 M (≈ USD 33.400) en desarrollo y COP 4,8 M/año en infraestructura comercial; el punto de equilibrio se alcanza con 3 licencias de programa o ≈ 780 estudiantes/año. Supuestos: TRM de planeación COP 3.200/USD (TRM del 21-oct-2026: COP 3.163,76, [Portafolio](https://www.portafolio.co/economia/finanzas/precio-del-dolar-hoy-en-colombia-la-divisa-inicia-cerca-de-3-160-este-21-de-octubre-504832)); tarifas horarias son supuestos de mercado local a validar; precios antes de IVA.

### Inversión de desarrollo del PMV (CAPEX, 19 semanas)

| Rubro | Cantidad | Tarifa | Total (COP) |
| --- | --- | --- | --- |
| Líder técnico y de producto (vibe engineering) | 380 h | 120.000/h | 45.600.000 |
| Desarrolladores junior (2 monitores del semillero) | 570 h | 35.000/h | 19.950.000 |
| Contenidos: 150 retos ECAES alineados, fichas de 14 países, 17 empresas y 12 eventos | 280 h | 60.000/h | 16.800.000 |
| Diseño UX/UI | 90 h | 60.000/h | 5.400.000 |
| Asistentes de codificación IA | 5 meses | USD 200/mes | 3.200.000 |
| Infraestructura en desarrollo | 5 meses | USD 34/mes | 544.000 |
| Registro de software, dominio y legales | global | — | 1.500.000 |
| Contingencia (15 %) | — | — | 13.949.100 |
| **Total CAPEX** |  |  | **106.943.100** |

### Costo de operación mensual (OPEX)

| Servicio | Piloto académico (USD/mes) | Operación comercial (USD/mes) |
| --- | --- | --- |
| [Vercel](https://vercel.com/docs/accounts/plans/pro) (frontend) | 0 (Hobby) | 20 (Pro, 1 puesto) |
| [Supabase](https://schematichq.com/blog/supabase-pricing) (BD, auth, realtime) | 25 (Pro) | 40 (Pro + cómputo adicional) |
| [Railway](https://docs.railway.com/pricing/plans) (motor Python) | 5 (Hobby) | 20 (Pro) |
| [Sentry](https://usagepricing.com/blueprint/sentry) (errores) | 0 (Developer) | 26 (Team, anual) |
| LLM Claude Haiku 5.5 (bots y retroalimentación) | 5 | 10 |
| Dominio y monitoreo de disponibilidad | 0 | 10 |
| **Total** | **35** | **126** |

El costo de IA es marginal: Haiku 5.5 se ofrece a [USD 0,10 por millón de tokens de entrada y 0,50 de salida](https://techenclave.com/news/items/claude-haiku-5-5-launches-with-0-10-input-pricing-for-shorter-prompts) para prompts cortos; una partida de 60 jugadores consume del orden de centavos de dólar.

### Costos fijos anuales y punto de equilibrio

| Componente | COP/año |
| --- | --- |
| OPEX comercial (USD 126 × 12) | 4.838.400 |
| Soporte y mantenimiento (10 h/mes × 120.000) | 14.400.000 |
| Actualización de contenidos: retos, normativa, países y eventos (80 h × 60.000) | 4.800.000 |
| Amortización del CAPEX a 3 años | 35.647.700 |
| **Total fijo** | **59.686.100** |

Con un margen de contribución del 85 % (15 % para comisión comercial y pasarela de pago), el equilibrio es: 59,7 M / (90.000 × 0,85) ≈ 780 estudiantes/año, o 59,7 M / (30 M × 0,85) ≈ 2,34 → 3 licencias de programa.

### Precios de venta propuestos

| Producto | Precio (COP, antes de IVA) | Incluye |
| --- | --- | --- |
| Licencia por estudiante | 90.000 / semestre | Acceso a partidas, banco ECAES, informe individual por resultado de aprendizaje |
| Licencia institucional por programa (5 asignaturas) | 30.000.000 / año | Hasta 300 estudiantes, consola docente, 150 retos alineados con los 5 syllabus, 2 escenarios, capacitación de 8 h, soporte |
| Taller corporativo (exportadores, cámaras de comercio, gremios) | 5.400.000 / jornada | Hasta 36 participantes, facilitador, informe de equipo |
| Escenario a la medida (p. ej., cadena acuícola o agroindustrial de Córdoba) | 8.000.000 – 15.000.000 | Diseño del corredor, productos, costos y eventos |

**Referencia de mercado internacional:** [The Fresh Connection](https://www.vub.be/en/studying-vub/all-study-programmes-vub/personal-development-during-your-studies/short-courses/business-game-fresh-connection) se ofrece a €58 por persona; [ERPsim](https://erpsim.hec.ca/en/node/339) a CAD 65 por estudiante desde agosto de 2026; [MonsoonSIM](https://www.monsoonsim.com/event/973598/book_trial.html) a USD 36 por estudiante al año. El precio propuesto (≈ USD 28) queda por debajo de esos referentes, con diferenciación por idioma, normativa colombiana y preparación Saber Pro.

**Escenarios año 1** (licencia de programa a COP 30 M): conservador (1 licencia + 4 talleres + 150 estudiantes individuales) = COP 65,1 M de ingresos, contribución COP 55,3 M y pérdida operativa ≈ COP 4,4 M. Base (2 licencias + 4 talleres + 150 estudiantes) = COP 95,1 M, contribución COP 80,8 M y utilidad ≈ COP 21,1 M. Optimista (3 licencias + 6 talleres + 300 estudiantes) = COP 149,4 M, contribución COP 127,0 M y utilidad ≈ COP 67,3 M. El precio de la licencia sube de COP 24 M a 30 M porque ahora cubre cinco asignaturas del programa; los escenarios a la medida son el margen adicional. Pendiente: confirmar con asesor tributario el tratamiento de IVA aplicable a licencias de software.

## 18. Mundo del juego: países, empresas y cadenas de suministro

Cada empresa hereda de su país una divisa, un bloque comercial, reglas de importación y exportación y una exposición geopolítica; así, un mismo evento golpea distinto a cada jugador. El mundo base tiene 14 países en 6 continentes y 17 empresas (14 productoras o comercializadoras y 3 transportadoras); el PMV usa 6 de ellas.

### Países y reglas de comercio exterior

Las reglas son simplificaciones didácticas de la normativa real; el escenario puede ajustarlas.

| País | Divisa | Bloque o acuerdo | Regla clave de exportación | Regla clave de importación | Paso crítico (chokepoint) |
| --- | --- | --- | --- | --- | --- |
| Colombia | COP | CAN, Alianza del Pacífico | Declaración de exportación ante la DIAN; exportaciones exentas de IVA | Vistos buenos en la VUCE (ICA, Invima); IVA 19 % | Canal de Panamá |
| México | MXN | T-MEC | Reglas de origen T-MEC para preferencia arancelaria | Pedimento con agente aduanal; IVA 16 % | Frontera terrestre con EE. UU. |
| Estados Unidos | USD | T-MEC | Controles de exportación por destino | Alimentos: registro y aviso previo ante la FDA; ISF 10+2 en marítimo | Puertos de las costas Este y Oeste |
| Brasil | BRL | Mercosur | Registro en Siscomex | Tributos en cascada: II, IPI, PIS/COFINS, ICMS | Puerto de Santos |
| Chile | CLP | Alianza del Pacífico, CPTPP | Certificados de origen para sus TLC | Arancel general 6 % (0 % con TLC); IVA 19 % | Pacífico sur |
| Países Bajos | EUR | Unión Europea | Documentos de exportación de la UE | Arancel externo común; ICS2 (declaración previa de seguridad); IVA 21 % | Rotterdam, mar Rojo |
| Alemania | EUR | Unión Europea | Licencias para bienes de doble uso | Arancel externo común; IVA 19 % | Río Rin |
| Sudáfrica | ZAR | SACU, AfCFTA | Certificación fitosanitaria para agro | IVA 15 % | Cabo de Buena Esperanza |
| Egipto | EGP | AfCFTA, COMESA | Certificados de origen preferencial | ACI: información anticipada de carga obligatoria; IVA 14 % | Canal de Suez |
| Emiratos Árabes Unidos | AED | CCG | Reexportación desde zonas francas | Arancel común del CCG 5 %; IVA 5 % | Estrecho de Ormuz |
| China | CNY | RCEP | Licencias para bienes controlados | Alimentos: registro del exportador ante la GACC; IVA 13 % | Estrecho de Taiwán, Malaca |
| India | INR | — (TLC bilaterales) | Código IEC del exportador | Arancel básico + IGST | Mar Arábigo, mar Rojo |
| Japón | JPY | CPTPP, RCEP | Controles para tecnología sensible | Impuesto al consumo 10 % | Estrecho de Taiwán |
| Australia | AUD | CPTPP, RCEP | Certificados de exportación agrícola | Bioseguridad estricta; GST 10 % | Mar de China Meridional |

### Empresas y su cadena de suministro

Cada empresa necesita insumos importados; puede comprarlos a otro jugador o a un proveedor bot. Para cada insumo hay una opción en el mismo continente (más cara, más rápida y menos expuesta) y otra lejana (más barata y más expuesta). La decisión entre nearshoring y offshoring, la doble fuente y el inventario de seguridad quedan en manos de los jugadores.

| Empresa | País (divisa) | Giro | Vende | Insumos y proveedores posibles | Exposición principal |
| --- | --- | --- | --- | --- | --- |
| Café Sinú S.A.S. | Colombia (COP) | Productora agro | Café verde especial | Sacos de yute (Jute & Pack, India) o fique (bot, Colombia); trilladora (Rhein Maschinenbau, Alemania) | Huracanes del Caribe, USD/COP |
| Acuícola del Sinú | Colombia (COP) | Productora acuícola | Tilapia congelada | Alimento de soya (SojaSul, Brasil); empaque al vacío (Shenzhen Parts, China); reefer (Caribe Line) | Cadena de frío, alertas sanitarias |
| Caribe Line | Colombia (tarifas en USD) | Naviera | Fletes Caribe–EE. UU.–Europa | Bunker (bot, Panamá); contenedores reefer (bot, China) | Canal de Panamá, petróleo |
| Autopartes del Bajío | México (MXN) | Manufactura | Arneses para la industria automotriz de EE. UU. | Cobre (Cobre Andino, Chile); microcontroladores (Shenzhen Parts) | Aranceles de EE. UU., estrecho de Taiwán |
| Gulf Retail Inc. | EE. UU. (USD) | Importadora | Distribución de alimentos | Café, tilapia y cítricos de otros jugadores | FDA, huelgas portuarias |
| SojaSul Agroindústria | Brasil (BRL) | Productora agro | Harina de soya | Urea (Nilo Fertilizantes, Egipto) o fertilizante local (bot, Brasil) | BRL, sequía |
| Cobre Andino | Chile (CLP) | Minería | Cátodos de cobre | Maquinaria (Rhein Maschinenbau); neumáticos mineros (bot, Japón) | Precio del cobre, sismos |
| Rotterdam Foods B.V. | Países Bajos (EUR) | Importadora | Alimentos para la UE | Café, cítricos y granos de otros jugadores | Huelga en Rotterdam, mar Rojo, normas UE |
| Rhein Maschinenbau GmbH | Alemania (EUR) | Manufactura | Maquinaria agroindustrial | Acero (bot, India); electrónica (Shenzhen Parts) | Bajo caudal del Rin, energía |
| Cape Citrus Ltd. | Sudáfrica (ZAR) | Productora agro | Cítricos frescos | Cartón (bot, Sudáfrica); reefer (Dragon Ocean Lines) | Alertas fitosanitarias, ZAR |
| Nilo Fertilizantes | Egipto (EGP) | Química | Urea | Catalizadores (bot, Alemania) | Canal de Suez, EGP |
| Gulf Hub Logistics | EAU (AED) | Operador 3PL y aéreo | Carga aérea y almacenamiento | Combustible de aviación (bot, EAU) | Ormuz, cierres de espacio aéreo |
| Shenzhen Parts Co. | China (CNY) | Manufactura tech | Componentes electrónicos | Cobre (Cobre Andino); tierras raras (bot, China) | Guerra comercial, pandemias |
| Dragon Ocean Lines | China (tarifas en USD) | Naviera | Fletes transpacífico y Asia–Europa | Bunker (bot, Singapur) | Malaca, Suez, tifones |
| Jute & Pack India | India (INR) | Manufactura | Sacos de yute y empaques | Yute crudo (bot, India) | Monzón, INR |
| Osaka Precision | Japón (JPY) | Manufactura tech | Sensores industriales | Cobre (Cobre Andino); tierras raras (Shenzhen Parts) | Sismos, estrecho de Taiwán |
| Austral Grains | Australia (AUD) | Productora agro | Trigo y cebada | Urea (Nilo Fertilizantes); maquinaria (Rhein Maschinenbau) | Sequía, bioseguridad |

La red forma cadenas cruzadas: el cobre chileno alimenta a México, China y Japón; la urea egipcia a Brasil y Australia. Un cierre del mar Rojo encarece la urea que llega a Australia, y una tensión en Taiwán frena los arneses mexicanos.

## 19. Catálogo de eventos y propagación por exposición

Un evento no se aplica a todos por igual. El motor cruza sus etiquetas con las de cada ruta, insumo y empresa: paso crítico, región, sector, divisa y modo de transporte. Solo quien está expuesto sufre el efecto, y quien diversificó proveedores lo amortigua.

**Regla de propagación:** efecto sobre la empresa = intensidad del evento × exposición de cada contrato o envío (0 a 1) × (1 − mitigación). La mitigación sube con proveedores alternos activos, inventario de seguridad, cobertura cambiaria y pólizas vigentes. Los parámetros de la tabla son valores de diseño del juego, calibrables por escenario.

| Evento | Categoría | Referencia histórica | Efecto en la partida | Afecta a |
| --- | --- | --- | --- | --- |
| Ataques en el mar Rojo | Conflicto | Desvíos de navieras desde finales de 2023 | Rutas Asia–Europa por el Cabo de Buena Esperanza: +12 días y flete +60 % | China, India, Japón, EAU ↔ UE; Egipto pierde tránsito por Suez |
| Bloqueo del Canal de Suez | Operativo | Encallamiento del Ever Given (marzo de 2021) | Cola de buques: +6 días y efecto rebote en puertos de destino | Todo envío Asia–Europa en tránsito |
| Guerra regional en Europa del Este | Conflicto | Invasión rusa de Ucrania (2022) | Cierre de espacio aéreo; energía +40 %; trigo +25 % | UE, aéreo Asia–Europa; beneficia a Austral Grains |
| Tensión en el estrecho de Taiwán | Geopolítico | Ejercicios militares recurrentes | Componentes electrónicos: +20 días y precio +30 % | Shenzhen Parts, Osaka Precision, Autopartes del Bajío |
| Guerra comercial | Geopolítico | Aranceles EE. UU.–China (2018 en adelante) | Arancel bilateral +25 %; desvío de pedidos a terceros países | Pares EE. UU.–China; oportunidad para México |
| Sanciones a un país | Geopolítico | Regímenes de sanciones financieras | Pagos bloqueados; contratos abiertos en riesgo de incumplimiento | Empresas del país sancionado y sus contrapartes |
| Tensión en el estrecho de Ormuz | Conflicto | Tensiones recurrentes en el Golfo | Petróleo +35 % → recargo de combustible (BAF) en todo flete | Todos; directo a Gulf Hub Logistics |
| Pandemia | Sanitario | COVID-19 (2020–2022) | Capacidad de planta −30 %; cuarentena portuaria +5 días; flete +100 % | Todos, con mayor peso en manufactura |
| Alerta fitosanitaria | Sanitario | Rechazos de cítricos o carne por plagas | Bloqueo de exportaciones agro del país hasta presentar certificado y superar reto ECAES | Productoras agro del país afectado |
| Huracán o tifón | Clima | Temporadas del Caribe y del Pacífico | Cierre de puerto 2 a 4 ticks | Caribe: Colombia, México, EE. UU.; Pacífico: China, Japón |
| Sequía en el Canal de Panamá | Clima | Restricciones de calado (2023–2024) | Tránsitos +4 días; menos cupos diarios | Rutas Asia–Atlántico de América |
| Bajo caudal del Rin | Clima | Episodios de 2018 y 2022 | Barcazas con carga parcial; acarreo interno +50 % | Rhein Maschinenbau, importaciones a Alemania |
| Sismo en país productor | Clima | Sismos en Chile y Japón | Planta detenida 2 ticks | Cobre Andino, Osaka Precision |
| Devaluación o revaluación | Financiero | Movimientos fuertes del COP, ARS o EGP | Divisa elegida ±5 a ±25 % | Quien tenga ingresos u obligaciones en esa divisa |
| Alza de tasas de la Fed | Financiero | Ciclo de alzas de 2022 | USD +8 % frente a todas; crédito +2 puntos | Importadores en USD y empresas endeudadas |
| Escasez de contenedores | Operativo | Crisis logística de 2021 | Flete marítimo +80 %; reservas limitadas | Todas las rutas marítimas |
| Huelga portuaria | Laboral | Huelga en puertos de la costa Este de EE. UU. (octubre de 2024) | Puerto cerrado 3 ticks | Envíos con origen o destino en ese puerto |
| Ciberataque a una naviera | Operativo | NotPetya contra Maersk (2017) | Reservas y documentos caídos 3 ticks | Clientes de Caribe Line o Dragon Ocean Lines |
| Nueva norma documental | Regulatorio | Exigencias de debida diligencia en la UE | Documento adicional obligatorio para entrar al bloque | Exportadores hacia la UE |

**Campañas históricas listas para usar:** Pandemia 2020 (pandemia + escasez de contenedores), Suez 2021 (bloqueo + congestión) y mar Rojo 2024 (desvío + alza de fletes + sequía en Panamá). Permiten comparar decisiones de los estudiantes con lo que ocurrió en la realidad.

## 20. Negociación entre pares y mejoras propuestas

Los jugadores negocian libremente entre sí; los proveedores bot solo garantizan que el mercado no se paralice cuando falte una contraparte humana, y siempre ofrecen peores condiciones que un buen acuerdo entre pares.

**Variables de cada contrato** (todas negociables en la sala B2B, con historial de ofertas y contraofertas):

1. Producto, especificación y cantidad.
2. Precio unitario y moneda de facturación (la de cualquiera de las partes o una divisa fuerte).
3. Incoterm 2020 y lugar convenido.
4. Medio de pago: anticipo, cuenta abierta, cobranza documentaria o carta de crédito.
5. Plazo de pago y plazo de entrega.
6. Penalidades por demora y cláusula de fuerza mayor ante eventos del Superusuario.

**Reputación:** cada contrato cumplido o incumplido modifica un índice visible para todos. Un índice bajo obliga a aceptar carta de crédito o anticipo, lo que cuesta caja.

### Mejoras propuestas

| # | Mejora | Qué aprende el estudiante | Fase |
| --- | --- | --- | --- |
| 1 | Identidad país por empresa: divisa, bloque, tributos y reglas impo/expo | Normativa comparada y costos de nacionalización | PMV |
| 2 | Catálogo de 17 empresas en 14 países con selección en el lobby | Lectura de contexto país y sector | PMV |
| 3 | Cadena de suministro con insumos y proveedores alternos | Nearshoring frente a offshoring, doble fuente, inventario de seguridad | PMV |
| 4 | Motor de exposición por paso crítico, región, sector y divisa | Análisis de riesgo de ruta y de contraparte | PMV |
| 5 | Catálogo de eventos con referencias históricas | Respuesta a crisis con datos reales | PMV (12), v2 (19) |
| 6 | Negociación entre pares con 6 variables y reputación | Negociación internacional y gestión del riesgo comercial | PMV |
| 7 | Medios de pago y cobertura cambiaria (forward) | Finanzas internacionales | v2 |
| 8 | Acuerdos comerciales y reglas de origen: arancel preferencial solo con certificado válido | Uso estratégico de TLC | v2 |
| 9 | Globo 3D con mapa político y pasos críticos: Panamá, Suez, Bab el-Mandeb, Ormuz, Malaca, Taiwán y el Cabo | Geografía económica y geopolítica aplicada | PMV |
| 10 | Nuevos KPIs: resiliencia, concentración de proveedores (índice de Herfindahl), exposición cambiaria neta, cumplimiento contractual | Medición de desempeño más allá del margen | PMV (resiliencia e IHH), v2 (resto) |
| 11 | Campañas históricas: Pandemia 2020, Suez 2021, mar Rojo 2024 | Contraste entre decisiones simuladas y reales | v2 |

**Decisión (26 de octubre de 2026):** las mejoras 1 a 6 y 9, y los KPIs de resiliencia e IHH, entran al PMV. Esto añade al modelo de datos las tablas `countries`, `trade_rules`, `bill_of_materials`, `suppliers`, `exposures` y `reputation`, y extiende el cronograma de 12 a 15 semanas. Las fronteras del mapa provienen de Natural Earth 1:50m (dominio público), empaquetadas en world-atlas.

## 21. Alineación curricular con los syllabus exigidos

De los 55 temas que exigen los cinco syllabus, el diseño actual cubre 11, cubre en parte 19 y necesita mecánica nueva para 25. Los vacíos se concentran en Comercio Internacional y Procesos Logísticos; la matriz tema por tema está en Alineación curricular.

&#91;embedded content: syllabus de Administración del Comercio Internacional (USB Cartagena) · 55 temas de 5 asignaturas\]

**Criterio de cobertura:** un tema está cubierto cuando una mecánica jugable lo ejerce y genera una evidencia evaluable en el informe de gestión; parcial, cuando la mecánica existe pero no modela el concepto completo; nuevo, cuando no hay mecánica. Todos los temas, incluidos los que queden para la versión 2, tendrán retos ECAES en el PMV: el banco pasa de 120 a 150 retos, 30 por asignatura, etiquetados por resultado de aprendizaje y rol.

### Paquetes de mecánicas nuevas

Los 44 temas parciales o nuevos se agrupan en 10 paquetes.

| Paquete | Mecánicas nuevas | Temas | Asignaturas | Fase | Esfuerzo (semanas-equipo) |
| --- | --- | --- | --- | --- | --- |
| P1 Carga y mercancías peligrosas | Tipos de carga y embalaje; clases ONU y segregación; peso neto, bruto y volumétrico | 3 | Comercio Internacional | PMV | 1 |
| P2 Aduana colombiana y regímenes | Levante automático, documental o físico; zonas francas; Plan Vallejo; tránsito y cabotaje; OEA; intermediarios | 5 | Comercio Internacional | PMV | 1,5 |
| P3 Contratos y medios de pago | Compraventa internacional; contrato de transporte por modo con BL, AWB, manifiesto y documento multimodal; límites de responsabilidad; OTM; carta de crédito | 9 | Comercio Internacional, Legislación del Transporte | PMV | 1,5 |
| P4 Integración económica y TLC | Etapa de integración por bloque; preferencias con certificado de origen; Decisiones de la CAN; organismos multilaterales | 8 | Comercio Internacional, Integración Económica | PMV | 1 |
| P5 Procesos logísticos internos | Pronóstico de demanda; inventarios (EOQ, punto de reorden, justo a tiempo); almacenamiento; distribución; logística inversa; estrategia | 7 | Procesos Logísticos | PMV | 1,5 |
| P6 Sostenibilidad | Huella de carbono por modo; exigencias ambientales de destino | 2 | Procesos Logísticos, Geografía | PMV | 0,5 |
| P7 Geografía económica y teorías del comercio | Ficha país con región, clima, recursos y desarrollo; costos por país; economías de escala; localización; términos de intercambio | 6 | Comercio Internacional, Geografía | PMV (ficha y costos); v2 (escala y localización) | 1 |
| P8 Seguridad de la cadena | OEA y BASC; contaminación de carga; contrabando; ciberataque | 1 | Comercio Internacional | PMV | 0,5 |
| P9 Mejora continua y tecnología | Lean y calidad; sensores IoT; documentos electrónicos | 2 | Procesos Logísticos | v2 | — |
| P10 Cultura en los negocios | Perfil de negociación por país | 1 | Comercio Internacional | v2 | — |

### Impacto estimado en el PMV

Los paquetes P1 a P8 suman unas 8,5 semanas-equipo. Con el líder y dos monitores en paralelo, el cronograma pasa de 15 a 19 semanas y el CAPEX sube ≈ COP 29,8 M, hasta ≈ COP 106,9 M (sección 17).

**Decisión (26 de octubre de 2026):** P1 a P8 entran al PMV con las 18 mecánicas de la sección 22; P9, P10 y los temas marcados como versión full quedan para después.

**Observaciones sobre los syllabus:**

- Comercio Internacional cita UAP y ALTEX junto al OEA; conviene verificar su vigencia frente al Decreto 1165 de 2019 antes de incluirlos como figuras jugables.
- Procesos Logísticos y Comercio Internacional usan Syscomer y el arancel de la DIAN como recursos. El simulador puede complementarlos: costeo DFI y documentos en formatos didácticos claramente marcados, nunca réplicas de formularios oficiales.
- Los cinco syllabus siguen el modelo de resultados de aprendizaje. El informe de gestión por jugador puede reportar el desempeño por resultado de aprendizaje, usando las evidencias de la matriz.

## 22. Mecánicas curriculares del PMV y versión full

Con 18 mecánicas nuevas o ampliadas (paquetes P1 a P8), el PMV ejerce 49 de los 55 temas exigidos (89 %). Los 6 restantes pasan a la versión full y, mientras tanto, se evalúan con retos ECAES.

Cada mecánica sigue el mismo patrón: el jugador decide, el motor aplica una regla verificable, un evento o una inspección la pone a prueba y el resultado queda como evidencia en el informe de gestión.

| Mecánica | Decisión del jugador | Regla del motor | Cómo se pone a prueba | Evidencia |
| --- | --- | --- | --- | --- |
| P1.1 Ficha de carga | Tráfico declara tipo de carga (suelta, embalada, paletizada, LCL, FCL, granel, refrigerada), embalaje, peso neto y bruto | Calcula volumen, peso volumétrico y unidades; cruza Factura, Packing List y documento de transporte | Inspección que detecta una discrepancia: multa y 1 día de retención | Exactitud documental |
| P1.2 Mercancía peligrosa | Tráfico y Aduanas clasifican la carga (clase ONU 1 a 9; p. ej., baterías de litio, clase 9) y emiten la declaración | Exige declaración, etiqueta y segregación según una tabla simplificada; el aéreo restringe ciertas clases | Rechazo en puerto o aeropuerto si falta un requisito | Operaciones peligrosas sin rechazo |
| P2.1 Perfil de riesgo y levante | Aduanas presenta la declaración | Asigna levante automático, inspección documental o física según un puntaje (historial de errores, producto, origen, OEA) | La inspección física dispara un reto ECAES de 90 s y suma 1 a 3 días | Tiempo de levante |
| P2.2 Regímenes aduaneros | Aduanas y CFO eligen importación ordinaria, temporal para perfeccionamiento (Plan Vallejo), zona franca, tránsito o cabotaje | Cada régimen difiere o suspende tributos y fija obligaciones (plazo de reexportación, nacionalización) | Incumplir la obligación genera tributos más multa | Ahorro tributario lícito |
| P2.3 OEA e intermediarios | CEO invierte en la certificación OEA; Tráfico contrata agencia de aduanas o agente de carga (bots) | El OEA reduce a la mitad la probabilidad de inspección física; la agencia reduce errores a cambio de tarifa; el agente consolida LCL | Auditoría de seguridad durante 3 rondas | Inspecciones evitadas; costo de intermediación |
| P3.1 Contrato de compraventa | Comercial y CEO arman el contrato con cláusulas: ley aplicable, fuerza mayor, penalidad por demora, inspección de calidad (marco de referencia: CISG) | Ejecuta las cláusulas ante cada incidente | Un evento del Superusuario solo exime a quien pactó fuerza mayor | Cumplimiento contractual |
| P3.2 Contrato de transporte por modo | Tráfico reserva y recibe el documento del modo: BL, AWB, manifiesto de carga o documento de transporte multimodal con un OTM | Indemnización por pérdida limitada por modo, con límites configurados en el escenario; la diferencia solo la cubre la póliza | Siniestro en tránsito | Pérdida no cubierta |
| P3.3 Medios de pago | CFO y Comercial pactan anticipo, cuenta abierta, cobranza documentaria o carta de crédito (referencia: UCP 600) | El banco bot coteja documentos con la carta de crédito; cualquier discrepancia retiene el pago; cada medio tiene costo y riesgo | Discrepancias de fecha, descripción o cantidad | Días de cobro; costo financiero |
| P4.1 Bloques y preferencias | Comercial elige mercado; Aduanas emite el certificado de origen | Arancel según origen, destino, acuerdo, etapa del bloque (zona de libre comercio, unión aduanera, mercado común) y regla de origen cumplida | Verificación de origen: si falla, arancel pleno más multa | Arancel ahorrado |
| P4.2 Derecho comunitario y organismos | Aduanas consulta las reglas del escenario | Decisiones de la CAN como reglas; eventos de la OMC (fallo que revierte un arancel), del FMI (apoyo cambiario), de la CEPAL y la CAF | Retos ECAES por bloque | Puntaje de retos |
| P5.1 Demanda y pronóstico | CEO y Comercial pronostican la demanda de cada mercado por ronda | Demanda estocástica con media, variabilidad y estacionalidad | Ventas perdidas o exceso de inventario | Error de pronóstico (MAPE) |
| P5.2 Inventarios | CFO y Tráfico fijan cantidad y momento de pedido de cada insumo | Muestra EOQ y punto de reorden calculados; aplica costos de ordenar, mantener y faltante | Quiebre de stock que detiene la planta | Costo total de inventario; quiebres |
| P5.3 Almacenamiento y distribución | Tráfico elige bodega propia, operador 3PL o zona franca, y entrega directa o centro de distribución | Costo fijo frente a variable por posición; tiempos de entrega distintos | Picos de demanda | Costo por unidad entregada; OTIF |
| P5.4 Logística inversa | Riesgos decide reprocesar, devolver o destruir un lote rechazado | Costo y tiempo de retorno por modo | Rechazo por calidad o daño | Costo de retorno |
| P5.5 Estrategia competitiva | CEO elige al inicio costos, diferenciación o respuesta rápida | La estrategia pondera los KPIs del puntaje final | Coherencia entre decisiones y estrategia | Índice de coherencia |
| P6.1 Huella de carbono | Tráfico compara modos y rutas | Emisiones por operación con factores por modo configurables (referencia metodológica: GLEC) | Mercados que exigen reporte o premian baja huella | t CO2e por operación |
| P7.1 Ficha país y ventaja comparativa | Todos consultan la ficha: región, clima, recursos, desarrollo, costos de producción | Costo unitario distinto por país; términos de intercambio que cambian con los precios de materias primas | Retos ECAES de geografía y teorías del comercio | Margen; puntaje de retos |
| P8.1 Seguridad de la cadena | Riesgos invierte en precintos, verificación de contraparte o BASC | Eventos de contaminación de carga, contrabando técnico y ciberataque con probabilidad reducida por la mitigación | Incidente durante el tránsito o en puerto | Incidentes evitados |

**Fórmulas de inventario** que el sistema muestra al CFO (D = demanda anual, S = costo por pedido, H = costo anual de mantener una unidad, d = demanda diaria, L = lead time en días, z = factor de servicio, σd = desviación de la demanda diaria):

```latex
EOQ = \sqrt{\frac{2DS}{H}}, \qquad ROP = d\,L + z\,\sigma_d \sqrt{L}
```

**Arancel aplicable en la importación**, con la preferencia condicionada al certificado de origen válido:

```latex
\text{Arancel} = V_{aduana} \times \begin{cases} t_{pref} & \text{si hay acuerdo vigente y origen probado} \\ t_{NMF} & \text{en otro caso} \end{cases}
```

### Lo que pasa a la versión full

| Tema | Asignatura | Mecánica prevista | Cobertura en el PMV |
| --- | --- | --- | --- |
| Lean, mejora continua y calidad | Procesos Logísticos | Mapa de flujo de valor y desperdicios por operación | Retos ECAES |
| IoT, inteligencia artificial y blockchain | Procesos Logísticos | Mejoras tecnológicas adquiribles (sensores, eBL) | Retos ECAES |
| Cultura en los negocios internacionales | Comercio Internacional | Perfil de negociación por país en los bots | Retos ECAES |
| Economías de escala y aglomeración | Geografía del Comercio | Costo unitario decreciente; puertos hub | Retos ECAES |
| Localización de actividades | Geografía del Comercio | Abrir planta o bodega en otro país | Retos ECAES |
| Transporte fluvial y férreo | Legislación del Transporte | Modos adicionales en rutas nacionales | Retos ECAES |

También quedan para la versión full: cobertura cambiaria con forward, campañas históricas, bots con LLM, partidas entre universidades y aplicación nativa.

## 23. Proceso BPMN de una operación

Una exportación atraviesa los seis roles en 17 actividades y cuatro compuertas exclusivas: aprobación del CEO, carga peligrosa, perfil de riesgo aduanero y conformidad documental del cobro.

&#91;embedded content: BPMN de una operación de exportación · 6 carriles, 17 actividades, 4 compuertas\]

**Lectura del diagrama:**

- **Interrupción:** el Superusuario lanza un evento global (mensaje punteado) que interrumpe el tránsito mediante un evento de borde; Riesgos mitiga con desvío o reclamo antes de la aduana de destino.
- **Mecánicas curriculares en el flujo:** ficha de carga y mercancía peligrosa (P1), perfil de riesgo y régimen (P2), contrato de transporte y carta de crédito (P3), y cierre con OTIF y huella de carbono (P5 y P6).
- **Importación:** sigue el mismo proceso desde el lado del comprador. Se añaden la liquidación de tributos con preferencia por origen (P4) y la elección de régimen especial (P2).

## Riesgos y próximos pasos

| Riesgo | Probabilidad | Impacto | Mitigación |
| --- | --- | --- | --- |
| Conectividad inestable en aula | Alta | Alto | Deltas pequeños, reconexión con estado completo, modo proyector como respaldo |
| Errores de cálculo que invaliden notas | Media | Alto | Invariante de conservación de dinero, pruebas de propiedad, registro de eventos reproducible |
| Equilibrio de juego deficiente (una estrategia domina) | Alta | Medio | Simular 1.000 partidas con bots (SimPy) antes del piloto; calibrar parámetros del escenario |
| Alcance ampliado (14 países, 17 empresas, cadenas cruzadas) desborda el cronograma | Media | Alto | Datos del mundo como configuración (JSON), no como código; congelar el catálogo en la semana 3 |
| Reglas de comercio exterior desactualizadas o simplificadas en exceso | Media | Medio | Revisión semestral con fuentes oficiales; aviso de simplificación didáctica en cada ficha |
| Dependencia de un solo desarrollador | Media | Alto | Especificaciones primero (vibe engineering), repositorio documentado, monitores capacitados |
| Validez pedagógica no demostrada | Media | Alto | Diseño cuasi-experimental con grupo de control y pre/post-test |
| Propiedad intelectual difusa (UPB, docente, estudiantes) | Media | Alto | Acuerdo de PI y registro ante la DNDA antes de comercializar |

**Próximos pasos:**

- [ ] Validar tarifas horarias y precios con la Oficina de Transferencia de la UPB.
- [ ] Redactar especificación funcional por rol (casos de uso + criterios de aceptación).
- [ ] Construir el modelo del motor en Python/SimPy y calibrar el escenario por simulación.
- [ ] Diseñar los 120 retos ECAES con el Modelo Basado en Evidencias.
- [ ] Definir acuerdo de propiedad intelectual antes de iniciar desarrollo con estudiantes.

## Fuentes

- [Vercel — Pro plan](https://vercel.com/docs/accounts/plans/pro)
- [Supabase pricing (Schematic, 2026)](https://schematichq.com/blog/supabase-pricing)
- [Railway — Pricing plans](https://docs.railway.com/pricing/plans)
- [Sentry pricing (UsagePricing)](https://usagepricing.com/blueprint/sentry)
- [Claude Haiku 5.5 pricing (TechEnclave)](https://techenclave.com/news/items/claude-haiku-5-5-launches-with-0-10-input-pricing-for-shorter-prompts)
- [TRM 21-oct-2026 (Portafolio)](https://www.portafolio.co/economia/finanzas/precio-del-dolar-hoy-en-colombia-la-divisa-inicia-cerca-de-3-160-este-21-de-octubre-504832)
- [The Fresh Connection (VUB)](https://www.vub.be/en/studying-vub/all-study-programmes-vub/personal-development-during-your-studies/short-courses/business-game-fresh-connection) · [ERPsim (HEC Montréal)](https://erpsim.hec.ca/en/node/339) · [MonsoonSIM](https://www.monsoonsim.com/event/973598/book_trial.html)
