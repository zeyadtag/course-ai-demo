const fs=require('fs');

const path='./src/App.jsx';
let s=fs.readFileSync(path,'utf8');

const start=s.indexOf('function TeacherAnalytics(){');
const end=s.indexOf('function Automation(){');

if(start===-1 || end===-1 || end<=start){
  throw new Error('TeacherAnalytics section not found');
}

const replacement=`function TeacherAnalytics(){

  const [report,setReport]=useState(null)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    loadWeeklyReport()
  },[])

  async function loadWeeklyReport(){
    setLoading(true)

    const {data,error}=await supabase
      .from('automation_runs')
      .select(
        'id,risk_score,weak_topic,generated_text,status,created_at'
      )
      .eq('workflow_key','weekly_teacher_report')
      .eq('status','prepared')
      .order('created_at',{ascending:false})
      .limit(1)
      .maybeSingle()

    if(error){
      console.error('Could not load weekly report',error)
      setLoading(false)
      return
    }

    setReport(data||null)
    setLoading(false)
  }

  function extractNumber(label){
    if(!report?.generated_text) return null

    const escaped=
      label.replace(/[.*+?^\\${}()|[\\]\\\\]/g,'\\\\$&')

    const match=
      report.generated_text.match(
        new RegExp(escaped+'\\\\s*:?\\\\s*(\\\\d+)','i')
      )

    return match ? Number(match[1]) : null
  }

  const students=
    extractNumber('Students') ?? 0

  const avgProgress=
    extractNumber('Average progress') ?? 0

  const avgQuiz=
    extractNumber('Average quiz score') ?? 0

  const atRisk=
    report?.risk_score ?? 0

  return <>
    <PageTitle
      title="Analytics"
      text="Live cohort performance and the latest automated weekly teacher report."
    />

    <div className="stats">
      <Stat
        icon={Users}
        value={loading?'...':students}
        label="Students"
        sub="Live weekly report"
      />

      <Stat
        icon={Target}
        value={loading?'...':avgQuiz+'%'}
        label="Avg quiz score"
        sub="Current cohort"
      />

      <Stat
        icon={BarChart3}
        value={loading?'...':avgProgress+'%'}
        label="Avg progress"
        sub="Current cohort"
      />

      <Stat
        icon={CircleAlert}
        value={loading?'...':atRisk}
        label="At-risk students"
        sub="Needs attention"
      />
    </div>

    <div className="grid two">

      <Card>
        <SectionHead
          eyebrow="Weekly signal"
          title="Teaching priority"
          icon={Target}
        />

        {report ? <>
          <div className="detail-note">
            <CircleAlert size={17}/>
            <div>
              <b>Weakest topic</b>
              <p>{report.weak_topic}</p>
            </div>
          </div>

          <div className="detail-note">
            <Users size={17}/>
            <div>
              <b>Students needing attention</b>
              <p>{atRisk} students are currently flagged.</p>
            </div>
          </div>

          <Badge type="green">
            Live from Supabase
          </Badge>
        </> :
          <p className="muted">
            No weekly report has been generated yet.
          </p>
        }
      </Card>

      <Card>
        <SectionHead
          eyebrow="AI weekly report"
          title="Latest teacher briefing"
          icon={Brain}
        />

        {loading ?
          <p className="muted">Loading report...</p>
        :
          report ?
            <>
              <pre className="revision-plan-text">
                {report.generated_text}
              </pre>

              <p className="muted">
                Generated {new Date(
                  report.created_at
                ).toLocaleString()}
              </p>
            </>
          :
            <p className="muted">
              The automatic weekly report will appear here.
            </p>
        }
      </Card>

    </div>
  </>
}

`;

s=s.slice(0,start)+replacement+s.slice(end);

fs.writeFileSync(path,s,'utf8');

console.log(
  'CourseAI V25 Live Weekly Analytics applied successfully.'
);
