const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path,'utf8');

const oldText =
`If the uploaded course material does not cover a point, say: "This point is not covered in the uploaded course material." Keep the terminology and level of detail consistent with the course material.`;

const newText =
`If the uploaded course material does not cover a point explicitly asked by the student, say: "This point is not covered in the uploaded course material." Do not introduce, suggest, or list topics that are absent from the uploaded course material. Review only topics and subtopics actually present in the retrieved course content. Keep the terminology, scope, and level of detail consistent with the course material.`;

if(!s.includes(oldText)){
  throw new Error(
    'Could not find V23.1 strict review prompt'
  );
}

s=s.replace(oldText,newText);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log(
  'CourseAI V23.2 strict topic-scope review applied successfully.'
);
console.log('');
