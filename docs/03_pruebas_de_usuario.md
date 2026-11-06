# Pruebas de usabilidad del mock-up

Revisión del Oct 26, 2026 sobre las 7 pantallas del mock-up (versión publicada 8 del lienzo).

## 1. Pruebas en vacío automatizadas

De 48 casos ejecutados sobre la lógica de las 7 pantallas, 36 se comportaron como se esperaba, ninguno falló y 12 revelaron problemas de diseño. Los cálculos son correctos; los problemas están en la experiencia.

**Método:** un arnés en Node carga el componente de cada pantalla con un entorno simulado, ejecuta clics y cambios de estado, y compara el resultado con la regla esperada (tipo de cambio tras devaluación, tramos por Incoterm, cubicaje, saldos tras pagos, cronómetro de retos, propagación de eventos, negociación y filtros). No incluye el render del globo 3D, que se revisó a ojo.

**Lo que pasó sin novedad:** tasas de cambio, ranking por margen, normalización de eventos, matriz Incoterms, saldos multimoneda, bloqueo de respuestas por tiempo, alertas del planificador (carga congelada, FOB y CIF en aéreo, CIP sin ICC (A), peso volumétrico), propagación del mar Rojo con inventario de seguridad, doble fuente y coherencia de datos del lobby (17 empresas y sus proveedores).

Los 12 hallazgos aparecen en la sección 4 con el código de su prueba (M9, M10, C4, C5, F3, F4, A6, T4, K5, K8, S4, S6).

## 2. Auditoría de accesibilidad

De 18 pares de color revisados con la fórmula de contraste WCAG 2.1, 17 cumplen el nivel AA. También hay 6 botones sin acción, 1 objetivo táctil por debajo de 44 px y 10 textos de 11 px.

| Revisión | Resultado | Dónde |
| --- | --- | --- |
| Contraste de texto (mínimo 4,5:1; 3:1 en texto grande) | 17 de 18 pares cumplen; rojo #D62839 sobre rosa #FFE3E6 da 4,12:1 | Recuadro de transferencia del riesgo (Comercial) |
| Botones sin acción | 6: Pausar partida, Convertir divisas, Cubrir con forward, Pedir visto al CEO, Enviar oferta, Unirme | Consola, CFO, Comercial, Lobby |
| Objetivos táctiles de al menos 44 px | 1 por debajo: opciones de la negociación (40 px) | Cadena y negociación |
| Textos menores de 12 px | 10 (8 en el lobby, 2 en la negociación) | Etiquetas de continente, PMV, expo/impo y origen |
| Controles con estado anunciado | Todos los botones de selección usan aria-pressed | Las 7 pantallas |
| Cambios dinámicos anunciados | Noticias y alertas no usan aria-live | Consola |
| Alternativa al globo 3D | Alertas y lista de puertos en texto; sin detalle de buques | Consola |

La paleta nocturna cumple en todos los pares revisados (mínimo 7,9:1).

## 3. Recorrido cognitivo por tarea

En 6 de las 8 tareas clave el usuario sabe qué hacer y encuentra el control; el punto débil es la respuesta del sistema, incompleta o engañosa en 5 tareas.

Cada tarea se recorrió en vacío con las cuatro preguntas del método: ¿intentará el usuario lograr el efecto correcto?, ¿verá el control?, ¿asociará el control con su objetivo?, ¿entenderá la respuesta del sistema?

