/* Divulgación USerena — entry.js
   Plantilla de entrada por bloques. Lee ?slug= de la URL, busca la entrada en
   data.json y arma la página recorriendo su arreglo "bloques". Bloques de tipo
   desconocido se ignoran (aviso solo en consola). 100% estático (fetch a JSON). */
(function(){
  'use strict';
  var root = document.getElementById('entry-root');
  if(!root) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var AREAS = {
    humanidades:{label:'Humanidades', fac:'Facultad de Humanidades'},
    ciencias:{label:'Ciencias', fac:'Facultad de Ciencias'},
    facsej:{label:'Cs. Sociales, Empresariales y Jurídicas', fac:'FACSEJ'},
    ingenieria:{label:'Ingeniería', fac:'Facultad de Ingeniería'}
  };
  var TIPOS = {grafico:'Gráfico', audiovisual:'Audiovisual', podcast:'Podcast'};
  var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  function fmtFecha(iso){ var p=(iso||'').split('-'); return p.length===3 ? (+p[2])+' de '+MESES[(+p[1])-1]+' de '+p[0] : ''; }
  function esc(s){ return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function getSlug(){ return new URLSearchParams(location.search).get('slug') || ''; }

  /* ---------- Renderizadores de bloque ---------- */
  /* Nota: 'texto' en parrafo/cita admite HTML inline (contenido de confianza, escrito por la Oficina). */
  var BLOQUES = {
    parrafo: function(b){ return '<p>'+(b.texto||'')+'</p>'; },
    subtitulo: function(b){ return '<h2>'+esc(b.texto)+'</h2>'; },
    cita: function(b){
      return '<blockquote>'+(b.texto||'')+(b.autor?'<cite>'+esc(b.autor)+'</cite>':'')+'</blockquote>';
    },
    imagen: function(b){
      return '<figure class="media"><img src="'+esc(b.src)+'" alt="'+esc(b.alt)+'" loading="lazy">'
        + (b.pie?'<figcaption>'+esc(b.pie)+'</figcaption>':'') + '</figure>';
    },
    infografia: function(b){
      return '<figure class="media infografia"><img src="'+esc(b.src)+'" alt="'+esc(b.alt)+'" loading="lazy">'
        + (b.pie?'<figcaption>'+esc(b.pie)+'</figcaption>':'') + '</figure>';
    },
    carrusel: function(b){
      var imgs = b.imagenes||[];
      var slides = imgs.map(function(im,n){
        return '<div class="eslide'+(n===0?' on':'')+'"><img src="'+esc(im.src)+'" alt="'+esc(im.alt)+'" loading="lazy"></div>';
      }).join('');
      var arrows = imgs.length>1
        ? '<button class="earrow l" aria-label="Anterior">‹</button><button class="earrow r" aria-label="Siguiente">›</button><div class="edots"></div>'
        : '';
      return '<figure class="media"><div class="ecarousel">'+slides+arrows+'</div>'
        + (b.pie?'<figcaption>'+esc(b.pie)+'</figcaption>':'') + '</figure>';
    },
    video: function(b){
      var id = b.youtubeId||'';
      var placeholder = (!id || id==='YT_ID_AQUI');
      var poster = b.poster ? esc(b.poster) : (id && !placeholder ? 'https://img.youtube.com/vi/'+esc(id)+'/hqdefault.jpg' : '');
      var play = '<button class="evbtn" aria-label="Reproducir video"><svg viewBox="0 0 68 48" fill="none">'
        + '<path d="M66.5 7.5a8 8 0 0 0-5.6-5.7C56 .5 34 .5 34 .5s-22 0-26.9 1.3A8 8 0 0 0 1.5 7.5 83 83 0 0 0 .2 24a83 83 0 0 0 1.3 16.5 8 8 0 0 0 5.6 5.7C12 47.5 34 47.5 34 47.5s22 0 26.9-1.3a8 8 0 0 0 5.6-5.7A83 83 0 0 0 67.8 24a83 83 0 0 0-1.3-16.5z" fill="#f00"/>'
        + '<path d="M27 34l18-10-18-10z" fill="#fff"/></svg></button>';
      return '<figure class="media"><div class="evideo" data-yt="'+esc(id)+'"'+(placeholder?' data-ph="1"':'')+'>'
        + (poster?'<img src="'+poster+'" alt="">':'') + play + '</div></figure>';
    }
  };

  function renderBloques(bloques){
    if(!Array.isArray(bloques)) return '<p style="color:var(--c-ink-2)">Esta entrada a&uacute;n no tiene contenido.</p>';
    return bloques.map(function(b){
      var fn = BLOQUES[b.tipo];
      if(!fn){ console.warn('Bloque de tipo desconocido, ignorado:', b.tipo); return ''; }
      return fn(b);
    }).join('');
  }

  /* ---------- Tarjeta relacionada ---------- */
  function relCard(e){
    var a = AREAS[e.area] || {fac:e.area};
    var t = 'var(--'+({humanidades:'yellow',ciencias:'green',facsej:'purple',ingenieria:'blue'}[e.area]||'c-ink')+'-t)';
    return '<a class="pcard" href="entrada.html?slug='+esc(e.slug)+'">'
      + '<div class="th"><img src="'+esc(e.img)+'" alt="'+esc(e.alt)+'" loading="lazy"></div>'
      + '<div class="body"><div class="eye" style="color:'+t+'">'+esc(e.disciplina)+'</div>'
      + '<h4>'+esc(e.titulo)+'</h4>'
      + '<span class="chip solid" style="background:'+t+'">'+esc(a.fac)+'</span>'
      + '<span class="more">Leer más →</span></div></a>';
  }
  function relacionados(entry, data){
    var pool;
    if(entry.tipo==='audiovisual') pool = data.filter(function(e){ return e.tipo==='audiovisual' && e.slug!==entry.slug; });
    else pool = data.filter(function(e){ return e.area===entry.area && e.slug!==entry.slug; });
    pool.sort(function(a,b){ return b.fecha.localeCompare(a.fecha); });
    if(pool.length<3){
      var extra = data.filter(function(e){ return e.slug!==entry.slug && pool.indexOf(e)<0; })
        .sort(function(a,b){ return b.fecha.localeCompare(a.fecha); });
      pool = pool.concat(extra);
    }
    return pool.slice(0,3);
  }

  /* ---------- Construcción de la página ---------- */
  function build(entry, data){
    var a = AREAS[entry.area] || {label:entry.area, fac:entry.area};
    document.title = entry.titulo + ' · Divulgación USerena';
    root.className = 'tema-'+entry.area;

    var meta = [fmtFecha(entry.fecha), TIPOS[entry.tipo]||entry.tipo, a.label]
      .filter(Boolean).map(esc).join(' <span class="sep">·</span> ');

    var rels = relacionados(entry, data);
    var relTitle = entry.tipo==='audiovisual' ? 'Más <b>videos</b>' : 'Más de <b>'+esc(a.label)+'</b>';

    var ccIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9.5 10.6a2 2 0 1 0 0 2.8l-1-.7a1 1 0 1 1 0-1.4l1-.7zM15 10.6a2 2 0 1 0 0 2.8l-1-.7a1 1 0 1 1 0-1.4l1-.7z"/></svg>';

    root.innerHTML =
      '<header class="entry-head"><div class="inner">'
        + '<nav class="entry-crumb" aria-label="Ruta"><a href="index.html">Inicio</a>'
        + '<span class="sep">»</span><a href="repositorio.html">Repositorio</a>'
        + '<span class="sep">»</span><span class="cur">'+esc(entry.titulo)+'</span></nav>'
        + '<div class="entry-eyebrow">'+esc(entry.disciplina)+'</div>'
        + '<h1>'+esc(entry.titulo)+'</h1>'
        + '<div class="entry-meta">'+meta+'</div>'
      + '</div></header>'
      + ((entry.hero||entry.img) ? '<figure class="entry-figure"><img src="'+esc(entry.hero||entry.img)+'" alt="'+esc(entry.alt)+'"></figure>' : '')
      + '<article class="entry-body">'+renderBloques(entry.bloques)
        + (entry.creditos
            ? '<div class="entry-creditos">'+entry.creditos
              + '<div class="cc">'+ccIcon+' Contenido bajo licencia Creative Commons</div></div>'
            : '')
      + '</article>'
      + '<section class="relacionados"><h2>'+relTitle+'</h2>'
        + '<p class="rsub">Sigue explorando el repositorio.</p>'
        + '<div class="rgrid3">'+rels.map(relCard).join('')+'</div></section>';

    initCarousels();
    initVideos();
  }

  function notFound(){
    document.title = 'Entrada no encontrada · Divulgación USerena';
    root.innerHTML = '<div class="entry-404"><h1>No encontramos esta entrada</h1>'
      + '<p>Es posible que el enlace est&eacute; mal escrito o que la entrada ya no exista.</p>'
      + '<a href="repositorio.html">Volver al repositorio</a></div>';
  }

  /* ---------- Interactividad ---------- */
  function initCarousels(){
    root.querySelectorAll('.ecarousel').forEach(function(car){
      var slides = car.querySelectorAll('.eslide');
      if(slides.length<2) return;
      var dotsWrap = car.querySelector('.edots'), i=0, timer;
      slides.forEach(function(_,n){
        var b=document.createElement('button'); if(n===0)b.className='on';
        b.setAttribute('aria-label','Imagen '+(n+1));
        b.addEventListener('click',function(){ go(n); });
        dotsWrap.appendChild(b);
      });
      var dots=dotsWrap.children;
      function go(n){
        slides[i].classList.remove('on'); dots[i].classList.remove('on');
        i=(n+slides.length)%slides.length;
        slides[i].classList.add('on'); dots[i].classList.add('on'); restart();
      }
      car.querySelector('.earrow.l').addEventListener('click',function(){ go(i-1); });
      car.querySelector('.earrow.r').addEventListener('click',function(){ go(i+1); });
      function restart(){ if(reduce)return; clearInterval(timer); timer=setInterval(function(){ go(i+1); },5500); }
      restart();
    });
  }
  function initVideos(){
    root.querySelectorAll('.evideo').forEach(function(v){
      v.addEventListener('click', function(){
        if(v.dataset.ph){
          v.innerHTML = '<div class="evnote">Aqu&iacute; ir&aacute; el video de YouTube.<br>Reemplaza <b>youtubeId</b> en data.json por el ID real.</div>';
          return;
        }
        var id = v.dataset.yt;
        v.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)
          +'?autoplay=1&rel=0" title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      });
    });
  }

  /* ---------- Carga ---------- */
  var slug = getSlug();
  if(!slug){ notFound(); return; }
  fetch('assets/data/data.json')
    .then(function(r){ if(!r.ok) throw 0; return r.json(); })
    .then(function(data){
      var entry = data.filter(function(e){ return e.slug===slug; })[0];
      if(!entry) notFound(); else build(entry, data);
    })
    .catch(function(){
      root.innerHTML = '<div class="entry-404"><h1>No se pudo cargar la entrada</h1>'
        + '<p>Si est&aacute;s previsualizando en local, sirve el sitio con <code>python -m http.server</code> '
        + 'o s&uacute;belo a GitHub Pages (al abrir con doble clic el navegador bloquea la carga de datos).</p>'
        + '<a href="repositorio.html">Volver al repositorio</a></div>';
    });
})();
