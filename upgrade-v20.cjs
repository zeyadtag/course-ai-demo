const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path, 'utf8');

function replaceRequired(oldText,newText,label){
  if(!s.includes(oldText)){
    throw new Error('Could not find: ' + label);
  }
  s=s.replace(oldText,newText);
}

/* =========================================
   1. Add improvement state to Quizzes
========================================= */

replaceRequired(
`  const [saved,setSaved]=useState(false)
  const [attempts,setAttempts]=useState([])`,
`  const [saved,setSaved]=useState(false)
  const [attempts,setAttempts]=useState([])
  const [improvement,setImprovement]=useState(null)`,
'quiz improvement state'
);

/* =========================================
   2. Calculate improvement from attempts
========================================= */

replaceRequired(
`    setAttempts(data||[])
  }

  async function submitQuiz(){`,
`    const rows=data||[]
    setAttempts(rows)

    if(rows.length>=2){
      const latest=Number(rows[0].score||0)

      const previousLow=rows
        .slice(1)
        .find(x=>Number(x.score)<65)

      if(previousLow && latest>=65){
        const previous=Number(previousLow.score||0)

        setImprovement({
          previous,
          latest,
          change:latest-previous
        })
      }else{
        setImprovement(null)
      }
    }else{
      setImprovement(null)
    }
  }

  async function submitQuiz(){`,
'quiz improvement calculation'
);

/* =========================================
   3. Show student improvement card
========================================= */

replaceRequired(
`    <div className="grid two">

      <Card>
        <SectionHead`,
`    {improvement&&
      <Card className="improvement-card">
        <SectionHead
          eyebrow="AI intervention result"
          title="Your recovery"
          icon={Trophy}
        />

        <div className="improvement-grid">
          <div>
            <span>Before revision</span>
            <strong>{improvement.previous}%</strong>
          </div>

          <div className="improvement-arrow">
            →
          </div>

          <div>
            <span>Retake score</span>
            <strong>{improvement.latest}%</strong>
          </div>

          <div className="improvement-change">
            <span>Improvement</span>
            <strong>+{improvement.change} pts</strong>
          </div>
        </div>

        <div className="feedback good">
          <Trophy size={17}/>
          Great recovery. Your revision plan improved your latest quiz performance.
        </div>
      </Card>
    }

    <div className="grid two">

      <Card>
        <SectionHead`,
'student improvement UI'
);

/* =========================================
   4. Sort each student's attempts
   and calculate recovery for teacher
========================================= */

replaceRequired(
`    const list=attemptMap.get(p.id)||[]
    const avg=list.length?Math.round(list.reduce((sum,a)=>sum+Number(a.score||0),0)/list.length):0`,
`    const list=(attemptMap.get(p.id)||[])
      .sort(
        (a,b)=>
          new Date(b.completed_at||0)-
          new Date(a.completed_at||0)
      )

    const avg=list.length
      ? Math.round(
          list.reduce(
            (sum,a)=>sum+Number(a.score||0),
            0
          )/list.length
        )
      : 0

    const latestScore=
      list.length
        ? Number(list[0].score||0)
        : null

    const previousLowAttempt=
      list
        .slice(1)
        .find(a=>Number(a.score)<65)

    const previousLowScore=
      previousLowAttempt
        ? Number(previousLowAttempt.score||0)
        : null

    const improvement=
      latestScore!==null &&
      latestScore>=65 &&
      previousLowScore!==null
        ? latestScore-previousLowScore
        : null`,
'teacher improvement calculation'
);

/* =========================================
   5. Add recovery fields to live student
========================================= */

replaceRequired(
`      reason:daysInactive>=5?`,
`      latestScore,
      previousLowScore,
      improvement,
      reason:daysInactive>=5?`,
'student recovery fields'
);

/* =========================================
   6. Add Recovery column to Teacher table
========================================= */

replaceRequired(
`<th>Weak topic</th><th>Last active</th><th>Status</th>`,
`<th>Weak topic</th><th>Recovery</th><th>Last active</th><th>Status</th>`,
'teacher recovery table header'
);

replaceRequired(
`<td>{s.weak}</td><td>{s.last}</td><td><Badge`,
`<td>{s.weak}</td>
<td>
  {s.improvement!==null && s.improvement!==undefined
    ? <Badge type="green">+{s.improvement} pts</Badge>
    : <span className="muted">—</span>
  }
</td>
<td>{s.last}</td><td><Badge`,
'teacher recovery table value'
);

/* =========================================
   Save
========================================= */

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log('CourseAI V20 intervention improvement tracking added successfully.');
console.log('');
