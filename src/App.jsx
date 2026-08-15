import React, { useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard, BookOpen, Brain, ListChecks, BarChart3, Trophy, Users,
  Bell, Sparkles, GraduationCap, PlayCircle, CheckCircle2, Clock3, Flame,
  Target, MessageCircle, Search, Megaphone, Zap, CalendarDays, ChevronRight,
  ShieldCheck, Bot, UserRoundCheck, CircleAlert, Send, Settings2, FileText, Upload
} from 'lucide-react'
import { supabase } from './supabase'

const fallback = {
  student:{full_name:'Omar Mohamed',points:1280,streak:12},
  teacher:{full_name:'Dr. Ahmed Hassan'},
  course:{title:'Biology Mastery 2027',subject:'Biology',instructor_name:'Dr. Ahmed Hassan'},
  lessons:[
    {id:'l1',title:'Cell Structure & Function',summary:'Understand organelles and how cell structure supports function.',duration_minutes:42,position:1},
    {id:'l2',title:'DNA & Gene Expression',summary:'From DNA structure to transcription and translation.',duration_minutes:55,position:2},
    {id:'l3',title:'Human Physiology',summary:'Circulation, respiration and homeostasis.',duration_minutes:48,position:3}
  ],
  plan:[
    {task:'Review DNA transcription',day:'Today',minutes:25},
    {task:'Complete DNA Challenge quiz',day:'Today',minutes:15},
    {task:'Watch Human Physiology lesson',day:'Tomorrow',minutes:48},
    {task:'Revise weak topic: protein synthesis',day:'Tomorrow',minutes:20}
  ]
}

const fallbackStudents = [
  {name:'Omar Mohamed',progress:68,score:86,status:'Active',last:'2h ago',risk:18,trend:'+6%',weak:'DNA transcription',reason:'Healthy engagement',recommended:'Keep current plan'},
  {name:'Sara Ali',progress:82,score:91,status:'Active',last:'35m ago',risk:8,trend:'+9%',weak:'Genetics',reason:'High engagement',recommended:'Advanced quiz'},
  {name:'Youssef Karim',progress:41,score:59,status:'At risk',last:'6d ago',risk:87,trend:'-14%',weak:'DNA & protein synthesis',reason:'6 days inactive · 3 low scores',recommended:'Send reminder + revision plan'},
  {name:'Mariam Ahmed',progress:74,score:84,status:'Active',last:'1d ago',risk:22,trend:'+3%',weak:'Human physiology',reason:'Stable performance',recommended:'Continue plan'},
  {name:'Adham Tarek',progress:37,score:62,status:'At risk',last:'8d ago',risk:92,trend:'-18%',weak:'Cell biology',reason:'8 days inactive · progress stalled',recommended:'Urgent teacher follow-up'},
  {name:'Laila Samir',progress:53,score:66,status:'Watch',last:'3d ago',risk:61,trend:'-7%',weak:'Genetics',reason:'Quiz accuracy declining',recommended:'Targeted 20-min revision'}
]

async function fetchLiveStudents(){
  const [
    {data:profiles,error:pErr},
    {data:enrollments,error:eErr},
    {data:attempts,error:aErr}
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,full_name,role')
      .eq('role','student'),

    supabase
      .from('enrollments')
      .select('student_id,progress,last_activity_at'),

    supabase
      .from('quiz_attempts')
      .select('student_id,score,weak_topics,completed_at')
  ])

  if(pErr || eErr || aErr){
    throw (pErr || eErr || aErr)
  }

  const enrollmentMap = new Map(
    (enrollments || []).map(e => [e.student_id,e])
  )

  const attemptMap = new Map()

  ;(attempts || []).forEach(a=>{
    const list = attemptMap.get(a.student_id) || []
    list.push(a)
    attemptMap.set(a.student_id,list)
  })

  return (profiles || []).map(profile=>{

    const enrollment =
      enrollmentMap.get(profile.id) || {}

    const studentAttempts =
      attemptMap.get(profile.id) || []

    const averageScore =
      studentAttempts.length
        ? Math.round(
            studentAttempts.reduce(
              (total,a)=>total + Number(a.score || 0),
              0
            ) / studentAttempts.length
          )
        : 0

    const weakTopics = [
      ...new Set(
        studentAttempts.flatMap(
          a => a.weak_topics || []
        )
      )
    ].filter(Boolean)

    const lastActivity =
      enrollment.last_activity_at
        ? new Date(enrollment.last_activity_at)
        : null

    const daysInactive =
      lastActivity
        ? Math.max(
            0,
            Math.floor(
              (Date.now() - lastActivity.getTime())
              / 86400000
            )
          )
        : 99

    const progress =
      Number(enrollment.progress || 0)

    let risk =
      (100 - progress) * 0.45 +
      (100 - (averageScore || 70)) * 0.35 +
      Math.min(daysInactive,10) * 4

    risk = Math.round(
      Math.min(
        100,
        Math.max(5,risk)
      )
    )

    const status =
      risk >= 75
        ? 'At risk'
        : risk >= 55
          ? 'Watch'
          : 'Active'

    const last =
      daysInactive === 0
        ? 'Today'
        : daysInactive === 1
          ? '1d ago'
          : daysInactive + 'd ago'

    const reason =
      daysInactive >= 5
        ? daysInactive +
          ' days inactive' +
          (
            averageScore && averageScore < 65
              ? ' · low quiz average'
              : ''
          )
        : (
            averageScore && averageScore < 65
              ? 'Low quiz average'
              : 'Healthy engagement'
          )

    const recommended =
      risk >= 75
        ? 'Teacher follow-up + revision plan'
        : risk >= 55
          ? 'Targeted revision'
          : 'Keep current plan'

    return {
      id: profile.id,
      name: profile.full_name,

      progress,

      score: averageScore || 0,

      risk,

      status,

      last,

      weak:
        weakTopics[0] ||
        'General review',

      reason,

      recommended,

      trend:
        risk >= 75
          ? '-12%'
          : risk >= 55
            ? '-5%'
            : '+5%'
    }

  }).sort(
    (a,b)=>b.risk-a.risk
  )
}

