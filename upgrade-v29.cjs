const fs=require('fs');

const path='./src/App.jsx';
let s=fs.readFileSync(path,'utf8');

/* Fix any overview badge logic still using old thresholds */
s=s.replaceAll(
  `selected.risk>=80?'danger':selected.risk>=60?'warn':'safe'`,
  `selected.risk>=70?'danger':selected.risk>=55?'warn':'safe'`
);

s=s.replaceAll(
  `s.risk>=80?'danger':s.risk>=60?'warn':'safe'`,
  `s.risk>=70?'danger':s.risk>=55?'warn':'safe'`
);

/* Find TeacherOverview */
const start=s.indexOf('function TeacherOverview');
const end=s.indexOf('function TeacherStudents',start);

if(start===-1 || end===-1){
  throw new Error('TeacherOverview block not found');
}

let block=s.slice(start,end);

/* Add inactive list next to at-risk list */
block=block.replace(
`const priorityStudents=students
      .filter(s=>s.risk>=70)`,
`const priorityStudents=students
      .filter(s=>s.risk>=70)

  const inactiveStudents=students
      .filter(s=>s.daysInactive>=5)`
);

/* Insert inactive section before end of overview */
const insertPoint=block.lastIndexOf('</>');

if(insertPoint===-1){
  throw new Error('Could not find TeacherOverview return end');
}

const inactiveSection=`

    <Card>
      <SectionHead
        eyebrow="ENGAGEMENT ALERT"
        title="Inactive students"
        icon={Clock3}
      />

      {inactiveStudents.length===0
        ? <p className="muted">
            No students inactive for 5+ days.
          </p>
        : inactiveStudents.map(student=>
            <div
              className="result-row"
              key={'inactive-'+student.id}
            >
              <div>
                <b>{student.name}</b>
                <span>
                  {student.daysInactive} days inactive · {student.weak}
                </span>
              </div>

              <Badge type={
                student.risk>=70
                  ? 'red'
                  : 'blue'
              }>
                {student.risk>=70
                  ? 'At risk'
                  : 'Inactive'}
              </Badge>
            </div>
          )
      }
    </Card>

`;

block=
  block.slice(0,insertPoint)+
  inactiveSection+
  block.slice(insertPoint);

s=
  s.slice(0,start)+
  block+
  s.slice(end);

fs.writeFileSync(path,s,'utf8');

console.log(
  'V29: separated At-Risk and Inactive priority queues.'
);
