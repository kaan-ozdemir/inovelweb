const fs=require('node:fs');
const path=require('node:path');
const convert=require('heic-convert');
const source='C:/Users/msi-nb/Downloads/foto/foto/pgi/';
const output='static-site/assets/team/project/';
const entries=[
 ['Mustafa Kaan KALECİ','mustafa kaan kaleci.jpeg','mustafa-kaan-kaleci'],
 ['Esma HARMAN','esma harman.jpeg','esma-harman'],
 ['Mehmet Efehan ABAYLI','Mehmet Efehan Abaylı.jpeg','mehmet-efehan-abayli'],
 ['Medine Melek BEKAR','medine melek.jpeg','medine-melek-bekar'],
 ['Zeynep ÖZBEK','zeynep özbek.jpeg','zeynep-ozbek'],
 ['Zehranur ERDOĞDU','Zehranur Erdoğdu.jpeg','zehranur-erdogdu'],
 ['Nida ŞAHİN','Nida ŞAHİN.jpeg','nida-sahin'],
 ['Şeyda İzabel DAĞ','izabel.HEIC','seyda-izabel-dag'],
 ['Tuğçe DEMİRKIRAN','Tuğçe Demirkıran.jpg','tugce-demirkiran'],
 ['Talha ÇINAR','talha.png','talha-cinar'],
 ['Hüseyin ALTAY','hüseyin altay.png','huseyin-altay'],
 ['Sevcan SESKİN','Sevcan Seskin.jpeg','sevcan-seskin'],
 ['Ali Efe ŞİMŞEK','Ali Efe Şimşek.jpg','ali-efe-simsek'],
 ['Ege ERGEN'],
 ['Fatmanur SÜNDÜR','Fatmanur Sündür.jpg','fatmanur-sundur'],
 ['Nur GEYGEL','nur geygel.HEIC','nur-geygel'],
 ['Berfu KURT','berfu kurt.jpeg','berfu-kurt'],
 ['Muharrem EKŞİ'],['Emirhan İDRİSOĞLU'],['Mehmet M. ATIĞ'],
 ['Muhammet Cafer GÖKKAYA'],['Yeliz KARA']
];
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const people=[];
 for(const [index,[name,file,slug]] of entries.entries()){
  const person={name,role:index<2?'Departman Koordinatörü':'Koordinatör Yardımcısı'};
  if(file){
   const bytes=fs.readFileSync(source+file);
   const ext=file.endsWith('.png')?'.png':'.jpg';
   const dest=output+slug+ext;
   if(file.endsWith('.HEIC'))fs.writeFileSync(dest,Buffer.from(await convert({buffer:bytes,format:'JPEG',quality:0.9})));
   else fs.copyFileSync(source+file,dest);
   person.image='assets/team/project/'+slug+ext;
  }
  people.push(person);
 }
 fs.writeFileSync('static-site/assets/team/project.json',JSON.stringify(people,null,2)+'\n','utf8');
 console.log('Project roster: 22 members, 16 portraits, 6 initials placeholders.');
})().catch(error=>{console.error(error);process.exitCode=1;});
