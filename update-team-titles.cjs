const fs=require('node:fs');
for(const file of ['prepare-board.cjs','static-site/assets/team/board.json','test-about.cjs']){
 const text=fs.readFileSync(file,'utf8').replaceAll('Topluluk Başkan Yardımcısı','Yönetim Kurulu Başkan Yardımcısı').replaceAll('Topluluk Başkanı','Yönetim Kurulu Başkanı');
 fs.writeFileSync(file,text,'utf8');
}
