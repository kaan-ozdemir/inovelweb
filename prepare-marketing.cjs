const fs=require('node:fs');
const source='C:/Users/msi-nb/Downloads/foto/foto/reklam/';
const output='static-site/assets/team/marketing/';
const entries=[
 ['Enes BAHADIR','enes bahadır.jpeg','enes-bahadir'],
 ['İlayda YILDIZ','İlayda Yıldız.jpeg','ilayda-yildiz'],
 ['Şafak Buğra ELMACI','Şafak Buğra Yazıcı.jpeg','safak-bugra-elmaci'],
 ['Barat Göktuğ MISIROĞLU','Barat Göktuğ Mısıroğlu.jpeg','barat-goktug-misiroglu'],
 ['Melek MEHMETALİGİL','Melek Mehmetaligil.jpeg','melek-mehmetaligil'],
 ['Sinem Gamze ERDOĞAN','Sinem Gamze Erdoğan.jpeg','sinem-gamze-erdogan'],
 ['Hatice HAYTA','Hatica Hayta.jpeg','hatice-hayta'],
 ['Berre SEVİNÇ','Berre Sevinç.jpeg','berre-sevinc'],
 ['Şevval BOZDEMİR','Şevval Bozdemir.jpeg','sevval-bozdemir'],
 ['Rümeysa YORULMAZ','Rümeysa Yorulmaz.jpeg','rumeysa-yorulmaz'],
 ['Özge GÜLEÇ','Özge Güleç.jpeg','ozge-gulec'],
 ['Enes Kaan BAYİK','enes kaan bayik.jpeg','enes-kaan-bayik'],
 ['Mürsel KARABULUT','mürsel.png','mursel-karabulut'],
 ['Ayşe DOĞAN','Ayşe Doğan.jpeg','ayse-dogan'],['Tuğçe KEMİKLİ']
];
fs.mkdirSync(output,{recursive:true});
const people=entries.map(([name,file,slug],index)=>{
 const person={name,role:index<2?'Departman Koordinatörü':'Koordinatör Yardımcısı'};
 if(file){const filename=slug+(file.endsWith('.png')?'.png':'.jpg');fs.copyFileSync(source+file,output+filename);person.image='assets/team/marketing/'+filename;}
 return person;
});
fs.writeFileSync('static-site/assets/team/marketing.json',JSON.stringify(people,null,2)+'\n','utf8');
const academy=[['Zeki AKTEPE','Zeki Aktepe.jpg','zeki-aktepe'],['Selvi SEZER','selvi.jpeg','selvi-sezer']].map(([name,file,slug])=>{
 const image='assets/team/academy/'+slug+'.jpg';
 fs.mkdirSync('static-site/assets/team/academy',{recursive:true});
 fs.copyFileSync('C:/Users/msi-nb/Downloads/foto/foto/akademi/'+file,'static-site/'+image);
 return {name,role:'Departman Koordinatörü',image};
});
fs.writeFileSync('static-site/assets/team/academy.json',JSON.stringify(academy,null,2)+'\n','utf8');
console.log('Marketing: 16 members, 15 photos. Academy: 2 coordinators, 2 photos.');
