# Alineación curricular: syllabus × simulador

Cada fila es un tema exigido por un syllabus del programa de Administración del Comercio Internacional (USB Cartagena), con la mecánica que lo enseña, el rol que lo ejerce, la evidencia que lo evalúa y su estado de cobertura en el diseño actual.

## Comercio Internacional · 40159-3C · semestre VI

Es la asignatura con más temas operativos: 3 cubiertos, 7 parciales y 7 nuevos. Los vacíos se concentran en mercancías peligrosas, regímenes aduaneros colombianos, seguridad de la cadena y medios de pago.

| Tema del syllabus | Mecánica en el simulador | Rol | Evidencia evaluable | Estado |
| --- | --- | --- | --- | --- |
| U1 · Tipos de carga: embalada, suelta, consolidada, paletizada, a granel | Selector de tipo de carga y embalaje en el planificador; cubicaje según el tipo | Tráfico | Exactitud de cubicaje; reto ECAES | Parcial |
| U1–U2 · Mercancías peligrosas: clasificación, códigos y control | Clase ONU (1 a 9), segregación y declaración de mercancía peligrosa (IMDG en marítimo, IATA en aéreo) | Tráfico, Aduanas | Documento sin errores; multa por segregación incorrecta | Nuevo |
| U1 · Transportistas marítimos, aéreos y terrestres | Navieras, aerolíneas y transportadoras como empresas jugadoras o bots | Tráfico | Selección modal costo–tiempo | Cubierto |
| U2 · Seguridad portuaria, contrabando, narcotráfico y ciberseguridad | Eventos de contaminación de carga y ciberataque; certificación OEA o BASC que reduce inspecciones | Riesgos | Inspecciones evitadas; siniestros | Nuevo |
| U2 · Gestión de riesgos y cumplimiento de normas internacionales | Motor de exposición, pólizas y retos de cumplimiento | Riesgos | Índice de resiliencia | Cubierto |
| U3 · Volumen de mercancías, peso neto y bruto | Cubicaje con peso neto, bruto y volumétrico reflejado en la Packing List | Tráfico, Aduanas | Coherencia Factura–Packing List–BL | Parcial |
| U3 · Reglas de negocio internacionales (Incoterms 2020) | Matriz de responsabilidades por tramo ligada al costo y al riesgo | Comercial | Costo a cargo según el término pactado | Cubierto |
| U3 · Contratos de compraventa internacional | Contrato con cláusulas de objeto, precio, Incoterm, pago, ley aplicable y fuerza mayor en la sala B2B | Comercial, CEO | Contratos cumplidos; reputación | Parcial |
| Objetivo · Medios de pago usados en Colombia | Anticipo, cuenta abierta, cobranza documentaria y carta de crédito con discrepancias documentales | CFO | Costo financiero; pagos rechazados | Nuevo |
| U4 · Régimen de importación y exportación; normatividad aduanera | Flujo de declaración con levante automático, inspección documental o física | Aduanas | Tiempo de levante; glosas | Parcial |
| U4 · Cabotaje, tránsito aduanero, zonas francas y Plan Vallejo | Regímenes especiales elegibles con efecto en tributos y tiempos | Aduanas, CFO | Ahorro tributario lícito | Nuevo |
| U4 · OEA, UAP y ALTEX | OEA como certificación que se gana; UAP y ALTEX como contraste (verificar su vigencia frente al Decreto 1165 de 2019) | Aduanas | Inspecciones reducidas | Nuevo |
| U4 · Agencias de aduanas, navieras, operadores logísticos y agentes de carga | Intermediarios contratables (bots) con tarifas y niveles de servicio | Tráfico, Aduanas | Costo de intermediación | Parcial |
| Objetivo · TLC y organismos multilaterales | Preferencias arancelarias por acuerdo; OMC, FMI, CEPAL, CAF y ALADI como actores de eventos y noticias | Comercial | Arancel ahorrado | Parcial |
| Objetivo · Cultura en los negocios internacionales | Perfil de negociación por país que modifica el comportamiento de los bots | Comercial | Acuerdos cerrados por perfil cultural | Nuevo |
| RA · Teorías del comercio internacional | Costos de producción distintos por país (ventaja comparativa) visibles en la ficha | CEO | Reto ECAES | Nuevo |
| U4 · Creación de empresa importadora; proceso de exportación completo | Lobby con registro de la empresa y campaña guiada de una operación de punta a punta | CEO | Operación cerrada sin errores | Parcial |

