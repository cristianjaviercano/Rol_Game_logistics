# Juego de cartas de comercio internacional · lógica para aprobación

Oct 30, 2026 · @Cristian Javier Cano Mogollon

LogiVerse pasa a jugarse con cartas: cada rol arma la operación de exportación jugando cartas sobre una mesa de 6 tramos, y el Superusuario mueve el mundo con cartas de evento. Las 20 reglas de esta pestaña ya funcionan en el mock-up v2 y esperan tu decisión antes de las pruebas con usuarios.

## 1. Punto de partida

Casi todo lo construido se reutiliza: las cartas son la nueva interfaz de decisiones que ya estaban modeladas. El motor por rondas, los eventos y los KPIs no cambian.

| Componente | Estado hoy | En el juego de cartas |
| --- | --- | --- |
| Consola 3D del Superusuario | 8 eventos con confirmación y deshacer; ranking con causas | Pasa al centro de la mesa del Superusuario; los eventos se vuelven cartas con duración |
| Matriz Incoterms (Comercial) | Precio por término y visto del CEO | Define qué tramos de la mesa juega cada empresa |
| Planificador de Tráfico | Cubicaje, lead time y costo DFI | Sus unidades se vuelven cartas de transporte |
| Tesorería del CFO | Pagos confirmados y conversión de divisas | Pólizas, forward y carta de crédito se vuelven cartas de finanzas |
| Retos ECAES | 6 ejes e inspección que bloquea la navegación | Cada documento se emite respondiendo un reto; las inspecciones son retos |
| Cadena y negociación | Contratos con contraoferta | Se integra en la versión siguiente como cartas de proveedor |
| Lobby | Cupos por rol y modo Multirrol | Sin cambios |
| Pruebas en vacío | 63 de 63 casos; 17 de 23 hallazgos resueltos | Las reglas nuevas se prueban con su propio arnés |

## 2. Distribución de las pantallas

Ambas mesas siguen la misma regla: el juego en el centro y el panel de control con las cartas abajo, siempre visible.

| Zona | Mesa del Superusuario | Mesa del jugador |
| --- | --- | --- |
| Arriba | Ronda, las 7 fases y estado en vivo; tasa USD/COP, índice de fletes, eventos en juego y contratos | Empresa, ronda y fase; margen, entrega a bordo, exactitud documental, Saber Pro y puntaje; selector de rol con jugadas restantes |
| Izquierda | Las 3 empresas de América: KPIs, avance de su operación, cartas en mano y eventos que las afectan | Carta del contrato en curso (precio, Incoterm, plazo, punto de entrega) |
| Centro | Globo 3D con el mapa político, rutas, buques y eventos activos | Mesa de operación de 6 tramos y zona de coberturas |
| Derecha | Las 3 empresas de Europa y Asia | Resumen en vivo del costo DFI y del margen, alertas y liquidación |
| Abajo | Pestañas Mano de eventos, En juego, Mercado y Bitácora; jugar, robar o retirar eventos, revelar contratos, pausar y avanzar fase | Pestañas Mano, Archivo, Mercado y Retos; robar, guardar, descartar, emitir documentos, deshacer, terminar turno y ejecutar |

## 3. Reglas para aprobar

Marca cada regla como Aprobada o Ajustar; las que marques para ajustar las cambio en el mock-up antes de las pruebas con usuarios.

