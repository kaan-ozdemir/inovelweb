const fs=require('fs');
const convert=require('heic-convert');
(async()=>{
 const root='C:/Users/msi-nb/Desktop/15.yıl/';
 const out='static-site/assets/gallery/';
 fs.copyFileSync(root+'IMG_8570.JPG',out+'15-yil-toplu.jpg');
 fs.copyFileSync(root+'IMG_8657.JPG',out+'15-yil-ekip.jpg');
 fs.writeFileSync(out+'15-yil-bulusma.jpg',Buffer.from(await convert({buffer:fs.readFileSync(root+'IMG_1643.HEIC'),format:'JPEG',quality:0.88})));
})();