const nav = [
  ['dashboard','Dashboard',LayoutDashboard],['courses','Courses',BookOpen],['tutor','AI Tutor',Brain],
  ['quizzes','Quizzes',ListChecks],['analytics','Analytics',BarChart3],['achievements','Achievements',Trophy]
]
const teacherNav = [
  ['dashboard','Overview',LayoutDashboard],['students','Students',Users],['content','Content',BookOpen],
  ['analytics','Analytics',BarChart3],['automation','Automation',Zap],['announcements','Announcements',Megaphone]
]

function Card({children,className=''}){return <div className={'card '+className}>{children}</div>}
function SectionHead({eyebrow,title,icon:Icon}){return <div className="section-head"><div><small>{eyebrow}</small><h2>{title}</h2></div>{Icon&&<Icon/>}</div>}
function Stat({icon:Icon,value,label,sub}){return <Card className="stat"><div className="iconbox"><Icon size={20}/></div><div><strong>{value}</strong><span>{label}</span>{sub&&<em>{sub}</em>}</div></Card>}
function Progress({value}){return <div className="progress"><i style={{width:`${value}%`}}/></div>}
function Badge({children,type=''}){return <span className={'badge '+type}>{children}</span>}

function StudentDashboard({data,setPage,setTutorPrompt}){
  const [revisionPlan,setRevisionPlan]=useState(null)

  useEffect(()=>{
    loadRevisionPlan()
  },[])

  async function loadRevisionPlan(){
    const {data:plan,error}=await supabase
      .from('automation_runs')
      .select('id,workflow_key,student_name,weak_topic,generated_text,status,created_at')
      .eq('workflow_key','low_score_revision')
      .eq('student_name','Omar Mohamed')
      .eq('status','prepared')
      .order('created_at',{ascending:false})
      .limit(1)
      .maybeSingle()

    if(error){
      console.error(error)
      return
    }

    setRevisionPlan(plan||null)
  }

  return <>
    <section className="hero"><div><div className="eyebrow"><Sparkles size={16}/> Personalized learning dashboard</div><h1>Welcome back, {data.student.full_name.split(' ')[0]} 👋</h1><p>Your AI study plan adapts to your weak topics and recent quiz results.</p></div><div className="hero-badge"><Flame/><div><b>{data.student.streak} days</b><span>Study streak</span></div></div></section>
    <div className="stats"><Stat icon={Target} value="68%" label="Course progress" sub="+8% this week"/><Stat icon={Trophy} value={data.student.points} label="XP points" sub="Top 18%"/><Stat icon={CheckCircle2} value="86%" label="Quiz average" sub="+4% vs last week"/><Stat icon={Clock3} value="3h 10m" label="This week" sub="Goal: 4h"/></div>
    <div className="grid two"><Card><SectionHead eyebrow="Continue learning" title={data.course.title} icon={BookOpen}/><Progress value={68}/><p className="muted">68% complete · 3 lessons in this demo</p><div className="lesson-list">{data.lessons.map((l,i)=><button className="lesson" key={l.id} onClick={()=>setPage('courses')}><div className="lesson-num">{i+1}</div><div className="grow"><b>{l.title}</b><span>{l.summary}</span></div><span className="duration">{l.duration_minutes} min</span><PlayCircle size={20}/></button>)}</div></Card>
    <Card><SectionHead eyebrow="AI generated" title="Today's study plan" icon={ListChecks}/>{data.plan.map((t,i)=><div className="task" key={i}><div><b>{t.task}</b><span>{t.day} · {t.minutes} min</span></div><CheckCircle2 size={20}/></div>)}</Card></div>
    <div className="grid three"><Card><SectionHead eyebrow="Weak topic" title="DNA transcription" icon={CircleAlert}/><p className="muted">You missed 3 of the last 5 questions on transcription.</p><button className="primary" onClick={()=>setPage('tutor')}>Ask AI Tutor</button></Card><Card><SectionHead eyebrow="Next milestone" title="Quiz Master" icon={Trophy}/><p className="muted">Score 90%+ in two more quizzes to unlock 500 XP.</p><Progress value={67}/></Card><Card><SectionHead eyebrow="Upcoming" title="Weekly biology challenge" icon={CalendarDays}/><p className="muted">Saturday · 8:00 PM · 20 questions</p><Badge type="blue">Starts in 2 days</Badge></Card></div>

    {revisionPlan&&
      <Card className="revision-plan-card">
        <SectionHead
          eyebrow="AI intervention"
          title="Your new revision plan"
          icon={Brain}
        />

        <div className="revision-plan-head">
          <div>
            <span>Weak topic</span>
            <b>{revisionPlan.weak_topic}</b>
          </div>

          <Badge type="green">
            AI generated
          </Badge>
        </div>

        <pre className="revision-plan-text">
          {revisionPlan.generated_text}
        </pre>

        <div className="revision-plan-actions">
          <button
            className="primary"
            onClick={()=>{
              setTutorPrompt(
                'Help me revise ' +
                revisionPlan.weak_topic +
                ' based on my latest revision plan.'
              )
              setPage('tutor')
            }}
          >
            <Brain size={17}/>
            Ask AI Tutor about this topic
          </button>

          <span className="muted">
            Generated after your latest low-score quiz.
          </span>
        </div>
      </Card>
    }
  </>
}

function Courses({data}){return <><PageTitle title="Courses" text="All lessons, progress and learning resources in one place."/><div className="course-banner"><div><Badge type="blue">{data.course.subject}</Badge><h2>{data.course.title}</h2><p>Instructor: {data.course.instructor_name}</p><Progress value={68}/></div><div className="course-score"><b>68%</b><span>completed</span></div></div><div className="lesson-list large">{data.lessons.map((l,i)=><Card className="lesson-card" key={l.id}><div className="lesson-num">{i+1}</div><div className="grow"><b>{l.title}</b><p>{l.summary}</p><span><Clock3 size={14}/> {l.duration_minutes} minutes</span></div><button className="primary"><PlayCircle size={17}/> Start lesson</button></Card>)}</div></>}

