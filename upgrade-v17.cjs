const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path, 'utf8');

const oldStart = `function StudentDashboard({data,setPage}){
  return <>`;

const newStart = `function StudentDashboard({data,setPage}){
  const [revisionPlan,setRevisionPlan]=useState(null)

  useEffect(()=>{
    loadRevisionPlan()
  },[])

  async function loadRevisionPlan(){
    const {data:plan,error}=await supabase
      .from('automation_runs')
      .select('id,workflow_key,student_name,weak_topic,generated_text,status,created_at')
      .eq('workflow_key','low_score_revision')
      .eq('student_name','Omar Mohamed')
      .eq('status','prepared')
      .order('created_at',{ascending:false})
      .limit(1)
      .maybeSingle()

    if(error){
      console.error(error)
      return
    }

    setRevisionPlan(plan||null)
  }

  return <>`;

if(!s.includes(oldStart)){
  throw new Error('Could not find StudentDashboard start');
}

s=s.replace(oldStart,newStart);

const oldEnd = `    <div className="grid three"><Card><SectionHead eyebrow="Weak topic" title="DNA transcription" icon={CircleAlert}/><p className="muted">You missed 3 of the last 5 questions on transcription.</p><button className="primary" onClick={()=>setPage('tutor')}>Ask AI Tutor</button></Card><Card><SectionHead eyebrow="Next milestone" title="Quiz Master" icon={Trophy}/><p className="muted">Score 90%+ in two more quizzes to unlock 500 XP.</p><Progress value={67}/></Card><Card><SectionHead eyebrow="Upcoming" title="Weekly biology challenge" icon={CalendarDays}/><p className="muted">Saturday · 8:00 PM · 20 questions</p><Badge type="blue">Starts in 2 days</Badge></Card></div>
  </>
}`;

const newEnd = `    <div className="grid three"><Card><SectionHead eyebrow="Weak topic" title="DNA transcription" icon={CircleAlert}/><p className="muted">You missed 3 of the last 5 questions on transcription.</p><button className="primary" onClick={()=>setPage('tutor')}>Ask AI Tutor</button></Card><Card><SectionHead eyebrow="Next milestone" title="Quiz Master" icon={Trophy}/><p className="muted">Score 90%+ in two more quizzes to unlock 500 XP.</p><Progress value={67}/></Card><Card><SectionHead eyebrow="Upcoming" title="Weekly biology challenge" icon={CalendarDays}/><p className="muted">Saturday · 8:00 PM · 20 questions</p><Badge type="blue">Starts in 2 days</Badge></Card></div>

    {revisionPlan&&
      <Card className="revision-plan-card">
        <SectionHead
          eyebrow="AI intervention"
          title="Your new revision plan"
          icon={Brain}
        />

        <div className="revision-plan-head">
          <div>
            <span>Weak topic</span>
            <b>{revisionPlan.weak_topic}</b>
          </div>

          <Badge type="green">
            AI generated
          </Badge>
        </div>

        <pre className="revision-plan-text">
          {revisionPlan.generated_text}
        </pre>

        <div className="revision-plan-actions">
          <button
            className="primary"
            onClick={()=>setPage('tutor')}
          >
            <Brain size={17}/>
            Ask AI Tutor about this topic
          </button>

          <span className="muted">
            Generated after your latest low-score quiz.
          </span>
        </div>
      </Card>
    }
  </>
}`;

if(!s.includes(oldEnd)){
  throw new Error('Could not find StudentDashboard end');
}

s=s.replace(oldEnd,newEnd);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log('CourseAI V17 revision plan UI added successfully.');
console.log('');