| ID | Regla | Detalle | Decisión |
| --- | --- | --- | --- |
| R1 | Familias de cartas | 8 familias por color: Contrato (azul), Incoterm (amarillo), Transporte (verde), Documento (morado), Finanzas (naranja), Mitigación (turquesa), Evento (rojo) y Reto (azul marino). | Aprobada |
| R2 | Mazos | Mercado: contratos, 3 a la vista. Operaciones: transporte, finanzas y mitigación; cada empresa roba 2 por ronda. Eventos: solo del Superusuario, mano de 5 y 1 robo por ronda. Retos: banco ECAES. Los Incoterms siempre están disponibles y los documentos se emiten, no se roban. | Aprobada |
| R3 | Mano y archivo | Mano de máximo 8 cartas. El archivo guarda cartas sin límite y los documentos por emitir. No se puede terminar el turno con más de 8 cartas en la mano. | Aprobada |
| R4 | Ronda de 7 fases | Mercado → Robo → Planeación → Visto del CEO → Evento → Reacción → Liquidación. Una ronda equivale a una semana simulada y dura de 10 a 12 minutos reales. | Aprobada |
| R5 | Jugadas por rol | Tráfico, Aduanas, CFO y Riesgos tienen 3 jugadas por ronda. El CEO ejecuta la operación y el Comercial negocia en el mercado. | Aprobada |
| R6 | Rol de cada familia | Tráfico juega transporte; Aduanas emite documentos y responde inspecciones; el CFO juega finanzas; Riesgos juega mitigación. | Aprobada |
| R7 | Mesa de 6 tramos | Acarreo en origen, Aduana de exportación, Flete principal, Seguro, Aduana de importación y Entrega final. | Aprobada |
| R8 | Tramos del vendedor por Incoterm | EXW: ninguno. FCA y FOB: 1 y 2. CIF y CIP: 1 a 4. DAP: 1, 2, 3 y 6, con seguro opcional. | Aprobada |
| R9 | Validaciones al jugar | Un tramo del comprador queda bloqueado; FOB y CIF solo admiten transporte marítimo; la carga refrigerada exige equipo refrigerado; CIP exige ICC (A). Una carta nueva en un tramo devuelve la anterior a la mano. | Aprobada |
| R10 | Emisión de documentos | Cada documento se emite respondiendo un reto de 2 opciones. Si la respuesta es incorrecta, el documento queda con error y genera una glosa de USD 500 y 2 días, salvo que Aduanas lo corrija con otra jugada. | Aprobada |
| R11 | Coberturas | Forward, carta de crédito y mitigaciones se juegan antes del evento y se activan solas cuando el evento entra en juego. | Aprobada |
| R12 | Eventos con duración | El Superusuario juega una carta de 1 a 3 rondas, la confirma viendo a quién afecta y tiene 10 s para deshacerla. Al cerrar la ronda salen los eventos que cumplieron su duración. | Aprobada |
| R13 | Efecto según ruta e Incoterm | Un evento posterior al punto de entrega no afecta al vendedor (huelga en Rotterdam bajo CIF). Un evento fuera de la ruta no tiene efecto (mar Rojo en Cartagena–Rotterdam). | Aprobada |
| R14 | Ejecución | Solo el CEO ejecuta, con todos los tramos a cargo cubiertos y sin inspección pendiente. La liquidación queda congelada. | Aprobada |
| R15 | OTIF | A tiempo: los días hasta el punto de entrega del Incoterm no superan el plazo. Completo: todos los tramos y documentos obligatorios están en la mesa. | Aprobada |
| R16 | Puntaje de 0 a 100 | 40 % margen (15 % de margen da el máximo), 25 % OTIF, 20 % exactitud documental y 15 % Saber Pro. | Aprobada |
| R17 | Exactitud documental | Documentos correctos sobre el mayor valor entre los obligatorios y los presentados. | Aprobada |
| R18 | Margen | Precio − costo de la mercancía − acarreo − agente y documentos (USD 350) − flete − seguro − coberturas − eventos y glosas + preferencia arancelaria (1 % del precio con certificado de origen correcto). | Aprobada |
| R19 | Valores de mitigación | Ruta alterna Santa Marta: tormenta o congestión sin retraso, USD 600. Operador OEA: evita una inspección, USD 250. Forward: tasa fija de 3.200, 0,3 %. Carta de crédito: cubre el impago, 0,8 %. | Aprobada |
| R20 | Sincronización | El Superusuario ve en vivo el avance de cada empresa (tramos, glosas y días a bordo) y los contratos que le interesan; el jugador ve los eventos y la fase de la ronda. | Aprobada |

Puntaje (m = margen en %, OTIF = 1 si cumple, E = exactitud, S = aciertos en Saber Pro):

```latex
\text{Puntaje} = 40\cdot\min\left(1,\max\left(0,\tfrac{m}{15}\right)\right) + 25\cdot \text{OTIF} + 20\cdot E + 15\cdot S
```

Seguro (r = tasa de la póliza, P = precio del contrato):

