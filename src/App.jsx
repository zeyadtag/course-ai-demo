import React, { useEffect, useMemo, useState } from 'react'
import {
  BookOpen, Brain, Trophy, Flame, BarChart3, Users, Target,
  PlayCircle, CheckCircle2, Clock3, Bell, Sparkles, GraduationCap,
  LayoutDashboard, MessageCircle, ListChecks, ChevronRight
} from 'lucide-react'
import { supabase } from './supabase'

const fallback = {
  student: { full_name: 'Omar Mohamed', points: 1280, streak: 12 },
  teacher: { full_name: 'Dr. Ahmed Hassan' },
  course: { title: 'Biology Mastery 2027', description: 'AI-powered biology learning experience', subject: 'Biology', instructor_name: 'Dr. Ahmed Hassan' },
  lessons: [
    { id:'l1', title:'Cell Structure & Function', summary:'Understand organelles and cell function', duration_minutes:42, position:1 },
    { id:'l2', title:'DNA & Gene Expression', summary:'From DNA structure to transcription and translation', duration_minutes:55, position:2 },
    { id:'l3', title:'Human Physiology', summary:'Circulation, respiration and homeostasis', duration_minutes:48, position:3 }
  ],
  plan: [
    { task:'Review DNA transcription', day:'Today', minutes:25 },
    { task:'Complete DNA Challenge quiz', day:'Today', minutes:15 },
    { task:'Watch Human Physiology lesson', day:'Tomorrow', minutes:48 },
    { task:'Revise weak topic: protein synthesis', day:'Tomorrow', minutes:20 }
  ]
}

function Stat({icon:Icon, value, label}) {
  return <div className="stat card"><div className="iconbox"><Icon size={20}/></div><div><strong>{value}</strong><span>{label}</span></div></div>
}

function Student({data}) {
  const [chat, setChat] = useState([])
  const [q, setQ] = useState('')
  const [quizOpen, setQuizOpen] = useState(false)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)

  function askAI(e){
    e.preventDefault()
    if(!q.trim()) return
    const reply = q.toLowerCase().includes('mitochond')
      ? 'Mitochondria produce most cellular ATP through oxidative phosphorylation. Think of them as the cell’s energy-conversion center.'
      : 'For this demo, the AI Tutor explains concepts from the current biology course and gives a concise, exam-focused answer.'
    setChat(c=>[...c,{q,reply}]); setQ('')
  }

  function submitQuiz(){
    setResult(answer==='Mitochondrion')
  }

  return <>
    <section className="hero">
      <div>
        <div className="eyebrow"><Sparkles size={16}/> Personalized learning dashboard</div>
        <h1>Welcome back, {data.student.full_name.split(' ')[0]} 👋</h1>
        <p>Keep your 12-day streak alive. Your AI study plan is ready.</p>
      </div>
      <div className="hero-badge"><Flame/><div><b>{data.student.streak} days</b><span>Study streak</span></div></div>
    </section>

    <div className="stats">
      <Stat icon={Target} value="68%" label="Course progress"/>
      <Stat icon={Trophy} value={data.student.points} label="XP points"/>
      <Stat icon={CheckCircle2} value="86%" label="Quiz average"/>
      <Stat icon={Clock3} value="3h 10m" label="This week"/>
    </div>

    <div className="grid two">
      <div className="card">
        <div className="section-head"><div><small>Continue learning</small><h2>{data.course.title}</h2></div><BookOpen/></div>
        <div className="progress"><i style={{width:'68%'}}></i></div>
        <p className="muted">68% complete · 3 lessons in this demo</p>
        <div className="lesson-list">
          {data.lessons.map((l,i)=><div className="lesson" key={l.id}>
            <div className="lesson-num">{i+1}</div>
            <div className="grow"><b>{l.title}</b><span>{l.summary}</span></div>
            <span className="duration">{l.duration_minutes} min</span>
            <PlayCircle size={20}/>
          </div>)}
        </div>
      </div>

      <div className="card ai-card">
        <div className="section-head"><div><small>AI Tutor</small><h2>Ask anything about Biology</h2></div><Brain/></div>
        <div className="chatbox">
          {chat.length===0 && <div className="empty-chat"><MessageCircle/><p>Try: “Why are mitochondria called the powerhouse of the cell?”</p></div>}
          {chat.map((m,i)=><div key={i} className="chat-item"><b>You</b><p>{m.q}</p><b className="ai">CourseAI</b><p>{m.reply}</p></div>)}
        </div>
        <form className="ask" onSubmit={askAI}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask your AI tutor..." />
          <button>Ask AI</button>
        </form>
      </div>
    </div>

    <div className="grid two">
      <div className="card">
        <div className="section-head"><div><small>AI generated</small><h2>Your study plan</h2></div><ListChecks/></div>
        {data.plan.map((t,i)=><div className="task" key={i}><div><b>{t.task}</b><span>{t.day} · {t.minutes} min</span></div><CheckCircle2 size={20}/></div>)}
      </div>

      <div className="card">
        <div className="section-head"><div><small>Checkpoint</small><h2>Cell Biology Quiz</h2></div><Target/></div>
        {!quizOpen ? <>
          <p>2 demo questions · Medium difficulty</p>
          <button className="primary" onClick={()=>setQuizOpen(true)}>Start quiz</button>
        </> : <>
          <p className="question">Which organelle is primarily responsible for ATP production?</p>
          {['Nucleus','Mitochondrion','Ribosome','Golgi apparatus'].map(o=>
            <label className={"option "+(answer===o?'selected':'')} key={o}>
              <input type="radio" name="q1" value={o} onChange={e=>setAnswer(e.target.value)}/>{o}
            </label>
          )}
          <button className="primary" onClick={submitQuiz}>Check answer</button>
          {result!==null && <div className={result?'feedback good':'feedback bad'}>
            {result ? 'Correct! Mitochondria generate most cellular ATP.' : 'Not quite. The correct answer is Mitochondrion.'}
          </div>}
        </>}
      </div>
    </div>
  </>
}

