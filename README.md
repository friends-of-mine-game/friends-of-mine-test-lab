# Friends of Mine · Test Lab

Laboratorio público para pruebas humanas de Friends of Mine desde móvil.

## Flujo

`idea → test versionado → URL específica → respuesta móvil → SplitForms → análisis → decisión`

El repo no contiene GDD ni código del producto. Solo la interfaz y cuestionarios que decidimos publicar.

## URLs

La web base es `https://friends-of-mine-game.github.io/friends-of-mine-test-lab/` y abre por defecto el test de socios.

Cada test tiene URL estable mediante `?test=`:

- socios: `https://friends-of-mine-game.github.io/friends-of-mine-test-lab/?test=socios-v1`
- smoke técnico: `https://friends-of-mine-game.github.io/friends-of-mine-test-lab/?test=smoke-test`

Para añadir otro test se crea `tests/<id>.js` y se autoriza el id en `test.js`. El motor no se duplica.

## Respuestas

Al terminar, la web envía automáticamente la respuesta a SplitForms. SplitForms es únicamente el buzón/receptor: evita mantener un backend propio y almacena cada submission en un dashboard privado asociado a la cuenta de Alexandre.

Cada submission incluye `test_id`, versión, participante, timestamps y `response_json` con todas las respuestas, confianza y justificaciones. Desde la cuenta de SplitForms Alexandre puede consultar y descargar/exportar las respuestas para analizarlas. Los participantes no necesitan cuenta ni ven SplitForms.

El navegador mantiene además el progreso en `localStorage`. La descarga JSON manual solo aparece si falla el envío automático, como recuperación.

## Separación de responsabilidades

- GitHub: versiona aplicación, cuestionarios y cambios.
- GitHub Pages: publica la web gratis.
- SplitForms: recibe y almacena submissions.
- Repo privado principal: conserva GDD, decisiones y conclusiones de los análisis; no recibe un commit por cada participante.

## Test de socios

`?test=socios-v1` contiene las 55 preguntas del test exhaustivo validado en el repo principal. Alexandre y Anxo deben responderlo por separado. Sus respuestas son hipótesis de diseño, no evidencia externa. Después se ejecuta el run de análisis y se construye un test externo distinto, más corto (objetivo ≤15 min).
