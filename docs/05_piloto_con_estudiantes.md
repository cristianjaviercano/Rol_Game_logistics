# Piloto con estudiantes: app web, Supabase y Vercel

La carpeta `web/` sirve las 13 pantallas del mock-up fuera del lienzo de Claude. Un script (`web/scripts/gen-screens.mjs`) toma cada `mockup/*.dc.html` sin modificarlo y la monta con un runtime propio (Preact). Así el lienzo y la app comparten la misma lógica y las mismas pruebas.

## Arquitectura del piloto

| Pieza | Función |
| --- | --- |
| GitHub | Código fuente; cada push a `main` despliega en Vercel |
| Vercel (plan Hobby) | Sitio estático: `web/` construido con Vite |
| Supabase Auth | Al iniciar cada persona se identifica: Superusuario (correo y contraseña) o jugador (sesión anónima, sin correo) |
| Supabase Realtime | Canal por partida que reemplaza el `BroadcastChannel` del lienzo: la Mesa del Superusuario mueve el mundo y cada equipo recibe fases y eventos en su computador |
| Supabase Postgres | Partidas, participantes, último estado por canal, eventos del piloto y encuestas, protegidos con RLS |

Sin variables de Supabase la app arranca en **modo local**: las pantallas se comunican entre pestañas del mismo navegador y no se guarda nada. Sirve para demostraciones.

## Puesta en marcha (una vez)

1. **Crear el proyecto** en [supabase.com](https://supabase.com): región *South America (São Paulo)*, la más cercana a Colombia.
2. **Crear las tablas:** en *SQL Editor*, pegar y ejecutar `supabase/migrations/001_piloto.sql` y luego `002_salas_empresas.sql`. Se pueden volver a ejecutar sin perder datos.
3. **Activar el ingreso anónimo:** *Authentication → Sign In / Providers → Allow anonymous sign-ins*.
4. **Cuenta del docente:** en la app, *Soy docente → Crear cuenta*. Si Supabase pide confirmar el correo, confirmarlo una vez.
5. **Conectar Vercel:** en el proyecto `rol-game-logistics`, *Settings → Environment Variables*:
   - `VITE_SUPABASE_URL` = *Project URL* (Supabase → Project Settings → API).
   - `VITE_SUPABASE_ANON_KEY` = clave pública *anon* / *publishable*. **Nunca** la clave `service_role`.
   - Volver a desplegar.

## Guion de una sesión (90 min)

| Momento | Docente | Estudiantes |
| --- | --- | --- |
| Antes | «Soy el Superusuario» → abrir sala con nombre → se abre la Mesa del Superusuario | — |
| 0–10 min | Explica empresas, roles y fases | «Soy jugador» → eligen la sala, su empresa y un alias; aceptan el consentimiento. Si comparten empresa, los roles se reparten solos |
| 10–15 min | — | Prueba corta tipo Saber Pro (pre-test, en papel o formulario) |
| 15–75 min | Proyecta la Mesa del Superusuario; avanza fases y juega cartas de evento (todos ven el aviso animado) | Cada integrante juega sus roles en la *Mesa del jugador*; el *Mundo de la partida* muestra el globo con los eventos |
| 75–85 min | Revisa la tabla de equipos del panel | Encuesta final (SUS + 2 preguntas abiertas) |
| Después | Descarga los CSV y cierra la partida | — |

Hay 3 empresas jugables (Café Sinú, Acuícola del Sinú, Shenzhen Parts) y 3 contrapartes automáticas; una empresa jugable sin integrantes también la maneja el computador. Con 2 a 6 personas por empresa se cubren de 6 a 18 estudiantes por sala; para grupos más grandes se abren varias salas.

## Datos que se guardan

| Tabla | Contenido |
| --- | --- |
| `participantes` | alias, equipo, consentimiento, hora de ingreso (sin nombre, correo ni documento) |
| `eventos` | `bitacora` (cada decisión por rol, con alternativa, efecto y costo), `cambio` (fase, Incoterm, visto del CEO, retos, documentos, liquidación…), `pantalla` (qué abrió y con qué tamaño de pantalla) y `error` |
| `estado_canal` | último estado de cada equipo y del mundo, e instantáneas para retomar tras recargar |
| `encuestas` | 10 ítems SUS (puntaje 0–100) y comentarios |

Desde el panel docente se descargan como CSV (UTF-8, abre en Excel).

## Seguridad y ética

- **RLS:**
  - un estudiante solo escribe su propio estado y sus eventos dentro de su partida;
  - no puede mover el mundo (`gm`);
  - no lee eventos ni encuestas;
  - solo el docente dueño de la partida lee los datos.
- **Pruebas de los permisos:** `supabase/tests/` simula Supabase en un PostgreSQL local y verifica 22 casos de permisos (todos correctos al cerrar esta versión).
- **Datos personales:** el consentimiento informado se muestra antes de entrar. Los datos personales se tratan según la Ley 1581 de 2012. Si los resultados se publicarán, el protocolo debe pasar por el comité de ética de la UPB.
- **Canal público:** el canal en tiempo real es público pero su nombre usa el identificador interno de la partida (UUID), que no se muestra a los estudiantes. Para producción conviene activar canales privados con autorización de Realtime.

## Límites de los planes gratuitos (noviembre de 2026)

- **Supabase Free:**
  - 500 MB de base de datos y 50 000 usuarios activos al mes;
  - 200 conexiones simultáneas en tiempo real y 2 millones de mensajes al mes;
  - el proyecto se pausa tras una semana sin actividad (reactivarlo antes de clase). Pro cuesta US$25 al mes.
- **Vercel Hobby:** gratis, solo para uso personal y no comercial. Si el laboratorio se vende, se pasa a Pro (US$20 por usuario al mes).

## Limitaciones conocidas del piloto

- **Mesa compartida:** si dos integrantes cambian lo mismo al mismo tiempo, gana el último cambio.
- **Contrapartes:** Caribe Line, Rotterdam Foods y AeroCarga todavía no son jugables.
- **Escenas 3D:** son ilustrativas; no cambian los indicadores del juego.
- **Tamaños de pantalla:** las pantallas se diseñaron a 1440 px y se escalan al ancho del navegador; las de rol están a 390 px, para celular.
