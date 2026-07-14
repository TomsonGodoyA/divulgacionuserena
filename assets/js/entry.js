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

  /* Marcado inline mínimo: **palabra** -> token de color del área.
     Escapa HTML primero (seguro) y luego aplica el token. Se usa en títulos
     (subtitulo, título de donut) donde no queremos HTML crudo. Un ** sin cerrar
     se deja literal, no rompe la página. */
  function md(s){ return esc(s).replace(/\*\*([^*]+?)\*\*/g,'<span class="token-fac">$1</span>'); }

  function getSlug(){ return new URLSearchParams(location.search).get('slug') || ''; }

  /* Iconos SVG inline para el bloque flexbox (heredan color via currentColor). */
  var FLEX_ICONS = {
    luz:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>',
    calor:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V4a2 2 0 0 0-4 0v10.76a4 4 0 1 0 4 0z"/></svg>',
    oxigeno:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.4"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></svg>'
  };

  var YT_PLAY = '<button class="evbtn" aria-label="Reproducir video"><svg viewBox="0 0 68 48" fill="none">'
    + '<path d="M66.5 7.5a8 8 0 0 0-5.6-5.7C56 .5 34 .5 34 .5s-22 0-26.9 1.3A8 8 0 0 0 1.5 7.5 83 83 0 0 0 .2 24a83 83 0 0 0 1.3 16.5 8 8 0 0 0 5.6 5.7C12 47.5 34 47.5 34 47.5s22 0 26.9-1.3a8 8 0 0 0 5.6-5.7A83 83 0 0 0 67.8 24a83 83 0 0 0-1.3-16.5z" fill="#f00"/>'
    + '<path d="M27 34l18-10-18-10z" fill="#fff"/></svg></button>';
  /* Acepta ID de 11 caracteres o URL de YouTube (youtu.be / watch?v= / embed) */
  function ytId(s){
    if(!s) return '';
    var m = String(s).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
    if(m) return m[1];
    return /^[\w-]{11}$/.test(s) ? s : '';
  }

  /* ---------- Renderizadores de bloque ---------- */
  /* Nota: 'texto' en parrafo/cita admite HTML inline (contenido de confianza, escrito por la Oficina). */
  var BLOQUES = {
    parrafo: function(b){ return '<p>'+(b.texto||'')+'</p>'; },
    subtitulo: function(b){ return '<h2>'+md(b.texto)+'</h2>'; },
    cita: function(b){
      if(b.estilo==='consigna') return '<blockquote class="cita-consigna">'+(b.texto||'')+'</blockquote>';
      return '<blockquote>'+(b.texto||'')+(b.autor?'<cite>'+esc(b.autor)+'</cite>':'')+'</blockquote>';
    },
    imagen: function(b){
      var anchos = {texto:'media--texto', chica:'media--chica'};
      var cls = 'media' + (anchos[b.ancho] ? ' '+anchos[b.ancho] : '');
      var cap = '';
      if(Array.isArray(b.leyenda) && b.leyenda.length){
        cap = '<figcaption class="img-leyenda">' + b.leyenda.map(function(it){
          return '<span class="il-item">'
            + (it.n!=null?'<span class="il-num">'+esc(it.n)+'</span>':'')
            + '<span class="il-txt"><b>'+esc(it.label)+'</b>'
            + (it.sub?'<span class="il-sub">'+esc(it.sub)+'</span>':'') + '</span></span>';
        }).join('') + '</figcaption>';
      } else if(b.pie){ cap = '<figcaption>'+esc(b.pie)+'</figcaption>'; }
      return '<figure class="'+cls+'"><img src="'+esc(b.src)+'" alt="'+esc(b.alt)+'" loading="lazy">'
        + cap + '</figure>';
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
      var id = ytId(b.youtubeId);
      var placeholder = !id;
      var poster = b.poster ? esc(b.poster) : (id ? 'https://img.youtube.com/vi/'+id+'/hqdefault.jpg' : '');
      return '<figure class="media"><div class="evideo" data-yt="'+esc(id)+'"'+(placeholder?' data-ph="1"':'')+'>'
        + (poster?'<img src="'+poster+'" alt="">':'') + YT_PLAY + '</div></figure>';
    },

    /* ---- Bloques animados (Sesión 3) ---- */
    dato: function(b){
      var dec=+b.decimales||0, sep=b.sep?1:0;
      return '<div class="media anim e-dato">'
        + '<div class="e-dato-num"><span class="js-count" data-to="'+(+b.valor||0)+'" data-dec="'+dec+'" data-sep="'+sep+'">0</span>'
        + (b.sufijo?'<span class="e-dato-suf">'+esc(b.sufijo)+'</span>':'') + '</div>'
        + (b.texto?'<div class="e-dato-label">'+b.texto+'</div>':'') + '</div>';
    },
    gauge: function(b){
      var max=+b.max||100, val=+b.valor||0, dec=+b.decimales||0;
      return '<figure class="media anim e-gauge js-gauge" data-val="'+val+'" data-max="'+max+'">'
        + '<div class="e-gauge-vis"><svg viewBox="0 0 220 128">'
        + '<path class="track" d="M16 116 A94 94 0 0 1 204 116" fill="none" stroke-width="17" stroke-linecap="round"/>'
        + '<path class="fill" d="M16 116 A94 94 0 0 1 204 116" fill="none" stroke-width="17" stroke-linecap="round"/>'
        + '</svg><div class="e-gauge-num"><span class="js-count" data-to="'+val+'" data-dec="'+dec+'">0</span>'
        + (b.unidad?'<span class="u">'+esc(b.unidad)+'</span>':'') + '</div></div>'
        + (b.etiqueta?'<figcaption>'+esc(b.etiqueta)+'</figcaption>':'') + '</figure>';
    },
    barra: function(b){
      var max=+b.max||100, val=+b.valor||0, dec=+b.decimales||0;
      var pct=Math.max(0,Math.min(100, max?val/max*100:0));
      return '<div class="anim e-barra">'
        + '<div class="e-barra-top"><span class="e-barra-lbl">'+esc(b.etiqueta||'')+'</span>'
        + '<span class="e-barra-val"><span class="js-count" data-to="'+val+'" data-dec="'+dec+'">0</span>'+(b.sufijo?esc(b.sufijo):'')+'</span></div>'
        + '<div class="e-barra-track"><div class="e-barra-fill js-bar" data-pct="'+pct.toFixed(2)+'"></div></div></div>';
    },
    'mini-barras': function(b){
      var items=b.items||[];
      var maxv=Math.max.apply(null, items.map(function(it){return +it.valor||0;}).concat([1]));
      var rows=items.map(function(it){
        var pct=Math.max(0,Math.min(100,(+it.valor||0)/(it.max?+it.max:maxv)*100)), dec=+it.decimales||0;
        return '<div class="e-mbar"><div class="e-mbar-top"><span class="l">'+esc(it.etiqueta)+'</span>'
          + '<span class="v"><span class="js-count" data-to="'+(+it.valor||0)+'" data-dec="'+dec+'">0</span>'+(it.sufijo?esc(it.sufijo):'')+'</span></div>'
          + '<div class="e-mbar-track"><div class="e-mbar-fill js-bar" data-pct="'+pct.toFixed(2)+'"></div></div></div>';
      }).join('');
      return '<div class="anim e-mbars">'+(b.titulo?'<div class="e-mbars-t">'+esc(b.titulo)+'</div>':'')+rows+'</div>';
    },
    acordeon: function(b){
      var items=(b.items||[]).map(function(it){
        return '<details class="e-acc-item"><summary>'+esc(it.titulo)+'</summary>'
          + '<div class="e-acc-body">'+(it.contenido||'')+'</div></details>';
      }).join('');
      return '<div class="e-acc">'+items+'</div>';
    },
    separador: function(b){
      if(b.estilo==='minimal') return '<div class="e-sep-min" role="separator"></div>';
      return '<div class="e-sep"><img class="js-parallax" src="'+esc(b.src)+'" alt="'+esc(b.alt)+'">'
        + (b.titulo?'<div class="e-sep-cap"><span>'+esc(b.titulo)+'</span></div>':'') + '</div>';
    },

    /* ---- Bloques nuevos (Sesión 4) — genéricos, reutilizables desde el JSON ---- */

    /* Donut: anillo animado + valores en leyenda inferior (no sobre el arco).
       JSON: { tipo:"donut", titulo, imgCentro, altCentro,
               segmentos:[ {valor, color, texto} ], gap? }
       Los valores son independientes (no suman 100); cada arco = valor/100 del anillo. */
    donut: function(b){
      var segs = b.segmentos||[];
      var R=80, C=2*Math.PI*R, gap=(b.gap!=null?+b.gap:0), off=0;
      var arcs='', leg='';
      segs.forEach(function(s){
        var visible = Math.max(0,(+s.valor - gap))/100*C;
        var dashoff = -off/100*C;
        arcs += '<circle class="donut-arco js-donut" cx="100" cy="100" r="'+R+'" stroke="'+esc(s.color)+'" '
          + 'data-dash="'+visible.toFixed(2)+' '+C.toFixed(2)+'" '
          + 'style="stroke-dasharray:0 '+C.toFixed(2)+';stroke-dashoffset:'+dashoff.toFixed(2)+'"></circle>';
        leg += '<li class="donut-item" style="--dot:'+esc(s.color)+'">'
          + '<span class="donut-valor" style="color:'+esc(s.color)+'">'+(+s.valor)+'%</span>'
          + '<span class="donut-texto">'+md(s.texto)+'</span></li>';
        off += (+s.valor);
      });
      return '<figure class="media anim e-donut">'
        + (b.titulo?'<h2 class="e-donut-t">'+md(b.titulo)+'</h2>':'')
        + '<div class="e-donut-grid"><div class="donut-box">'
        + '<svg class="donut-svg" viewBox="0 0 200 200" role="img" aria-label="'+esc(segs.map(function(s){return s.valor+'%';}).join(', '))+'">'
        + '<circle class="donut-track" cx="100" cy="100" r="'+R+'"></circle>'+arcs+'</svg>'
        + (b.imgCentro?'<img class="donut-centro" src="'+esc(b.imgCentro)+'" alt="'+esc(b.altCentro||'')+'" loading="lazy">':'')
        + '</div><ul class="donut-leyenda">'+leg+'</ul></div></figure>';
    },

    /* Flexbox de tarjetas con ícono.
       JSON: { tipo:"flexbox", items:[ {icono:"luz|calor|oxigeno", label} ] } */
    flexbox: function(b){
      var cards=(b.items||[]).map(function(it){
        return '<div class="flex-card"><span class="flex-ico">'+(FLEX_ICONS[it.icono]||'')+'</span>'
          + '<span class="flex-lbl">'+esc(it.label)+'</span></div>';
      }).join('');
      return '<div class="media e-flexbox">'+cards+'</div>';
    },

/* Imagen + texto en dos columnas.
       lado:"izq" = imagen a la izquierda / texto derecha (por defecto)
       lado:"der" = imagen a la derecha / texto izquierda
       JSON: { tipo:"duo", src, alt, texto, titulo?, lado } */
    duo: function(b){
      var cls = 'e-duo' + (b.lado==='der' ? ' e-duo--der' : '');
      return '<div class="media '+cls+'">'
        + '<figure class="e-duo-fig"><img src="'+esc(b.src)+'" alt="'+esc(b.alt)+'" loading="lazy"></figure>'
        + '<div class="e-duo-txt">'
        + (b.titulo?'<h2>'+md(b.titulo)+'</h2>':'')
        + (b.texto?'<p>'+b.texto+'</p>':'') + '</div></div>';
    },


    notas: function(b){
      var out='<div class="e-notas"><h3>'+esc(b.titulo||'Notas y créditos')+'</h3>';
      var acad = b.academicos || b.academica || b['académica'] || b['académicos'];
      if(acad){ var al=Array.isArray(acad)?acad:[acad];
        out+='<p><b>'+(al.length>1?'Académicos participantes:':'Académica/o participante:')+'</b> '+al.map(esc).join(' · ')+'</p>'; }
      if(b.creditoFoto) out+='<p><b>Crédito fotográfico:</b> '+b.creditoFoto+'</p>';
      if(b.notasTecnicas) out+='<p><b>Notas técnicas:</b> '+b.notasTecnicas+'</p>';
      if(b.revista && b.revista.url) out+='<a class="e-revista" href="'+esc(b.revista.url)+'" target="_blank" rel="noopener">'
        + esc(b.revista.titulo||'Revisar la investigación en la revista')+' →</a>';
      return out+'</div>';
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

    var isVideo = entry.tipo==='audiovisual' && ytId(entry.youtubeId);
    var creditosHTML = entry.creditos
      ? '<div class="entry-creditos">'+entry.creditos+'<div class="cc">'+ccIcon+' Contenido bajo licencia Creative Commons</div></div>' : '';
    var hasBloques = Array.isArray(entry.bloques) && entry.bloques.length;
    var bodyHTML = (hasBloques || creditosHTML)
      ? '<article class="entry-body">'+(hasBloques?renderBloques(entry.bloques):'')+creditosHTML+'</article>' : '';
    var acadList = (!isVideo && entry.academicos) ? (Array.isArray(entry.academicos)?entry.academicos:[entry.academicos]) : [];
    var acadHTML = acadList.length
      ? '<div class="entry-academicos"><span class="l">Académicos participantes:</span> '+acadList.map(esc).join(' · ')+'</div>' : '';

    var headHTML;
    if(isVideo){
      var inv = entry.invitado ? (Array.isArray(entry.invitado)?entry.invitado:[entry.invitado]) : [];
      var invLabel = inv.length>1 ? 'Invitados' : 'Invitado';
      headHTML = '<header class="entry-vhead"><div class="wrap ev-grid">'
        + '<div class="ev-player"><div class="evideo" data-yt="'+esc(ytId(entry.youtubeId))+'">'
          + (entry.img?'<img src="'+esc(entry.img)+'" alt="'+esc(entry.alt)+'">':'') + YT_PLAY
          + (entry.duracion?'<span class="ev-dur">'+esc(entry.duracion)+'</span>':'') + '</div></div>'
        + '<div class="ev-info">'
          + '<nav class="entry-crumb" aria-label="Ruta"><a href="index.html">Inicio</a>'
          + '<span class="sep">»</span><a href="repositorio.html">Repositorio</a></nav>'
          + '<div class="entry-eyebrow">'+esc(entry.disciplina)+'</div>'
          + '<h1>'+esc(entry.titulo)+'</h1>'
          + '<div class="entry-meta">'+meta+'</div>'
          + (entry.resumen?'<p class="ev-resumen">'+esc(entry.resumen)+'</p>':'')
          + (inv.length?'<p class="ev-invitado"><b>'+invLabel+':</b> '+esc(inv.join(' · '))+'</p>':'')
          + '</div></div></header>';
    } else {
      headHTML = '<header class="entry-head"><div class="inner">'
        + '<nav class="entry-crumb" aria-label="Ruta"><a href="index.html">Inicio</a>'
        + '<span class="sep">»</span><a href="repositorio.html">Repositorio</a>'
        + '<span class="sep">»</span><span class="cur">'+esc(entry.titulo)+'</span></nav>'
        + '<div class="entry-eyebrow">'+esc(entry.disciplina)+'</div>'
        + '<h1>'+esc(entry.titulo)+'</h1>'
        + '<div class="entry-meta">'+meta+'</div>'
        + '</div></header>'
        + ((entry.hero||entry.img) ? '<figure class="entry-figure"><span class="ef-media"><img src="'+esc(entry.hero||entry.img)+'" alt="'+esc(entry.alt)+'"></span></figure>' : '');
    }

    root.innerHTML = headHTML + bodyHTML + acadHTML
      + '<section class="relacionados"><h2>'+relTitle+'</h2>'
        + '<p class="rsub">Sigue explorando el repositorio.</p>'
        + '<div class="rgrid3">'+rels.map(relCard).join('')+'</div></section>';

    initCarousels();
    initVideos();
    initAnimations();
    initParallax();
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

  /* ---------- Animaciones (contadores, gauge, barras, donut, parallax) ---------- */
  function fmtNum(n, dec, sep){
    var s = dec>0 ? n.toFixed(dec) : String(Math.round(n));
    if(dec>0){ var pt=s.split('.'); if(sep) pt[0]=pt[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.'); s=pt[0]+','+pt[1]; }
    else if(sep){ s=s.replace(/\B(?=(\d{3})+(?!\d))/g,'.'); }
    return s;
  }
  function countUp(el){
    var to=parseFloat(el.dataset.to)||0, dec=parseInt(el.dataset.dec||'0',10), sep=el.dataset.sep==='1';
    if(reduce){ el.textContent=fmtNum(to,dec,sep); return; }
    var t0=performance.now(), dur=1300;
    (function step(now){
      var p=Math.min(1,(now-t0)/dur), e=1-Math.pow(1-p,3);
      el.textContent=fmtNum(to*e,dec,sep);
      if(p<1) requestAnimationFrame(step);
    })(performance.now());
  }
  function fillGauge(g){
    var path=g.querySelector('.fill'); if(!path) return;
    var val=parseFloat(g.dataset.val)||0, max=parseFloat(g.dataset.max)||100;
    var frac=Math.max(0,Math.min(1, max?val/max:0));
    var len=path.getTotalLength();
    path.style.strokeDasharray=len;
    path.style.strokeDashoffset=len;
    if(reduce){ path.style.transition='none'; path.style.strokeDashoffset=len*(1-frac); return; }
    requestAnimationFrame(function(){ path.style.strokeDashoffset=len*(1-frac); });
  }
  function runBlock(blk){
    blk.querySelectorAll('.js-count').forEach(countUp);
    blk.querySelectorAll('.js-bar').forEach(function(bar){ bar.style.width=parseFloat(bar.dataset.pct||'0')+'%'; });
    blk.querySelectorAll('.js-gauge').forEach(fillGauge);
    if(blk.classList.contains('js-gauge')) fillGauge(blk);
    /* Donut: al entrar en viewport, cada arco crece hasta su dasharray final (CSS anima la transición). */
    blk.querySelectorAll('.js-donut').forEach(function(arc){ arc.style.strokeDasharray=arc.dataset.dash; });
  }
  function initAnimations(){
    var blocks=root.querySelectorAll('.anim'); if(!blocks.length) return;
    if(reduce || !('IntersectionObserver' in window)){ blocks.forEach(runBlock); return; }
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ runBlock(e.target); io.unobserve(e.target); } });
    }, {threshold:.35});
    blocks.forEach(function(b){ io.observe(b); });
  }
  function initParallax(){
    if(reduce) return;
    var imgs=root.querySelectorAll('.js-parallax'); if(!imgs.length) return;
    var ticking=false;
    function upd(){
      imgs.forEach(function(img){
        var sep=img.closest('.e-sep'); if(!sep) return;
        var r=sep.getBoundingClientRect();
        if(r.bottom<0 || r.top>innerHeight) return;
        var prog=(r.top+r.height/2 - innerHeight/2)/innerHeight;
        img.style.transform='translateY('+(prog*-42).toFixed(1)+'px)';
      });
      ticking=false;
    }
    addEventListener('scroll',function(){ if(!ticking){ requestAnimationFrame(upd); ticking=true; } },{passive:true});
    upd();
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