## Legislación del Transporte · 40299-3C · semestre VI

El simulador ya mueve carga por modo, pero no modela el contrato de transporte como objeto jurídico: 4 temas parciales y 3 nuevos, ninguno cubierto del todo.

| Tema del syllabus | Mecánica en el simulador | Rol | Evidencia evaluable | Estado |
| --- | --- | --- | --- | --- |
| T1 · Contrato de transporte: definición, características, partes y obligaciones | Contrato entre productora y transportadora con remitente, transportador y destinatario, y sus obligaciones | Tráfico, transportadora | Contratos sin incumplimiento | Parcial |
| T2 · Transporte marítimo: normatividad, partes y términos de contratación | BL con condiciones; responsabilidad del porteador con límite de indemnización; demoras (demurrage) | Tráfico | Reclamos resueltos a favor | Parcial |
| T3 · Transporte aéreo: Convenio de Montreal de 1999 y RAC | AWB con límite de responsabilidad por kilogramo | Tráfico | Reclamos resueltos a favor | Parcial |
| T4 · Transporte terrestre: Decreto 1079 de 2015 | Manifiesto de carga y control de pesos y dimensiones por vehículo | Tráfico | Multas evitadas | Nuevo |
| T5 · Transporte multimodal: Decreto 149 de 1999 y Decisión 331 de la CAN | Contrato único con operador de transporte multimodal (OTM) y documento de transporte multimodal | Tráfico | Lead time y costo multimodal | Nuevo |
| Referencias · Modos fluvial y férreo | Modos adicionales en rutas nacionales, por ejemplo el río Magdalena | Tráfico | Costo por tonelada-kilómetro | Nuevo |
| RA · Ventajas y desventajas de cada contrato según origen, destino y bloque | Comparador de contratos en el planificador multimodal | Tráfico | Decisión justificada en el informe de gestión | Parcial |

## Procesos Logísticos · 40298-3C · semestre VI

El transporte y el riesgo de la cadena ya están; faltan los procesos internos de la empresa: demanda, inventarios, almacenamiento, logística inversa, mejora continua y sostenibilidad (4 cubiertos, 3 parciales, 7 nuevos).

| Tema del syllabus | Mecánica en el simulador | Rol | Evidencia evaluable | Estado |
| --- | --- | --- | --- | --- |
| U1 · Logística de aprovisionamiento, producción y distribución | Cadena de suministro con insumos, proveedores alternos y capacidad de planta | CEO, Tráfico | Nivel de servicio (fill rate) | Cubierto |
| U1 · Logística inversa | Rechazos y devoluciones con costo y tiempo de retorno | Tráfico, Riesgos | Costo de retorno | Nuevo |
| U1, U5 · Logística verde y huella de carbono | Emisiones por modo con factores configurables como KPI | Riesgos | t CO2e por operación | Nuevo |
| U2 · Estructura de la cadena; flujos de producto, información y fondos | Tablero de flujos por empresa (pedidos, documentos, pagos) | CEO | Ciclo pedido–cobro | Parcial |
| U2 · Planificación de la cadena y pronóstico de la demanda | Demanda por mercado con incertidumbre; pronóstico que decide el CEO | CEO, Comercial | Error de pronóstico (MAPE) | Nuevo |
| U2–U3 · Inventarios: tipos, justo a tiempo, reorden y EOQ | Inventario de insumos, en proceso y terminado; EOQ y punto de reorden calculables | CFO, Tráfico | Costo total de inventario; quiebres de stock | Parcial |
| U3 · Almacenamiento: tipos de almacén, diseño y manejo de materiales | Bodega propia, operador 3PL o zona franca, cada una con su costo | Tráfico | Costo por posición de almacenaje | Nuevo |
| U3 · Transporte: selección de modos, rutas y costos | Planificador multimodal | Tráfico | Costo DFI; lead time | Cubierto |
| U3 · Distribución: estrategias, red y optimización | Distribución en destino: centro de distribución o entrega directa | Comercial, Tráfico | OTIF | Parcial |
| U2 · Gestión de riesgos en la cadena de suministro | Motor de exposición, doble fuente e inventario de seguridad | Riesgos | Resiliencia; índice de Herfindahl | Cubierto |
| U4 · Estrategias de costos, diferenciación y respuesta rápida | Estrategia elegida al inicio que pondera los KPIs de la empresa | CEO | Coherencia estrategia–KPI | Nuevo |
| U4 · Lean, mejora continua y gestión de la calidad | Desperdicios medidos (esperas, reprocesos documentales) y lotes rechazados por calidad | Riesgos | Reprocesos por operación | Nuevo |
| U5 · IoT, inteligencia artificial y blockchain | Mejoras adquiribles: sensores IoT en reefer y documentos electrónicos (eBL) | Riesgos, CFO | Errores y siniestros evitados | Nuevo |
| U3 · Simulador DFI (Syscomer) | Costeo DFI y emisión documental integrados en la partida | CFO, Aduanas | Costo DFI sobre valor de la mercancía | Cubierto |

