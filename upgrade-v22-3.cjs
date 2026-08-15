const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path,'utf8');

function mustReplace(oldText,newText,label){
  if(!s.includes(oldText)){
    throw new Error('Could not find: '+label);
  }
  s=s.replace(oldText,newText);
}

/* 1) Add inactive follow-up state */

mustReplace(
`  const [revisionSaving,setRevisionSaving]=useState(false)

  useEffect(()=>{
    loadRevisionPlan()
  },[])`,
`  const [revisionSaving,setRevisionSaving]=useState(false)
  const [inactiveFollowup,setInactiveFollowup]=useState(null)

  useEffect(()=>{
    loadRevisionPlan()
    loadInactiveFollowup()
  },[])

  async function loadInactiveFollowup(){
    const {data:followup,error}=await supabase
      .from('automation_runs')
      .select('id,student_name,weak_topic,generated_text,status,created_at')
      .eq('workflow_key','inactive_student_followup')
      .eq('student_name',data.student.full_name)
      .eq('status','prepared')
      .order('created_at',{ascending:false})
      .limit(1)
      .maybeSingle()

    if(error){
      console.error(
        'Could not load student inactive follow-up',
        error
      )
      return
    }

    setInactiveFollowup(followup||null)
  }`,
'student inactive state'
);

/* 2) Add welcome-back card under hero */

mustReplace(
`    <div className="stats"><Stat icon={Target}`,
`    {inactiveFollowup&&
      <Card className="welcome-back-card">
        <SectionHead
          eyebrow="AI follow-up"
          title="Welcome back — let's continue"
          icon={Sparkles}
        />

        <p className="welcome-back-message">
          {inactiveFollowup.generated_text}
        </p>

        <div className="welcome-back-actions">
          <Badge type="blue">
            Focus: {inactiveFollowup.weak_topic}
          </Badge>

          <button
            className="primary"
            onClick={()=>{
              setTutorPrompt(
                'Give me a focused 15-minute review of '+
                inactiveFollowup.weak_topic+
                ' based only on my uploaded course material.'
              )
              setPage('tutor')
            }}
          >
            <PlayCircle size={17}/>
            Start 15-min review
          </button>
        </div>
      </Card>
    }

    <div className="stats"><Stat icon={Target}`,
'student inactive card'
);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log('CourseAI V22.3 student inactive follow-up added successfully.');
console.log('');
