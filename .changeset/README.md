# Changesets

Cada cambio que un usuario debería notar (nueva funcionalidad, fix, mejora visible) necesita
un changeset antes de mergear el PR:

```bash
pnpm changeset
```

Elegí el tipo de bump (patch/minor/major) y escribí el resumen **en español** — ese texto
es justamente lo que después aparece tal cual en `/changelog` para los usuarios, así que
redactalo pensando en ellos, no en otros devs (nada de "fix: null check en X").

El [changeset-bot](https://github.com/apps/changeset-bot) comenta en cada PR si falta o no
un changeset. Cambios internos que no afectan al usuario (refactors, tests, tooling) pueden
mergearse sin changeset.

Cuando se quiere cortar una release, alguien con permisos corre:

```bash
pnpm version-packages   # consume los changesets, bump de versión y actualiza CHANGELOG.md
git push && git push --tags
```

Más info en la [documentación oficial](https://github.com/changesets/changesets/blob/main/docs/common-questions.md).
