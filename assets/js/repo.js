/* Divulgación USerena — repo.js (solo repositorio.html)
   Motor: fetch data.json, búsqueda instantánea fuzzy + insensible a tildes,
   orden, filtro por tipo, chips de área, paginación 12/pág, estado en URL. */
(function(){
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PER = 12;
  var DATA = [];

  var AREAS = {
    humanidades:{label:'Humanidades', pill:'Humanidades', t:'var(--yellow-t)'},
    ciencias:{label:'Ciencias', pill:'Ciencias', t:'var(--green-t)'},
    facsej:{label:'Cs. Sociales, Empresariales y Jurídicas', pill:'Cs. Sociales, Empresariales y J.', t:'var(--purple-t)'},
    ingenieria:{label:'Ingeniería', pill:'Ingeniería', t:'var(--blue-t)'}
  };

  var state = {q:'', orden:'reciente', tipo:'', area:new Set(), pag:1};
  function $(id){ return document.getElementById(id); }
  var grid = $('grid'), pager = $('pager'), empty = $('empty'), rcount = $('rcount');

  /* ---- normalización + fuzzy ---- */
  function norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
  function lev(a,b){
    var m=a.length,n=b.length; if(Math.abs(m-n)>2) return 3;
    var d=[],i,j;
    for(i=0;i<=m;i++){ d[i]=[i]; }
    for(j=0;j<=n;j++){ d[0][j]=j; }
    for(i=1;i<=m;i++){ var row=3;
      for(j=1;j<=n;j++){ var c=a[i-1]===b[j-1]?0:1;
        d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c); row=Math.min(row,d[i][j]); }
      if(row>2) return 3;
    }
    return d[m][n];
  }
  function tokenHit(tok, words, hay){
    if(hay.indexOf(tok)!==-1) return true;
    var th = tok.length<=4 ? 1 : 2;
    return words.some(function(w){ return Math.abs(w.length-tok.length)<=th && lev(w,tok)<=th; });
  }
  function searchHit(e, q){
    var hay = norm([e.titulo, e.disciplina, AREAS[e.area].label, e.resumen, e.tipo].join(' '));
    var words = hay.split(/[^a-z0-9]+/).filter(Boolean);
    return norm(q).split(/\s+/).filter(Boolean).every(function(t){ return tokenHit(t, words, hay); });
  }

  /* ---- render ---- */
  function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
  function cardHTML(e){
    var a = AREAS[e.area];
    return '<a class="pcard" href="'+esc(e.url||'#')+'">'
      + '<div class="th"><img src="'+esc(e.img)+'" alt="'+esc(e.alt)+'" loading="lazy"></div>'
      + '<div class="body">'
      + '<div class="eye" style="color:'+a.t+'">'+esc(e.disciplina)+'</div>'
      + '<h4>'+esc(e.titulo)+'</h4>'
      + '<span class="chip solid" style="background:'+a.t+'">'+a.pill+'</span>'
      + '<span class="more">Leer más →</span>'
      + '</div></a>';
  }
  function filtered(){
    var r = DATA.filter(function(e){
      return (state.area.size===0 || state.area.has(e.area))
        && (!state.tipo || e.tipo===state.tipo)
        && (!state.q || searchHit(e, state.q));
    });
    if(state.orden==='antiguo') r.sort(function(a,b){ return a.fecha.localeCompare(b.fecha); });
    else if(state.orden==='az') r.sort(function(a,b){ return a.titulo.localeCompare(b.titulo,'es',{sensitivity:'base'}); });
    else r.sort(function(a,b){ return b.fecha.localeCompare(a.fecha); });
    return r;
  }
  function buildPager(pages){
    if(pages<=1){ pager.innerHTML=''; return; }
    var p=state.pag, out=[];
    out.push('<button data-go="'+(p-1)+'"'+(p===1?' disabled':'')+' aria-label="Anterior">‹</button>');
    var nums={}; [1,pages,p,p-1,p+1].forEach(function(n){ nums[n]=1; });
    var last=0;
    for(var i=1;i<=pages;i++){
      if(!nums[i]) continue;
      if(i-last>1) out.push('<span class="ell">…</span>');
      out.push('<button data-go="'+i+'" class="'+(i===p?'on':'')+'"'+(i===p?' aria-current="page"':'')+'>'+i+'</button>');
      last=i;
    }
    out.push('<button data-go="'+(p+1)+'"'+(p===pages?' disabled':'')+' aria-label="Siguiente">›</button>');
    pager.innerHTML=out.join('');
    pager.querySelectorAll('button[data-go]').forEach(function(b){
      b.addEventListener('click', function(){
        var g=+b.dataset.go; if(g<1||g>pages||g===state.pag) return;
        state.pag=g; render();
        $('results').scrollIntoView({behavior:reduce?'auto':'smooth', block:'start'});
      });
    });
  }
  function render(){
    var r=filtered(), total=r.length, pages=Math.max(1,Math.ceil(total/PER));
    if(state.pag>pages) state.pag=pages;
    var start=(state.pag-1)*PER, slice=r.slice(start,start+PER);
    if(total===0){
      grid.innerHTML=''; grid.hidden=true; pager.innerHTML=''; empty.hidden=false;
      $('emptymsg').textContent = state.q
        ? 'No encontramos entradas para \u201C'+state.q+'\u201D. Prueba con otra palabra o limpia los filtros.'
        : 'No hay entradas que coincidan con los filtros seleccionados.';
      rcount.textContent='0 entradas';
    } else {
      empty.hidden=true; grid.hidden=false;
      grid.innerHTML=slice.map(cardHTML).join('');
      buildPager(pages);
      rcount.textContent='Mostrando '+(start+1)+'\u2013'+Math.min(start+PER,total)+' de '+total+(total===1?' entrada':' entradas');
    }
    syncURL();
  }

  /* ---- estado en URL ---- */
  function syncURL(){
    var p=new URLSearchParams();
    if(state.q) p.set('q',state.q);
    if(state.orden!=='reciente') p.set('orden',state.orden);
    if(state.tipo) p.set('tipo',state.tipo);
    if(state.area.size) p.set('area',Array.from(state.area).join(','));
    if(state.pag>1) p.set('pag',state.pag);
    var qs=p.toString();
    history.replaceState(null,'', qs?('?'+qs):location.pathname);
  }
  function readURL(){
    var p=new URLSearchParams(location.search);
    state.q=p.get('q')||''; state.orden=p.get('orden')||'reciente';
    state.tipo=p.get('tipo')||'';
    state.area=new Set((p.get('area')||'').split(',').filter(Boolean));
    state.pag=Math.max(1,parseInt(p.get('pag')||'1',10)||1);
  }
  function syncControls(){
    $('q').value=state.q; $('orden').value=state.orden; $('tipo').value=state.tipo;
    document.querySelectorAll('.chip-f').forEach(function(c){
      var on=state.area.has(c.dataset.area);
      c.classList.toggle('on',on); c.setAttribute('aria-pressed',on);
    });
  }

  /* ---- eventos ---- */
  var deb;
  $('q').addEventListener('input', function(e){
    clearTimeout(deb);
    deb=setTimeout(function(){ state.q=e.target.value.trim(); state.pag=1; render(); },150);
  });
  $('orden').addEventListener('change', function(e){ state.orden=e.target.value; state.pag=1; render(); });
  $('tipo').addEventListener('change', function(e){ state.tipo=e.target.value; state.pag=1; render(); });
  document.querySelectorAll('.chip-f').forEach(function(c){
    c.addEventListener('click', function(){
      var a=c.dataset.area;
      state.area.has(a) ? state.area.delete(a) : state.area.add(a);
      state.pag=1; syncControls(); render();
    });
  });
  function clearAll(){
    state.q=''; state.orden='reciente'; state.tipo=''; state.area.clear(); state.pag=1;
    syncControls(); render();
  }
  $('clear').addEventListener('click', clearAll);
  $('emptyreset').addEventListener('click', clearAll);
  window.addEventListener('popstate', function(){ readURL(); syncControls(); render(); });

  /* ---- carga de datos ---- */
  fetch('assets/data/data.json')
    .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
    .then(function(json){ DATA=json; readURL(); syncControls(); render(); })
    .catch(function(){
      grid.hidden=true; empty.hidden=false;
      $('emptymsg').innerHTML='No se pudo cargar el cat&aacute;logo. Si est&aacute;s previsualizando en local, '
        +'sirve el sitio con <code>python -m http.server</code> y abre <code>http://localhost:8000</code> '
        +'(al abrir con doble clic, el navegador bloquea la carga de datos).';
      document.querySelector('.empty .reset').hidden=true;
      rcount.textContent='';
    });
})();

/* Parallax sutil del mini-hero (ligado al scroll; respeta prefers-reduced-motion) */
(function(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var img = document.querySelector('.mhero .bg img');
  if(!img) return;
  var ticking = false;
  function update(){
    var y = window.scrollY;
    if(y < 520){ img.style.transform = 'translateY(' + (y * 0.15).toFixed(1) + 'px)'; }
    ticking = false;
  }
  window.addEventListener('scroll', function(){
    if(!ticking){ requestAnimationFrame(update); ticking = true; }
  }, {passive:true});
  update();
})();
