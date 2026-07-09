/* Divulgación USerena — nav.js (compartido)
   Nav dinámico: fondo sólido al scrollear, se oculta al bajar / reaparece al subir,
   menú móvil. Umbral: alto del #hero * 0.55 si existe; si no, 240px. */
(function(){
  'use strict';
  var nav = document.getElementById('nav');
  if(!nav) return;
  var hero = document.getElementById('hero');
  var lastY = window.scrollY, ticking = false;

  function threshold(){ return hero ? hero.offsetHeight * 0.55 : 240; }

  function update(){
    var y = window.scrollY;
    nav.classList.toggle('scrolled', y > 10);
    if(y > threshold()){
      if(y > lastY + 4) nav.classList.add('hidden');
      else if(y < lastY - 4) nav.classList.remove('hidden');
    } else {
      nav.classList.remove('hidden');
    }
    lastY = y; ticking = false;
  }
  window.addEventListener('scroll', function(){
    if(!ticking){ requestAnimationFrame(update); ticking = true; }
  }, {passive:true});
  update();

  /* menú móvil */
  var tg = document.getElementById('navtoggle');
  var menu = document.getElementById('navmenu');
  if(tg && menu){
    tg.addEventListener('click', function(){
      var open = menu.classList.toggle('open');
      tg.setAttribute('aria-expanded', open);
    });
    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        menu.classList.remove('open'); tg.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* reveal compartido (threshold .28, rootMargin -12%) */
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = document.querySelectorAll('.reveal');
  if(els.length){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          e.target.classList.add('in');
          io.unobserve(e.target);
          if(e.target.dataset.onreveal){
            document.dispatchEvent(new CustomEvent('reveal:'+e.target.dataset.onreveal));
          }
        }
      });
    }, {threshold:0, rootMargin:'0px 0px -18% 0px'});
    els.forEach(function(el){ io.observe(el); });
  }
})();
