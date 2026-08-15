const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path,'utf8');

const oldText = `  const atRiskStudents=
    students.filter(
      student =>
        student.id &&
        student.risk >= 70
    )`;

const newText = `  console.log(
    'V24 at-risk input students:',
    students.map(s=>({
      name:s.name,
      id:s.id,
      risk:s.risk
    }))
  )

  const atRiskStudents=
    students.filter(
      student =>
        student.id &&
        student.risk >= 70
    )

  console.log(
    'V24 matched at-risk students:',
    atRiskStudents
  )`;

if(!s.includes(oldText)){
  throw new Error('Could not find at-risk filter');
}

s=s.replace(oldText,newText);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log('CourseAI V24.2 at-risk debug added successfully.');
console.log('');
