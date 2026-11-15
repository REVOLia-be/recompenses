import { renderToStaticMarkup } from 'react-dom/server';
import { createElement as h } from 'react';
import { writeFileSync, readFileSync } from 'node:fs';
import { CompanionArt } from '/home/user/recompenses/src/screens/companions/CompanionArt';
const hues = [330, 265, 140, 30];
const css = readFileSync('/home/user/recompenses/src/screens/companions/companions.css','utf8');
let html = `<html><head><style>${css} body{background:linear-gradient(#e8e1ff,#ffe1ee,#ffe9d9);margin:0;font-family:sans-serif} .row{display:flex;gap:8px;padding:8px} .cell{background:rgba(255,255,255,.5);border-radius:16px}</style></head><body>`;
const els=[];
for (const hue of hues) { els.push(h('div',{className:'row'}, [0,1,2,3,4,5].map(s=>h('div',{className:'cell'},h(CompanionArt,{stage:s,hue,size:260,animated:false}))))); }
html += renderToStaticMarkup(h('div',null,els));
html += '<div class="row">';
for (let s=0;s<6;s++) html += '<div class="cell">'+renderToStaticMarkup(h(CompanionArt,{stage:s,hue:265,size:48,animated:false}))+'</div>';
for (let s=0;s<6;s++) html += '<div class="cell">'+renderToStaticMarkup(h(CompanionArt,{stage:s,hue:265,size:48,silhouette:true}))+'</div>';
html += '</div></body></html>';
writeFileSync('/tmp/claude-0/-home-user-recompenses/9f66701c-bf49-5af3-86c1-a0d5378a92bf/scratchpad/cmp/gallery.html', html);
