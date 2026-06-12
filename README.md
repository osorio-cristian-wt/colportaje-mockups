# Mockups colportajeApp — Revisión

Borradores de diseño (prototipos HTML de Claude Design) de las 3 vistas de
**colportajeApp**, preparados para enviar a revisión. Cada vista se publica como
una página estática con:

- **Navegación por pestañas** (interactuables).
- **Mensaje de bienvenida** que resalta las pestañas con un marco + explicación.
- **Botón "💬 Comentar"**: el revisor arrastra una zona de la pantalla y deja un
  comentario. Se guarda: `vista`, `tab`, `x`, `y`, `ancho`, `alto`, `scroll_y`,
  `comentario`, `autor`.

> Son prototipos, **no** la app final. No contienen datos reales de clientes.

## Vistas (3 links)

| Vista | Archivo | URL (tras publicar en Pages) |
|-------|---------|------------------------------|
| App Colportor (mobile) | `colportor.html`   | `https://<usuario>.github.io/colportaje-mockups/colportor.html` |
| Panel Admin            | `admin.html`       | `https://<usuario>.github.io/colportaje-mockups/admin.html` |
| Panel Coordinador      | `coordinador.html` | `https://<usuario>.github.io/colportaje-mockups/coordinador.html` |

`index.html` es una portada con los 3 accesos.

## Publicar en GitHub Pages

```bash
# 1) Crear el repo remoto y subir (desde F:\repos\colportaje-mockups)
git init
git add .
git commit -m "feat: mockups de revisión con capa de comentarios"
gh repo create colportaje-mockups --public --source=. --push

# 2) Activar GitHub Pages: rama main, carpeta raíz (/)
gh api -X POST repos/{owner}/colportaje-mockups/pages -f "source[branch]=main" -f "source[path]=/" 2>/dev/null \
  || echo "Activá Pages a mano: Settings → Pages → Branch: main / root"
```

Pages tarda ~1 min en publicar. El archivo `.nojekyll` evita que GitHub
reprocese los archivos.

## Recolectar los comentarios (Supabase)

Los comentarios se guardan en una tabla de **Supabase** (el backend que ya usa
el proyecto). Es feedback sobre mockups, sin PII, por eso se permite inserción
anónima protegida por RLS (solo-INSERT).

1. **Crear la tabla** — Supabase Dashboard → SQL Editor → pegar y ejecutar
   [`supabase/revision_comentario.sql`](supabase/revision_comentario.sql).
2. **Configurar credenciales** — editar [`revision-config.js`](revision-config.js)
   con el `Project URL` y la `anon public` key (Settings → API). Commit + push.
3. **Leer el feedback** — Table Editor → `revision_comentario`, o:
   ```sql
   select vista, tab, comentario, autor, created_at
   from revision_comentario order by created_at desc;
   ```

### Fallback sin Supabase

Si todavía no configurás Supabase (o falla la red), cada comentario se guarda en
el `localStorage` del navegador del revisor. Con **doble-click en el botón `?`**
se descarga un `comentarios-<vista>.json` que el revisor puede enviarte.

## Estructura

```
colportaje-mockups/
├── index.html              # portada con los 3 links
├── colportor.html          # App Colportor (mobile 390×844)
├── admin.html              # Panel Admin (escritorio)
├── coordinador.html        # Panel Coordinador (escritorio)
├── support.js              # runtime de Claude Design (renderiza los .dc.html)
├── revision.js             # capa de revisión: bienvenida + comentarios
├── revision-config.js      # credenciales Supabase (completar)
├── .nojekyll
└── supabase/
    └── revision_comentario.sql
```

### ¿Cómo funciona la capa de revisión?

`support.js` monta cada prototipo con React en `#dc-root`. `revision.js` corre
aparte: detecta la pantalla activa leyendo el atributo `data-screen-label` del
DOM renderizado, resalta la barra de pestañas uniendo los rects de los ítems de
navegación, y captura las coordenadas del comentario relativas al contenedor
scrolleable de la pantalla activa (por eso se guarda también `scroll_y`).

---

Generado a partir del bundle `vistas-colportaje` de Claude Design.