| Tarea | Rol y pantalla | Pasos | ¿Sabe qué hacer? | ¿Ve y asocia el control? | ¿Entiende la respuesta? | Problema |
| --- | --- | --- | --- | --- | --- | --- |
| W1 Lanzar una tormenta y ver su efecto | Superusuario · Consola | 2 | Sí | Sí | En parte | El ranking no dice qué evento afectó a cada empresa; un clic lanza el evento sin confirmar (H12, H16) |
| W2 Elegir el Incoterm que reduce el riesgo del exportador | Comercial · Matriz | 2 | Sí | Sí | En parte | El precio no cambia con el término (H3) |
| W3 Configurar tilapia en aéreo y volver a marítimo | Tráfico · Planificador | 4 | Sí | Sí | No | Aparece una alerta de rechazo que el usuario no provocó (H7) |
| W4 Pagar el flete y revisar el saldo | CFO · Tesorería | 1 | Sí | Sí | Sí | El pago se deshace con un toque (H5) |
| W5 Responder la inspección sorpresa | Aduanas · Retos | 1–2 | Sí | Sí | Sí | Cambiar de eje reinicia el cronómetro (H6) |
| W6 Elegir empresa y rol en el lobby | Estudiante · Lobby | 3 | Sí | En parte | En parte | La ficha no sigue el filtro; no se ven roles ocupados (H10, H11) |
| W7 Negociar sacos y fijar el proveedor | Comercial · Cadena | 3–6 | Sí | Sí | No | El proveedor acepta muy rápido y el trato no cambia la cadena (H8, H9) |
| W8 Activar doble fuente ante el mar Rojo | Riesgos · Cadena | 3 | En parte | Sí | Sí | «Doble fuente» e «IHH» no se explican en pantalla (H18, H21) |

## 4. Hallazgos y mejoras priorizadas

23 hallazgos: 8 mayores (severidad 3) para resolver ahora, 10 menores y 5 cosméticos; 13 se resuelven con esfuerzo bajo.

Severidad según la escala de Nielsen: 1 cosmético, 2 menor, 3 mayor, 4 catastrófico (ninguno). Entre paréntesis, el código de la prueba en vacío que lo detectó.

**Ronda de corrección (29 de octubre):** 14 de los 23 hallazgos quedaron resueltos en el mock-up: los 8 de prioridad «Ahora» y 6 de esfuerzo bajo (H4, H10, H13, H14, H15, H23). Al repetir las pruebas en vacío, 59 de 62 casos pasaron, ninguno falló y 3 siguen marcando hallazgos abiertos (H7, H8, H12). La auditoría ya no encuentra botones sin acción, objetivos menores de 44 px ni textos menores de 12 px, y los 18 pares de color cumplen el contraste.

El estado compartido (H2) funciona entre las pantallas abiertas en un mismo navegador; en el producto lo resolverá Supabase Realtime.

**Segunda ronda (30 de octubre):** se resolvieron H7, H8 y H12, con lo que suman 17 de 23. Las pruebas en vacío dan 63 de 63 casos correctos. Quedan 6 mejoras de prioridad media o baja: H17, H18, H20, H21, H22 y H24.

