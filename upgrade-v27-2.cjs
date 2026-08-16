const fs=require('fs');

const path='./src/App.jsx';
let s=fs.readFileSync(path,'utf8');

const oldText=`liveStudents
      .filter(s=>s.risk>=55)`;

const newText=`liveStudents
      .filter(s=>s.risk>=70)`;

if(!s.includes(oldText)){
  throw new Error('Overview priority filter not found');
}

s=s.replace(oldText,newText);

fs.writeFileSync(path,s,'utf8');

console.log('V27.2 Overview now shows At-risk students only.');