function Tutor({initialPrompt=''}){

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
  },[initialPrompt])
  const [loading,setLoading]=useState(false)

  async function send(e){
    e.preventDefault()
    const question=q.trim()
    if(!question || loading) return

    setMessages(m=>[...m,{role:'user',text:question}])
    setQ('')
    setLoading(true)

    try{
      const res=await fetch('https://tag811.app.n8n.cloud/webhook/courseai-ai-tutor',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({question})
      })
      if(!res.ok) throw new Error(`AI Tutor webhook returned ${res.status}`)
      const data=await res.json()
      const answer=data.answer || 'The AI Tutor returned an empty response.'
      setMessages(m=>[...m,{role:'ai',text:answer}])
    }catch(err){
      console.error(err)
      setMessages(m=>[...m,{role:'ai',text:'I could not reach the AI Tutor right now. Please try again.'}])
    }finally{
      setLoading(false)
    }
  }

  return <>
    <PageTitle title="AI Tutor" text="Ask a real question and get a live Gemini response through n8n."/>
    <Card className="tutor-shell">
      <div className="tutor-top">
        <div className="avatar"><Brain/></div>
        <div><b>CourseAI Tutor</b><span>Biology Mastery 2027 · Gemini via n8n</span></div>
        <Badge type="green">Live AI</Badge>
      </div>

      <div className="messages">
        {messages.map((m,i)=><div key={i} className={'message '+m.role}>{m.text}</div>)}
        {loading&&<div className="message ai tutor-thinking"><Sparkles size={16}/> Thinking...</div>}
      </div>

      <form className="ask" onSubmit={send}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask a biology question..." disabled={loading}/>
        <button disabled={loading || !q.trim()}><Send size={17}/> {loading?'Thinking...':'Send'}</button>
      </form>

      <div className="chips">
        {['Explain transcription simply','Quiz me on cells','Make a 20-min revision plan'].map(x=>
          <button key={x} onClick={()=>setQ(x)} disabled={loading}>{x}</button>
        )}
      </div>
    </Card>
  </>
}

function Quizzes(){
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

      if(score < 65){
        try{
          await fetch(
            'https://tag811.app.n8n.cloud/webhook/courseai-low-score',
            {
              method:'POST',
              headers:{
                'Content-Type':'application/json'
              },
              body:JSON.stringify({
                student_name:'Omar Mohamed',
                score,
                weak_topic:'Cell biology'
              })
            }
          )
        }catch(automationError){
          console.error(
            'Low-score automation failed',
            automationError
          )
        }
      }

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
}

function StudentAnalytics(){return <><PageTitle title="Analytics" text="Your learning patterns, strengths and weak topics."/><div className="stats"><Stat icon={BarChart3} value="+12%" label="Progress growth"/><Stat icon={Target} value="86%" label="Accuracy"/><Stat icon={Clock3} value="6.4h" label="Study time / 30d"/><Stat icon={Flame} value="12" label="Current streak"/></div><div className="grid two"><Card><SectionHead eyebrow="Topic mastery" title="Where you stand" icon={Target}/>{[['Cell structure',91],['Human physiology',82],['DNA transcription',63],['Protein synthesis',69]].map(([n,v])=><div className="bar-row" key={n}><span>{n}</span><Progress value={v}/><b>{v}%</b></div>)}</Card><Card><SectionHead eyebrow="AI insight" title="Best next action" icon={Brain}/><div className="insight"><Sparkles/><div><b>Spend 25 minutes on DNA transcription today.</b><p>You are likely to gain the most score improvement by reviewing transcription before taking another hard quiz.</p></div></div><div className="insight"><Clock3/><div><b>Your best study window is 7–9 PM.</b><p>Your recent completion rate is highest during this period.</p></div></div></Card></div></>}

function Achievements(){return <><PageTitle title="Achievements" text="Streaks, XP and milestones designed to keep momentum high."/><div className="achievement-grid">{[['🔥','12 Day Streak','Study 12 days in a row','Unlocked'],['🏆','Quiz Master','Score 90%+ on 3 quizzes','2 / 3'],['🚀','Fast Starter','Complete your first module','Unlocked'],['🧠','DNA Specialist','Reach 85% mastery in DNA','63%'],['⭐','Top 10%','Reach top 10% of cohort','18%']].map(a=><Card key={a[1]} className="achievement"><div className="emoji">{a[0]}</div><b>{a[1]}</b><p>{a[2]}</p><Badge type={a[3]==='Unlocked'?'green':'blue'}>{a[3]}</Badge></Card>)}</div></>}

