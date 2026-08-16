const fs=require('fs');

const path='./src/App.jsx';
let s=fs.readFileSync(path,'utf8');

const start=s.indexOf('function Achievements(){');
const end=s.indexOf('function TeacherDashboard(){',start);

if(start===-1 || end===-1){
  throw new Error('Achievements block not found');
}

const replacement=`function Achievements({studentName='Omar Mohamed'}){

  const [stats,setStats]=useState({
    points:0,
    streak:0,
    progress:0,
    quizCount:0,
    highScores:0,
    bestScore:0
  })

  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    loadAchievements()
  },[studentName])

  async function loadAchievements(){
    setLoading(true)

    const {data:student,error:studentError}=await supabase
      .from('profiles')
      .select('id,points,streak')
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
      {data:attempts,error:attemptError}
    ]=await Promise.all([

      supabase
        .from('enrollments')
        .select('progress')
        .eq('student_id',student.id)
        .limit(1)
        .maybeSingle(),

      supabase
        .from('quiz_attempts')
        .select('score')
        .eq('student_id',student.id)

    ])

    if(enrollmentError) console.error(enrollmentError)
    if(attemptError) console.error(attemptError)

    const rows=attempts||[]

    const highScores=
      rows.filter(
        row=>Number(row.score||0)>=90
      ).length

    const bestScore=
      rows.length
        ? Math.max(
            ...rows.map(
              row=>Number(row.score||0)
            )
          )
        : 0

    setStats({
      points:Number(student.points||0),
      streak:Number(student.streak||0),
      progress:Number(enrollment?.progress||0),
      quizCount:rows.length,
      highScores,
      bestScore
    })

    setLoading(false)
  }

  const achievements=[
    {
      emoji:'🔥',
      title:'Study Streak',
      description:'Maintain a consistent learning streak.',
      value:loading
        ? '...'
        : stats.streak+' days',
      unlocked:stats.streak>=7
    },
    {
      emoji:'🏆',
      title:'Quiz Master',
      description:'Score 90%+ on 3 quizzes.',
      value:loading
        ? '...'
        : stats.highScores+' / 3',
      unlocked:stats.highScores>=3
    },
    {
      emoji:'🚀',
      title:'Course Explorer',
      description:'Reach at least 25% course progress.',
      value:loading
        ? '...'
        : stats.progress+'%',
      unlocked:stats.progress>=25
    },
    {
      emoji:'🎯',
      title:'High Scorer',
      description:'Reach a 90% best quiz score.',
      value:loading
        ? '...'
        : stats.bestScore+'%',
      unlocked:stats.bestScore>=90
    },
    {
      emoji:'⭐',
      title:'XP Builder',
      description:'Earn 1000 XP points.',
      value:loading
        ? '...'
        : stats.points+' XP',
      unlocked:stats.points>=1000
    }
  ]

  return <>
    <PageTitle
      title="Achievements"
      text={'Live milestones and learning progress for '+studentName+'.'}
    />

    <div className="stats">
      <Stat
        icon={Trophy}
        value={loading?'...':stats.points}
        label="XP points"
      />

      <Stat
        icon={Flame}
        value={loading?'...':stats.streak+'d'}
        label="Study streak"
      />

      <Stat
        icon={Target}
        value={loading?'...':stats.progress+'%'}
        label="Course progress"
      />

      <Stat
        icon={ListChecks}
        value={loading?'...':stats.quizCount}
        label="Quiz attempts"
      />
    </div>

    <div className="achievement-grid">
      {achievements.map(item=>
        <Card
          key={item.title}
          className="achievement"
        >
          <div className="emoji">
            {item.emoji}
          </div>

          <b>{item.title}</b>

          <p>{item.description}</p>

          <Badge type={
            item.unlocked
              ? 'green'
              : 'blue'
          }>
            {item.unlocked
              ? 'Unlocked · '+item.value
              : item.value}
          </Badge>
        </Card>
      )}
    </div>
  </>
}

`;

s=s.slice(0,start)+replacement+s.slice(end);

/* Pass selected student into Achievements */

const oldRender=
`: <Achievements/>`;

const newRender=
`: <Achievements
        studentName={demoStudentName}
      />`;

if(!s.includes(oldRender)){
  throw new Error(
    'Achievements render call not found'
  );
}

s=s.replace(oldRender,newRender);

fs.writeFileSync(path,s,'utf8');

console.log(
  'CourseAI V34 Live Achievements applied successfully.'
);
