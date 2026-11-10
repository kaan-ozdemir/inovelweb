const fs=require('node:fs');
for(const file of ['update-about.cjs','test-about.cjs']){
 let text=fs.readFileSync(file,'utf8').replaceAll("'../../'+person.image","'../../'+(person.preview||person.image)");
 for(const name of ['board[index]','media[index]','project[index]','sponsorship[index]','members[i]'])text=text.replaceAll("'../../'+"+name+'.image',"'../../'+("+name+'.preview||'+name+'.image)');
 fs.writeFileSync(file,text);
}
