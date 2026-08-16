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
   1. Tutor receives selected student
========================================= */

mustReplace(
`function Tutor({initialPrompt=''}){`,
`function Tutor({initialPrompt='',studentName='Student'}){`,
'Tutor function signature'
);

mustReplace(
`      text:'Hi Omar! Ask me anything from your Biology course. I can explain concepts, quiz you, or simplify a difficult topic.'`,
`      text:'Hi '+studentName.split(' ')[0]+'! Ask me anything from your Biology course. I can explain concepts, quiz you, or simplify a difficult topic.'`,
'Tutor greeting'
);

mustReplace(
`        body:JSON.stringify({question})`,
`        body:JSON.stringify({
          question,
          student_name:studentName
        })`,
'Tutor webhook body'
);

/* =========================================
   2. Quiz receives selected student
========================================= */

mustReplace(
`function Quizzes(){`,
`function Quizzes({studentName='Omar Mohamed'}){`,
'Quiz function signature'
);

/* =========================================
   3. Load attempts for selected student
========================================= */

mustReplace(
`  useEffect(()=>{
    loadAttempts()
  },[])`,
`  useEffect(()=>{
    setStarted(false)
    setAnswer('')
    setResult(null)
    setSaved(false)
    loadAttempts()
  },[studentName])`,
'Quiz effect'
);

mustReplace(
`    const {data:omar}=await supabase
      .from('profiles')
      .select('id')
      .eq('full_name','Omar Mohamed')
      .maybeSingle()

    if(!omar) return`,
`    const {data:student}=await supabase
      .from('profiles')
      .select('id')
      .eq('full_name',studentName)
      .eq('role','student')
      .maybeSingle()

    if(!student) return`,
'Quiz load student'
);

mustReplace(
`.eq('student_id',omar.id)`,
`.eq('student_id',student.id)`,
'Quiz attempt student query'
);

/* =========================================
   4. Save quiz for selected student
========================================= */

mustReplace(
`      const [{data:omar,error:studentError},{data:quiz,error:quizError}]=await Promise.all([
        supabase
          .from('profiles')
          .select('id')
          .eq('full_name','Omar Mohamed')
          .single(),`,
`      const [{data:student,error:studentError},{data:quiz,error:quizError}]=await Promise.all([
        supabase
          .from('profiles')
          .select('id')
          .eq('full_name',studentName)
          .eq('role','student')
          .single(),`,
'Quiz submit student'
);

mustReplace(
`          student_id:omar.id,`,
`          student_id:student.id,`,
'Quiz insert student'
);

mustReplace(
`                student_name:'Omar Mohamed',`,
`                student_name:studentName,`,
'Low score selected student'
);

/* =========================================
   5. Display selected student in Quiz page
========================================= */

mustReplace(
`      text="Adaptive checkpoints that feed your weak-topic analysis."`,
`      text={'Adaptive checkpoint for '+studentName+' that feeds the weak-topic analysis.'}`,
'Quiz page subtitle'
);

/* =========================================
   6. Pass selected student from App
========================================= */

mustReplace(
`: page==='tutor'
    ? <Tutor initialPrompt={tutorPrompt}/>
  : page==='quizzes'
    ? <Quizzes/>`,
`: page==='tutor'
    ? <Tutor
        initialPrompt={tutorPrompt}
        studentName={demoStudentName}
      />
  : page==='quizzes'
    ? <Quizzes
        studentName={demoStudentName}
      />`,
'App Tutor Quiz props'
);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log(
  'CourseAI V31 selected-student Tutor and Quiz applied successfully.'
);
console.log('');
