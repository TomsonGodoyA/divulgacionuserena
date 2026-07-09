# Sitio Divulgación USerena — estructura de producción

Sitio 100% estático (HTML/CSS/JS + JSON). Sin backend.

## Estructura
```
index.html            Inicio
repositorio.html      Listado + buscador (carga assets/data/data.json)
assets/
  css/base.css        Compartido (tokens, nav, cards, filtros, footer, reveal)
  css/home.css        Solo index
  js/nav.js           Compartido (nav dinámico + menú móvil + reveal)
  js/home.js          Solo index (carrusel hero + conteo métricas)
  js/repo.js          Solo repositorio (búsqueda/orden/filtros/paginación/URL)
  data/data.json      Catálogo de entradas
  img/                Imágenes estructurales (.webp)
  img/entradas/       Miniatura de cada entrada (.webp), 1 por slug
  svg/                logo-divulgacion.svg, logo-userena.svg, logo-cna.svg
```

## Assets que debes colocar (kebab-case, minúsculas)
Ver `assets-manifest.md`. Los 5 íconos de redes ya van inline; no se exportan.

## Previsualizar en local
`fetch()` no funciona abriendo el HTML con doble clic (file://). Levanta un servidor:
```
cd (carpeta del sitio)
python -m http.server
```
Luego abre http://localhost:8000  (o revisa directo en GitHub Pages tras el push).

## Agregar una entrada
1. Exporta su miniatura a `assets/img/entradas/<slug>.webp`.
2. Agrega un objeto a `assets/data/data.json`:
   { id, slug, titulo, resumen, area, disciplina, tipo, fecha (AAAA-MM-DD),
     img: "assets/img/entradas/<slug>.webp", alt, url: "entrada.html?slug=<slug>" }
   area  = humanidades | ciencias | facsej | ingenieria
   tipo  = grafico | audiovisual | podcast
El buscador y el home se actualizan solos; no se toca código.
