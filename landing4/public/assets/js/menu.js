document.addEventListener('DOMContentLoaded',function(){
  var b=document.querySelector('.pi-hamb'),n=document.getElementById('pi-nav');
  if(b&&n)b.addEventListener('click',function(){var o=n.classList.toggle('pi-abierto');b.setAttribute('aria-expanded',String(o));b.textContent=o?'Cerrar':'Menú';});
  var gs=document.querySelectorAll('.pi-g');
  gs.forEach(function(d){d.addEventListener('toggle',function(){if(d.open)gs.forEach(function(x){if(x!==d)x.open=false;});});});
  document.addEventListener('click',function(e){if(!e.target.closest('.pi-g'))gs.forEach(function(x){x.open=false;});});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')gs.forEach(function(x){x.open=false;});});
});