function TeacherDashboard(){
  const [materialTitle,setMaterialTitle]=useState('')
  const [materialFile,setMaterialFile]=useState(null)
  const [uploading,setUploading]=useState(false)
  const [uploadStatus,setUploadStatus]=useState(null)
  const [materials,setMaterials]=useState([])
  const [materialsLoading,setMaterialsLoading]=useState(true)

  const [liveStudents,setLiveStudents] =
    useState(fallbackStudents)

  const [studentDataLive,setStudentDataLive] =
    useState(false)

  useEffect(()=>{
    loadMaterials()
  },[])

  useEffect(()=>{

    fetchLiveStudents()
      .then(rows=>{

        if(rows.length){

          setLiveStudents(rows)

          setStudentDataLive(true)

        }

      })
      .catch(console.error)

  },[])

  async function loadMaterials(){
    setMaterialsLoading(true)
    const {data,error}=await supabase
      .from('course_materials')
      .select('id,title,subject,source_name,is_active,created_at')
      .order('created_at',{ascending:false})
    if(!error) setMaterials(data||[])
    else console.error(error)
    setMaterialsLoading(false)
  }

  async function toggleMaterial(material){
    const {error}=await supabase
      .from('course_materials')
      .update({is_active:!material.is_active,updated_at:new Date().toISOString()})
      .eq('id',material.id)
    if(error){
      console.error(error)
      setUploadStatus({type:'error',message:'Could not update this material.'})
      return
    }
    setMaterials(x=>x.map(m=>m.id===material.id?{...m,is_active:!m.is_active}:m))
  }

  async function deleteMaterial(id){
    const {error}=await supabase.from('course_materials').delete().eq('id',id)
    if(error){
      console.error(error)
      setUploadStatus({type:'error',message:'Could not delete this material.'})
      return
    }
    setMaterials(x=>x.filter(m=>m.id!==id))
  }

  async function uploadMaterial(e){
    e.preventDefault()
    if(!materialFile) return
    setUploading(true); setUploadStatus(null)
    try{
      const form=new FormData()
      form.append('file',materialFile)
      form.append('title',materialTitle.trim() || materialFile.name.replace(/\.pdf$/i,''))
      form.append('subject','Biology')
      const res=await fetch('https://tag811.app.n8n.cloud/webhook/courseai-upload-material',{method:'POST',body:form})
      const result=await res.json().catch(()=>({}))
      if(!res.ok || result.success===false) throw new Error(result.message || `Upload returned ${res.status}`)
      setUploadStatus({type:'success',message:'Course material uploaded. AI Tutor can now use it.'})
      setMaterialTitle(''); setMaterialFile(null); e.target.reset()
      loadMaterials()
    }catch(err){
      console.error(err)
      setUploadStatus({type:'error',message:'Upload failed. Please try again.'})
    }finally{ setUploading(false) }
  }

  const [action,setAction]=useState(null)
  const riskStudents=
    liveStudents
      .filter(s=>s.risk>=55)
      .sort((a,b)=>b.risk-a.risk)
  function runAction(student,type){setAction({student,type})}
  return <>
    <section className="hero teacher-hero"><div><div className="eyebrow"><Brain size={16}/> AI teacher command center</div><h1>Biology Mastery 2027</h1><p>Prioritize who needs help, why they are struggling, and what action to take next.</p></div><div className="hero-badge"><Bell/><div><b>{riskStudents.length} priority students</b><span>AI risk queue</span></div></div></section>
    <Card className="material-upload-card"><SectionHead eyebrow="Course Knowledge" title="Upload Course Material" icon={Upload}/><p className="muted">Upload a PDF and CourseAI will extract its text through n8n, save it to Supabase, and make it available to the AI Tutor.</p><form className="material-upload-form" onSubmit={uploadMaterial}><input type="text" value={materialTitle} onChange={e=>setMaterialTitle(e.target.value)} placeholder="Material title (optional)" disabled={uploading}/><label className="file-picker"><Upload size={18}/><span>{materialFile?materialFile.name:'Choose PDF'}</span><input type="file" accept="application/pdf,.pdf" onChange={e=>setMaterialFile(e.target.files?.[0]||null)} disabled={uploading}/></label><button className="primary" disabled={uploading||!materialFile}><Upload size={17}/> {uploading?'Uploading...':'Upload material'}</button></form>{uploadStatus&&<div className={'material-upload-status '+uploadStatus.type}>{uploadStatus.message}</div>}</Card>
    <Card className="materials-library-card">
      <SectionHead eyebrow="Knowledge Library" title="Uploaded Materials" icon={FileText}/>
      <p className="muted">Active materials are available to the AI Tutor. Disable a file to exclude it without deleting it.</p>
      {materialsLoading?<p className="muted">Loading materials...</p>:
        <div className="materials-library">
          {materials.length===0?<div className="empty-state">No course materials uploaded yet.</div>:
            materials.map(m=><div className="material-row" key={m.id}>
              <div className="material-icon"><FileText size={18}/></div>
              <div className="grow">
                <b>{m.title}</b>
                <span>{m.source_name||'Course material'} · {m.subject||'Biology'}</span>
              </div>
              <Badge type={m.is_active?'green':'blue'}>{m.is_active?'Active':'Disabled'}</Badge>
              <button className="secondary small" onClick={()=>toggleMaterial(m)}>
                {m.is_active?'Disable':'Enable'}
              </button>
              <button className="danger small" onClick={()=>deleteMaterial(m.id)}>Delete</button>
            </div>)
          }
        </div>}
    </Card>
    {action&&<TeacherActionModal student={action.student} type={action.type} onClose={()=>setAction(null)}/>}
    <div className="stats">

      <Stat
        icon={Users}
        value={liveStudents.length}
        label="Students"
        sub={
          studentDataLive
            ? 'Live from Supabase'
            : 'Demo fallback'
        }
      />

      <Stat
        icon={BarChart3}
        value={
          Math.round(
            liveStudents.reduce(
              (total,x)=>total+x.progress,
              0
            )
            /
            Math.max(
              liveStudents.length,
              1
            )
          ) + '%'
        }
        label="Avg. progress"
        sub="Live cohort"
      />

      <Stat
        icon={Target}
        value={
          Math.round(
            liveStudents
              .filter(x=>x.score)
              .reduce(
                (total,x)=>total+x.score,
                0
              )
            /
            Math.max(
              liveStudents
                .filter(x=>x.score)
                .length,
              1
            )
          ) + '%'
        }
        label="Avg. quiz score"
        sub="From Supabase attempts"
      />

      <Stat
        icon={Bell}
        value={riskStudents.length}
        label="Need attention"
        sub="Calculated risk"
      />

    </div>
    <div className="grid teacher-main-grid">
      <Card><SectionHead eyebrow="Priority queue" title="At-risk students" icon={CircleAlert}/><div className="risk-list">{riskStudents.map(s=><div className="risk-card" key={s.name}><div className="risk-score"><strong>{s.risk}</strong><span>risk</span></div><div className="grow"><div className="risk-title"><b>{s.name}</b><Badge type={s.risk>=80?'red':'blue'}>{s.risk>=80?'High risk':'Watch'}</Badge></div><p>{s.reason}</p><div className="risk-meta"><span>Weak: {s.weak}</span><span>Last active: {s.last}</span><span className="down">Trend {s.trend}</span></div><div className="suggestion"><Sparkles size={15}/><span><b>AI suggestion:</b> {s.recommended}</span></div><div className="risk-actions"><button className="primary small" onClick={()=>runAction(s,'Reminder')}><Send size={15}/> Prepare reminder</button><button className="secondary small" onClick={()=>runAction(s,'Revision plan')}><Brain size={15}/> AI study plan</button></div></div></div>)}</div></Card>
      <div className="stack"><Card><SectionHead eyebrow="AI insights" title="What changed this week" icon={Brain}/><TeacherInsights/></Card><Card><SectionHead eyebrow="Cohort health" title="Risk distribution" icon={ShieldCheck}/><div className="health-row"><div><strong>79%</strong><span>On track</span></div><div><strong>14%</strong><span>Watch</span></div><div><strong>7%</strong><span>High risk</span></div></div><Progress value={79}/><p className="muted">Most risk is driven by inactivity and repeated low quiz scores.</p></Card></div>
    </div>
    <div className="grid two"><Card><SectionHead eyebrow="Lesson performance" title="Mastery by topic" icon={BarChart3}/>{[['Cell Structure & Function',88],['DNA & Gene Expression',63],['Human Physiology',79],['Genetics',71]].map(([n,v])=><div className="bar-row" key={n}><span>{n}</span><Progress value={v}/><b>{v}%</b></div>)}</Card><Card><SectionHead eyebrow="Automation preview" title="Recommended teacher actions" icon={Zap}/>{[['Send inactivity reminders','5 students','Ready'],['Generate DNA revision plans','12 students','Suggested'],['Celebrate high performers','18 students','Ready']].map(x=><div className="result-row" key={x[0]}><div><b>{x[0]}</b><span>{x[1]}</span></div><Badge type="blue">{x[2]}</Badge></div>)}</Card></div>
    <StudentTable compact rows={liveStudents}/>
  </>
}
function TeacherActionModal({student,type,onClose}){
  const isPlan=type==='Revision plan'
  const defaultText=isPlan
    ? `AI revision plan for ${student.name}\n\nFocus topic: ${student.weak}\nReason: ${student.reason}\n\n1. 10 min concept review\n2. 10 min targeted practice\n3. 5 min mini-quiz\n4. Recheck weak questions tomorrow\n\nGoal: recover consistency and raise the next quiz score above 75%.`
    : `Hi ${student.name}, we noticed you may be falling behind in ${student.weak}. Your recent activity shows: ${student.reason}.\n\nWe prepared a short revision plan to help you get back on track. Open the platform today and complete the recommended session. If you need help, use the AI Tutor or contact your teacher.`
  const [text,setText]=useState(defaultText)
  const [sent,setSent]=useState(false)
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div className="action-modal">
      <div className="detail-head"><div><small>{isPlan?'AI GENERATED PLAN':'SMART FOLLOW-UP'}</small><h3>{isPlan?'Revision plan':'Student reminder'} · {student.name}</h3></div><button className="icon-btn" onClick={onClose}>×</button></div>
      <div className="action-summary"><div><span>Risk score</span><b>{student.risk}</b></div><div><span>Weak topic</span><b>{student.weak}</b></div><div><span>Last active</span><b>{student.last}</b></div></div>
      <label className="editor-label">Review before sending</label>
      <textarea className="action-editor" value={text} onChange={e=>setText(e.target.value)}/>
      <div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" onClick={()=>setSent(true)}>{isPlan?<ListChecks size={17}/>:<Send size={17}/>} {isPlan?'Assign demo plan':'Send demo reminder'}</button></div>
      {sent&&<div className="feedback good action-success"><CheckCircle2 size={17}/> Demo action completed. This is where n8n / WhatsApp / email will connect later.</div>}
    </div>
  </div>
}

