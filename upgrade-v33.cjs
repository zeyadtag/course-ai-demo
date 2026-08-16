const fs=require('fs');

const path='./src/App.jsx';
let s=fs.readFileSync(path,'utf8');

const start=s.indexOf('function StudentAnalytics()');
const end=s.indexOf('function Achievements',start);

if(start===-1 || end===-1){
  throw new Error('StudentAnalytics block not found');
}

const replacement=`function StudentAnalytics({studentName='Omar Mohamed'}){

  const [stats,setStats]=useState({
    progress:0,
    average:0,
    attempts:0,
    weakTopic:'General review',
    lastScore:null,
    bestScore:null,
    daysInactive:0
  })

  const [attempts,setAttempts]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    loadAnalytics()
  },[studentName])

  async function loadAnalytics(){
    setLoading(true)

    const {data:student,error:studentError}=await supabase
      .from('profiles')
      .select('id')
      .eq('full_name',studentName)
      .eq('role','student')
      .maybeSingle()

    if(studentError || !student){
      if(studentError) console.error(studentError)
      setLoading(false)
      return
    }

    const [
      {data:enrollment,error:enrollmentError},
      {data:quizRows,error:quizError}
    ]=await Promise.all([

      supabase
        .from('enrollments')
        .select('progress,last_activity_at')
        .eq('student_id',student.id)
        .limit(1)
        .maybeSingle(),

      supabase
        .from('quiz_attempts')
        .select('score,weak_topics,completed_at,quizzes(title)')
        .eq('student_id',student.id)
        .order('completed_at',{ascending:false})

    ])

    if(enrollmentError) console.error(enrollmentError)
    if(quizError) console.error(quizError)

    const rows=quizRows||[]

    const average=
      rows.length
        ? Math.round(
            rows.reduce(
              (sum,row)=>sum+Number(row.score||0),
              0
            )/rows.length
          )
        : 0

    const bestScore=
      rows.length
        ? Math.max(
            ...rows.map(row=>Number(row.score||0))
          )
        : null

    const lastScore=
      rows.length
        ? Number(rows[0].score||0)
        : null

    const topicCounts={}

    rows.forEach(row=>{
      ;(row.weak_topics||[]).forEach(topic=>{
        if(!topic) return
        topicCounts[topic]=(topicCounts[topic]||0)+1
      })
    })

    const weakTopic=
      Object.entries(topicCounts)
        .sort((a,b)=>b[1]-a[1])[0]?.[0]
      || 'General review'

    const lastActivity=
      enrollment?.last_activity_at
        ? new Date(enrollment.last_activity_at)
        : null

    const daysInactive=
      lastActivity
        ? Math.max(
            0,
            Math.floor(
              (Date.now()-lastActivity.getTime())/
              86400000
            )
          )
        : 0

    setStats({
      progress:Number(enrollment?.progress||0),
      average,
      attempts:rows.length,
      weakTopic,
      lastScore,
      bestScore,
      daysInactive
    })

    setAttempts(rows.slice(0,5))
    setLoading(false)
  }

  return <>
    <PageTitle
      title="Analytics"
      text={'Live learning analytics for '+studentName+'.'}
    />

    <div className="stats">
      <Stat
        icon={BarChart3}
        value={loading?'...':stats.progress+'%'}
        label="Course progress"
      />

      <Stat
        icon={Target}
        value={loading?'...':stats.average+'%'}
        label="Quiz average"
      />

      <Stat
        icon={ListChecks}
        value={loading?'...':stats.attempts}
        label="Quiz attempts"
      />

      <Stat
        icon={Clock3}
        value={loading?'...':stats.daysInactive+'d'}
        label="Since last activity"
      />
    </div>

    <div className="grid two">

      <Card>
        <SectionHead
          eyebrow="Learning signal"
          title="Performance summary"
          icon={Brain}
        />

        <div className="detail-note">
          <CircleAlert size={17}/>
          <div>
            <b>Current weak topic</b>
            <p>{stats.weakTopic}</p>
          </div>
        </div>

        <div className="detail-note">
          <Target size={17}/>
          <div>
            <b>Latest quiz score</b>
            <p>
              {stats.lastScore!==null
                ? stats.lastScore+'%'
                : 'No attempt yet'}
            </p>
          </div>
        </div>

        <div className="detail-note">
          <Trophy size={17}/>
          <div>
            <b>Best quiz score</b>
            <p>
              {stats.bestScore!==null
                ? stats.bestScore+'%'
                : 'No attempt yet'}
            </p>
          </div>
        </div>

        <Badge type={
          stats.average>=75
            ? 'green'
            : stats.average>=65
              ? 'blue'
              : 'red'
        }>
          {stats.average>=75
            ? 'Strong performance'
            : stats.average>=65
              ? 'Needs monitoring'
              : 'Needs support'}
        </Badge>
      </Card>

      <Card>
        <SectionHead
          eyebrow="Live history"
          title="Recent quiz performance"
          icon={BarChart3}
        />

        {loading ?
          <p className="muted">
            Loading performance...
          </p>
        :
          attempts.length===0 ?
            <p className="muted">
              No quiz attempts recorded.
            </p>
          :
            attempts.map((attempt,index)=>
              <div
                className="result-row"
                key={index}
              >
                <div>
                  <b>
                    {attempt.quizzes?.title||
                     'Quiz attempt'}
                  </b>

                  <span>
                    {new Date(
                      attempt.completed_at
                    ).toLocaleDateString()}
                  </span>
                </div>

                <strong>
                  {Number(attempt.score)}%
                </strong>
              </div>
            )
        }
      </Card>

    </div>
  </>
}

`;

s=s.slice(0,start)+replacement+s.slice(end);

/* Pass selected student to Analytics */

const oldRender=
`page==='analytics'?<StudentAnalytics/>:<Achievements/>`;

const newRender=
`page==='analytics'
    ? <StudentAnalytics
        studentName={demoStudentName}
      />
    : <Achievements/>`;

if(!s.includes(oldRender)){
  throw new Error(
    'StudentAnalytics render call not found'
  );
}

s=s.replace(oldRender,newRender);

fs.writeFileSync(path,s,'utf8');

console.log(
  'CourseAI V33 Live Student Analytics applied successfully.'
);
