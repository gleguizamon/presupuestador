# Ideas (post-lanzamiento)

> Draft. Cosas que podrían servir más adelante, sin compromiso ni orden.

## Editor JSON del documento

Como RenderCV con su YAML: un panel donde ves y editás el documento entero en
su formato crudo (JSON), además del formulario. Sirve para copiar/pegar un
presupuesto completo, versionarlo, o generarlo desde afuera y pegarlo.

- Encaja perfecto con el modelo actual: el `Doc` ya es un objeto plano
  serializable, `withDocDefaults()` ya normaliza cualquier JSON parcial.
- 100% client-side, sin backend — no rompe el pitch.
- A resolver: validación/errores de parseo, sincronización form ↔ JSON,
  qué campos exponer (¿`id`/timestamps ocultos?).

## Generar documentos por API + endpoints

Exponer un par de endpoints para crear/renderizar un presupuesto
programáticamente (POST un JSON → PDF, o → link compartible).

- **Tensión con el core**: hoy la promesa es "sin backend, nada sale del
  navegador". Una API implica un servidor. Decidir si es un producto aparte
  (`api.` / servicio pago) o si se descarta por principio.
- Si se hace: el renderer de PDF (`@react-pdf`) puede correr en Node, así que
  el mismo `pdf.tsx` serviría server-side. El `Doc` ya es el "contrato".
- Alternativa sin servidor: un paquete npm / CLI que genere el PDF localmente
  desde un JSON, reusando el mismo código.
