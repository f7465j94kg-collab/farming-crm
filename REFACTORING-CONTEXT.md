# Contexto de refactorización — Portal Farming (Power Pages)

> Documento de **handoff**: léelo al empezar otra sesión para continuar el refactor
> con todo el contexto. No lo sube `pac` (no es un componente del portal).
> Última actualización: commit `acd7c41` en `main`.

---

## 1. Qué es este proyecto

Portal **Power Pages** (Dataverse) de **Farming** (maquinaria agrícola), en español, gestionado
como código vía **`pac` (Power Platform CLI)**. El repo es la exportación del sitio
(`web-pages/`, `web-templates/`, `web-files/`, `lists/`, `basic-forms/`, etc.).

Funcionalidad principal: un **configurador CPQ** (Fabricante → Producto → Producto Base →
Pasos N1–N4 → Opcionales → Resumen) que crea `wi_oportunidadfarming` + líneas; además
**stock / Farming Park**, **Mis Pedidos**, **Peticiones a producto**, **perfil**.

---

## 2. Objetivo del refactor

Centralizar y deduplicar estilos (estaban dispersos en `<style>` inline por todas las
páginas), crear un **mini sistema de diseño `.fm-*` reutilizable**, y hacerlo **sin
cambios visuales drásticos** para poder seguir construyendo páginas con este sistema.

---

## 3. El sistema de diseño (`web-files/farming.css`)

**Fuente única de verdad.** Se carga **UNA vez en cada página** con un `<link>` en el
**web-template `Header`** (`website.adx_headerwebtemplateid`), que se renderiza en TODAS
las páginas (`usewebsiteheaderandfooter = true`). No tocar el "Default studio template"
(marcado *do not modify*).

### Tokens (`:root`)
Colores de marca (`--fm-brand: #009FD9`, `--fm-brand-700`), foco, tintas
(`--fm-ink/-2/-3`, `--fm-text`, `--fm-muted/-2`), superficies/bordes
(`--fm-surface`, `--fm-border`, `--fm-card-border/-radius/-shadow`, `--fm-ghost-border`),
`--fm-font` (Space Grotesk, la carga `portalbasictheme.css`), radios, sombras, espaciado.

### Componentes compartidos (usar en contenido nuevo)
| Componente | Clases |
|---|---|
| Botón | `fm-btn` + `fm-btn--primary` / `fm-btn--ghost` / `fm-btn--sold` |
| Superficie/tarjeta | `fm-surface` (fondo blanco redondeado con sombra) |
| Tipografía | `fm-title` · `fm-section-title` · `fm-card-title` · `fm-eyebrow` · `fm-lead` |
| Formulario CRM | `.ppp-wrap` / `.ppp-form` (entityform a grid de 2 columnas) |
| Listas/detalle stock | `.pp-*` (listas), `.dp-*` (detalle stock/park), `.stk-*` (grid stock) |

### Estilos "de un solo dueño" (NO en farming.css, ya tokenizados)
- `.cfg-*` → inline en `web-templates/configurador-core` (lo incluyen todas las páginas
  del configurador + resumen).
- `.rsm-*` → inline en `web-templates/resumen`.
- `.do-*` → `web-pages/detalle-oportunidad/.../custom_css.css`.
- `.home-*` → `web-pages/página-principal/.../custom_css.css`.
- `.pb-*` → inline en `web-templates/producto-base`.
- header/footer/breadcrumb → inline en sus web-templates (chrome).

---

## 4. Reglas de arquitectura (IMPORTANTE para no romper la cascada)

**Dónde poner el CSS:**
- Compartido por 2+ páginas → `farming.css`.
- Único de una página → su `custom_css.css` (se inyecta en `<head>`).
- Solo de un web-template → inline en ese template.

**Orden de carga / cascada** (clave):
1. `<head>`: `theme.css`, `portalbasictheme.css`, y el **`custom_css.css`** de la página.
2. `<body>`: Header → **`<link farming.css>`** → … → contenido (`<style>` inline si lo hay).

