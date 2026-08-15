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
   1. Add revision progress state + loader
========================================= */

replaceRequired(
`function StudentDashboard({data,setPage,setTutorPrompt}){
  const [revisionPlan,setRevisionPlan]=useState(null)

  useEffect(()=>{
    loadRevisionPlan()
  },[])`,
`function StudentDashboard({data,setPage,setTutorPrompt}){
  const [revisionPlan,setRevisionPlan]=useState(null)
  const [revisionSteps,setRevisionSteps]=useState([])
  const [revisionSaving,setRevisionSaving]=useState(false)

  useEffect(()=>{
    loadRevisionPlan()
  },[])`,
'StudentDashboard revision state'
);

/* =========================================
   2. Load saved step progress
========================================= */

replaceRequired(
`    setRevisionPlan(plan||null)
  }

  return <>`,
`    setRevisionPlan(plan||null)

    if(plan){
      await loadRevisionProgress(plan.id)
    }else{
      setRevisionSteps([])
    }
  }

  async function loadRevisionProgress(automationRunId){
    const {data,error}=await supabase
      .from('revision_plan_progress')
      .select('step_number,completed')
      .eq('automation_run_id',automationRunId)
      .order('step_number')

    if(error){
      console.error(error)
      return
    }

    const map=new Map(
      (data||[]).map(x=>[
        Number(x.step_number),
        Boolean(x.completed)
      ])
    )

    setRevisionSteps(
      [1,2,3,4].map(step=>({
        step,
        completed:map.get(step)||false
      }))
    )
  }

  async function toggleRevisionStep(stepNumber){
    if(!revisionPlan || revisionSaving) return

    const current=
      revisionSteps.find(x=>x.step===stepNumber)

    const nextCompleted=
      !current?.completed

    setRevisionSaving(true)

    try{
      const {error}=await supabase
        .from('revision_plan_progress')
        .upsert({
          automation_run_id:revisionPlan.id,
          student_name:'Omar Mohamed',
          step_number:stepNumber,
          completed:nextCompleted,
          completed_at:nextCompleted
            ? new Date().toISOString()
            : null,
          updated_at:new Date().toISOString()
        },{
          onConflict:'automation_run_id,step_number'
        })

      if(error) throw error

      setRevisionSteps(rows=>
        rows.map(row=>
          row.step===stepNumber
            ? {...row,completed:nextCompleted}
            : row
        )
      )

    }catch(err){
      console.error(err)
      alert('Could not save revision progress.')
    }finally{
      setRevisionSaving(false)
    }
  }

  const revisionStepLabels=[
    'Review the core concept for 10 minutes',
    'Solve 5 targeted questions',
    'Ask the AI Tutor about mistakes',
    'Retake a short quiz tomorrow'
  ]

  const completedRevisionSteps=
    revisionSteps.filter(x=>x.completed).length

  const revisionComplete=
    revisionSteps.length===4 &&
    completedRevisionSteps===4

  return <>`,
'revision progress functions'
);

/* =========================================
   3. Replace static revision plan body
========================================= */

replaceRequired(
`        <pre className="revision-plan-text">
          {revisionPlan.generated_text}
        </pre>

        <div className="revision-plan-actions">
          <button
            className="primary"
            onClick={()=>{
              setTutorPrompt(
                'Help me revise ' +
                revisionPlan.weak_topic +
                ' based on my latest revision plan.'
              )
              setPage('tutor')
            }}
          >
            <Brain size={17}/>
            Ask AI Tutor about this topic
          </button>

          <span className="muted">
            Generated after your latest low-score quiz.
          </span>
        </div>`,
`        <div className="revision-progress-summary">
          <div>
            <b>{completedRevisionSteps}/4 steps completed</b>
            <span>
              Complete the plan before retaking the quiz.
            </span>
          </div>
          <strong>
            {Math.round((completedRevisionSteps/4)*100)}%
          </strong>
        </div>

        <Progress value={(completedRevisionSteps/4)*100}/>

        <div className="revision-checklist">
          {revisionStepLabels.map((label,index)=>{
            const stepNumber=index+1
            const item=revisionSteps.find(
              x=>x.step===stepNumber
            )
            const done=item?.completed||false

            return (
              <button
                key={stepNumber}
                className={
                  'revision-step ' +
                  (done?'done':'')
                }
                disabled={revisionSaving}
                onClick={()=>
                  toggleRevisionStep(stepNumber)
                }
              >
                <span className="revision-step-check">
                  {done?'✓':stepNumber}
                </span>

                <div>
                  <b>{label}</b>
                  <span>
                    {done
                      ? 'Completed'
                      : 'Mark as done'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="revision-plan-actions">
          <button
            className="secondary"
            onClick={()=>{
              setTutorPrompt(
                'Help me revise ' +
                revisionPlan.weak_topic +
                ' based on my latest revision plan.'
              )
              setPage('tutor')
            }}
          >
            <Brain size={17}/>
            Ask AI Tutor
          </button>

          {revisionComplete&&
            <button
              className="primary"
              onClick={()=>setPage('quizzes')}
            >
              <Target size={17}/>
              Retake Quiz
            </button>
          }

          <span className="muted">
            Progress is saved automatically.
          </span>
        </div>`,
'revision plan interactive UI'
);

/* =========================================
   Save
========================================= */

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log('CourseAI V19 interactive revision plan added successfully.');
console.log('');
