const fs=require('node:fs');
const path=require('node:path');
const source='C:/Users/msi-nb/Downloads/foto/foto/yk';
const output='static-site/assets/team/board';
fs.mkdirSync(output,{recursive:true});
const members=[
 {name:'İbrahim Çağrı DİLBER',role:'Yönetim Kurulu Başkanı',file:'İbrahim Çağrı Dilber.jpeg',slug:'ibrahim-cagri-dilber'},
 {name:'Gökhan KAYA',role:'Yönetim Kurulu Başkan Yardımcısı',file:'Gökhan Kaya.jpg',slug:'gokhan-kaya'},
 {name:'Ahmet YİĞİT',role:'Yönetim Kurulu Başkan Yardımcısı',file:'Ahmet Yiğit.jpg',slug:'ahmet-yigit'},
 {name:'Yusuf PALA',role:'Yönetim Kurulu Üyesi',file:'Yusuf Pala.jpg',slug:'yusuf-pala'},
 {name:'Batuhan YILMAZ',role:'Yönetim Kurulu Üyesi',file:'batuhan yılmaz.jpeg',slug:'batuhan-yilmaz'},
 {name:'Yiğit TÜRK',role:'Yönetim Kurulu Üyesi',file:'Yiğit Türk.jpg',slug:'yigit-turk'},
 {name:'Şevval YEĞİT',role:'Yönetim Kurulu Üyesi',file:'Şevval Yeğit.jpg',slug:'sevval-yegit'},
 {name:'Buket UÇAN',role:'Yönetim Kurulu Üyesi',file:'Buket Uçan.jpeg',slug:'buket-ucan'}
];
const board=members.map(member=>{
 const filename=member.slug+path.extname(member.file);
 const original=path.join(source,member.file);
 const bytes=fs.readFileSync(original);
 if(bytes[0]!==255||bytes[1]!==216)throw new Error('Expected JPEG: '+member.file);
 fs.copyFileSync(original,path.join(output,filename));
 return {name:member.name,role:member.role,image:'assets/team/board/'+filename};
});
fs.writeFileSync('static-site/assets/team/board.json',JSON.stringify(board,null,2)+'\n','utf8');
console.log('Eight supplied board photos copied without editing; names and roles saved.');