function TeacherInsights(){return <>{[['DNA & Gene Expression is the weakest topic','37% of students missed transcription/translation questions.'],['9 students are at risk of dropping behind','Low activity or declining quiz performance detected.'],['Engagement is up 18%','Streaks and weekly challenges are improving return visits.']].map((x,i)=><div className="insight" key={x[0]}>{i===0?<CircleAlert/>:i===1?<Bell/>:<Trophy/>}<div><b>{x[0]}</b><p>{x[1]}</p></div></div>)}</>}
function StudentTable({
  compact=false,
  rows:sourceRows=fallbackStudents
}){
  const [selected,setSelected]=useState(null)

  const rows=
    compact
      ? sourceRows.slice(0,5)
      : sourceRows
  return <Card><SectionHead eyebrow="Student intelligence" title={compact?'Student performance':'All students'} icon={Users}/><div className="table-wrap"><table><thead><tr><th>Student</th><th>Progress</th><th>Quiz avg.</th><th>Risk</th><th>Last active</th><th>Status</th><th></th></tr></thead><tbody>{rows.map(s=><tr key={s.name} className="click-row" onClick={()=>setSelected(s)}><td><b>{s.name}</b></td><td>{s.progress}%</td><td>{s.score}%</td><td><span className={'risk-number '+(s.risk>=80?'danger':s.risk>=60?'warn':'safe')}>{s.risk}</span></td><td>{s.last}</td><td><Badge type={s.status==='At risk'?'red':s.status==='Watch'?'blue':'green'}>{s.status}</Badge></td><td><ChevronRight size={18}/></td></tr>)}</tbody></table></div>{selected&&<div className="student-detail"><div className="detail-head"><div><small>STUDENT PROFILE</small><h3>{selected.name}</h3></div><button className="icon-btn" onClick={()=>setSelected(null)}>×</button></div><div className="detail-stats"><div><b>{selected.progress}%</b><span>Progress</span></div><div><b>{selected.score}%</b><span>Quiz avg.</span></div><div><b>{selected.risk}</b><span>Risk score</span></div><div><b>{selected.trend}</b><span>Trend</span></div></div><div className="detail-note"><CircleAlert size={17}/><div><b>Why flagged</b><p>{selected.reason}</p></div></div><div className="detail-note"><Brain size={17}/><div><b>Recommended action</b><p>{selected.recommended}</p></div></div></div>}</Card>
}
function TeacherStudents(){

  const [query,setQuery]=useState('')

  const [filter,setFilter]=useState('All')

  const [rows,setRows]=useState(
    fallbackStudents
  )

  const [live,setLive]=useState(false)

  useEffect(()=>{

    fetchLiveStudents()
      .then(data=>{

        if(data.length){

          setRows(data)

          setLive(true)

        }

      })
      .catch(console.error)

  },[])

  const filtered =
    rows.filter(student=>

      student.name
        .toLowerCase()
        .includes(
          query.toLowerCase()
        )

      &&

      (
        filter === 'All' ||
        student.status === filter
      )

    )

  const atRiskCount =
    rows.filter(
      student =>
        student.status === 'At risk'
    ).length

  const inactiveCount =
    rows.filter(
      student =>
        parseInt(student.last) >= 5
    ).length

  const lowScoreCount =
    rows.filter(
      student =>
        student.score &&
        student.score < 65
    ).length

  const plansSuggested =
    rows.filter(
      student =>
        student.risk >= 55
    ).length

  return <>

    <PageTitle
      title="Students"
      text={
        live
          ? 'Live student performance from Supabase.'
          : 'Student performance demo data.'
      }
    />

    <div className="toolbar">

      <div className="search">

        <Search size={17}/>

        <input
          value={query}
          onChange={
            e=>setQuery(e.target.value)
          }
          placeholder="Search student..."
        />

      </div>

      <div className="filter-pills">

        {
          [
            'All',
            'At risk',
            'Watch',
            'Active'
          ].map(x=>

            <button
              key={x}
              className={
                filter===x
                  ? 'active'
                  : ''
              }
              onClick={
                ()=>setFilter(x)
              }
            >
              {x}
            </button>

          )
        }

      </div>

      <Badge
        type={
          live
            ? 'green'
            : 'blue'
        }
      >

        {
          live
            ? 'Live data'
            : 'Demo data'
        }

      </Badge>

    </div>

    <div className="stats mini-stats">

      <Stat
        icon={CircleAlert}
        value={atRiskCount}
        label="At risk"
      />

      <Stat
        icon={Clock3}
        value={inactiveCount}
        label="Inactive 5+ days"
      />

      <Stat
        icon={Target}
        value={lowScoreCount}
        label="Score below 65%"
      />

      <Stat
        icon={Brain}
        value={plansSuggested}
        label="AI plans suggested"
      />

    </div>

    <StudentTableCustom
      rows={filtered}
    />

  </>

}

