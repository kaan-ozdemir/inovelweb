const fs=require('node:fs');
const convert=require('heic-convert');
const source='C:/Users/msi-nb/Downloads/foto/foto/medya/';
const output='static-site/assets/team/media/';
const entries=[
 ['Rana UTKUTAN','rana utkutan.jpeg','rana-utkutan'],
 ['Kaan ÖZDEMİR','kaan özdemir.HEIC','kaan-ozdemir'],
 ['Dilara ÇAKMAK','dilara çakmak.jpeg','dilara-cakmak'],
 ['Arzu YILDIRIM','arzu yıldırım.jpeg','arzu-yildirim'],
 ['Gamze AKMAN','gamze akman.jpeg','gamze-akman'],
 ['Reyyan UZUN','reyyan uzn.jpeg','reyyan-uzun'],
 ['Sedef ÖZCAN','sedef özcan.jpeg','sedef-ozcan'],
 ['Raif Eren FİŞNECİ'],['Ayşe UÇAR'],['Medine ANDIÇ'],['İkranur ÖZEL']
];
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const people=[];
 for(const [index,[name,file,slug]] of entries.entries()){
  const person={name,role:index<2?'Departman Koordinatörü':'Koordinatör Yardımcısı'};
  if(file){
   const bytes=fs.readFileSync(source+file);
   const dest=output+slug+'.jpg';
   if(file.endsWith('.HEIC'))fs.writeFileSync(dest,Buffer.from(await convert({buffer:bytes,format:'JPEG',quality:0.9})));
   else fs.copyFileSync(source+file,dest);
   person.image='assets/team/media/'+slug+'.jpg';
  }
  people.push(person);
 }
 fs.writeFileSync('static-site/assets/team/media.json',JSON.stringify(people,null,2)+'\n','utf8');
 console.log('Media roster: 11 members, 7 supplied portraits, 4 initials placeholders.');
})().catch(error=>{console.error(error);process.exitCode=1;});