Consecuencia: `farming.css` gana al tema. Pero un `custom_css.css` (head) carga **ANTES**
que `farming.css` (body) → si una página necesita **sobreescribir** una regla de
`farming.css`, debe ir **inline** (carga después) o con **más especificidad** (ej.:
`.do-wrap .do-title` para que el tamaño del H1 gane a `.fm-title`).

**Patrón "componente compartido + variación por página":** la clase comparte lo común y
lo que varía se pasa como **dato**, no como override:
- `.pp-card` (común en farming.css) + cada lista fija `--pp-card-cols` en su `.pp-wrap`.
- `.fm-title` (peso/color/tracking + tamaño 2.4 por defecto) + cada página fija su
  `font-size`/`margin` (detalle = 2.2).
- `.fm-btn` (look) + clase de layout (`.stk-btn`/`.home-card-btn` solo `margin/align-self`).

**Imágenes:** fondo → `style="background-image:url('/x.jpg')"` o CSS (NO atributos
sueltos); contenido → `<img src="/x.jpg">`. La ruta `/x.jpg` solo funciona si es un
**web file** del portal (si no, 404 → subirla como web file o usar URL absoluta).

---

## 5. Operativa `pac` / Power Pages (playbook)

- `pac.exe`: `%LOCALAPPDATA%\pac-cli\pkg\tools\pac.exe`. Auth activo → entorno **farming-dev**.
- **Website ID**: `53a5514e-8dc7-4356-8e99-87b0c8f8f325`.
- **Subir**: `pac pages upload --path . --modelVersion 2` (lee `website.yml`, sin `--webSiteId`).
- **Descargar**: `pac pages download --path <dir> --webSiteId 53a5514e-... --modelVersion 2`.
- **Caché**: tras subir hay que **sincronizar/limpiar la caché del portal** para ver los
  cambios (el Header está *output-cached*). Un Ctrl+F5 del navegador no basta.
- **`annotationid` de `farming.css`**: el contenido del web-file vive en una *annotation*
  cuyo id **se regenera en CADA subida**. Procedimiento: tras subir, **re-descargar**,
  leer el `annotationid` de `web-files/farming.css.webfile.yml` del entorno y copiarlo al
  local (si no, futuras subidas pueden fallar). **No fiarse del "upload succeeded"**:
  verificar el contenido re-descargando y comprobando.
- **Errores benignos** en subida: `Entity 'powerpagecomponent' ... Does Not Exist` (ciclo
  delete+recreate de annotations de web-files) — la subida igualmente "succeeds" y el
  contenido aterriza.
- ⚠️ **BORRADO**: `--modelVersion 2` **sincroniza borrados**. Borrar una carpeta de
  `web-pages/*` del repo hace que `pac` **intente borrarla del portal** (falla con
  `cannot be deleted ... referenced` si está referenciada). **Para borrar páginas usar el
  estudio de Power Pages**, NO borrar del repo. (Recuperación si pasa: `git checkout HEAD -- <carpeta>` + re-subir.)
- **Modelo de web-page**: cada página = 2 registros → la **raíz** (`<x>.webpage.yml`, sin
  idioma; sus copy/css/js suelen estar vacíos) y la **content-page** localizada
  (`content-pages/<x>.es-ES.webpage.*`, que lleva el contenido real). **Editar la content-page.**
- **Dos rutas de render**: la mayoría usa "Default studio template" (renderiza `adx_copy`);
  el configurador usa web-templates propios (CPQ/N1–N4/Opcionales/Producto/Producto-Base/Resumen).

---

## 6. Git / ramas

- Trabajar en rama **`refactor`** (feature). `main` es la baseline.
- Commit en `refactor`; merge a `main` (`git checkout main; git merge --ff-only refactor;
  git push origin main`) y push **solo tras verificar y cuando el usuario lo pida**.
