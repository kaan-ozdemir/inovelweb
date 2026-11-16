function normalizeHeader(header){
 const home=header.match(/class="modern-brand" href="([^"]*)index.html"/);
 if(!home)return header;
 const prefix=home[1];
 const links=[['portfolios/inovel-etkinlik/index.html','İNOVEL'],['portfolios/gbs-etkinlik/index.html','GBS'],['portfolios/kasis-etkinlikler/index.html','KASİS']];
 const group=`<div class="modern-event-group"><button class="modern-event-toggle modern-event-label" type="button" aria-expanded="false" aria-controls="modern-event-submenu">Etkinlikler <span aria-hidden="true">⌄</span></button><div class="modern-event-submenu" id="modern-event-submenu" hidden>${links.map(([href,title])=>`<a href="${prefix}${href}">${title}</a>`).join('')}<a class="modern-platform-link" href="${prefix}etkinlikler/index.html">Etkinlik ekranı<small>Çekiliş · Tombala · Vampir Köylü</small></a></div></div>`;
 if(header.includes('class="modern-event-group"'))header=header.replace(/<div class="modern-event-group">[\s\S]*?<\/div><\/div>/,group);
 else header=header.replace(/<details class="modern-dropdown"><summary>Etkinlikler[\s\S]*?<\/details>/,group);
 header=header.replace(/<a class="modern-blog-link"[^>]*>[\s\S]*?<\/a>/g,'');
 if(!header.includes('>Tüm içerikler</a>'))header=header.replace(/(<div>)(<a href="([^"]*)dergi\/index.html">)/,'$1<a href="$3icerikler/index.html">Tüm içerikler</a>$2');
 return header;
}
function finalizePage(html){
 const header=html.match(/<header class="modern-header">[\s\S]*?<\/header>/)?.[0];
 if(!header)return html;
 const normalized=normalizeHeader(header);
 html=html.replace(header,normalized);
 const prefix=normalized.match(/class="modern-brand" href="([^"]*)index.html"/)?.[1];
 if(prefix!==undefined&&!html.includes('assets/navigation-repairs.css'))html=html.replace('</head>',`<link rel="stylesheet" href="${prefix}assets/navigation-repairs.css">\n</head>`);
 return html;
}
module.exports={normalizeHeader,finalizePage};
