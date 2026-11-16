(function(){
 'use strict';
 function init(){
  var root=document.querySelector('[data-gallery-root]');if(!root)return;
  var items=Array.from(root.querySelectorAll('[data-gallery-item]'));
  var filters=Array.from(root.querySelectorAll('[data-gallery-filter]'));
  var dialog=document.querySelector('.gallery-viewer');
  var image=dialog.querySelector('.gallery-viewer-image');
  var loading=dialog.querySelector('.gallery-loading');
  var count=dialog.querySelector('.gallery-viewer-count');
  var close=dialog.querySelector('.gallery-close');
  var trigger=null,photos=[],position=0;
  function visible(){return items.filter(function(item){return !item.hidden;}).map(function(item){return item.querySelector('[data-gallery-photo]');});}
  filters.forEach(function(button){button.addEventListener('click',function(){
   var category=button.dataset.galleryFilter,shown=0;
   items.forEach(function(item){item.hidden=category!=='all'&&item.dataset.category!==category;if(!item.hidden)shown++;});
   filters.forEach(function(other){other.setAttribute('aria-pressed',String(other===button));});
   root.querySelector('.gallery-status').textContent=shown+' fotoğraf gösteriliyor';
  });});
  root.querySelector('.gallery-controls').hidden=false;
  // Browsers without native dialog support keep the original image links.
  if(typeof dialog.showModal!=='function')return;
  function show(index){
   position=(index+photos.length)%photos.length;
   var photo=photos[position];
   loading.hidden=false;loading.textContent='Fotoğraf yükleniyor…';
   image.alt=photo.dataset.alt;image.src=photo.href;
   dialog.querySelector('.gallery-original').href=photo.href;
   count.textContent=String(position+1).padStart(2,'0')+' / '+String(photos.length).padStart(2,'0')+' — '+photo.dataset.title;
   dialog.querySelector('.gallery-previous').disabled=photos.length<2;
   dialog.querySelector('.gallery-next').disabled=photos.length<2;
  }
  items.forEach(function(item){var link=item.querySelector('[data-gallery-photo]');link.setAttribute('aria-haspopup','dialog');link.addEventListener('click',function(event){
   if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   event.preventDefault();trigger=link;photos=visible();show(photos.indexOf(link));dialog.showModal();document.documentElement.classList.add('gallery-viewer-open');close.focus();
  });});
  image.addEventListener('load',function(){loading.hidden=true;});
  image.addEventListener('error',function(){loading.hidden=false;loading.textContent='Fotoğraf yüklenemedi. “Tam boy aç” bağlantısını deneyebilirsin.';});
  close.addEventListener('click',function(){dialog.close();});
  dialog.querySelector('.gallery-previous').addEventListener('click',function(){show(position-1);});
  dialog.querySelector('.gallery-next').addEventListener('click',function(){show(position+1);});
  var stage=dialog.querySelector('.gallery-viewer-stage'),swipe=null;
  stage.addEventListener('touchstart',function(event){
   swipe=null;
   if(!dialog.open||event.touches.length!==1||event.target.closest('button,a')||(window.visualViewport&&window.visualViewport.scale>1))return;
   swipe={x:event.touches[0].clientX,y:event.touches[0].clientY};
  },{passive:true});
  stage.addEventListener('touchmove',function(event){if(event.touches.length!==1)swipe=null;},{passive:true});
  stage.addEventListener('touchcancel',function(){swipe=null;},{passive:true});
  stage.addEventListener('touchend',function(event){
   var start=swipe;swipe=null;
   if(!start||!dialog.open||event.touches.length||event.changedTouches.length!==1||photos.length<2)return;
   var dx=event.changedTouches[0].clientX-start.x,dy=event.changedTouches[0].clientY-start.y;
   if(Math.abs(dx)<50||Math.abs(dx)<Math.abs(dy)*1.4)return;
   // A committed swipe must not also produce a backdrop click and close the viewer.
   if(event.cancelable)event.preventDefault();
   show(position+(dx<0?1:-1));
  },{passive:false});
  dialog.addEventListener('click',function(event){if(event.target===dialog||event.target===dialog.querySelector('.gallery-viewer-stage'))dialog.close();});
  dialog.addEventListener('close',function(){swipe=null;document.documentElement.classList.remove('gallery-viewer-open');image.removeAttribute('src');if(trigger&&trigger.isConnected)trigger.focus();});
  document.addEventListener('keydown',function(event){
   if(!dialog.open)return;
   if(event.key==='Escape'){event.preventDefault();dialog.close();}
   else if(event.key==='ArrowRight'){event.preventDefault();show(position+1);}
   else if(event.key==='ArrowLeft'){event.preventDefault();show(position-1);}
   else if(event.key==='Home'){event.preventDefault();show(0);}
   else if(event.key==='End'){event.preventDefault();show(photos.length-1);}
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
