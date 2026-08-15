const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path, 'utf8');

function replaceRequired(oldText,newText,label){
  if(!s.includes(oldText)){
    throw new Error('Could not find: ' + label);
  }
  s=s.replace(oldText,newText);
}

replaceRequired(
`  const [saved,setSaved]=useState(false)
  const [attempts,setAttempts]=useState([])`,
`  const [saved,setSaved]=useState(false)
  const [attempts,setAttempts]=useState([])
  const [improvement,setImprovement]=useState(null)`,
'improvement state'
);

replaceRequired(
`    setAttempts(data||[])
  }`,
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
  }`,
'improvement calculation'
);

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
          Great recovery. Your revision plan improved your latest quiz performance.
        </div>
      </Card>
    }

    <div className="grid two">

      <Card>
        <SectionHead`,
'improvement card'
);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log('CourseAI V20.1 recovery card applied successfully.');
console.log('');
