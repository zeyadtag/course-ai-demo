const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path, 'utf8');

const oldBlock = `      if(error) throw error

      setSaved(true)
      await loadAttempts()`;

const newBlock = `      if(error) throw error

      if(score < 65){
        try{
          await fetch(
            'https://tag811.app.n8n.cloud/webhook/courseai-low-score',
            {
              method:'POST',
              headers:{
                'Content-Type':'application/json'
              },
              body:JSON.stringify({
                student_name:'Omar Mohamed',
                score,
                weak_topic:'Cell biology'
              })
            }
          )
        }catch(automationError){
          console.error(
            'Low-score automation failed',
            automationError
          )
        }
      }

      setSaved(true)
      await loadAttempts()`;

if(!s.includes(oldBlock)){
  throw new Error(
    'Could not find quiz save block'
  );
}

s=s.replace(
  oldBlock,
  newBlock
);

fs.writeFileSync(
  path,
  s,
  'utf8'
);

console.log('');
console.log(
  'CourseAI V16 low-score automation connected.'
);
console.log('');
