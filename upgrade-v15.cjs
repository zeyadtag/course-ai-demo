const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path, 'utf8');

const oldQuiz = `function Quizzes(){const [started,setStarted]=useState(false);const [answer,setAnswer]=useState('');const [result,setResult]=useState(null);return <><PageTitle title="Quizzes" text="Adaptive checkpoints that feed your weak-topic analysis."/><div className="grid two"><Card><SectionHead eyebrow="Recommended" title="DNA Challenge" icon={Target}/><p className="muted">10 questions · Hard · AI recommends this because DNA is your weakest topic.</p>{!started?<button className="primary" onClick={()=>setStarted(true)}>Start adaptive quiz</button>:<><p className="question">Which organelle is primarily responsible for ATP production?</p>{['Nucleus','Mitochondrion','Ribosome','Golgi apparatus'].map(o=><label className={'option '+(answer===o?'selected':'')} key={o}><input type="radio" name="q" value={o} onChange={e=>setAnswer(e.target.value)}/>{o}</label>)}<button className="primary" onClick={()=>setResult(answer==='Mitochondrion')}>Check answer</button>{result!==null&&<div className={'feedback '+(result?'good':'bad')}>{result?'Correct. Mitochondria generate most cellular ATP.':'Try again. Focus on cellular respiration.'}</div>}</>}</Card><Card><SectionHead eyebrow="Performance" title="Recent attempts" icon={BarChart3}/>{[['Cell Biology Checkpoint',92,'Excellent'],['DNA Basics',71,'Needs review'],['Human Physiology',85,'Good']].map(r=><div className="result-row" key={r[0]}><div><b>{r[0]}</b><span>{r[2]}</span></div><strong>{r[1]}%</strong></div>)}</Card></div></>}`;

const newQuiz = `function Quizzes(){
  const [started,setStarted]=useState(false)
  const [answer,setAnswer]=useState('')
  const [result,setResult]=useState(null)
  const [saving,setSaving]=useState(false)
  const [saved,setSaved]=useState(false)
  const [attempts,setAttempts]=useState([])

  useEffect(()=>{
    loadAttempts()
  },[])

  async function loadAttempts(){
    const {data:omar}=await supabase
      .from('profiles')
      .select('id')
      .eq('full_name','Omar Mohamed')
      .maybeSingle()

    if(!omar) return

    const {data}=await supabase
      .from('quiz_attempts')
      .select('score,completed_at,quizzes(title)')
      .eq('student_id',omar.id)
      .order('completed_at',{ascending:false})
      .limit(5)

    setAttempts(data||[])
  }

  async function submitQuiz(){
    if(!answer || saving || saved) return

    const correct=answer==='Mitochondrion'
    const score=correct?100:0

    setResult(correct)
    setSaving(true)

    try{
      const [{data:omar,error:studentError},{data:quiz,error:quizError}]=await Promise.all([
        supabase
          .from('profiles')
          .select('id')
          .eq('full_name','Omar Mohamed')
          .single(),

        supabase
          .from('quizzes')
          .select('id')
          .eq('title','Cell Biology Checkpoint')
          .single()
      ])

      if(studentError) throw studentError
      if(quizError) throw quizError

      const {error}=await supabase
        .from('quiz_attempts')
        .insert({
          student_id:omar.id,
          quiz_id:quiz.id,
          score,
          answers:{
            question:'Which organelle is primarily responsible for ATP production?',
            answer
          },
          weak_topics:correct?[]:['Cell biology']
        })

      if(error) throw error

      setSaved(true)
      await loadAttempts()

    }catch(err){
      console.error(err)
      alert('Could not save quiz result to Supabase.')
    }finally{
      setSaving(false)
    }
  }

  return <>
    <PageTitle
      title="Quizzes"
      text="Adaptive checkpoints that feed your weak-topic analysis."
    />

    <div className="grid two">

      <Card>
        <SectionHead
          eyebrow="Live quiz"
          title="Cell Biology Checkpoint"
          icon={Target}
        />

        <p className="muted">
          This attempt is saved directly to Supabase and becomes visible in the Teacher Dashboard.
        </p>

        {!started
          ? <button
              className="primary"
              onClick={()=>setStarted(true)}
            >
              Start quiz
            </button>

          : <>
              <p className="question">
                Which organelle is primarily responsible for ATP production?
              </p>

              {[
                'Nucleus',
                'Mitochondrion',
                'Ribosome',
                'Golgi apparatus'
              ].map(option=>
                <label
                  className={'option '+(answer===option?'selected':'')}
                  key={option}
                >
                  <input
                    type="radio"
                    name="quiz-question"
                    value={option}
                    checked={answer===option}
                    disabled={saved}
                    onChange={e=>setAnswer(e.target.value)}
                  />
                  {option}
                </label>
              )}

              <button
                className="primary"
                disabled={!answer || saving || saved}
                onClick={submitQuiz}
              >
                {saving
                  ? 'Saving...'
                  : saved
                    ? 'Result saved'
                    : 'Submit answer'}
              </button>

              {result!==null &&
                <div className={'feedback '+(result?'good':'bad')}>
                  {result
                    ? 'Correct. Your score was saved to Supabase.'
                    : 'Incorrect. Your score and weak topic were saved to Supabase.'}
                </div>
              }
            </>
        }
      </Card>

      <Card>
        <SectionHead
          eyebrow="Live performance"
          title="Recent attempts"
          icon={BarChart3}
        />

        {attempts.length===0
          ? <p className="muted">
              No quiz attempts recorded yet.
            </p>

          : attempts.map((attempt,index)=>
              <div
                className="result-row"
                key={index}
              >
                <div>
                  <b>
                    {attempt.quizzes?.title || 'Quiz attempt'}
                  </b>
                  <span>
                    {new Date(attempt.completed_at).toLocaleDateString()}
                  </span>
                </div>

                <strong>
                  {Number(attempt.score)}%
                </strong>
              </div>
            )
        }

      </Card>

    </div>
  </>
}`;

if(!s.includes(oldQuiz)){
  throw new Error('Could not find current Quizzes function');
}

s=s.replace(oldQuiz,newQuiz);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log('CourseAI V15 quiz patch applied successfully.');
console.log('');
