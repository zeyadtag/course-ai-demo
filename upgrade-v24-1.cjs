const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path,'utf8');

const oldText = `student.risk >= 75`;
const newText = `student.risk >= 70`;

if(!s.includes(oldText)){
  throw new Error('Could not find at-risk threshold');
}

s = s.replace(oldText,newText);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log('CourseAI V24.1 at-risk threshold changed to 70 successfully.');
console.log('');
