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
   1. Add automatic at-risk runner
========================================= */

mustReplace(
`async function runInactiveStudentAutomations(students){`,
`async function runAtRiskStudentAutomations(students){

  const atRiskStudents=
    students.filter(
      student =>
        student.id &&
        student.risk >= 75
    )

  for(const student of atRiskStudents){

    try{

      const {data:existing,error:readError}=
        await supabase
          .from('at_risk_student_alerts')
          .select('id')
          .eq('student_id',student.id)
          .limit(1)
          .maybeSingle()

      if(readError){
        console.error(
          'At-risk alert check failed',
          readError
        )
        continue
      }

      if(existing){
        continue
      }

      const response=
        await fetch(
          'https://tag811.app.n8n.cloud/webhook/courseai-at-risk',
          {
            method:'POST',
            headers:{
              'Content-Type':'application/json'
            },
            body:JSON.stringify({
              student_name:student.name,
              risk_score:student.risk,
              weak_topic:student.weak,
              action_type:'AI intervention'
            })
          }
        )

      if(!response.ok){
        throw new Error(
          'At-risk webhook returned '+
          response.status
        )
      }

      const {error:insertError}=
        await supabase
          .from('at_risk_student_alerts')
          .insert({
            student_id:student.id,
            student_name:student.name,
            risk_score:student.risk,
            weak_topic:student.weak,
            status:'sent'
          })

      if(insertError){
        console.error(
          'Could not save at-risk alert',
          insertError
        )
        continue
      }

      console.log(
        'At-risk automation triggered:',
        student.name
      )

    }catch(error){

      console.error(
        'At-risk automation failed:',
        student.name,
        error
      )

    }

  }

}

async function runInactiveStudentAutomations(students){`,
'at-risk automation function'
);

/* =========================================
   2. Run from Teacher Overview
========================================= */

mustReplace(
`          runInactiveStudentAutomations(rows)`,
`          runInactiveStudentAutomations(rows)
          runAtRiskStudentAutomations(rows)`,
'TeacherDashboard at-risk scan'
);

/* =========================================
   3. Run from Teacher Students page
========================================= */

mustReplace(
`          runInactiveStudentAutomations(data)`,
`          runInactiveStudentAutomations(data)
          runAtRiskStudentAutomations(data)`,
'TeacherStudents at-risk scan'
);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log(
  'CourseAI V24 automatic at-risk workflow connected successfully.'
);
console.log('');
