const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path, 'utf8');

function replaceRequired(oldText, newText, label) {
  if (!s.includes(oldText)) {
    throw new Error('Could not find: ' + label);
  }
  s = s.replace(oldText, newText);
}

/* =========================================
   1. Keep current students as fallback data
========================================= */

replaceRequired(
  'const students = [',
  'const fallbackStudents = [',
  'students array'
);

/* =========================================
   2. Add live Supabase student loader
========================================= */

replaceRequired(
`]

const nav = [`,
`]

async function fetchLiveStudents(){
  const [
    {data:profiles,error:pErr},
    {data:enrollments,error:eErr},
    {data:attempts,error:aErr}
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,full_name,role')
      .eq('role','student'),

    supabase
      .from('enrollments')
      .select('student_id,progress,last_activity_at'),

    supabase
      .from('quiz_attempts')
      .select('student_id,score,weak_topics,completed_at')
  ])

  if(pErr || eErr || aErr){
    throw (pErr || eErr || aErr)
  }

  const enrollmentMap = new Map(
    (enrollments || []).map(e => [e.student_id,e])
  )

  const attemptMap = new Map()

  ;(attempts || []).forEach(a=>{
    const list = attemptMap.get(a.student_id) || []
    list.push(a)
    attemptMap.set(a.student_id,list)
  })

  return (profiles || []).map(profile=>{

    const enrollment =
      enrollmentMap.get(profile.id) || {}

    const studentAttempts =
      attemptMap.get(profile.id) || []

    const averageScore =
      studentAttempts.length
        ? Math.round(
            studentAttempts.reduce(
              (total,a)=>total + Number(a.score || 0),
              0
            ) / studentAttempts.length
          )
        : 0

    const weakTopics = [
      ...new Set(
        studentAttempts.flatMap(
          a => a.weak_topics || []
        )
      )
    ].filter(Boolean)

    const lastActivity =
      enrollment.last_activity_at
        ? new Date(enrollment.last_activity_at)
        : null

    const daysInactive =
      lastActivity
        ? Math.max(
            0,
            Math.floor(
              (Date.now() - lastActivity.getTime())
              / 86400000
            )
          )
        : 99

    const progress =
      Number(enrollment.progress || 0)

    let risk =
      (100 - progress) * 0.45 +
      (100 - (averageScore || 70)) * 0.35 +
      Math.min(daysInactive,10) * 4

    risk = Math.round(
      Math.min(
        100,
        Math.max(5,risk)
      )
    )

    const status =
      risk >= 75
        ? 'At risk'
        : risk >= 55
          ? 'Watch'
          : 'Active'

    const last =
      daysInactive === 0
        ? 'Today'
        : daysInactive === 1
          ? '1d ago'
          : daysInactive + 'd ago'

    const reason =
      daysInactive >= 5
        ? daysInactive +
          ' days inactive' +
          (
            averageScore && averageScore < 65
              ? ' · low quiz average'
              : ''
          )
        : (
            averageScore && averageScore < 65
              ? 'Low quiz average'
              : 'Healthy engagement'
          )

    const recommended =
      risk >= 75
        ? 'Teacher follow-up + revision plan'
        : risk >= 55
          ? 'Targeted revision'
          : 'Keep current plan'

    return {
      id: profile.id,
      name: profile.full_name,

      progress,

      score: averageScore || 0,

      risk,

      status,

      last,

      weak:
        weakTopics[0] ||
        'General review',

      reason,

      recommended,

      trend:
        risk >= 75
          ? '-12%'
          : risk >= 55
            ? '-5%'
            : '+5%'
    }

  }).sort(
    (a,b)=>b.risk-a.risk
  )
}

const nav = [`,
  'live Supabase loader'
);

/* =========================================
   3. Teacher Dashboard live student state
========================================= */

replaceRequired(
`  const [materialsLoading,setMaterialsLoading]=useState(true)

  useEffect(()=>{ loadMaterials() },[])`,
`  const [materialsLoading,setMaterialsLoading]=useState(true)

  const [liveStudents,setLiveStudents] =
    useState(fallbackStudents)

  const [studentDataLive,setStudentDataLive] =
    useState(false)

  useEffect(()=>{
    loadMaterials()
  },[])

  useEffect(()=>{

    fetchLiveStudents()
      .then(rows=>{

        if(rows.length){

          setLiveStudents(rows)

          setStudentDataLive(true)

        }

      })
      .catch(console.error)

  },[])`,
  'TeacherDashboard student state'
);

/* =========================================
   4. Make risk list live
========================================= */

replaceRequired(
`  const riskStudents=students.filter(s=>s.risk>=60).sort((a,b)=>b.risk-a.risk)`,
`  const riskStudents=
    liveStudents
      .filter(s=>s.risk>=55)
      .sort((a,b)=>b.risk-a.risk)`,
  'riskStudents'
);

/* =========================================
   5. Replace teacher top statistics
========================================= */