| ID | Hallazgo | Pantalla | Heurística o criterio | Severidad | Mejora propuesta | Esfuerzo | Prioridad | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| H1 | Seis botones sin acción (M9 y auditoría) | Consola, CFO, Comercial, Lobby | 1 Visibilidad del estado | 3 | Dar respuesta a cada botón (cambio de estado o aviso); retirar «Cubrir con forward» del PMV porque es de la versión full | Bajo | Ahora | Hecha |
| H2 | Estado no compartido entre pantallas: el banner de devaluación del CFO es fijo (F4) | CFO y vistas por rol | 4 Consistencia y estándares | 3 | Estado de partida compartido: los eventos de la consola alimentan cada vista por rol | Alto | Ahora | Hecha |
| H3 | El precio ofertado no cambia con el Incoterm (C5) | Comercial | 2 Correspondencia con el mundo real | 3 | Precio calculado: valor FOB más los tramos que asume el vendedor según el término | Medio | Ahora | Hecha |
| H5 | Un pago se deshace con un toque (F3) | CFO | 5 Prevención de errores | 3 | Confirmación con monto en COP y USD; sin reversión después del tick | Bajo | Ahora | Hecha |
| H6 | Cambiar de eje reinicia el cronómetro (A6) | Retos ECAES | Integridad de la evaluación | 3 | Cronómetro persistente por pregunta; en inspección sorpresa, bloquear la navegación hasta responder | Bajo | Ahora | Hecha |
| H9 | Un trato aceptado no cambia la cadena (K8) | Cadena y negociación | 1 Visibilidad del estado | 3 | Al aceptar, fijar proveedor y precio del insumo y generar el contrato | Medio | Ahora | Hecha |
| H11 | No se ven roles ocupados ni el modo Multirrol (S6) | Lobby | 1 Visibilidad del estado | 3 | Mostrar cupos por rol, quién los ocupa y qué roles cubrirá un bot | Medio | Ahora | Hecha |
| H16 | Un clic lanza un evento global sin confirmar | Consola | 5 Prevención de errores | 3 | Confirmación con vista previa de empresas afectadas y opción de deshacer durante 10 s | Medio | Ahora | Hecha |
| H4 | En DAP el seguro figura como obligación del vendedor (C4) | Comercial | 2 Correspondencia con el mundo real | 2 | Etiqueta «Vendedor (opcional: asume el riesgo)» | Bajo | Siguiente | Hecha |
| H7 | Volver a marítimo elige un contenedor seco para carga congelada (T4) | Planificador | 5 Prevención de errores | 2 | Preseleccionar la primera unidad apta para la carga | Bajo | Siguiente | Hecha |
| H8 | El proveedor acepta muy por debajo de su precio de lista (K5) | Cadena y negociación | Balance de juego | 2 | Piso del vendedor cercano a la lista y ajustado por reputación; contraoferta antes de aceptar | Bajo | Siguiente | Hecha |
| H12 | El ranking no dice qué evento afectó a cada empresa (M10) | Consola | 6 Reconocer antes que recordar | 2 | Chip del evento causante y variación frente a la ronda anterior | Medio | Siguiente | Hecha |
| H13 | Rojo sobre rosa con contraste de 4,12:1 | Comercial | Accesibilidad WCAG 2.1 | 2 | Usar el rojo oscuro #B01F2E (5,64:1) | Bajo | Siguiente | Hecha |
| H17 | Puertos y buques sin identificación en el globo | Consola | 6 Reconocer antes que recordar | 2 | Tooltip sobre puerto o buque con empresa, carga y ETA | Medio | Siguiente | Pendiente |
| H18 | Sin ayuda contextual para conceptos técnicos (doble fuente, regímenes) | Todas | 10 Ayuda y documentación | 2 | Ícono de ayuda con definición breve y enlace al reto ECAES relacionado | Medio | Siguiente | Pendiente |
| H20 | Planificador largo sin progreso; en celular el resultado queda al final | Planificador | 7 Flexibilidad y eficiencia | 2 | Barra de progreso de 5 pasos y resumen fijo inferior en móvil | Medio | Siguiente | Pendiente |
| H23 | Noticias y alertas no se anuncian a lectores de pantalla | Consola | Accesibilidad WCAG 2.1 | 2 | aria-live="polite" en el feed y en las alertas | Bajo | Siguiente | Hecha |
| H24 | Tras una noticia no se sugiere qué revisar | Consola y vistas por rol | 9 Reconocer y recuperarse de errores | 2 | Tarjeta «Qué revisar» por rol en cada noticia (p. ej., CFO: exposición en USD) | Medio | Siguiente | Pendiente |
| H10 | La ficha del lobby no sigue el filtro (S4) | Lobby | 4 Consistencia y estándares | 1 | Seleccionar la primera empresa visible al filtrar | Bajo | Después | Hecha |
| H14 | Opciones de negociación de 40 px | Cadena y negociación | Accesibilidad WCAG 2.1 | 1 | Altura mínima de 44 px | Bajo | Después | Hecha |
| H15 | Diez textos de 11 px | Lobby, Cadena | 8 Diseño estético y minimalista | 1 | Tamaño mínimo de 12 px | Bajo | Después | Hecha |
| H21 | Siglas sin expandir (IHH, OTIF, MAPE, DTM) | Varias | 2 Correspondencia con el mundo real | 1 | Tooltip con la definición la primera vez que aparece la sigla | Bajo | Después | Pendiente |
| H22 | La vista nocturna no se conserva entre pantallas | Todas | 4 Consistencia y estándares | 1 | Preferencia de tema global por usuario | Bajo | Después | Pendiente |

## 5. Plan de pruebas con usuarios

Las pruebas en vacío verifican reglas; solo las pruebas con usuarios miden si la interfaz se entiende y si enseña. El plan tiene tres rondas, y cada una empieza después de corregir los hallazgos de la anterior.

**Objetivos:** eficacia (tareas completadas), eficiencia (tiempo y errores), satisfacción (SEQ y SUS) y aprendizaje (puntaje antes y después en los retos).

