const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path,'utf8');

const oldText = `'Give me a focused 15-minute review of '+
                inactiveFollowup.weak_topic+
                ' based only on my uploaded course material.'`;

const newText = `'Give me a focused 15-minute review of '+
                inactiveFollowup.weak_topic+
                '. Use ONLY information explicitly supported by my uploaded course material. Do not add, infer, expand, or supplement any detail from general knowledge. If the uploaded course material does not cover a point, say: "This point is not covered in the uploaded course material." Keep the terminology and level of detail consistent with the course material.'`;

if(!s.includes(oldText)){
  throw new Error(
    'Could not find inactive review tutor prompt'
  );
}

s=s.replace(oldText,newText);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log(
  'CourseAI V23.1 strict course-only review prompt applied successfully.'
);
console.log('');