replaceRequired(
`    <div className="stats"><Stat icon={Users} value="128" label="Students" sub="+14 this month"/><Stat icon={BarChart3} value="74%" label="Avg. progress" sub="+6%"/><Stat icon={Target} value="81%" label="Avg. quiz score" sub="+3%"/><Stat icon={Bell} value="9" label="Need attention" sub="3 high priority"/></div>`,
`    <div className="stats">

      <Stat
        icon={Users}
        value={liveStudents.length}
        label="Students"
        sub={
          studentDataLive
            ? 'Live from Supabase'
            : 'Demo fallback'
        }
      />

      <Stat
        icon={BarChart3}
        value={
          Math.round(
            liveStudents.reduce(
              (total,x)=>total+x.progress,
              0
            )
            /
            Math.max(
              liveStudents.length,
              1
            )
          ) + '%'
        }
        label="Avg. progress"
        sub="Live cohort"
      />

      <Stat
        icon={Target}
        value={
          Math.round(
            liveStudents
              .filter(x=>x.score)
              .reduce(
                (total,x)=>total+x.score,
                0
              )
            /
            Math.max(
              liveStudents
                .filter(x=>x.score)
                .length,
              1
            )
          ) + '%'
        }
        label="Avg. quiz score"
        sub="From Supabase attempts"
      />

      <Stat
        icon={Bell}
        value={riskStudents.length}
        label="Need attention"
        sub="Calculated risk"
      />

    </div>`,
  'Teacher Dashboard stats'
);

/* =========================================
   6. Make compact student table live
========================================= */

replaceRequired(
  '<StudentTable compact/>',
  '<StudentTable compact rows={liveStudents}/>',
  'compact StudentTable'
);

/* =========================================
   7. StudentTable supports supplied data
========================================= */

replaceRequired(
`function StudentTable({compact=false}){
  const [selected,setSelected]=useState(null)
  const rows=compact?students.slice(0,5):students`,
`function StudentTable({
  compact=false,
  rows:sourceRows=fallbackStudents
}){
  const [selected,setSelected]=useState(null)

  const rows=
    compact
      ? sourceRows.slice(0,5)
      : sourceRows`,
  'StudentTable function'
);

/* =========================================
   8. Replace full Teacher Students page
========================================= */

const teacherStudentsRegex =
  /function TeacherStudents\(\)\{[\s\S]*?\n\}\nfunction StudentTableCustom/

if(!teacherStudentsRegex.test(s)){
  throw new Error(
    'Could not find TeacherStudents function'
  )
}

s = s.replace(
  teacherStudentsRegex,
`function TeacherStudents(){

  const [query,setQuery]=useState('')

  const [filter,setFilter]=useState('All')

  const [rows,setRows]=useState(
    fallbackStudents
  )

  const [live,setLive]=useState(false)

  useEffect(()=>{

    fetchLiveStudents()
      .then(data=>{

        if(data.length){

          setRows(data)

          setLive(true)

        }

      })
      .catch(console.error)

  },[])

  const filtered =
    rows.filter(student=>

      student.name
        .toLowerCase()
        .includes(
          query.toLowerCase()
        )

      &&

      (
        filter === 'All' ||
        student.status === filter
      )

    )

  const atRiskCount =
    rows.filter(
      student =>
        student.status === 'At risk'
    ).length

  const inactiveCount =
    rows.filter(
      student =>
        parseInt(student.last) >= 5
    ).length

  const lowScoreCount =
    rows.filter(
      student =>
        student.score &&
        student.score < 65
    ).length

  const plansSuggested =
    rows.filter(
      student =>
        student.risk >= 55
    ).length

  return <>

    <PageTitle
      title="Students"
      text={
        live
          ? 'Live student performance from Supabase.'
          : 'Student performance demo data.'
      }
    />

    <div className="toolbar">

      <div className="search">

        <Search size={17}/>

        <input
          value={query}
          onChange={
            e=>setQuery(e.target.value)
          }
          placeholder="Search student..."
        />

      </div>

      <div className="filter-pills">

        {
          [
            'All',
            'At risk',
            'Watch',
            'Active'
          ].map(x=>

            <button
              key={x}
              className={
                filter===x
                  ? 'active'
                  : ''
              }
              onClick={
                ()=>setFilter(x)
              }
            >
              {x}
            </button>

          )
        }

      </div>

      <Badge
        type={
          live
            ? 'green'
            : 'blue'
        }
      >

        {
          live
            ? 'Live data'
            : 'Demo data'
        }

      </Badge>

    </div>

    <div className="stats mini-stats">

      <Stat
        icon={CircleAlert}
        value={atRiskCount}
        label="At risk"
      />

      <Stat
        icon={Clock3}
        value={inactiveCount}
        label="Inactive 5+ days"
      />

      <Stat
        icon={Target}
        value={lowScoreCount}
        label="Score below 65%"
      />

      <Stat
        icon={Brain}
        value={plansSuggested}
        label="AI plans suggested"
      />

    </div>

    <StudentTableCustom
      rows={filtered}
    />

  </>

}

function StudentTableCustom`
);

/* =========================================
   9. Fix low-score automation key
========================================= */

replaceRequired(
`      } else if(k === 'low'){`,
`      } else if(k === 'quiz'){`,
  'low score automation key'
);

/* =========================================
   Save
========================================= */

fs.writeFileSync(
  path,
  s,
  'utf8'
);

console.log('');
console.log(
  'CourseAI V14 patch applied successfully.'
);
console.log(
  'Teacher student data is now connected to Supabase.'
);
console.log('');
