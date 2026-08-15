const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path, 'utf8');

function replaceRequired(oldText,newText,label){
  if(!s.includes(oldText)){
    throw new Error('Could not find: ' + label);
  }
  s=s.replace(oldText,newText);
}

/* =========================================
   1. Expose daysInactive in student data
========================================= */

replaceRequired(
`      status,

      last,

      weak:`,
`      status,

      last,
      daysInactive,

      weak:`,
'daysInactive field'
);

/* =========================================
   2. Add automatic inactive-student runner
========================================= */

replaceRequired(
`const nav = [`,
`async function runInactiveStudentAutomations(students){

  const inactiveStudents=
    students.filter(
      student =>
        student.id &&
        student.daysInactive >= 5
    )

  for(const student of inactiveStudents){

    try{

      const {data:existing,error:readError}=
        await supabase
          .from('inactive_student_alerts')
          .select('id')
          .eq('student_id',student.id)
          .limit(1)
          .maybeSingle()

      if(readError){
        console.error(
          'Inactive alert check failed',
          readError
        )
        continue
      }

      if(existing){
        continue
      }

      const response=
        await fetch(
          'https://tag811.app.n8n.cloud/webhook/courseai-inactive-student',
          {
            method:'POST',
            headers:{
              'Content-Type':'application/json'
            },
            body:JSON.stringify({
              student_name:student.name,
              days_inactive:student.daysInactive,
              weak_topic:student.weak
            })
          }
        )

      if(!response.ok){
        throw new Error(
          'Inactive webhook returned ' +
          response.status
        )
      }

      const {error:insertError}=
        await supabase
          .from('inactive_student_alerts')
          .insert({
            student_id:student.id,
            student_name:student.name,
            days_inactive:student.daysInactive,
            status:'sent'
          })

      if(insertError){
        console.error(
          'Could not save inactive alert',
          insertError
        )
        continue
      }

      console.log(
        'Inactive automation triggered:',
        student.name
      )

    }catch(error){

      console.error(
        'Inactive student automation failed:',
        student.name,
        error
      )

    }

  }

}

const nav = [`,
'inactive automation function'
);

/* =========================================
   3. Run automatically from Teacher Overview
========================================= */

replaceRequired(
`        if(rows.length){

          setLiveStudents(rows)

          setStudentDataLive(true)

        }`,
`        if(rows.length){

          setLiveStudents(rows)

          setStudentDataLive(true)

          runInactiveStudentAutomations(rows)

        }`,
'TeacherDashboard automatic inactive scan'
);

/* =========================================
   4. Run automatically from Students page
========================================= */

replaceRequired(
`        if(data.length){

          setRows(data)

          setLive(true)

        }`,
`        if(data.length){

          setRows(data)

          setLive(true)

          runInactiveStudentAutomations(data)

        }`,
'TeacherStudents automatic inactive scan'
);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log('CourseAI V21 automatic inactive-student workflow connected successfully.');
console.log('');
