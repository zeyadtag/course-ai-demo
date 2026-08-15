const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path,'utf8');

function mustReplace(oldText,newText,label){
  if(!s.includes(oldText)){
    throw new Error('Could not find: '+label);
  }
  s=s.replace(oldText,newText);
}

/* 1) Add teacher follow-up state */

mustReplace(
`  const [studentDataLive,setStudentDataLive] =
    useState(false)`,
`  const [studentDataLive,setStudentDataLive] =
    useState(false)

  const [inactiveFollowups,setInactiveFollowups] =
    useState([])`,
'teacher state'
);

/* 2) Load inactive followups */

mustReplace(
`  useEffect(()=>{
    loadMaterials()
  },[])`,
`  useEffect(()=>{
    loadMaterials()
    loadInactiveFollowups()
  },[])

  async function loadInactiveFollowups(){
    const {data,error}=await supabase
      .from('automation_runs')
      .select('id,student_name,weak_topic,generated_text,status,created_at')
      .eq('workflow_key','inactive_student_followup')
      .order('created_at',{ascending:false})
      .limit(10)

    if(error){
      console.error('Could not load inactive followups',error)
      return
    }

    setInactiveFollowups(data||[])
  }`,
'load followups'
);

/* 3) Insert panel after hero */

mustReplace(
`    <section className="hero teacher-hero"><div><div className="eyebrow"><Brain size={16}/> AI teacher command center</div><h1>Biology Mastery 2027</h1><p>Prioritize who needs help, why they are struggling, and what action to take next.</p></div><div className="hero-badge"><Bell/><div><b>{riskStudents.length} priority students</b><span>AI risk queue</span></div></div></section>`,
`    <section className="hero teacher-hero"><div><div className="eyebrow"><Brain size={16}/> AI teacher command center</div><h1>Biology Mastery 2027</h1><p>Prioritize who needs help, why they are struggling, and what action to take next.</p></div><div className="hero-badge"><Bell/><div><b>{riskStudents.length} priority students</b><span>AI risk queue</span></div></div></section>

    {inactiveFollowups.length>0&&
      <Card className="inactive-followups-card">
        <SectionHead
          eyebrow="AI automation"
          title="Inactive student follow-ups"
          icon={MessageCircle}
        />

        <div className="inactive-followup-list">
          {inactiveFollowups.map(item=>
            <div
              className="inactive-followup-item"
              key={item.id}
            >
              <div className="inactive-followup-head">
                <div>
                  <b>{item.student_name}</b>
                  <span>{item.weak_topic}</span>
                </div>

                <Badge type="green">
                  {item.status}
                </Badge>
              </div>

              <p>{item.generated_text}</p>
            </div>
          )}
        </div>
      </Card>
    }`,
'teacher followup panel'
);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log('CourseAI V22.1 teacher follow-up panel applied successfully.');
console.log('');
