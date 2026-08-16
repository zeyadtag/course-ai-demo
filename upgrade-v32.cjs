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
   1. Courses receives selected student
========================================= */

mustReplace(
`function Courses({data}){return <><PageTitle title="Courses" text="All lessons, progress and learning resources in one place."/><div className="course-banner"><div><Badge type="blue">{data.course.subject}</Badge><h2>{data.course.title}</h2><p>Instructor: {data.course.instructor_name}</p><Progress value={68}/></div><div className="course-score"><b>68%</b><span>completed</span></div></div><div className="lesson-list large">{data.lessons.map((l,i)=><Card className="lesson-card" key={l.id}><div className="lesson-num">{i+1}</div><div className="grow"><b>{l.title}</b><p>{l.summary}</p><span><Clock3 size={14}/> {l.duration_minutes} minutes</span></div><button className="primary"><PlayCircle size={17}/> Start lesson</button></Card>)}</div></>}`,
`function Courses({data,studentName='Omar Mohamed'}){

  const [progress,setProgress]=useState(0)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    loadProgress()
  },[studentName])

  async function loadProgress(){
    setLoading(true)

    const {data:student,error:studentError}=await supabase
      .from('profiles')
      .select('id')
      .eq('full_name',studentName)
      .eq('role','student')
      .maybeSingle()

    if(studentError || !student){
      if(studentError) console.error(studentError)
      setProgress(0)
      setLoading(false)
      return
    }

    const {data:enrollment,error}=await supabase
      .from('enrollments')
      .select('progress')
      .eq('student_id',student.id)
      .limit(1)
      .maybeSingle()

    if(error){
      console.error(error)
      setProgress(0)
      setLoading(false)
      return
    }

    setProgress(Number(enrollment?.progress||0))
    setLoading(false)
  }

  return <>
    <PageTitle
      title="Courses"
      text={'Course progress for '+studentName+'.'}
    />

    <div className="course-banner">
      <div>
        <Badge type="blue">
          {data.course.subject}
        </Badge>

        <h2>{data.course.title}</h2>

        <p>
          Instructor: {data.course.instructor_name}
        </p>

        <Progress value={progress}/>
      </div>

      <div className="course-score">
        <b>
          {loading?'...':progress+'%'}
        </b>
        <span>completed</span>
      </div>
    </div>

    <div className="lesson-list large">
      {data.lessons.map((l,i)=>
        <Card
          className="lesson-card"
          key={l.id}
        >
          <div className="lesson-num">
            {i+1}
          </div>

          <div className="grow">
            <b>{l.title}</b>
            <p>{l.summary}</p>
            <span>
              <Clock3 size={14}/>
              {' '}
              {l.duration_minutes} minutes
            </span>
          </div>

          <button className="primary">
            <PlayCircle size={17}/>
            Start lesson
          </button>
        </Card>
      )}
    </div>
  </>
}`,
'Courses live progress'
);

/* =========================================
   2. Pass selected student into Courses
========================================= */

mustReplace(
`: page==='courses'
    ? <Courses data={data}/>`,
`: page==='courses'
    ? <Courses
        data={data}
        studentName={demoStudentName}
      />`,
'Courses selected student prop'
);

fs.writeFileSync(path,s,'utf8');

console.log(
  'CourseAI V32 live course progress applied successfully.'
);