| Ronda | Cuándo | Participantes | Formato | Pregunta que responde |
| --- | --- | --- | --- | --- |
| 1 Moderada | Tras corregir los hallazgos «Ahora» | 5 estudiantes de 5.º–6.º semestre y 2 docentes | Sesiones individuales de 45 min, pensando en voz alta, grabadas con consentimiento | ¿Entienden las pantallas y completan las tareas sin ayuda? |
| 2 Partida real | Con el estado compartido funcionando | 12 estudiantes (2 empresas × 6 roles) y 1 superusuario | Partida de 60 min con observación y registro de eventos | ¿Se coordinan los roles bajo presión de eventos? |
| 3 Piloto | Semestre siguiente | Un grupo con simulador y un grupo de control | Comparación de resultados de aprendizaje | ¿Mejora el aprendizaje frente a la clase tradicional? |

Antes de la ronda 1 se ensaya el protocolo con un monitor. Cinco participantes por perfil bastan para encontrar la mayoría de problemas graves, según la regla práctica de Nielsen; por eso la ronda 1 es pequeña y se repite tras cada corrección.

### Tareas

| Tarea | Escenario que se lee al participante | Criterio de éxito | Tiempo máximo |
| --- | --- | --- | --- |
| W1 | «Una tormenta cierra el puerto de Shanghái. Lánzala y di qué empresa salió más afectada.» | Lanza el evento y nombra la empresa correcta | 2 min |
| W2 | «Eres el comercial de Café Sinú. Elige el Incoterm con el que tu empresa asume menos riesgo y di hasta dónde llega.» | Elige EXW y explica dónde se transfiere el riesgo | 2 min |
| W3 | «Envía tilapia congelada a Miami por avión y compárala con la opción marítima.» | Usa unidad refrigerada en ambos modos y compara lead time y costo DFI | 4 min |
| W4 | «Paga el flete y di cuánto queda en dólares.» | Informa el saldo correcto | 1 min |
| W5 | «Llegó una inspección aduanera: responde el reto.» | Responde dentro del tiempo | 1,5 min |
| W6 | «Únete a una empresa asiática como CFO.» | Empresa de Asia y rol CFO seleccionados | 2 min |
| W7 | «Negocia los sacos por debajo del precio de lista y deja fijado al proveedor.» | Trato aceptado y proveedor fijado en la cadena | 4 min |
| W8 | «El mar Rojo se cierra. Reduce los días de parada de tu cadena.» | Activa doble fuente o inventario de seguridad y explica el cambio en resiliencia | 3 min |

### Métricas

| Métrica | Instrumento | Meta |
| --- | --- | --- |
| Éxito por tarea | Observación: completa, con ayuda o fallida | ≥ 80 % sin ayuda |
| Tiempo por tarea | Cronómetro desde la lectura del escenario | Dentro del máximo |
| Errores | Clics fuera de ruta y alertas provocadas | ≤ 2 por tarea |
| Facilidad percibida | SEQ (escala de 1 a 7) tras cada tarea | ≥ 5,5 |
| Usabilidad global | SUS (10 ítems) al final | ≥ 70 |
| Carga mental en crisis | NASA-TLX tras W8 | Línea base para la ronda 2 |
| Aprendizaje | 10 retos tipo ECAES antes y después | Mejora significativa en la ronda 3 |
| Primera impresión | Prueba de 5 segundos con la consola | Nombran 2 de 3 zonas: mapa, eventos, ranking |

### Guion de la sesión (45 min)

1. Bienvenida y propósito (3 min): «Probamos el simulador, no a ti».
2. Consentimiento informado para grabar y tratar datos según la Ley 1581 de 2012 (2 min).
3. Prueba de 5 segundos y calentamiento en el lobby (5 min).
4. Tareas W1–W8 pensando en voz alta, con la pregunta SEQ después de cada una (28 min). El moderador solo interviene tras 2 min de bloqueo.
5. Cuestionario SUS (3 min).
6. Cierre (4 min): ¿qué fue lo más confuso?, ¿qué te ayudó a entender el comercio exterior?, ¿lo usarías en clase?

**Análisis:** cada problema se registra con tarea, participante y cita textual. La prioridad combina severidad y frecuencia (participantes afectados sobre el total), y los problemas nuevos entran a la tabla de la sección 4 con su estado.
