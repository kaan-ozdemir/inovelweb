const fs=require('node:fs');
const convert=require('heic-convert');
const source='C:/Users/msi-nb/Downloads/foto/foto/spo/';
const output='static-site/assets/team/sponsorship/';
const entries=[
 ['Semih BAYRAM','Semih Bayram.jpg','semih-bayram'],
 ['Batuhan OKUMUŞ','batuhan okumuş.HEIC','batuhan-okumus'],
 ['Mücahit Efe AKBULUT','mücahit efe akbulut.jpeg','mucahit-efe-akbulut'],
 ['Emir BARKIN','emir barkın.jpeg','emir-barkin'],
 ['Ümran DEDEOĞLU','ümran dedeoğlu.jpeg','umran-dedeoglu'],
 ['Afra Beyza YILMAZ','afra beyza .jpeg','afra-beyza-yilmaz'],
 ['Ömer Fatih TÜZÜN','Ömer Fatih Tüzün.jpg','omer-fatih-tuzun'],
 ['Nidanur OKÇU','nidanur okçu.jpeg','nidanur-okcu'],
 ['Melisa ŞANLI','melisa şanlı.jpeg','melisa-sanli'],
 ['Sueda ARSLAN','sueda arslan.jpeg','sueda-arslan'],
 ['Büşra BAŞDİNÇ','büşra başdinç.jpeg','busra-basdinc'],
 ['Müberra AÇILAN','müberra.jpeg','muberra-acilan'],
 ['Muhammed KARDOĞAN']
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
   person.image='assets/team/sponsorship/'+slug+'.jpg';
  }
  people.push(person);
 }
 fs.writeFileSync('static-site/assets/team/sponsorship.json',JSON.stringify(people,null,2)+'\n','utf8');
 console.log('Sponsorship roster: 13 members, 12 portraits, 1 initials placeholder.');
})().catch(error=>{console.error(error);process.exitCode=1;});
