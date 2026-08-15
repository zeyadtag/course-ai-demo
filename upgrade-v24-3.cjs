const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path,'utf8');

function mustReplace(oldText,newText,label){
  if(!s.includes(oldText)){
    throw new Error('Could not find: '+label);
  }
  s=s.replace(oldText,newText);
}

/* =========================================
   1. Remove browser-side At-Risk automation
      n8n now owns this workflow
========================================= */

const start =
  s.indexOf('async function runAtRiskStudentAutomations(students){');

const end =
  s.indexOf('async function runInactiveStudentAutomations(students){');

if(start === -1 || end === -1 || end <= start){
  throw new Error('Could not locate old at-risk browser automation');
}

s =
  s.slice(0,start) +
  s.slice(end);

/* Remove calls from Teacher Overview + Students */

s=s.replace(
`          runInactiveStudentAutomations(rows)
          runAtRiskStudentAutomations(rows)`,
`          runInactiveStudentAutomations(rows)`
);

s=s.replace(
`          runInactiveStudentAutomations(data)
          runAtRiskStudentAutomations(data)`,
`          runInactiveStudentAutomations(data)`
);

/* =========================================
   2. Student: load latest At-Risk intervention
========================================= */

mustReplace(
`  const [inactiveFollowup,setInactiveFollowup]=useState(null)`,
`  const [inactiveFollowup,setInactiveFollowup]=useState(null)
  const [atRiskIntervention,setAtRiskIntervention]=useState(null)`,
'student at-risk state'
);

mustReplace(
`    loadRevisionPlan()
    loadInactiveFollowup()`,
`    loadRevisionPlan()
    loadInactiveFollowup()
    loadAtRiskIntervention()`,
'student at-risk loader call'
);

mustReplace(
`  async function loadInactiveFollowup(){`,
`  async function loadAtRiskIntervention(){
    const {data:intervention,error}=await supabase
      .from('automation_runs')
      .select('id,student_name,risk_score,weak_topic,generated_text,status,created_at')
      .eq('workflow_key','at_risk_student')
      .eq('student_name',data.student.full_name)
      .eq('status','prepared')
      .order('created_at',{ascending:false})
      .limit(1)
      .maybeSingle()

    if(error){
      console.error(
        'Could not load at-risk intervention',
        error
      )
      return
    }

    setAtRiskIntervention(intervention||null)
  }

  async function loadInactiveFollowup(){`,
'student at-risk loader'
);

/* =========================================
   3. Student: show intervention card
========================================= */

mustReplace(
`    {inactiveFollowup&&
      <Card className="welcome-back-card">`,
`    {atRiskIntervention&&
      <Card className="welcome-back-card">
        <SectionHead
          eyebrow="AI support"
          title="Personalized support prepared"
          icon={Brain}
        />

        <p className="welcome-back-message">
          {atRiskIntervention.generated_text}
        </p>

        <div className="welcome-back-actions">
          <div>
            <Badge type="blue">
              Risk score: {atRiskIntervention.risk_score}
            </Badge>
            {' '}
            <Badge type="blue">
              Focus: {atRiskIntervention.weak_topic}
            </Badge>
          </div>

          <button
            className="primary"
            onClick={()=>{
              setTutorPrompt(
                'Help me review '+
                atRiskIntervention.weak_topic+
                '. Use ONLY information explicitly supported by my uploaded course material. Do not introduce topics that are absent from the uploaded material.'
              )
              setPage('tutor')
            }}
          >
            <Brain size={17}/>
            Start support session
          </button>
        </div>
      </Card>
    }

    {inactiveFollowup&&
      <Card className="welcome-back-card">`,
'student intervention card'
);

/* =========================================
   4. Teacher: At-Risk intervention state
========================================= */

mustReplace(
`  const [inactiveFollowups,setInactiveFollowups] =
    useState([])`,
`  const [inactiveFollowups,setInactiveFollowups] =
    useState([])

  const [atRiskInterventions,setAtRiskInterventions] =
    useState([])`,
'teacher at-risk state'
);

mustReplace(
`    loadMaterials()
    loadInactiveFollowups()`,
`    loadMaterials()
    loadInactiveFollowups()
    loadAtRiskInterventions()`,
'teacher at-risk load call'
);

mustReplace(
`  async function loadInactiveFollowups(){`,
`  async function loadAtRiskInterventions(){
    const {data,error}=await supabase
      .from('automation_runs')
      .select('id,student_name,risk_score,weak_topic,generated_text,status,created_at')
      .eq('workflow_key','at_risk_student')
      .order('created_at',{ascending:false})
      .limit(20)

    if(error){
      console.error(
        'Could not load at-risk interventions',
        error
      )
      return
    }

    const latestByStudent=[]

    for(const item of (data||[])){
      if(
        !latestByStudent.some(
          x=>x.student_name===item.student_name
        )
      ){
        latestByStudent.push(item)
      }
    }

    setAtRiskInterventions(latestByStudent)
  }

  async function loadInactiveFollowups(){`,
'teacher at-risk loader'
);

/* =========================================
   5. Teacher: show latest intervention
========================================= */

mustReplace(
`    {inactiveFollowups.length>0&&
      <Card className="inactive-followups-card">`,
`    {atRiskInterventions.length>0&&
      <Card className="inactive-followups-card">
        <SectionHead
          eyebrow="AI risk automation"
          title="At-risk interventions"
          icon={Brain}
        />

        <div className="inactive-followup-list">
          {atRiskInterventions.map(item=>
            <div
              className="inactive-followup-item"
              key={item.id}
            >
              <div className="inactive-followup-head">
                <div>
                  <b>{item.student_name}</b>
                  <span>
                    {item.weak_topic} · Risk {item.risk_score}
                  </span>
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
    }

    {inactiveFollowups.length>0&&
      <Card className="inactive-followups-card">`,
'teacher at-risk panel'
);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log(
  'CourseAI V24.3 server-side at-risk cleanup and display applied successfully.'
);
console.log('');
