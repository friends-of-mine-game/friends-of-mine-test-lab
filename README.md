# Friends of Mine · Test Lab

Laboratorio público y ligero para ejecutar pruebas humanas del proyecto Friends of Mine desde móvil.

## Objetivo

`idea → test versionado → enlace → respuestas estructuradas → análisis → decisión`

Este repositorio no contiene el GDD ni código del producto. Solo contiene instrumentación y cuestionarios que se decida hacer públicos.

## Web

GitHub Pages publica la interfaz en:

`https://friends-of-mine-game.github.io/friends-of-mine-test-lab/`

El navegador mantiene un borrador en `localStorage` para que cerrar o recargar no borre el test.

## Guardado automático

Para evitar backend propio, Workers, tokens GitHub y repos adicionales, las respuestas se envían a SplitForms al terminar el test.

Flujo:

`GitHub Pages → SplitForms → dashboard privado + email`

La respuesta completa se manda en el campo `response_json`, junto con `test_id`, versión, participante y timestamps. La descarga local del JSON sigue disponible como respaldo si el servicio falla.

SplitForms usa una access key pública diseñada para clientes web. No da acceso de lectura a las respuestas ni permite administrar la cuenta. Se recomienda restringirla en SplitForms al dominio `friends-of-mine-game.github.io`.

## Activación única

1. Crear una cuenta gratuita en SplitForms.
2. Copiar la access key del formulario.
3. Configurar `Allowed Domains` con `friends-of-mine-game.github.io`.
4. Escribir la key en `config.js`:

```js
window.FOM_CONFIG = {
  splitFormsAccessKey: 'sf_live_...'
};
```

Después GitHub Pages se redespliega automáticamente y el botón final pasa a enviar las respuestas sin pasos manuales.

El plan gratuito de SplitForms ofrece 500 envíos al mes, suficiente para el uso previsto del Test Lab.