## Geografía del Comercio Internacional · 40144-3C · semestre V

La geografía política ya es fuerte gracias al mapa 3D y los eventos; falta la geografía física y económica como variables de decisión (3 cubiertos, 1 parcial, 5 nuevos).

| Tema del syllabus | Mecánica en el simulador | Rol | Evidencia evaluable | Estado |
| --- | --- | --- | --- | --- |
| T3 · Geografía física: localización, clima y recursos naturales | Ficha país con región, clima y recursos; eventos climáticos estacionales | Todos | Reto ECAES | Parcial |
| T3 · Deterioro ambiental y comercio internacional | Huella de carbono y exigencias ambientales de los mercados de destino | Riesgos | Emisiones por operación | Nuevo |
| T3 · Regiones del mundo y nivel de desarrollo | Ficha país con región (mundo desarrollado, América Latina, mundo árabe, África subsahariana, Asia meridional y sudeste) e indicadores | Todos | Reto ECAES | Nuevo |
| T2 · Nueva geografía económica: economías de escala y aglomeración | Costo unitario decreciente con el volumen; puertos hub y clústeres | CEO | Reto ECAES | Nuevo |
| T4 · Localización de actividades económicas | Decisión de ubicar bodega o planta en zona franca o en otro país | CEO | ROI de la decisión de localización | Nuevo |
| T4 · Centro–periferia, intercambio desigual y desequilibrios | Términos de intercambio por país (materias primas frente a manufacturas) | CEO | Reto ECAES | Nuevo |
| T5 · Geografía política y geopolítica | Mapa político 3D, pasos críticos y eventos geopolíticos | Riesgos | Índice de resiliencia | Cubierto |
| T5 · Geoeconomía y factores de inestabilidad | Sanciones, guerra comercial y conflictos con propagación por exposición | Riesgos | Exposición neta | Cubierto |
| Objetivo · Caso colombiano, América Latina y Cartagena | Puerto de Cartagena en el escenario base y empresas colombianas | Todos | Informe de gestión | Cubierto |

## Integración Económica · 40302-3C · semestre VI

Los bloques existen solo como etiquetas en la ficha país; para enseñarlos deben cambiar aranceles y reglas del juego según su etapa de integración (1 cubierto, 4 parciales, 3 nuevos).

| Tema del syllabus | Mecánica en el simulador | Rol | Evidencia evaluable | Estado |
| --- | --- | --- | --- | --- |
| U1 · Teoría y efectos de la integración: zona de libre comercio, unión aduanera, mercado común | Cada bloque con su etapa: arancel cero intrabloque y arancel externo común donde aplique | Comercial, Aduanas | Arancel ahorrado | Nuevo |
| U1 · Derecho comunitario: primacía y seguridad jurídica (CAN) | Decisiones de la CAN como reglas del escenario, por ejemplo origen y transporte multimodal | Aduanas | Reto ECAES | Nuevo |
| U2 · Asia: ASEAN, APEC y RCEP | China, India, Japón y EAU con sus acuerdos en el mundo del juego | Comercial | Reto ECAES | Parcial |
| U3 · Europa: Unión Europea, instituciones y mercado único | UE como unión aduanera con arancel externo común | Comercial | Reto ECAES | Parcial |
| U4 · África: Agenda 2063 y AfCFTA | Sudáfrica y Egipto dentro de la AfCFTA | Comercial | Reto ECAES | Parcial |
| U5 · Américas y el Caribe: Mercosur, Alianza del Pacífico, T-MEC | Bloques americanos en el mundo del juego | Comercial | Reto ECAES | Parcial |
| U6 · Integración de Colombia: CAN, Alianza del Pacífico y TLC | Preferencias de Colombia por acuerdo, solo con certificado de origen válido | Comercial, Aduanas | Arancel ahorrado | Nuevo |
| U1 · Comercio internacional y globalización | Contexto del mundo multijugador y sus interdependencias | Todos | Informe de gestión | Cubierto |
