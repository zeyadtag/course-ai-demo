const fs=require('fs');

const path='./src/App.jsx';
let s=fs.readFileSync(path,'utf8');

let changed=0;

/* Overview badge: always use the already-calculated student status */
const patterns=[
  /<Badge type=\{[^}]*\}>\{s\.risk[^<]*<\/Badge>/g,
  /<Badge type=\{[^}]*\}>Watch<\/Badge>/g
];

for(const pattern of patterns){
  s=s.replace(pattern,match=>{
    changed++;
    return `<Badge type={s.status==='At risk'?'red':s.status==='Watch'?'blue':'green'}>{s.status}</Badge>`;
  });
}

/* More targeted fallback: replace explicit risk-based badge expressions */
s=s.replace(
  /<Badge type=\{s\.risk>=\d+\?'red':s\.risk>=\d+\?'blue':'green'\}>\{s\.risk>=\d+\?'At risk':'Watch'\}<\/Badge>/g,
  ()=>{
    changed++;
    return `<Badge type={s.status==='At risk'?'red':s.status==='Watch'?'blue':'green'}>{s.status}</Badge>`;
  }
);

fs.writeFileSync(path,s,'utf8');

console.log('V29.1 overview status badge fixes:',changed);