```latex
\text{Seguro} = r \times 1{,}1 \times P
```

## 4. Catálogo de cartas del prototipo

El prototipo trae 29 cartas: 11 de operación, 5 documentos y 13 eventos, montadas sobre el contrato C-07 (café verde CIF Rotterdam, USD 48.100, embarque en 7 días).

### Cartas de los jugadores

| Carta | Familia | La juega | Costo | Efecto |
| --- | --- | --- | --- | --- |
| Tractomula seca | Transporte | Tráfico | USD 1.700 | 2 viajes Montería → Cartagena, 1 día |
| Tractomula refrigerada | Transporte | Tráfico | USD 2.500 | Igual, a −18 °C; sobrecosto con carga seca |
| 2 × 40' High Cube | Transporte | Tráfico | USD 3.700 | Cartagena → Rotterdam, 14 días, incluye el BL |
| 2 × 40' Reefer | Transporte | Tráfico | USD 8.200 | Igual, refrigerado; llega al robar |
| Carga aérea en pallets | Transporte | Tráfico | USD 76.000 | 1 día; CIF la rechaza por ser solo marítimo |
| Póliza ICC (C) | Finanzas | CFO | 0,75 % | Cobertura mínima que exige CIF |
| Póliza ICC (A) | Finanzas | CFO | 1,1 % | Todo riesgo; exigida por CIP |
| Forward de venta USD | Finanzas | CFO | 0,3 % | Fija la tasa en 3.200 frente a devaluación o revaluación |
| Carta de crédito confirmada | Finanzas | CFO | 0,8 % | Cubre el retraso en el pago; llega al robar |
| Ruta alterna: Santa Marta | Mitigación | Riesgos | USD 600 si se usa | Anula el retraso por tormenta o congestión en Cartagena |
| Operador OEA | Mitigación | Riesgos | USD 250 | Evita la próxima inspección sorpresa; empieza en el archivo |
| Factura comercial | Documento | Aduanas | Reto | Obligatorio |
| Lista de empaque | Documento | Aduanas | Reto | Obligatorio |
| Declaración de exportación | Documento | Aduanas | Reto | Obligatorio |
| Certificado fitosanitario | Documento | Aduanas | Reto | Obligatorio; cubre la alerta sanitaria de la UE |
| Certificado de origen | Documento | Aduanas | Reto | Opcional; suma 1 % del precio por la preferencia arancelaria |

### Cartas de evento del Superusuario

| Evento | Duración | Efecto sobre C-07 | Se mitiga con |
| --- | --- | --- | --- |
| Tormenta tropical | 1 ronda | +3 días al embarque | Ruta alterna: Santa Marta |
| Congestión en Cartagena | 1 ronda | +2 días al embarque | Ruta alterna: Santa Marta |
| Inspección sorpresa | 1 ronda | Reto a Aduanas; si falla, +2 días y USD 500 | Operador OEA |
| Alza de fletes | 3 rondas | Flete +18 %, que paga el vendedor en CIF | Negociar FOB en el próximo contrato |
| Pandemia | 3 rondas | +2 días y USD 400 | Inventario de seguridad (versión completa) |
| Alerta sanitaria en la UE | 2 rondas | +5 días y USD 900 sin certificado fitosanitario correcto | Certificado fitosanitario |
| Retraso en el pago | 2 rondas | USD 480 de costo financiero | Carta de crédito confirmada |
| Revaluación del peso | 2 rondas | Margen en pesos −8 % | Forward de venta USD |
| Devaluación del peso | 2 rondas | Margen en pesos +12 % | Forward (si se prefiere certeza) |
| Huelga en Rotterdam | 2 rondas | Ninguno bajo CIF; la llegada se demora 6 días | Incoterm con entrega en origen |
| Ciberataque a la naviera | 1 ronda | Ninguno bajo CIF; la llegada se demora 3 días | Diversificar navieras |
| Ataques en el mar Rojo | 3 rondas | Ninguno: la ruta no cruza Suez | Doble fuente (otras empresas) |
| Sequía en Panamá | 2 rondas | Ninguno: la ruta no cruza el canal | Ruta por Buenaventura (otras empresas) |

## 5. Siguiente paso

