const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path, 'utf8');

function replaceRequired(oldText,newText,label){
  if(!s.includes(oldText)){
    throw new Error('Could not find: ' + label);
  }
  s=s.replace(oldText,newText);
}

/* 1) StudentDashboard receives tutor prompt setter */

replaceRequired(
`function StudentDashboard({data,setPage}){`,
`function StudentDashboard({data,setPage,setTutorPrompt}){`,
'StudentDashboard props'
);

/* 2) Revision-plan button sends topic to Tutor */

replaceRequired(
`            onClick={()=>setPage('tutor')}`,
`            onClick={()=>{
              setTutorPrompt(
                'Help me revise ' +
                revisionPlan.weak_topic +
                ' based on my latest revision plan.'
              )
              setPage('tutor')
            }}`,
'revision plan Tutor button'
);

/* 3) Tutor receives initial prompt */

replaceRequired(
`function Tutor(){
  const [messages,setMessages]=useState([
    {role:'ai',text:'Hi Omar! Ask me anything from your Biology course. I can explain concepts, quiz you, or simplify a difficult topic.'}
  ])
  const [q,setQ]=useState('')`,
`function Tutor({initialPrompt=''}){

  const [messages,setMessages]=useState([
    {
      role:'ai',
      text:'Hi Omar! Ask me anything from your Biology course. I can explain concepts, quiz you, or simplify a difficult topic.'
    }
  ])

  const [q,setQ]=useState(initialPrompt)

  useEffect(()=>{
    if(initialPrompt){
      setQ(initialPrompt)
    }
  },[initialPrompt])`,
'Tutor function'
);

/* 4) Add tutorPrompt state to main App */

replaceRequired(
`export default function App(){
  const [mode,setMode]=useState('student');const [page,setPage]=useState('dashboard');const [data,setData]=useState(fallback);const [loading,setLoading]=useState(true)`,
`export default function App(){
  const [mode,setMode]=useState('student')
  const [page,setPage]=useState('dashboard')
  const [data,setData]=useState(fallback)
  const [loading,setLoading]=useState(true)
  const [tutorPrompt,setTutorPrompt]=useState('')`,
'App state'
);

/* 5) Pass prompt between Dashboard and Tutor */

replaceRequired(
`return page==='dashboard'?<StudentDashboard data={data} setPage={setPage}/>:page==='courses'?<Courses data={data}/>:page==='tutor'?<Tutor/>:page==='quizzes'?<Quizzes/>`,
`return page==='dashboard'
  ? <StudentDashboard
      data={data}
      setPage={setPage}
      setTutorPrompt={setTutorPrompt}
    />
  : page==='courses'
    ? <Courses data={data}/>
  : page==='tutor'
    ? <Tutor initialPrompt={tutorPrompt}/>
  : page==='quizzes'
    ? <Quizzes/>`,
'student render routing'
);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log('CourseAI V18 contextual AI Tutor connected successfully.');
console.log('');
