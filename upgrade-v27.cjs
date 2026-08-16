const fs=require('fs');

const path='./src/App.jsx';
let s=fs.readFileSync(path,'utf8');

function mustReplace(oldText,newText,label){
  if(!s.includes(oldText)){
    throw new Error('Could not find: '+label);
  }
  s=s.replace(oldText,newText);
}

/* =========================================
   1. Unify At-Risk threshold with n8n = 70
========================================= */

s=s.replaceAll(
  `risk >= 75`,
  `risk >= 70`
);

/* =========================================
   2. Add live student metrics state
========================================= */

mustReplace(
`  const [notificationsLoading,setNotificationsLoading]=useState(false)`,
`  const [notificationsLoading,setNotificationsLoading]=useState(false)

  const [liveStudentStats,setLiveStudentStats]=useState({
    progress:0,
    quizAverage:0,
    weakTopic:'General review',
    points:0,
    streak:0
  })`,
'live student stats state'
);

/* =========================================
   3. Load real metrics for selected student
========================================= */

mustReplace(
`    loadAtRiskIntervention()
    loadStudentNotifications()`,
`    loadAtRiskIntervention()
    loadStudentNotifications()
    loadLiveStudentStats()`,
'live stats loader call'
);

mustReplace(
`  async function loadStudentNotifications(){`,
`  async function loadLiveStudentStats(){

    const {data:profile,error:profileError}=await supabase
      .from('profiles')
      .select('id,points,streak')
      .eq('full_name',data.student.full_name)
      .eq('role','student')
      .limit(1)
      .maybeSingle()

    if(profileError || !profile){
      if(profileError) console.error(profileError)
      return
    }

    const [
      {data:enrollment,error:enrollmentError},
      {data:attempts,error:attemptsError}
    ]=await Promise.all([

      supabase
        .from('enrollments')
        .select('progress')
        .eq('student_id',profile.id)
        .limit(1)
        .maybeSingle(),

      supabase
        .from('quiz_attempts')
        .select('score,weak_topics,completed_at')
        .eq('student_id',profile.id)
        .order('completed_at',{ascending:false})

    ])

    if(enrollmentError){
      console.error(enrollmentError)
    }

    if(attemptsError){
      console.error(attemptsError)
    }

    const rows=attempts||[]

    const quizAverage=
      rows.length
        ? Math.round(
            rows.reduce(
              (sum,row)=>sum+Number(row.score||0),
              0
            )/rows.length
          )
        : 0

    const weakTopic=
      rows.flatMap(
        row=>row.weak_topics||[]
      ).filter(Boolean)[0] || 'General review'

    setLiveStudentStats({
      progress:Number(enrollment?.progress||0),
      quizAverage,
      weakTopic,
      points:Number(profile.points||0),
      streak:Number(profile.streak||0)
    })
  }

  async function loadStudentNotifications(){`,
'live stats function'
);

/* =========================================
   4. Live streak in hero
========================================= */

mustReplace(
`<b>{data.student.streak} days</b><span>Study streak</span>`,
`<b>{liveStudentStats.streak} days</b><span>Study streak</span>`,
'student streak'
);

/* =========================================
   5. Replace hardcoded student stats
========================================= */

mustReplace(
`    <div className="stats"><Stat icon={Target} value="68%" label="Course progress" sub="+8% this week"/><Stat icon={Trophy} value={data.student.points} label="XP points" sub="Top 18%"/><Stat icon={CheckCircle2} value="86%" label="Quiz average" sub="+4% vs last week"/><Stat icon={Clock3} value="3h 10m" label="This week" sub="Goal: 4h"/></div>`,
`    <div className="stats">
      <Stat
        icon={Target}
        value={liveStudentStats.progress+'%'}
        label="Course progress"
        sub="Live from Supabase"
      />

      <Stat
        icon={Trophy}
        value={liveStudentStats.points}
        label="XP points"
        sub="Student profile"
      />

      <Stat
        icon={CheckCircle2}
        value={liveStudentStats.quizAverage+'%'}
        label="Quiz average"
        sub="All quiz attempts"
      />

      <Stat
        icon={Brain}
        value={liveStudentStats.weakTopic}
        label="Current weak topic"
        sub="AI learning signal"
      />
    </div>`,
'student live stats'
);

/* =========================================
   6. Live progress in course card
========================================= */

mustReplace(
`<Progress value={68}/><p className="muted">68% complete · 3 lessons in this demo</p>`,
`<Progress value={liveStudentStats.progress}/><p className="muted">{liveStudentStats.progress}% complete · {data.lessons.length} lessons available</p>`,
'live course progress'
);

/* =========================================
   7. Live weak topic card
========================================= */

mustReplace(
`<SectionHead eyebrow="Weak topic" title="DNA transcription" icon={CircleAlert}/><p className="muted">You missed 3 of the last 5 questions on transcription.</p>`,
`<SectionHead eyebrow="Weak topic" title={liveStudentStats.weakTopic} icon={CircleAlert}/><p className="muted">Based on your latest quiz performance and recorded weak topics.</p>`,
'live weak topic'
);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log(
  'CourseAI V27 live student metrics and risk consistency applied successfully.'
);
console.log('');
