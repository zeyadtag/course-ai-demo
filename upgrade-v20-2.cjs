const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path, 'utf8');

function replaceRequired(oldText,newText,label){
  if(!s.includes(oldText)){
    throw new Error('Could not find: ' + label);
  }
  s=s.replace(oldText,newText);
}

/* 1. Replace student attempt calculation */

replaceRequired(
`    const studentAttempts =
      attemptMap.get(profile.id) || []

    const averageScore =
      studentAttempts.length
        ? Math.round(
            studentAttempts.reduce(
              (total,a)=>total + Number(a.score || 0),
              0
            ) / studentAttempts.length
          )
        : 0`,
`    const studentAttempts =
      (attemptMap.get(profile.id) || [])
        .sort(
          (a,b)=>
            new Date(b.completed_at||0) -
            new Date(a.completed_at||0)
        )

    const averageScore =
      studentAttempts.length
        ? Math.round(
            studentAttempts.reduce(
              (total,a)=>total + Number(a.score || 0),
              0
            ) / studentAttempts.length
          )
        : 0

    const latestScore =
      studentAttempts.length
        ? Number(studentAttempts[0].score || 0)
        : null

    const previousLowAttempt =
      studentAttempts
        .slice(1)
        .find(a=>Number(a.score)<65)

    const previousLowScore =
      previousLowAttempt
        ? Number(previousLowAttempt.score || 0)
        : null

    const improvement =
      latestScore !== null &&
      latestScore >= 65 &&
      previousLowScore !== null
        ? latestScore - previousLowScore
        : null`,
'teacher recovery calculation'
);

/* 2. Add fields to returned student */

replaceRequired(
`      progress,

      score: averageScore || 0,

      risk,`,
`      progress,

      score: averageScore || 0,

      latestScore,
      previousLowScore,
      improvement,

      risk,`,
'teacher recovery fields'
);

/* 3. Add recovery to teacher student detail */

replaceRequired(
`<div><b>{selected.risk}</b><span>Risk score</span></div><div><b>{selected.trend}</b><span>Trend</span></div>`,
`<div><b>{selected.risk}</b><span>Risk score</span></div>
<div>
  <b>
    {selected.improvement!==null && selected.improvement!==undefined
      ? '+'+selected.improvement+' pts'
      : '—'}
  </b>
  <span>Recovery</span>
</div>
<div><b>{selected.trend}</b><span>Trend</span></div>`,
'student detail recovery'
);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log('CourseAI V20.2 teacher recovery applied successfully.');
console.log('');