function Teacher({data}) {
  const rows = [
    ['Omar Mohamed','68%','86%','Active'],
    ['Sara Ali','82%','91%','Active'],
    ['Youssef Karim','41%','59%','At risk'],
    ['Mariam Ahmed','74%','84%','Active']
  ]
  return <>
    <section className="hero teacher-hero">
      <div><div className="eyebrow"><BarChart3 size={16}/> Teacher intelligence dashboard</div><h1>{data.course.title}</h1><p>AI-powered insights across student progress, engagement and weak topics.</p></div>
      <div className="hero-badge"><Users/><div><b>128 students</b><span>Demo cohort</span></div></div>
    </section>

    <div className="stats">
      <Stat icon={Users} value="128" label="Enrolled students"/>
      <Stat icon={BarChart3} value="74%" label="Avg. progress"/>
      <Stat icon={Target} value="81%" label="Avg. quiz score"/>
      <Stat icon={Bell} value="9" label="Need attention"/>
    </div>

    <div className="grid two">
      <div className="card">
        <div className="section-head"><div><small>AI Insight</small><h2>What needs attention</h2></div><Brain/></div>
        <div className="insight"><Sparkles/><div><b>DNA & Gene Expression is the weakest topic</b><p>37% of students missed questions related to transcription and translation. Consider assigning a short revision quiz.</p></div></div>
        <div className="insight"><Bell/><div><b>9 students are at risk of dropping behind</b><p>They have been inactive or have declining quiz performance.</p></div></div>
        <div className="insight"><Trophy/><div><b>Engagement is up 18%</b><p>Streaks and weekly challenges are improving return visits.</p></div></div>
      </div>

      <div className="card">
        <div className="section-head"><div><small>Course analytics</small><h2>Lesson performance</h2></div><BarChart3/></div>
        {[
          ['Cell Structure & Function',88],
          ['DNA & Gene Expression',63],
          ['Human Physiology',79]
        ].map(([name,v])=><div className="bar-row" key={name}><span>{name}</span><div className="bar"><i style={{width:v+'%'}}></i></div><b>{v}%</b></div>)}
      </div>
    </div>

    <div className="card">
      <div className="section-head"><div><small>Student intelligence</small><h2>Student performance</h2></div><Users/></div>
      <div className="table-wrap"><table><thead><tr><th>Student</th><th>Progress</th><th>Quiz avg.</th><th>Status</th><th></th></tr></thead>
      <tbody>{rows.map(r=><tr key={r[0]}>{r.map((x,i)=><td key={i}><span className={i===3 && x==='At risk'?'risk':''}>{x}</span></td>)}<td><ChevronRight size={18}/></td></tr>)}</tbody></table></div>
    </div>
  </>
}

export default function App(){
  const [mode,setMode]=useState('student')
  const [data,setData]=useState(fallback)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    (async()=>{
      try{
        const [{data:profiles},{data:courses},{data:lessons},{data:plans}] = await Promise.all([
          supabase.from('profiles').select('*'),
          supabase.from('courses').select('*').limit(1),
          supabase.from('lessons').select('*').order('position'),
          supabase.from('study_plans').select('*').limit(1)
        ])
        const student = profiles?.find(p=>p.role==='student') || fallback.student
        const teacher = profiles?.find(p=>p.role==='teacher') || fallback.teacher
        const course = courses?.[0] || fallback.course
        const plan = plans?.[0]?.tasks || fallback.plan
        setData({student,teacher,course,lessons:lessons?.length?lessons:fallback.lessons,plan})
      } catch(e){ console.warn(e) }
      setLoading(false)
    })()
  },[])

  return <div className="app">
    <aside>
      <div className="brand"><div className="logo"><GraduationCap/></div><div><b>CourseAI</b><span>Learning OS</span></div></div>
      <nav>
        <a className="active"><LayoutDashboard/> Dashboard</a>
        <a><BookOpen/> Courses</a>
        <a><Brain/> AI Tutor</a>
        <a><ListChecks/> Quizzes</a>
        <a><BarChart3/> Analytics</a>
        <a><Trophy/> Achievements</a>
      </nav>
      <div className="demo-note"><Sparkles/><div><b>Interactive demo</b><span>Supabase-connected prototype</span></div></div>
    </aside>
    <main>
      <header>
        <div><b>Biology Academy</b><span>{loading?'Syncing demo data...':'Live demo data connected'}</span></div>
        <div className="mode-switch">
          <button className={mode==='student'?'on':''} onClick={()=>setMode('student')}>Student</button>
          <button className={mode==='teacher'?'on':''} onClick={()=>setMode('teacher')}>Teacher</button>
        </div>
      </header>
      <div className="content">
        {mode==='student'?<Student data={data}/>:<Teacher data={data}/>}
      </div>
    </main>
  </div>
}
