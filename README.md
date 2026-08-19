# Friends of Mine · Test Lab

Laboratorio público y ligero para ejecutar pruebas humanas del proyecto Friends of Mine desde móvil.

## Objetivo

`idea → test versionado → enlace → respuestas estructuradas → análisis → decisión`

Este repositorio **no contiene el GDD ni código del producto**. Solo contiene instrumentación y cuestionarios que se decida hacer públicos.

## Web

GitHub Pages publica la interfaz en:

`https://friends-of-mine-game.github.io/friends-of-mine-test-lab/`

El navegador mantiene un borrador en `localStorage` para que cerrar o recargar no borre el test.

## Guardado automático de respuestas

La web está preparada para enviar el JSON final a un Cloudflare Worker. El Worker guarda cada respuesta como un archivo distinto en un repositorio GitHub configurado mediante variables, sin exponer el token de GitHub al navegador.

Flujo:

`GitHub Pages → POST al Worker → GitHub Contents API → repo privado de resultados`

Por privacidad, **no se recomienda guardar respuestas de personas en este repositorio público**. El destino previsto es un repositorio privado independiente llamado `friends-of-mine-test-results`.

Ejemplo de archivo generado:

`results/test-socios-v1/2026-08-19T16-30-00-alexandre-a1b2c3d4.json`

Si el endpoint no está configurado o falla, la descarga manual del JSON sigue disponible como respaldo.

## Worker

Código: `worker/src/index.js`

Configuración: `worker/wrangler.jsonc`

Variables no secretas ya previstas:

- `GITHUB_OWNER=friends-of-mine-game`
- `GITHUB_REPO=friends-of-mine-test-results`
- `GITHUB_BRANCH=main`

Secret requerido en Cloudflare:

- `GITHUB_TOKEN`: fine-grained personal access token con acceso únicamente al repositorio privado de resultados y permiso `Contents: Read and write`.

El Worker acepta POST solo desde el origen de GitHub Pages, limita el tamaño del payload, valida la estructura básica y genera un nombre de archivo único.

## Activación

1. Crear en la organización un repo **privado** vacío `friends-of-mine-test-results`.
2. Crear un fine-grained PAT de GitHub limitado a ese repo con `Contents: Read and write`.
3. En Cloudflare Workers & Pages, importar este repositorio como Worker con root directory `worker`.
4. Añadir `GITHUB_TOKEN` como **Secret** de runtime.
5. Desplegar y copiar la URL `https://...workers.dev`.
6. Escribir esa URL en `config.js` como `window.FOM_RESPONSE_API_URL`.
7. Probar un smoke test y comprobar que aparece un JSON en el repo privado.

No incluir tokens ni secretos en `config.js`, `wrangler.jsonc`, GitHub Pages ni ningún archivo versionado.