function StudentTableCustom({rows}){
  const [selected,setSelected]=useState(null)
  const [action,setAction]=useState(null)
  return <Card>
    <div className="table-wrap"><table><thead><tr><th>Student</th><th>Progress</th><th>Quiz avg.</th><th>Risk</th><th>Weak topic</th><th>Last active</th><th>Status</th></tr></thead><tbody>{rows.map(s=><tr key={s.name} className="click-row" onClick={()=>setSelected(s)}><td><b>{s.name}</b></td><td><div className="inline-progress"><Progress value={s.progress}/><span>{s.progress}%</span></div></td><td>{s.score}%</td><td><span className={'risk-number '+(s.risk>=80?'danger':s.risk>=60?'warn':'safe')}>{s.risk}</span></td><td>{s.weak}</td><td>{s.last}</td><td><Badge type={s.status==='At risk'?'red':s.status==='Watch'?'blue':'green'}>{s.status}</Badge></td></tr>)}</tbody></table></div>
    {selected&&<div className="student-detail"><div className="detail-head"><div><small>AI RISK REVIEW</small><h3>{selected.name}</h3></div><button className="icon-btn" onClick={()=>setSelected(null)}>×</button></div><div className="detail-stats"><div><b>{selected.progress}%</b><span>Progress</span></div><div><b>{selected.score}%</b><span>Quiz avg.</span></div><div><b>{selected.risk}</b><span>Risk score</span></div><div><b>{selected.trend}</b><span>Trend</span></div></div><div className="detail-note"><CircleAlert size={17}/><div><b>Detected issue</b><p>{selected.reason}</p></div></div><div className="detail-note"><Brain size={17}/><div><b>Suggested intervention</b><p>{selected.recommended}</p></div></div><div className="risk-actions"><button className="primary small" onClick={()=>setAction({student:selected,type:'Reminder'})}><Send size={15}/> Prepare message</button><button className="secondary small" onClick={()=>setAction({student:selected,type:'Revision plan'})}><ListChecks size={15}/> Generate plan</button></div></div>}
    {action&&<TeacherActionModal student={action.student} type={action.type} onClose={()=>setAction(null)}/>} 
  </Card>
}
function TeacherContent({data}){return <><PageTitle title="Content" text="Course modules, lessons, quizzes and resources."/><div className="toolbar"><span>{data.lessons.length} lessons</span><button className="primary"><BookOpen size={17}/> New lesson</button></div><div className="lesson-list large">{data.lessons.map((l,i)=><Card className="lesson-card" key={l.id}><div className="lesson-num">{i+1}</div><div className="grow"><b>{l.title}</b><p>{l.summary}</p><span><Clock3 size={14}/> {l.duration_minutes} min · Published</span></div><Badge type="green">Live</Badge><button className="icon-btn"><Settings2/></button></Card>)}</div></>}
function TeacherAnalytics(){return <><PageTitle title="Analytics" text="Cohort performance and AI-generated teaching insights."/><div className="stats"><Stat icon={Users} value="128" label="Students"/><Stat icon={Target} value="81%" label="Avg score"/><Stat icon={Clock3} value="4.2h" label="Avg weekly study"/><Stat icon={Flame} value="67%" label="Weekly active"/></div><div className="grid two"><Card><SectionHead eyebrow="Performance" title="Topic mastery" icon={BarChart3}/>{[['Cells',88],['DNA',63],['Physiology',79],['Genetics',71]].map(([n,v])=><div className="bar-row" key={n}><span>{n}</span><Progress value={v}/><b>{v}%</b></div>)}</Card><Card><SectionHead eyebrow="AI commentary" title="This week" icon={Brain}/><TeacherInsights/></Card></div></>}
function Automation(){
  const [toggles,setToggles]=useState({risk:true,inactive:true,quiz:true,weekly:true})
  const [log,setLog]=useState([
    {time:'2 min ago',title:'At-risk scan completed',detail:'3 priority students identified',status:'Success'},
    {time:'18 min ago',title:'Revision plan prepared',detail:'Youssef Karim · DNA & protein synthesis',status:'Success'},
    {time:'1h ago',title:'Inactive student reminder queued',detail:'Adham Tarek · 8 days inactive',status:'Queued'},
    {time:'Yesterday',title:'Weekly teacher report generated',detail:'128 students analyzed',status:'Success'}
  ])
  const [running,setRunning]=useState('')
  const [automationStatus,setAutomationStatus]=useState(null)
  const items=[
    ['risk','At-risk student alert','Detect low engagement or declining scores.',Bell,'3 students','2 min ago'],
    ['inactive','Inactive student follow-up','Prepare a reminder after 5 days of inactivity.',MessageCircle,'5 students','18 min ago'],
    ['quiz','Low-score revision plan','Generate a revision plan when score is below 65%.',Brain,'12 students','1h ago'],
    ['weekly','Weekly teacher report','Summarize weak topics, growth and intervention needs.',FileText,'128 students','Yesterday']
  ]
  async function runNow(k,title){
    setRunning(k)
    setAutomationStatus({type:'running',message:`Running ${title}...`})
    try {
      if(k === 'risk'){
        const res = await fetch('https://tag811.app.n8n.cloud/webhook/courseai-at-risk',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            student_name:'Adham Tarek',
            risk_score:92,
            weak_topic:'Cell Biology',
            action_type:'Reminder'
          })
        })
        if(!res.ok) throw new Error(`Webhook returned ${res.status}`)
        setLog(x=>[{time:'Just now',title:'At-risk automation ran via n8n',detail:'Adham Tarek · Reminder prepared and saved to Supabase',status:'Success'},...x])
        setAutomationStatus({type:'success',message:'n8n automation completed successfully · Saved to Supabase'})
      } else if(k === 'quiz'){
        const res = await fetch('https://tag811.app.n8n.cloud/webhook/courseai-low-score',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            student_name:'Mariam Ali',
            score:52,
            weak_topic:'Genetics'
          })
        })
        if(!res.ok) throw new Error(`Webhook returned ${res.status}`)
        setLog(x=>[{time:'Just now',title:'Low-score revision plan ran via n8n',detail:'Mariam Ali · 52% · Genetics · Revision plan saved to Supabase',status:'Success'},...x])
        setAutomationStatus({type:'success',message:'Revision plan generated by n8n · Saved to Supabase'})
      } else if(k === 'inactive'){
        const res = await fetch('https://tag811.app.n8n.cloud/webhook/courseai-inactive-student',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            student_name:'Adham Tarek',
            days_inactive:8,
            weak_topic:'Cell Biology'
          })
        })
        if(!res.ok) throw new Error(`Webhook returned ${res.status}`)
        setLog(x=>[{time:'Just now',title:'Inactive student follow-up ran via n8n',detail:'Adham Tarek · 8 days inactive · Follow-up saved to Supabase',status:'Success'},...x])
        setAutomationStatus({type:'success',message:'Inactive student follow-up prepared · Saved to Supabase'})
      } else if(k === 'weekly'){
        const res = await fetch('https://tag811.app.n8n.cloud/webhook/courseai-weekly-report',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            students:128,
            avg_progress:74,
            avg_quiz_score:81,
            at_risk_students:9,
            weakest_topic:'Genetics'
          })
        })
        if(!res.ok) throw new Error(`Webhook returned ${res.status}`)
        setLog(x=>[{time:'Just now',title:'Weekly teacher report ran via n8n',detail:'128 students analyzed · Report saved to Supabase',status:'Success'},...x])
        setAutomationStatus({type:'success',message:'Weekly teacher report generated · Saved to Supabase'})
      } else {
        await new Promise(resolve=>setTimeout(resolve,700))
        setLog(x=>[{time:'Just now',title:`${title} ran in demo mode`,detail:'This workflow is ready for the next n8n connection',status:'Success'},...x])
        setAutomationStatus({type:'success',message:`${title} demo completed`})
      }
    } catch(err){
      console.error(err)
      setLog(x=>[{time:'Just now',title:'Automation connection failed',detail:'Could not reach the n8n production webhook',status:'Queued'},...x])
      setAutomationStatus({type:'error',message:'Automation request failed. Check n8n webhook status.'})
    } finally {
      setRunning('')
      setTimeout(()=>setAutomationStatus(null),4500)
    }
  }
  return <>
    {automationStatus&&<div className={'automation-toast '+automationStatus.type}>
      {automationStatus.type==='success'?<CheckCircle2 size={18}/>:automationStatus.type==='error'?<CircleAlert size={18}/>:<Zap size={18}/>}
      <span>{automationStatus.message}</span>
    </div>}
    <PageTitle title="Automation Center" text="Monitor workflows, trigger demo runs and review recent activity."/>
    <div className="stats">
      <Stat icon={Zap} value="4" label="Active workflows" sub="All systems healthy"/>
      <Stat icon={Users} value="17" label="Students touched" sub="Last 24 hours"/>
      <Stat icon={Send} value="9" label="Actions prepared" sub="Awaiting teacher review"/>
      <Stat icon={ShieldCheck} value="99.8%" label="Automation health" sub="Demo environment"/>
    </div>

    <div className="automation-grid">
      {items.map(([k,t,d,Icon,affected,last])=><Card key={k} className="workflow-card">
        <div className="workflow-head">
          <div className="iconbox"><Icon/></div>
          <button className={'toggle '+(toggles[k]?'on':'')} onClick={()=>setToggles(x=>({...x,[k]:!x[k]}))}><i/></button>
        </div>
        <b className="workflow-title">{t}</b>
        <p className="muted">{d}</p>
        <div className="workflow-meta">
          <span><Users size={14}/>{affected}</span>
          <span><Clock3 size={14}/>{last}</span>
        </div>
        <div className="workflow-footer">
          <Badge type={toggles[k]?'green':'blue'}>{toggles[k]?'Active':'Paused'}</Badge>
          <button className="secondary small" disabled={running===k} onClick={()=>runNow(k,t)}>
            {running===k?'Running...':'Run demo'}
          </button>
        </div>
      </Card>)}
    </div>

    <div className="grid two">
      <Card>
        <SectionHead eyebrow="Live activity" title="Automation log" icon={Zap}/>
        <div className="activity-log">
          {log.map((x,i)=><div className="activity-item" key={i}>
            <div className={'activity-dot '+(x.status==='Success'?'success':'queued')}></div>
            <div className="grow"><b>{x.title}</b><span>{x.detail}</span></div>
            <div className="activity-time"><span>{x.time}</span><Badge type={x.status==='Success'?'green':'blue'}>{x.status}</Badge></div>
          </div>)}
        </div>
      </Card>
      <Card>
        <SectionHead eyebrow="Workflow preview" title="At-risk follow-up" icon={Brain}/>
        <div className="flow-vertical">
          <div><span>1</span><div><b>Student signal detected</b><p>Inactivity, low score or falling progress</p></div></div>
          <div><span>2</span><div><b>AI risk analysis</b><p>Risk score + weak topic + suggested action</p></div></div>
          <div><span>3</span><div><b>Teacher review</b><p>Message or study plan prepared for approval</p></div></div>
          <div><span>4</span><div><b>Delivery layer</b><p>Ready to connect with n8n, WhatsApp or email</p></div></div>
        </div>
        <div className="integration-strip"><ShieldCheck size={18}/><div><b>Integration-ready</b><span>UI + data model prepared for n8n webhooks</span></div></div>
      </Card>
    </div>
  </>
}

