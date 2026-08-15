const fs=require('fs');

const path='./src/App.jsx';
let s=fs.readFileSync(path,'utf8');

const oldText=`function TeacherAnalytics(){return <><PageTitle title="Analytics" text="Cohort performance and AI-generated teaching insights."/><div className="stats"><Stat icon={Users} value="128" label="Students"/><Stat icon={Target} value="81%" label="Avg score"/><Stat icon={Clock3} value="4.2h" label="Avg weekly study"/><Stat icon={Flame} value="67%" label="Weekly active"/></div><div className="grid two"><Card><SectionHead eyebrow="Performance" title="Topic mastery" icon={BarChart3}/>{[['Cells',88],['DNA',63],['Physiology',79],['Genetics',71]].map(([n,v])=><div className="bar-row" key={n}><span>{n}</span><Progress value={v}/><b>{v}%</b></div>)}</Card><Card><SectionHead eyebrow="AI commentary" title="This week" icon={Brain}/><TeacherInsights/></Card></div></>}`;

const newText=`function TeacherAnalytics(){

  const [report,setReport]=useState(null)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    loadWeeklyReport()
  },[])

  async function loadWeeklyReport(){
    const {data,error}=await supabase
      .from('automation_runs')
      .select('id,risk_score,weak_topic,generated_text,status,created_at')
      .eq('workflow_key','weekly_teacher_report')
      .eq('status','prepared')
      .order('created_at',{ascending:false})
      .limit(1)
      .maybeSingle()

    if(error){
      console.error(error)
      setLoading(false)
      return
    }

    setReport(data||null)
    setLoading(false)
  }

  function extractNumber(label){
    if(!report?.generated_text) return 0

    const line=
      report.generated_text
        .split('\\n')
        .find(x=>x.startsWith(label+':'))

    if(!line) return 0

    const value=line.split(':')[1]||''
    const num=value.match(/\\d+/)

    return num ? Number(num[0]) : 0
  }

  const students=extractNumber('Students')
  const avgProgress=extractNumber('Average progress')
  const avgQuiz=extractNumber('Average quiz score')
  const atRisk=report?.risk_score||0

  return <>
    <PageTitle
      title="Analytics"
      text="Live cohort performance and AI-generated teaching insights."
    />

    <div className="stats">
      <Stat icon={Users} value={loading?'...':students} label="Students"/>
      <Stat icon={Target} value={loading?'...':avgQuiz+'%'} label="Avg quiz score"/>
      <Stat icon={BarChart3} value={loading?'...':avgProgress+'%'} label="Avg progress"/>
      <Stat icon={CircleAlert} value={loading?'...':atRisk} label="At-risk students"/>
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
              <p>{atRisk} students</p>
            </div>
          </div>

          <Badge type="green">Live from Supabase</Badge>
        </> :
          <p className="muted">No weekly report yet.</p>
        }
      </Card>

      <Card>
        <SectionHead
          eyebrow="AI weekly report"
          title="Latest teacher briefing"
          icon={Brain}
        />

        {loading ?
          <p className="muted">Loading...</p>
        :
          report ?
            <pre className="revision-plan-text">
              {report.generated_text}
            </pre>
          :
            <p className="muted">
              No report generated yet.
            </p>
        }
      </Card>

    </div>
  </>
}`;

if(!s.includes(oldText)){
  throw new Error('Old TeacherAnalytics block not found');
}

s=s.replace(oldText,newText);

fs.writeFileSync(path,s,'utf8');

console.log('CourseAI V25.1 Live Analytics applied successfully.');
