const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path,'utf8');

function replaceRequired(oldText,newText,label){
  if(!s.includes(oldText)){
    throw new Error('Could not find: '+label);
  }
  s=s.replace(oldText,newText);
}

/* =========================================
   1. Student inactive follow-up state
========================================= */

replaceRequired(
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
      console.error(error)
      return
    }

    setInactiveFollowup(followup||null)
  }`,
'student inactive followup'
);

/* =========================================
   2. Student welcome-back card
========================================= */

replaceRequired(
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
                ' based only on my course material.'
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
'student welcome back card'
);

/* =========================================
   3. Teacher follow-up panel component
========================================= */

replaceRequired(
`function TeacherContent({data}){`,
`function InactiveFollowupPanel(){
  const [followups,setFollowups]=useState([])

  useEffect(()=>{
    loadFollowups()
  },[])

  async function loadFollowups(){
    const {data,error}=await supabase
      .from('automation_runs')
      .select('id,student_name,weak_topic,generated_text,status,created_at')
      .eq('workflow_key','inactive_student_followup')
      .order('created_at',{ascending:false})
      .limit(10)

    if(error){
      console.error(error)
      return
    }

    setFollowups(data||[])
  }

  if(!followups.length) return null

  return (
    <Card className="inactive-followups-card">
      <SectionHead
        eyebrow="AI automation"
        title="Inactive student follow-ups"
        icon={MessageCircle}
      />

      <div className="inactive-followup-list">
        {followups.map(item=>
          <div className="inactive-followup-item" key={item.id}>

            <div className="inactive-followup-head">
              <div>
                <b>{item.student_name}</b>
                <span>{item.weak_topic}</span>
              </div>

              <Badge type="green">
                {item.status}
              </Badge>
            </div>

            <p>{item.generated_text}</p>

          </div>
        )}
      </div>
    </Card>
  )
}

function TeacherContent({data}){`,
'teacher followup component'
);

/* =========================================
   4. Put panel on Teacher Overview
========================================= */

replaceRequired(
`    <PageTitle title="Teacher Overview"`,
`    <InactiveFollowupPanel/>
    <PageTitle title="Teacher Overview"`,
'teacher overview followup panel'
);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log('CourseAI V22 inactive follow-up UI added successfully.');
console.log('');