function Announcements(){const [text,setText]=useState('');const [sent,setSent]=useState(false);return <><PageTitle title="Announcements" text="Send updates, revision reminders and challenge notices."/><div className="grid two"><Card><SectionHead eyebrow="Compose" title="New announcement" icon={Megaphone}/><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Example: DNA revision session tomorrow at 8 PM..."/><button className="primary" onClick={()=>{if(text.trim())setSent(true)}}><Send size={17}/> Send demo announcement</button>{sent&&<div className="feedback good">Demo announcement queued successfully.</div>}</Card><Card><SectionHead eyebrow="Recent" title="Latest messages" icon={MessageCircle}/>{[['Weekly challenge','Saturday · 8:00 PM'],['DNA revision reminder','Yesterday'],['New lesson published','3 days ago']].map(x=><div className="result-row" key={x[0]}><div><b>{x[0]}</b><span>{x[1]}</span></div><CheckCircle2/></div>)}</Card></div></>}
function PageTitle({title,text}){return <div className="page-title"><div><h1>{title}</h1><p>{text}</p></div></div>}

export default function App(){
  const [mode,setMode]=useState('student')
  const [page,setPage]=useState('dashboard')
  const [data,setData]=useState(fallback)
  const [loading,setLoading]=useState(true)
  const [tutorPrompt,setTutorPrompt]=useState('')
  useEffect(()=>{(async()=>{try{const [{data:profiles},{data:courses},{data:lessons},{data:plans}]=await Promise.all([supabase.from('profiles').select('*'),supabase.from('courses').select('*').limit(1),supabase.from('lessons').select('*').order('position'),supabase.from('study_plans').select('*').limit(1)]);setData({student:profiles?.find(p=>p.role==='student')||fallback.student,teacher:profiles?.find(p=>p.role==='teacher')||fallback.teacher,course:courses?.[0]||fallback.course,lessons:lessons?.length?lessons:fallback.lessons,plan:plans?.[0]?.tasks||fallback.plan})}catch(e){console.warn(e)}setLoading(false)})()},[])
  const menu=mode==='student'?nav:teacherNav
  function render(){if(mode==='student'){return page==='dashboard'
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
    ? <Quizzes/>:page==='analytics'?<StudentAnalytics/>:<Achievements/>}return page==='dashboard'?<TeacherDashboard/>:page==='students'?<TeacherStudents/>:page==='content'?<TeacherContent data={data}/>:page==='analytics'?<TeacherAnalytics/>:page==='automation'?<Automation/>:<Announcements/>}
  return <div className="app"><aside><div className="brand"><div className="logo"><GraduationCap/></div><div><b>CourseAI</b><span>Learning OS</span></div></div><nav>{menu.map(([id,label,Icon])=><button key={id} className={page===id?'active':''} onClick={()=>setPage(id)}><Icon/>{label}</button>)}</nav><div className="demo-note"><Sparkles/><div><b>Interactive demo</b><span>Supabase-connected prototype</span></div></div></aside><main><header><div><b>Biology Academy</b><span>{loading?'Syncing demo data...':'Live demo data connected'}</span></div><div className="header-actions"><Bell size={18}/><div className="mode-switch"><button className={mode==='student'?'on':''} onClick={()=>{setMode('student');setPage('dashboard')}}>Student</button><button className={mode==='teacher'?'on':''} onClick={()=>{setMode('teacher');setPage('dashboard')}}>Teacher</button></div></div></header><div className="content">{render()}</div></main></div>
}
