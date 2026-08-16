const fs=require('fs');

const path='./src/App.jsx';
let s=fs.readFileSync(path,'utf8');

const start=s.indexOf(
  'async function runInactiveStudentAutomations(students){'
);

const end=s.indexOf(
  '\nconst nav = [',
  start
);

if(start===-1 || end===-1){
  throw new Error(
    'Old inactive automation function not found'
  );
}

s=s.slice(0,start)+s.slice(end);

/* Remove any remaining calls */
s=s.replace(
  /await\s+runInactiveStudentAutomations\s*\([^)]*\)\s*;?/g,
  ''
);

s=s.replace(
  /runInactiveStudentAutomations\s*\([^)]*\)\s*;?/g,
  ''
);

fs.writeFileSync(path,s,'utf8');

console.log(
  'V28: Browser-side inactive automation removed.'
);
