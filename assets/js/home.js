/* Divulgación USerena — home.js (solo index.html)
   Carrusel del hero + conteo de métricas (disparado por reveal). */
(function(){
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- carrusel hero ---- */
  var hero = document.getElementById('hero');
  if(hero){
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.slide'));
    var dotsWrap = hero.querySelector('.dots');
    var i = 0, timer;
    slides.forEach(function(_, n){
      var b = document.createElement('button');
      if(n === 0) b.className = 'on';
      b.setAttribute('aria-label', 'Imagen ' + (n+1));
      b.addEventListener('click', function(){ go(n); });
      dotsWrap.appendChild(b);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);
    function go(n){
      slides[i].classList.remove('on'); dots[i].classList.remove('on');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('on'); dots[i].classList.add('on');
      restart();
    }
    hero.querySelector('.arrow.l').addEventListener('click', function(){ go(i-1); });
    hero.querySelector('.arrow.r').addEventListener('click', function(){ go(i+1); });
    function restart(){
      if(reduce) return;
      clearInterval(timer);
      timer = setInterval(function(){ go(i+1); }, 7000);
    }
    restart();
  }
})();

/* ---- Contenido del home desde data.json (destacada + 3 tarjetas + panel de videos) ----
   100% JSON, sin API. Mejora progresiva: si el fetch falla (p. ej. file://), quedan los
   fallbacks estáticos del HTML. En servidor/Pages se actualiza solo al editar data.json. */
(function(){
  var featEl = document.getElementById('featured');
  var cardsEl = document.getElementById('cards3');
  var vidsEl = document.getElementById('videos-list');
  if(!featEl && !cardsEl && !vidsEl) return;

  var AREAS = {
    humanidades:{t:'var(--yellow-t)', fac:'Facultad de Humanidades'},
    ciencias:{t:'var(--green-t)', fac:'Facultad de Ciencias'},
    facsej:{t:'var(--purple-t)', fac:'FACSEJ'},
    ingenieria:{t:'var(--blue-t)', fac:'Facultad de Ingeniería'}
  };
  var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  function fmtFecha(iso){ var p=(iso||'').split('-'); return p.length===3 ? (+p[2])+' de '+MESES[(+p[1])-1]+' de '+p[0] : ''; }
  function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
  function cap(s){ return s ? s.charAt(0).toUpperCase()+s.slice(1) : ''; }
  var PLAY = '<span class="play"><svg viewBox="0 0 24 24" fill="none">'
    + '<circle cx="12" cy="12" r="11" fill="rgba(12,14,20,.7)"/>'
    + '<path d="M10 8.4l6.2 3.6-6.2 3.6z" fill="#fff"/></svg></span>';

  function cardHTML(e){
    var a = AREAS[e.area] || {t:'var(--c-ink)', fac:e.area};
    return '<a class="pcard" href="'+esc(e.url||'#')+'">'
      + '<div class="th"><img src="'+esc(e.img)+'" alt="'+esc(e.alt)+'" loading="lazy"></div>'
      + '<div class="body">'
      + '<div class="eye" style="color:'+a.t+'">'+esc(e.disciplina)+'</div>'
      + '<h4>'+esc(e.titulo)+'</h4>'
      + '<span class="chip solid" style="background:'+a.t+'">'+esc(a.fac)+'</span>'
      + '<span class="more">Leer más →</span>'
      + '</div></a>';
  }
  function featHTML(e){
    var a = AREAS[e.area] || {t:'var(--c-ink)', fac:e.area};
    return '<div class="txt">'
      + '<div class="chips"><span class="chip solid" style="background:'+a.t+'">'+esc(a.fac)+'</span>'
      + '<span class="chip dot" style="color:'+a.t+'">'+esc(e.disciplina)+'</span></div>'
      + '<h3>'+esc(e.titulo)+'</h3>'
      + '<p>'+esc(e.resumen)+'</p>'
      + '<div class="foot"><span class="date">'+fmtFecha(e.fecha)+'</span><span class="btn-more">Leer más</span></div>'
      + '</div>'
      + '<div class="img"><img src="'+esc(e.img)+'" alt="'+esc(e.alt)+'"></div>';
  }
  function vitemHTML(e){
    return '<a class="vitem" href="'+esc(e.url||'#')+'">'
      + '<span class="vthumb"><img src="'+esc(e.img)+'" alt="" loading="lazy">'+PLAY+'</span>'
      + '<span class="vmeta"><span class="veye">'+cap(e.tipo)+'</span>'
      + '<span class="vtit">'+esc(e.titulo)+'</span></span></a>';
  }

  fetch('assets/data/data.json')
    .then(function(r){ if(!r.ok) throw 0; return r.json(); })
    .then(function(data){
      var byDate = data.slice().sort(function(a,b){ return b.fecha.localeCompare(a.fecha); });
      // Destacada: la más reciente marcada destacado:true; si no hay, la más reciente.
      var feat = null;
      for(var i=0;i<byDate.length;i++){ if(byDate[i].destacado){ feat=byDate[i]; break; } }
      if(!feat) feat = byDate[0];
      if(featEl && feat){ featEl.href = feat.url || '#'; featEl.innerHTML = featHTML(feat); }
      // 3 últimas publicaciones (cualquier tipo), excluyendo la destacada.
      if(cardsEl){
        var rest = byDate.filter(function(e){ return e !== feat; }).slice(0,3);
        if(rest.length) cardsEl.innerHTML = rest.map(cardHTML).join('');
      }
      // Panel: 3 audiovisuales más recientes.
      if(vidsEl){
        var vids = data.filter(function(e){ return e.tipo === 'audiovisual'; })
          .sort(function(a,b){ return b.fecha.localeCompare(a.fecha); }).slice(0,3);
        if(vids.length) vidsEl.innerHTML = vids.map(vitemHTML).join('');
      }
      // Métricas calculadas desde el JSON.
      renderMetrics(data);
    })
    .catch(function(){ /* sin conexión al JSON el home queda vacío; en Pages siempre carga */ });

  /* ---- Métricas: recursos, disciplinas, académicos y horas de contenido ---- */
  function renderMetrics(data){
    var grid = document.getElementById('metrics'); if(!grid) return;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var disc = {}, people = {}, mins = 0;
    data.forEach(function(e){
      if(e.disciplina) disc[e.disciplina] = 1;
      var names = [];
      if(e.academicos) names = names.concat(Array.isArray(e.academicos)?e.academicos:[e.academicos]);
      if(e.invitado)   names = names.concat(Array.isArray(e.invitado)?e.invitado:[e.invitado]);
      names.forEach(function(n){ if(n) people[String(n).trim()] = 1; });
      if(e.duracion){
        var p = String(e.duracion).split(':').map(Number);
        if(p.length===3) mins += p[0]*60 + p[1] + p[2]/60;
        else if(p.length===2) mins += p[0] + p[1]/60;
      }
    });
    var vals = {
      recursos: data.length,
      disciplinas: Object.keys(disc).length,
      academicos: Object.keys(people).length,
      horas: Math.round(mins/60)
    };
    var nums = grid.querySelectorAll('.mnum[data-key]');
    function run(){
      nums.forEach(function(el){
        var to = vals[el.dataset.key] || 0;
        if(reduce){ el.textContent = to; return; }
        var t0 = performance.now(), dur = 1300;
        (function step(now){
          var pr = Math.min(1,(now-t0)/dur), e = 1-Math.pow(1-pr,3);
          el.textContent = Math.round(e*to);
          if(pr<1) requestAnimationFrame(step);
        })(performance.now());
      });
    }
    if(reduce || !('IntersectionObserver' in window)){ run(); return; }
    var io = new IntersectionObserver(function(es){
      es.forEach(function(en){ if(en.isIntersecting){ run(); io.disconnect(); } });
    }, {threshold:.35});
    io.observe(grid);
  }
})();
