const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path,'utf8');

function mustReplace(oldText,newText,label){
  if(!s.includes(oldText)){
    throw new Error('Could not find: '+label);
  }
  s=s.replace(oldText,newText);
}

/* =========================================
   1. Make StudentDashboard reload when
      selected demo student changes
========================================= */

mustReplace(
`  useEffect(()=>{
    loadRevisionPlan()
    loadInactiveFollowup()
  },[])`,
`  useEffect(()=>{
    loadRevisionPlan()
    loadInactiveFollowup()
  },[data.student.full_name])`,
'student dashboard reload'
);

/* =========================================
   2. Make revision plan dynamic
========================================= */

mustReplace(
`.eq('student_name','Omar Mohamed')
      .eq('status','prepared')`,
`.eq('student_name',data.student.full_name)
      .eq('status','prepared')`,
'dynamic revision student'
);

mustReplace(
`          student_name:'Omar Mohamed',
          step_number:stepNumber,`,
`          student_name:data.student.full_name,
          step_number:stepNumber,`,
'dynamic revision progress student'
);

/* =========================================
   3. Add selected demo student state
========================================= */

mustReplace(
`  const [tutorPrompt,setTutorPrompt]=useState('')`,
`  const [tutorPrompt,setTutorPrompt]=useState('')
  const [demoStudentName,setDemoStudentName]=
    useState('Omar Mohamed')`,
'demo student state'
);

/* =========================================
   4. Build current student data
========================================= */

mustReplace(
`  const menu=mode==='student'?nav:teacherNav
  function render(){if(mode==='student'){return page==='dashboard'`,
`  const menu=mode==='student'?nav:teacherNav

  const studentData={
    ...data,
    student:{
      ...data.student,
      full_name:demoStudentName
    }
  }

  function render(){if(mode==='student'){return page==='dashboard'`,
'student data wrapper'
);

/* =========================================
   5. Pass selected student to dashboard
========================================= */

mustReplace(
`      data={data}
      setPage={setPage}`,
`      data={studentData}
      setPage={setPage}`,
'student dashboard data'
);

/* =========================================
   6. Add demo student selector in header
========================================= */

mustReplace(
`<div className="header-actions"><Bell size={18}/><div className="mode-switch">`,
`<div className="header-actions">

{mode==='student'&&
  <div className="student-demo-switch">
    <span>Viewing as</span>

    <select
      value={demoStudentName}
      onChange={e=>{
        setDemoStudentName(e.target.value)
        setPage('dashboard')
        setTutorPrompt('')
      }}
    >
      <option value="Omar Mohamed">
        Omar Mohamed
      </option>

      <option value="Adham Tarek">
        Adham Tarek
      </option>

      <option value="Youssef Karim">
        Youssef Karim
      </option>
    </select>
  </div>
}

<Bell size={18}/><div className="mode-switch">`,
'student demo selector'
);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log(
  'CourseAI V23 student demo switch added successfully.'
);
console.log('');