Cuando las 20 reglas estén aprobadas o ajustadas, sigue la ronda 1 de pruebas con usuarios de Pruebas de usuario, con las tareas W1–W8 adaptadas a las dos mesas. En vacío ya se verificó el recorrido completo: los 4 tramos a cargo del vendedor, documentos con error y su corrección, la inspección, la ruta alterna frente a la tormenta y la sincronización entre ambas mesas.

Quedan para la versión completa las cartas de proveedor de la cadena, la negociación de contratos entre empresas en el mercado, más contratos e Incoterms en juego y el mazo completo de unas 80 cartas.

## 6. Turno guiado y bitácora de decisiones (para aprobación)

Las reglas R1–R20 quedaron aprobadas el 1 de noviembre. Esta sección agrega 8 reglas: cada fase tiene dueño y una decisión concreta, y cada decisión queda registrada con su alternativa y su efecto. Ya funcionan en la mesa del jugador del mock-up.

| Fase | Turno de | Decisión | Qué queda bloqueado |
| --- | --- | --- | --- |
| 1. Mercado | Comercial | Cerrar C-07 en CIF (USD 48.100) o renegociar FOB (USD 44.000) | Jugar cartas en la mesa |
| 2. Robo | Tráfico, Aduanas, CFO o Riesgos | Robar 2 cartas para el equipo, una vez por ronda | Seguir con más de 8 cartas en la mano |
| 3. Planeación | Tráfico, Aduanas, CFO y Riesgos | Cubrir los tramos a cargo, 3 jugadas por rol | Cambiar el Incoterm |
| 4. Visto del CEO | CEO | Dar el visto o devolver con motivo | Jugar cartas que no sean coberturas |
| 5. Evento | Superusuario | Jugar una carta de evento | Todas las jugadas del equipo |
| 6. Reacción | CFO y Riesgos | Jugar coberturas y mitigaciones con las jugadas que queden | Transporte, pólizas y documentos |
| 7. Liquidación | Nadie | Se liquida la operación si tiene visto | Todo; se revisa la bitácora |

| ID | Regla | Detalle | Decisión |
| --- | --- | --- | --- |
| R21 | Fases con dueño | Cada fase activa solo a los roles de la tabla anterior; los demás quedan en espera y ven quién decide y qué se espera. | Pendiente de aprobación |
| R22 | Control de la fase | Con el Superusuario conectado, él avanza las fases y la ronda. Sin conexión, el equipo juega en modo práctica y avanza las fases por su cuenta. | Pendiente de aprobación |
| R23 | Incoterm en Mercado | El Comercial decide una vez por ronda, antes del visto. Si pasa a FOB, las cartas de flete y seguro vuelven a la mano y esos tramos quedan del comprador. | Pendiente de aprobación |
| R24 | Visto del CEO | Exige todos los tramos a cargo cubiertos y ninguna inspección pendiente. Devolver exige un motivo: faltantes, costo alto o riesgo sin cubrir. Precisa R14: el CEO ya no ejecuta, da el visto. | Pendiente de aprobación |
| R25 | Operación aprobada | Con visto solo admite coberturas en Reacción; una operación devuelta vuelve a Planeación en la ronda siguiente con las jugadas recuperadas. | Pendiente de aprobación |
| R26 | Liquidación automática | Al entrar en Liquidación se liquida la operación con visto; sin visto la ronda cierra sin liquidar y el plazo sigue corriendo. | Pendiente de aprobación |
| R27 | Inspección en cualquier fase | La inspección sorpresa la responde Aduanas en cuanto aparece, sin importar la fase, y no gasta jugadas. | Pendiente de aprobación |
| R28 | Bitácora de decisiones | Cada decisión registra ronda, fase, rol, decisión, alternativa y efecto en USD o días; deshacer una jugada borra su registro. Al liquidar se resume por rol: número de decisiones y USD pagados por encima de la alternativa (sobrecostos, primas y glosas). Alimenta el informe individual. | Pendiente de aprobación |

Verificación en vacío: 13 de 13 casos correctos, entre ellos una operación devuelta que se completa, aprueba y liquida en la ronda siguiente, y la misma partida con el Superusuario controlando las fases.