- **`branch-main` fue eliminada** (2026-06-25). No recrearla.
- Remoto: el repo **se movió** a `https://github.com/widigital-es/farming-crm.git` (origin ya actualizado).
- Co-author en commits: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## 7. Qué está HECHO (en `main`, commit `acd7c41`)

- `farming.css` creado + cargado global vía Header; tokens + componentes.
- **Dedup** de bloques duplicados entre páginas: `.ppp-*` (peticiones), `.dp-*` (detalle
  stock/park, eran gemelos), `.stk-*` (listas stock/park), `.pp-*` (Mis Pedidos/Peticiones,
  con `--pp-card-cols`).
- **Tokenización** de valores (color/fuente/tintas/bordes) a `var(--fm-*)`.
- **Convergencia del azul** de marca a `#009FD9` (el del theme); eliminado `#2aa9e0`.
- **`.fm-btn`**: TODOS los botones del portal unificados.
- **`.fm-surface`**: tarjetas de detalle (dp/do/pp, sin cambio) + configurador/stock
  (`.cfg-card`/`.cfg-panel`/`.stk-card`, esquinas 14→16px).
- **Escala tipográfica `.fm-*`** definida; H1 de página migrados a `.fm-title`.
- **Migración de `<style>` inline → custom_css.css** en home y detalle-oportunidad
  (ninguna content-page conserva `<style>` inline).
- **Bug arreglado**: en Mis Pedidos, las solicitudes de stock enlazan a
  `/detalle-producto-stock` (no a Detalle-Oportunidad).
- **Hero** de la home arreglado (CSS estaba como atributos sueltos → `style="..."`).

---

## 8. Qué queda PENDIENTE (orden sugerido)

1. **`farming.js`** (lo más gordo — espejo de farming.css para JS). Duplicación fuerte:
   - `detalle-producto-stock.js` ≈ `detalle-farming-park.js` (192 líneas, gemelos);
     `productos-en-stock.js` ≈ `farming-park.js` (49, gemelos).
   - Formato de precio (toFixed + miles ES) en 6 ficheros; lógica de **modal** en 7;
     helpers **Web API** (`fetch('/_api'`, token) en 3; **filtro/búsqueda** de listas en 4.
   - Plan: web-file `farming.js` cargado vía Header con `fmtPrecio()`, `api*()/getToken()`,
     `modal()` genérico, filtro de listas. **Riesgo medio (comportamiento) → extraer lo
     seguro primero y verificar.**
2. **Unificar `.dp-*` y `.do-*`** (detalle stock vs detalle oportunidad: mismo patrón,
   distinto prefijo) → un layout de detalle común. Necesita tocar markup.
3. **Liquid duplicado** → content-snippets/web-templates compartidos:
   - fetchxml del "nombre de página" (GUID `48d3eb85-a348-7c23-...`) en 3 ficheros.
   - URL de imagen de fabricante (`.../CRM_DEV/Fabricantes/...` con `replace ' ' '%20'`) en 8.
4. **Adopción incremental** de `.fm-eyebrow` / `.fm-section-title` / `.fm-card-title` /
   `.fm-lead` en las etiquetas/títulos existentes (cuando se toque cada página).
5. Páginas **fuera del sistema** a propósito: `búsqueda` (search) y las de sistema
   (`acceso-denegado`, `página-no-encontrada`, `página-sin-conexión-predeterminada`) — sin
   estilos propios.
6. **Limpieza de páginas muertas** (`*-deleted`): solo desde el **estudio** (ver §5).

---

## 9. Cómo trabajar de aquí en adelante

- **Páginas/secciones nuevas** → usar `.fm-btn`, `.fm-surface`, `.fm-title`/`.fm-eyebrow`/…,
  y `var(--fm-*)`; no inventar clases con prefijo nuevo.
- CSS único de una página nueva → su `custom_css.css` (no inflar `farming.css`).
- Tras cualquier cambio: subir con `pac`, **sincronizar caché**, verificar en navegador,
  y re-sincronizar el `annotationid` de `farming.css` si se editó.
- Commit en `refactor`; a `main` + push tras verificar.
