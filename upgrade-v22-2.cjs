const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path,'utf8');

const oldText = `    setInactiveFollowups(data||[])`;

const newText = `    const latestByStudent = []

    for(const item of (data||[])){
      const alreadyAdded =
        latestByStudent.some(
          x => x.student_name === item.student_name
        )

      if(!alreadyAdded){
        latestByStudent.push(item)
      }
    }

    setInactiveFollowups(latestByStudent)`;

if(!s.includes(oldText)){
  throw new Error(
    'Could not find inactive follow-up setter'
  );
}

s=s.replace(oldText,newText);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log(
  'CourseAI V22.2 duplicate follow-ups fixed successfully.'
);
console.log('');
