const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path, 'utf8');

const oldBlock = `        <div className="revision-progress-summary">
          <div>
            <b>{completedRevisionSteps}/4 steps completed</b>`;

const newBlock = `        <div className="revision-full-plan">
          <div className="revision-full-plan-title">
            AI Revision Plan
          </div>

          <pre className="revision-plan-text">
            {revisionPlan.generated_text}
          </pre>
        </div>

        <div className="revision-progress-summary">
          <div>
            <b>{completedRevisionSteps}/4 steps completed</b>`;

if(!s.includes(oldBlock)){
  throw new Error('Could not find revision progress block');
}

s=s.replace(oldBlock,newBlock);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log('CourseAI V19.1 full AI plan restored successfully.');
console.log('');
