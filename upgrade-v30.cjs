const fs=require('fs');

const path='./src/App.jsx';
let s=fs.readFileSync(path,'utf8');

const start=s.indexOf('function Automation(){');
const end=s.indexOf('function Announcements(){',start);

if(start===-1 || end===-1){
  throw new Error('Automation block not found');
}

const replacement=`function Automation(){

  const [runs,setRuns]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    loadRuns()
  },[])

  async function loadRuns(){
    setLoading(true)

    const {data,error}=await supabase
      .from('automation_runs')
      .select(
        'id,workflow_key,student_name,risk_score,weak_topic,action_type,status,created_at'
      )
      .order('created_at',{ascending:false})
      .limit(50)

    if(error){
      console.error('Could not load automation runs',error)
      setLoading(false)
      return
    }

    setRuns(data||[])
    setLoading(false)
  }

  const workflows=[
    {
      key:'at_risk_student',
      title:'At-risk student alert',
      description:'Detect students with risk score 70 or higher.',
      icon:Bell,
      schedule:'Every hour'
    },
    {
      key:'inactive_student_followup',
      title:'Inactive student follow-up',
      description:'Prepare follow-up after 5+ inactive days.',
      icon:MessageCircle,
      schedule:'Every hour'
    },
    {
      key:'low_score_revision',
      title:'Low-score revision plan',
      description:'Generate a revision plan after a score below 65%.',
      icon:Brain,
      schedule:'Event triggered'
    },
    {
      key:'weekly_teacher_report',
      title:'Weekly teacher report',
      description:'Summarize cohort performance and teaching priorities.',
      icon:FileText,
      schedule:'Every Sunday'
    }
  ]

  function latestRun(key){
    return runs.find(x=>x.workflow_key===key)
  }

  function countRuns(key){
    return runs.filter(x=>x.workflow_key===key).length
  }

  return <>
    <PageTitle
      title="Automation Center"
      text="Live server-side automation status from Supabase and n8n."
    />

    <div className="workflow-grid">
      {workflows.map(flow=>{
        const latest=latestRun(flow.key)
        const Icon=flow.icon

        return (
          <Card key={flow.key} className="workflow-card">
            <div className="workflow-head">
              <div className="iconbox">
                <Icon/>
              </div>

              <Badge type="green">
                Active
              </Badge>
            </div>

            <b className="workflow-title">
              {flow.title}
            </b>

            <p className="muted">
              {flow.description}
            </p>

            <div className="workflow-meta">
              <span>
                <Zap size={14}/>
                {countRuns(flow.key)} recent runs
              </span>

              <span>
                <Clock3 size={14}/>
                {flow.schedule}
              </span>
            </div>

            <div className="workflow-footer">
              <span className="muted">
                {latest
                  ? 'Last run: '+
                    new Date(
                      latest.created_at
                    ).toLocaleString()
                  : 'No run recorded yet'}
              </span>
            </div>
          </Card>
        )
      })}
    </div>

    <Card>
      <SectionHead
        eyebrow="Live activity"
        title="Recent automation runs"
        icon={Zap}
      />

      {loading ?
        <p className="muted">
          Loading automation activity...
        </p>
      :
        runs.length===0 ?
          <p className="muted">
            No automation runs recorded yet.
          </p>
        :
          <div className="activity-log">
            {runs.slice(0,15).map(run=>
              <div
                className="activity-item"
                key={run.id}
              >
                <div className="activity-dot success"/>

                <div className="grow">
                  <b>
                    {run.action_type || run.workflow_key}
                  </b>

                  <span>
                    {run.student_name}
                    {run.weak_topic
                      ? ' · '+run.weak_topic
                      : ''}
                    {run.risk_score!==null &&
                     run.risk_score!==undefined
                      ? ' · '+run.risk_score
                      : ''}
                  </span>
                </div>

                <div className="activity-time">
                  <span>
                    {new Date(
                      run.created_at
                    ).toLocaleString()}
                  </span>

                  <Badge type="green">
                    {run.status}
                  </Badge>
                </div>
              </div>
            )}
          </div>
      }
    </Card>
  </>
}

`;

s=s.slice(0,start)+replacement+s.slice(end);

fs.writeFileSync(path,s,'utf8');

console.log(
  'V30 Live Automation Center applied successfully.'
);
