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
      (attemptMap.get(profile.id) || [])
        .sort(
          (a,b)=>
            new Date(b.completed_at||0) -
            new Date(a.completed_at||0)
        )

    const averageScore =
      studentAttempts.length
        ? Math.round(
            studentAttempts.reduce(
              (total,a)=>total + Number(a.score || 0),
              0
            ) / studentAttempts.length
          )
        : 0

    const latestScore =
      studentAttempts.length
        ? Number(studentAttempts[0].score || 0)
        : null

    const previousLowAttempt =
      studentAttempts
        .slice(1)
        .find(a=>Number(a.score)<65)

    const previousLowScore =
      previousLowAttempt
        ? Number(previousLowAttempt.score || 0)
        : null

    const improvement =
      latestScore !== null &&
      latestScore >= 65 &&
      previousLowScore !== null
        ? latestScore - previousLowScore
        : null

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
      risk >= 70
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
      risk >= 70
        ? 'Teacher follow-up + revision plan'
        : risk >= 55
          ? 'Targeted revision'
          : 'Keep current plan'

    return {
      id: profile.id,
      name: profile.full_name,

      progress,

      score: averageScore || 0,

      latestScore,
      previousLowScore,
      improvement,

      risk,

      status,

      last,
      daysInactive,

      weak:
        weakTopics[0] ||
        'General review',

      reason,

      recommended,

      trend:
        risk >= 70
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
  const [revisionSteps,setRevisionSteps]=useState([])
  const [revisionSaving,setRevisionSaving]=useState(false)
  const [inactiveFollowup,setInactiveFollowup]=useState(null)
  const [atRiskIntervention,setAtRiskIntervention]=useState(null)
  const [studentNotifications,setStudentNotifications]=useState([])
  const [notificationsLoading,setNotificationsLoading]=useState(false)

  const [liveStudentStats,setLiveStudentStats]=useState({
    progress:0,
    quizAverage:0,
    weakTopic:'General review',
    points:0,
    streak:0
  })

  useEffect(()=>{
    loadRevisionPlan()
    loadInactiveFollowup()
    loadAtRiskIntervention()
    loadStudentNotifications()
    loadLiveStudentStats()
  },[data.student.full_name])

  async function loadLiveStudentStats(){

    const {data:profile,error:profileError}=await supabase
      .from('profiles')
      .select('id,points,streak')
      .eq('full_name',data.student.full_name)
      .eq('role','student')
      .limit(1)
      .maybeSingle()

    if(profileError || !profile){
      if(profileError) console.error(profileError)
      return
    }

    const [
      {data:enrollment,error:enrollmentError},
      {data:attempts,error:attemptsError}
    ]=await Promise.all([

      supabase
        .from('enrollments')
        .select('progress')
        .eq('student_id',profile.id)
        .limit(1)
        .maybeSingle(),

      supabase
        .from('quiz_attempts')
        .select('score,weak_topics,completed_at')
        .eq('student_id',profile.id)
        .order('completed_at',{ascending:false})

    ])

    if(enrollmentError){
      console.error(enrollmentError)
    }

    if(attemptsError){
      console.error(attemptsError)
    }

    const rows=attempts||[]

    const quizAverage=
      rows.length
        ? Math.round(
            rows.reduce(
              (sum,row)=>sum+Number(row.score||0),
              0
            )/rows.length
          )
        : 0

    const weakTopic=
      rows.flatMap(
        row=>row.weak_topics||[]
      ).filter(Boolean)[0] || 'General review'

    setLiveStudentStats({
      progress:Number(enrollment?.progress||0),
      quizAverage,
      weakTopic,
      points:Number(profile.points||0),
      streak:Number(profile.streak||0)
    })
  }

  async function loadStudentNotifications(){
    setNotificationsLoading(true)

    const {data:profile,error:profileError}=await supabase
      .from('profiles')
      .select('id')
      .eq('full_name',data.student.full_name)
      .eq('role','student')
      .limit(1)
      .maybeSingle()

    if(profileError || !profile){
      if(profileError) console.error(profileError)
      setStudentNotifications([])
      setNotificationsLoading(false)
      return
    }

    const {data:rows,error}=await supabase
      .from('notifications')
      .select('id,title,message,type,read,created_at')
      .eq('profile_id',profile.id)
      .order('created_at',{ascending:false})
      .limit(10)

    if(error){
      console.error('Could not load notifications',error)
      setNotificationsLoading(false)
      return
    }

    setStudentNotifications(rows||[])
    setNotificationsLoading(false)
  }

  async function markNotificationRead(id){
    const {error}=await supabase
      .from('notifications')
      .update({read:true})
      .eq('id',id)

    if(error){
      console.error('Could not mark notification read',error)
      return
    }

    setStudentNotifications(rows=>
      rows.map(row=>
        row.id===id
          ? {...row,read:true}
          : row
      )
    )
  }

  async function loadAtRiskIntervention(){
    const {data:intervention,error}=await supabase
      .from('automation_runs')
      .select('id,student_name,risk_score,weak_topic,generated_text,status,created_at')
      .eq('workflow_key','at_risk_student')
      .eq('student_name',data.student.full_name)
      .eq('status','prepared')
      .order('created_at',{ascending:false})
      .limit(1)
      .maybeSingle()

    if(error){
      console.error(
        'Could not load at-risk intervention',
        error
      )
      return
    }

    setAtRiskIntervention(intervention||null)
  }

  async function loadInactiveFollowup(){
    const {data:followup,error}=await supabase
      .from('automation_runs')
      .select('id,student_name,weak_topic,generated_text,status,created_at')
      .eq('workflow_key','inactive_student_followup')
      .eq('student_name',data.student.full_name)
      .eq('status','prepared')
      .order('created_at',{ascending:false})
      .limit(1)
      .maybeSingle()

    if(error){
      console.error(
        'Could not load student inactive follow-up',
        error
      )
      return
    }

    setInactiveFollowup(followup||null)
  }

  async function loadRevisionPlan(){
    const {data:plan,error}=await supabase
      .from('automation_runs')
      .select('id,workflow_key,student_name,weak_topic,generated_text,status,created_at')
      .eq('workflow_key','low_score_revision')
      .eq('student_name',data.student.full_name)
      .eq('status','prepared')
      .order('created_at',{ascending:false})
      .limit(1)
      .maybeSingle()

    if(error){
      console.error(error)
      return
    }

    setRevisionPlan(plan||null)

    if(plan){
      await loadRevisionProgress(plan.id)
    }else{
      setRevisionSteps([])
    }
  }

  async function loadRevisionProgress(automationRunId){
    const {data,error}=await supabase
      .from('revision_plan_progress')
      .select('step_number,completed')
      .eq('automation_run_id',automationRunId)
      .order('step_number')

    if(error){
      console.error(error)
      return
    }

    const map=new Map(
      (data||[]).map(x=>[
        Number(x.step_number),
        Boolean(x.completed)
      ])
    )

    setRevisionSteps(
      [1,2,3,4].map(step=>({
        step,
        completed:map.get(step)||false
      }))
    )
  }

  async function toggleRevisionStep(stepNumber){
    if(!revisionPlan || revisionSaving) return

    const current=
      revisionSteps.find(x=>x.step===stepNumber)

    const nextCompleted=
      !current?.completed

    setRevisionSaving(true)

    try{
      const {error}=await supabase
        .from('revision_plan_progress')
        .upsert({
          automation_run_id:revisionPlan.id,
          student_name:data.student.full_name,
          step_number:stepNumber,
          completed:nextCompleted,
          completed_at:nextCompleted
            ? new Date().toISOString()
            : null,
          updated_at:new Date().toISOString()
        },{
          onConflict:'automation_run_id,step_number'
        })

      if(error) throw error

      setRevisionSteps(rows=>
        rows.map(row=>
          row.step===stepNumber
            ? {...row,completed:nextCompleted}
            : row
        )
      )

    }catch(err){
      console.error(err)
      alert('Could not save revision progress.')
    }finally{
      setRevisionSaving(false)
    }
  }

  const revisionStepLabels=[
    'Review the core concept for 10 minutes',
    'Solve 5 targeted questions',
    'Ask the AI Tutor about mistakes',
    'Retake a short quiz tomorrow'
  ]

  const completedRevisionSteps=
    revisionSteps.filter(x=>x.completed).length

  const revisionComplete=
    revisionSteps.length===4 &&
    completedRevisionSteps===4

  return <>
    <section className="hero"><div><div className="eyebrow"><Sparkles size={16}/> Personalized learning dashboard</div><h1>Welcome back, {data.student.full_name.split(' ')[0]} 👋</h1><p>Your AI study plan adapts to your weak topics and recent quiz results.</p></div><div className="hero-badge"><Flame/><div><b>{liveStudentStats.streak} days</b><span>Study streak</span></div></div></section>
    {studentNotifications.length>0&&
      <Card className="welcome-back-card">
        <SectionHead
          eyebrow="Notifications"
          title={
            studentNotifications.filter(x=>!x.read).length+
            ' unread'
          }
          icon={Bell}
        />

        <div className="inactive-followup-list">
          {studentNotifications.map(item=>
            <div
              key={item.id}
              className="inactive-followup-item"
            >
              <div className="inactive-followup-head">
                <div>
                  <b>{item.title}</b>
                  <span>
                    {new Date(
                      item.created_at
                    ).toLocaleString()}
                  </span>
                </div>

                <Badge type={item.read?'blue':'green'}>
                  {item.read?'Read':'New'}
                </Badge>
              </div>

              <p>{item.message}</p>

              {!item.read&&
                <button
                  className="secondary small"
                  onClick={()=>
                    markNotificationRead(item.id)
                  }
                >
                  Mark as read
                </button>
              }
            </div>
          )}
        </div>
      </Card>
    }

    {atRiskIntervention&&
      <Card className="welcome-back-card">
        <SectionHead
          eyebrow="AI support"
          title="Personalized support prepared"
          icon={Brain}
        />

        <p className="welcome-back-message">
          {atRiskIntervention.generated_text}
        </p>

        <div className="welcome-back-actions">
          <div>
            <Badge type="blue">
              Risk score: {atRiskIntervention.risk_score}
            </Badge>
            {' '}
            <Badge type="blue">
              Focus: {atRiskIntervention.weak_topic}
            </Badge>
          </div>

          <button
            className="primary"
            onClick={()=>{
              setTutorPrompt(
                'Help me review '+
                atRiskIntervention.weak_topic+
                '. Use ONLY information explicitly supported by my uploaded course material. Do not introduce topics that are absent from the uploaded material.'
              )
              setPage('tutor')
            }}
          >
            <Brain size={17}/>
            Start support session
          </button>
        </div>
      </Card>
    }

    {inactiveFollowup&&
      <Card className="welcome-back-card">
        <SectionHead
          eyebrow="AI follow-up"
          title="Welcome back — let's continue"
          icon={Sparkles}
        />

        <p className="welcome-back-message">
          {inactiveFollowup.generated_text}
        </p>

        <div className="welcome-back-actions">
          <Badge type="blue">
            Focus: {inactiveFollowup.weak_topic}
          </Badge>

          <button
            className="primary"
            onClick={()=>{
              setTutorPrompt(
                'Give me a focused 15-minute review of '+
                inactiveFollowup.weak_topic+
                '. Use ONLY information explicitly supported by my uploaded course material. Do not add, infer, expand, or supplement any detail from general knowledge. If the uploaded course material does not cover a point explicitly asked by the student, say: "This point is not covered in the uploaded course material." Do not introduce, suggest, or list topics that are absent from the uploaded course material. Review only topics and subtopics actually present in the retrieved course content. Keep the terminology, scope, and level of detail consistent with the course material.'
              )
              setPage('tutor')
            }}
          >
            <PlayCircle size={17}/>
            Start 15-min review
          </button>
        </div>
      </Card>
    }

    <div className="stats">
      <Stat
        icon={Target}
        value={liveStudentStats.progress+'%'}
        label="Course progress"
        sub="Live from Supabase"
      />

      <Stat
        icon={Trophy}
        value={liveStudentStats.points}
        label="XP points"
        sub="Student profile"
      />

      <Stat
        icon={CheckCircle2}
        value={liveStudentStats.quizAverage+'%'}
        label="Quiz average"
        sub="All quiz attempts"
      />

      <Stat
        icon={Brain}
        value={liveStudentStats.weakTopic}
        label="Current weak topic"
        sub="AI learning signal"
      />
    </div>
    <div className="grid two"><Card><SectionHead eyebrow="Continue learning" title={data.course.title} icon={BookOpen}/><Progress value={liveStudentStats.progress}/><p className="muted">{liveStudentStats.progress}% complete · {data.lessons.length} lessons available</p><div className="lesson-list">{data.lessons.map((l,i)=><button className="lesson" key={l.id} onClick={()=>setPage('courses')}><div className="lesson-num">{i+1}</div><div className="grow"><b>{l.title}</b><span>{l.summary}</span></div><span className="duration">{l.duration_minutes} min</span><PlayCircle size={20}/></button>)}</div></Card>
    <Card><SectionHead eyebrow="AI generated" title="Today's study plan" icon={ListChecks}/>{data.plan.map((t,i)=><div className="task" key={i}><div><b>{t.task}</b><span>{t.day} · {t.minutes} min</span></div><CheckCircle2 size={20}/></div>)}</Card></div>
    <div className="grid three"><Card><SectionHead eyebrow="Weak topic" title={liveStudentStats.weakTopic} icon={CircleAlert}/><p className="muted">Based on your latest quiz performance and recorded weak topics.</p><button className="primary" onClick={()=>setPage('tutor')}>Ask AI Tutor</button></Card><Card><SectionHead eyebrow="Next milestone" title="Quiz Master" icon={Trophy}/><p className="muted">Score 90%+ in two more quizzes to unlock 500 XP.</p><Progress value={67}/></Card><Card><SectionHead eyebrow="Upcoming" title="Weekly biology challenge" icon={CalendarDays}/><p className="muted">Saturday · 8:00 PM · 20 questions</p><Badge type="blue">Starts in 2 days</Badge></Card></div>

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

        <div className="revision-full-plan">
          <div className="revision-full-plan-title">
            AI Revision Plan
          </div>

          <pre className="revision-plan-text">
            {revisionPlan.generated_text}
          </pre>
        </div>

        <div className="revision-progress-summary">
          <div>
            <b>{completedRevisionSteps}/4 steps completed</b>
            <span>
              Complete the plan before retaking the quiz.
            </span>
          </div>
          <strong>
            {Math.round((completedRevisionSteps/4)*100)}%
          </strong>
        </div>

        <Progress value={(completedRevisionSteps/4)*100}/>

        <div className="revision-checklist">
          {revisionStepLabels.map((label,index)=>{
            const stepNumber=index+1
            const item=revisionSteps.find(
              x=>x.step===stepNumber
            )
            const done=item?.completed||false

            return (
              <button
                key={stepNumber}
                className={
                  'revision-step ' +
                  (done?'done':'')
                }
                disabled={revisionSaving}
                onClick={()=>
                  toggleRevisionStep(stepNumber)
                }
              >
                <span className="revision-step-check">
                  {done?'✓':stepNumber}
                </span>

                <div>
                  <b>{label}</b>
                  <span>
                    {done
                      ? 'Completed'
                      : 'Mark as done'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="revision-plan-actions">
          <button
            className="secondary"
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
            Ask AI Tutor
          </button>

          {revisionComplete&&
            <button
              className="primary"
              onClick={()=>setPage('quizzes')}
            >
              <Target size={17}/>
              Retake Quiz
            </button>
          }

          <span className="muted">
            Progress is saved automatically.
          </span>
        </div>
      </Card>
    }
  </>
}

function Courses({data,studentName='Omar Mohamed'}){

  const [progress,setProgress]=useState(0)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    loadProgress()
  },[studentName])

  async function loadProgress(){
    setLoading(true)

    const {data:student,error:studentError}=await supabase
      .from('profiles')
      .select('id')
      .eq('full_name',studentName)
      .eq('role','student')
      .maybeSingle()

    if(studentError || !student){
      if(studentError) console.error(studentError)
      setProgress(0)
      setLoading(false)
      return
    }

    const {data:enrollment,error}=await supabase
      .from('enrollments')
      .select('progress')
      .eq('student_id',student.id)
      .limit(1)
      .maybeSingle()

    if(error){
      console.error(error)
      setProgress(0)
      setLoading(false)
      return
    }

    setProgress(Number(enrollment?.progress||0))
    setLoading(false)
  }

  return <>
    <PageTitle
      title="Courses"
      text={'Course progress for '+studentName+'.'}
    />

    <div className="course-banner">
      <div>
        <Badge type="blue">
          {data.course.subject}
        </Badge>

        <h2>{data.course.title}</h2>

        <p>
          Instructor: {data.course.instructor_name}
        </p>

        <Progress value={progress}/>
      </div>

      <div className="course-score">
        <b>
          {loading?'...':progress+'%'}
        </b>
        <span>completed</span>
      </div>
    </div>

    <div className="lesson-list large">
      {data.lessons.map((l,i)=>
        <Card
          className="lesson-card"
          key={l.id}
        >
          <div className="lesson-num">
            {i+1}
          </div>

          <div className="grow">
            <b>{l.title}</b>
            <p>{l.summary}</p>
            <span>
              <Clock3 size={14}/>
              {' '}
              {l.duration_minutes} minutes
            </span>
          </div>

          <button className="primary">
            <PlayCircle size={17}/>
            Start lesson
          </button>
        </Card>
      )}
    </div>
  </>
}

function Tutor({initialPrompt='',studentName='Student'}){

  const [messages,setMessages]=useState([
    {
      role:'ai',
      text:'Hi '+studentName.split(' ')[0]+'! Ask me anything from your Biology course. I can explain concepts, quiz you, or simplify a difficult topic.'
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
        body:JSON.stringify({
          question,
          student_name:studentName
        })
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

function Quizzes({studentName='Omar Mohamed'}){
  const [started,setStarted]=useState(false)
  const [answer,setAnswer]=useState('')
  const [result,setResult]=useState(null)
  const [saving,setSaving]=useState(false)
  const [saved,setSaved]=useState(false)
  const [attempts,setAttempts]=useState([])
  const [improvement,setImprovement]=useState(null)

  useEffect(()=>{
    setStarted(false)
    setAnswer('')
    setResult(null)
    setSaved(false)
    loadAttempts()
  },[studentName])

  async function loadAttempts(){
    const {data:student}=await supabase
      .from('profiles')
      .select('id')
      .eq('full_name',studentName)
      .eq('role','student')
      .maybeSingle()

    if(!student) return

    const {data}=await supabase
      .from('quiz_attempts')
      .select('score,completed_at,quizzes(title)')
      .eq('student_id',student.id)
      .order('completed_at',{ascending:false})
      .limit(5)

    const rows=data||[]
    setAttempts(rows)

    if(rows.length>=2){
      const latest=Number(rows[0].score||0)

      const previousLow=rows
        .slice(1)
        .find(x=>Number(x.score)<65)

      if(previousLow && latest>=65){
        const previous=Number(previousLow.score||0)

        setImprovement({
          previous,
          latest,
          change:latest-previous
        })
      }else{
        setImprovement(null)
      }
    }else{
      setImprovement(null)
    }
  }

  async function submitQuiz(){
    if(!answer || saving || saved) return

    const correct=answer==='Mitochondrion'
    const score=correct?100:0

    setResult(correct)
    setSaving(true)

    try{
      const [{data:student,error:studentError},{data:quiz,error:quizError}]=await Promise.all([
        supabase
          .from('profiles')
          .select('id')
          .eq('full_name',studentName)
          .eq('role','student')
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
          student_id:student.id,
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
                student_name:studentName,
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
      text={'Adaptive checkpoint for '+studentName+' that feeds the weak-topic analysis.'}
    />

    {improvement&&
      <Card className="improvement-card">
        <SectionHead
          eyebrow="AI intervention result"
          title="Your recovery"
          icon={Trophy}
        />

        <div className="improvement-grid">
          <div>
            <span>Before revision</span>
            <strong>{improvement.previous}%</strong>
          </div>

          <div className="improvement-arrow">
            →
          </div>

          <div>
            <span>Retake score</span>
            <strong>{improvement.latest}%</strong>
          </div>

          <div className="improvement-change">
            <span>Improvement</span>
            <strong>+{improvement.change} pts</strong>
          </div>
        </div>

        <div className="feedback good">
          Great recovery. Your revision plan improved your latest quiz performance.
        </div>
      </Card>
    }

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

function StudentAnalytics({studentName='Omar Mohamed'}){

  const [stats,setStats]=useState({
    progress:0,
    average:0,
    attempts:0,
    weakTopic:'General review',
    lastScore:null,
    bestScore:null,
    daysInactive:0
  })

  const [attempts,setAttempts]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    loadAnalytics()
  },[studentName])

  async function loadAnalytics(){
    setLoading(true)

    const {data:student,error:studentError}=await supabase
      .from('profiles')
      .select('id')
      .eq('full_name',studentName)
      .eq('role','student')
      .maybeSingle()

    if(studentError || !student){
      if(studentError) console.error(studentError)
      setLoading(false)
      return
    }

    const [
      {data:enrollment,error:enrollmentError},
      {data:quizRows,error:quizError}
    ]=await Promise.all([

      supabase
        .from('enrollments')
        .select('progress,last_activity_at')
        .eq('student_id',student.id)
        .limit(1)
        .maybeSingle(),

      supabase
        .from('quiz_attempts')
        .select('score,weak_topics,completed_at,quizzes(title)')
        .eq('student_id',student.id)
        .order('completed_at',{ascending:false})

    ])

    if(enrollmentError) console.error(enrollmentError)
    if(quizError) console.error(quizError)

    const rows=quizRows||[]

    const average=
      rows.length
        ? Math.round(
            rows.reduce(
              (sum,row)=>sum+Number(row.score||0),
              0
            )/rows.length
          )
        : 0

    const bestScore=
      rows.length
        ? Math.max(
            ...rows.map(row=>Number(row.score||0))
          )
        : null

    const lastScore=
      rows.length
        ? Number(rows[0].score||0)
        : null

    const topicCounts={}

    rows.forEach(row=>{
      ;(row.weak_topics||[]).forEach(topic=>{
        if(!topic) return
        topicCounts[topic]=(topicCounts[topic]||0)+1
      })
    })

    const weakTopic=
      Object.entries(topicCounts)
        .sort((a,b)=>b[1]-a[1])[0]?.[0]
      || 'General review'

    const lastActivity=
      enrollment?.last_activity_at
        ? new Date(enrollment.last_activity_at)
        : null

    const daysInactive=
      lastActivity
        ? Math.max(
            0,
            Math.floor(
              (Date.now()-lastActivity.getTime())/
              86400000
            )
          )
        : 0

    setStats({
      progress:Number(enrollment?.progress||0),
      average,
      attempts:rows.length,
      weakTopic,
      lastScore,
      bestScore,
      daysInactive
    })

    setAttempts(rows.slice(0,5))
    setLoading(false)
  }

  return <>
    <PageTitle
      title="Analytics"
      text={'Live learning analytics for '+studentName+'.'}
    />

    <div className="stats">
      <Stat
        icon={BarChart3}
        value={loading?'...':stats.progress+'%'}
        label="Course progress"
      />

      <Stat
        icon={Target}
        value={loading?'...':stats.average+'%'}
        label="Quiz average"
      />

      <Stat
        icon={ListChecks}
        value={loading?'...':stats.attempts}
        label="Quiz attempts"
      />

      <Stat
        icon={Clock3}
        value={loading?'...':stats.daysInactive+'d'}
        label="Since last activity"
      />
    </div>

    <div className="grid two">

      <Card>
        <SectionHead
          eyebrow="Learning signal"
          title="Performance summary"
          icon={Brain}
        />

        <div className="detail-note">
          <CircleAlert size={17}/>
          <div>
            <b>Current weak topic</b>
            <p>{stats.weakTopic}</p>
          </div>
        </div>

        <div className="detail-note">
          <Target size={17}/>
          <div>
            <b>Latest quiz score</b>
            <p>
              {stats.lastScore!==null
                ? stats.lastScore+'%'
                : 'No attempt yet'}
            </p>
          </div>
        </div>

        <div className="detail-note">
          <Trophy size={17}/>
          <div>
            <b>Best quiz score</b>
            <p>
              {stats.bestScore!==null
                ? stats.bestScore+'%'
                : 'No attempt yet'}
            </p>
          </div>
        </div>

        <Badge type={
          stats.average>=75
            ? 'green'
            : stats.average>=65
              ? 'blue'
              : 'red'
        }>
          {stats.average>=75
            ? 'Strong performance'
            : stats.average>=65
              ? 'Needs monitoring'
              : 'Needs support'}
        </Badge>
      </Card>

      <Card>
        <SectionHead
          eyebrow="Live history"
          title="Recent quiz performance"
          icon={BarChart3}
        />

        {loading ?
          <p className="muted">
            Loading performance...
          </p>
        :
          attempts.length===0 ?
            <p className="muted">
              No quiz attempts recorded.
            </p>
          :
            attempts.map((attempt,index)=>
              <div
                className="result-row"
                key={index}
              >
                <div>
                  <b>
                    {attempt.quizzes?.title||
                     'Quiz attempt'}
                  </b>

                  <span>
                    {new Date(
                      attempt.completed_at
                    ).toLocaleDateString()}
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

  const [inactiveFollowups,setInactiveFollowups] =
    useState([])

  const [atRiskInterventions,setAtRiskInterventions] =
    useState([])

  useEffect(()=>{
    loadMaterials()
    loadInactiveFollowups()
    loadAtRiskInterventions()
  },[])

  async function loadAtRiskInterventions(){
    const {data,error}=await supabase
      .from('automation_runs')
      .select('id,student_name,risk_score,weak_topic,generated_text,status,created_at')
      .eq('workflow_key','at_risk_student')
      .order('created_at',{ascending:false})
      .limit(20)

    if(error){
      console.error(
        'Could not load at-risk interventions',
        error
      )
      return
    }

    const latestByStudent=[]

    for(const item of (data||[])){
      if(
        !latestByStudent.some(
          x=>x.student_name===item.student_name
        )
      ){
        latestByStudent.push(item)
      }
    }

    setAtRiskInterventions(latestByStudent)
  }

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

    const latestByStudent = []

    for(const item of (data||[])){
      const alreadyAdded =
        latestByStudent.some(
          x => x.student_name === item.student_name
        )

      if(!alreadyAdded){
        latestByStudent.push(item)
      }
    }

    setInactiveFollowups(latestByStudent)
  }

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
      .filter(s=>s.risk>=70)
      .sort((a,b)=>b.risk-a.risk)
  function runAction(student,type){setAction({student,type})}
  return <>
    <section className="hero teacher-hero"><div><div className="eyebrow"><Brain size={16}/> AI teacher command center</div><h1>Biology Mastery 2027</h1><p>Prioritize who needs help, why they are struggling, and what action to take next.</p></div><div className="hero-badge"><Bell/><div><b>{riskStudents.length} priority students</b><span>AI risk queue</span></div></div></section>

    {atRiskInterventions.length>0&&
      <Card className="inactive-followups-card">
        <SectionHead
          eyebrow="AI risk automation"
          title="At-risk interventions"
          icon={Brain}
        />

        <div className="inactive-followup-list">
          {atRiskInterventions.map(item=>
            <div
              className="inactive-followup-item"
              key={item.id}
            >
              <div className="inactive-followup-head">
                <div>
                  <b>{item.student_name}</b>
                  <span>
                    {item.weak_topic} · Risk {item.risk_score}
                  </span>
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
    }

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
    }
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
      <Card><SectionHead eyebrow="Priority queue" title="At-risk students" icon={CircleAlert}/><div className="risk-list">{riskStudents.map(s=><div className="risk-card" key={s.name}><div className="risk-score"><strong>{s.risk}</strong><span>risk</span></div><div className="grow"><div className="risk-title"><b>{s.name}</b><Badge type={s.status==='At risk'?'red':s.status==='Watch'?'blue':'green'}>{s.status}</Badge></div><p>{s.reason}</p><div className="risk-meta"><span>Weak: {s.weak}</span><span>Last active: {s.last}</span><span className="down">Trend {s.trend}</span></div><div className="suggestion"><Sparkles size={15}/><span><b>AI suggestion:</b> {s.recommended}</span></div><div className="risk-actions"><button className="primary small" onClick={()=>runAction(s,'Reminder')}><Send size={15}/> Prepare reminder</button><button className="secondary small" onClick={()=>runAction(s,'Revision plan')}><Brain size={15}/> AI study plan</button></div></div></div>)}</div></Card>
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
  return <Card><SectionHead eyebrow="Student intelligence" title={compact?'Student performance':'All students'} icon={Users}/><div className="table-wrap"><table><thead><tr><th>Student</th><th>Progress</th><th>Quiz avg.</th><th>Risk</th><th>Last active</th><th>Status</th><th></th></tr></thead><tbody>{rows.map(s=><tr key={s.name} className="click-row" onClick={()=>setSelected(s)}><td><b>{s.name}</b></td><td>{s.progress}%</td><td>{s.score}%</td><td><span className={'risk-number '+(s.risk>=80?'danger':s.risk>=60?'warn':'safe')}>{s.risk}</span></td><td>{s.last}</td><td><Badge type={s.status==='At risk'?'red':s.status==='Watch'?'blue':'green'}>{s.status}</Badge></td><td><ChevronRight size={18}/></td></tr>)}</tbody></table></div>{selected&&<div className="student-detail"><div className="detail-head"><div><small>STUDENT PROFILE</small><h3>{selected.name}</h3></div><button className="icon-btn" onClick={()=>setSelected(null)}>×</button></div><div className="detail-stats"><div><b>{selected.progress}%</b><span>Progress</span></div><div><b>{selected.score}%</b><span>Quiz avg.</span></div><div><b>{selected.risk}</b><span>Risk score</span></div>
<div>
  <b>
    {selected.previousLowScore!==null &&
     selected.previousLowScore!==undefined
      ? selected.previousLowScore+'%'
      : '—'}
  </b>
  <span>Previous score</span>
</div>

<div>
  <b>
    {selected.latestScore!==null &&
     selected.latestScore!==undefined
      ? selected.latestScore+'%'
      : '—'}
  </b>
  <span>Latest score</span>
</div>

<div>
  <b>
    {selected.improvement!==null &&
     selected.improvement!==undefined
      ? '+'+selected.improvement+' pts'
      : '—'}
  </b>
  <span>Recovery</span>
</div>

<div>
  <b>{selected.trend}</b>
  <span>Trend</span>
</div></div><div className="detail-note"><CircleAlert size={17}/><div><b>Why flagged</b><p>{selected.reason}</p></div></div><div className="detail-note"><Brain size={17}/><div><b>Recommended action</b><p>{selected.recommended}</p></div></div></div>}</Card>
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
    {selected&&<div className="student-detail"><div className="detail-head"><div><small>AI RISK REVIEW</small><h3>{selected.name}</h3></div><button className="icon-btn" onClick={()=>setSelected(null)}>×</button></div><div className="detail-stats">

  <div>
    <b>{selected.progress}%</b>
    <span>Progress</span>
  </div>

  <div>
    <b>{selected.score}%</b>
    <span>Quiz avg.</span>
  </div>

  <div>
    <b>{selected.risk}</b>
    <span>Risk score</span>
  </div>

  <div>
    <b>
      {selected.previousLowScore!==null &&
       selected.previousLowScore!==undefined
        ? selected.previousLowScore+'%'
        : '—'}
    </b>
    <span>Previous score</span>
  </div>

  <div>
    <b>
      {selected.latestScore!==null &&
       selected.latestScore!==undefined
        ? selected.latestScore+'%'
        : '—'}
    </b>
    <span>Latest score</span>
  </div>

  <div>
    <b>
      {selected.improvement!==null &&
       selected.improvement!==undefined
        ? '+'+selected.improvement+' pts'
        : '—'}
    </b>
    <span>Recovery</span>
  </div>

  <div>
    <b>{selected.trend}</b>
    <span>Trend</span>
  </div>

</div><div className="detail-note"><CircleAlert size={17}/><div><b>Detected issue</b><p>{selected.reason}</p></div></div><div className="detail-note"><Brain size={17}/><div><b>Suggested intervention</b><p>{selected.recommended}</p></div></div><div className="risk-actions"><button className="primary small" onClick={()=>setAction({student:selected,type:'Reminder'})}><Send size={15}/> Prepare message</button><button className="secondary small" onClick={()=>setAction({student:selected,type:'Revision plan'})}><ListChecks size={15}/> Generate plan</button></div></div>}
    {action&&<TeacherActionModal student={action.student} type={action.type} onClose={()=>setAction(null)}/>} 
  </Card>
}
function TeacherContent({data}){return <><PageTitle title="Content" text="Course modules, lessons, quizzes and resources."/><div className="toolbar"><span>{data.lessons.length} lessons</span><button className="primary"><BookOpen size={17}/> New lesson</button></div><div className="lesson-list large">{data.lessons.map((l,i)=><Card className="lesson-card" key={l.id}><div className="lesson-num">{i+1}</div><div className="grow"><b>{l.title}</b><p>{l.summary}</p><span><Clock3 size={14}/> {l.duration_minutes} min · Published</span></div><Badge type="green">Live</Badge><button className="icon-btn"><Settings2/></button></Card>)}</div></>}
function TeacherAnalytics(){

  const [report,setReport]=useState(null)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    loadWeeklyReport()
  },[])

  async function loadWeeklyReport(){
    const {data,error}=await supabase
      .from('automation_runs')
      .select('id,risk_score,weak_topic,generated_text,status,created_at')
      .eq('workflow_key','weekly_teacher_report')
      .eq('status','prepared')
      .order('created_at',{ascending:false})
      .limit(1)
      .maybeSingle()

    if(error){
      console.error(error)
      setLoading(false)
      return
    }

    setReport(data||null)
    setLoading(false)
  }

  function extractNumber(label){
    if(!report?.generated_text) return 0

    const line=
      report.generated_text
        .split('\n')
        .find(x=>x.startsWith(label+':'))

    if(!line) return 0

    const value=line.split(':')[1]||''
    const num=value.match(/\d+/)

    return num ? Number(num[0]) : 0
  }

  const students=extractNumber('Students')
  const avgProgress=extractNumber('Average progress')
  const avgQuiz=extractNumber('Average quiz score')
  const atRisk=report?.risk_score||0

  return <>
    <PageTitle
      title="Analytics"
      text="Live cohort performance and AI-generated teaching insights."
    />

    <div className="stats">
      <Stat icon={Users} value={loading?'...':students} label="Students"/>
      <Stat icon={Target} value={loading?'...':avgQuiz+'%'} label="Avg quiz score"/>
      <Stat icon={BarChart3} value={loading?'...':avgProgress+'%'} label="Avg progress"/>
      <Stat icon={CircleAlert} value={loading?'...':atRisk} label="At-risk students"/>
    </div>

    <div className="grid two">

      <Card>
        <SectionHead
          eyebrow="Weekly signal"
          title="Teaching priority"
          icon={Target}
        />

        {report ? <>
          <div className="detail-note">
            <CircleAlert size={17}/>
            <div>
              <b>Weakest topic</b>
              <p>{report.weak_topic}</p>
            </div>
          </div>

          <div className="detail-note">
            <Users size={17}/>
            <div>
              <b>Students needing attention</b>
              <p>{atRisk} students</p>
            </div>
          </div>

          <Badge type="green">Live from Supabase</Badge>
        </> :
          <p className="muted">No weekly report yet.</p>
        }
      </Card>

      <Card>
        <SectionHead
          eyebrow="AI weekly report"
          title="Latest teacher briefing"
          icon={Brain}
        />

        {loading ?
          <p className="muted">Loading...</p>
        :
          report ?
            <pre className="revision-plan-text">
              {report.generated_text}
            </pre>
          :
            <p className="muted">
              No report generated yet.
            </p>
        }
      </Card>

    </div>
  </>
}
function Automation(){

  const [runs,setRuns]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    loadRuns()
  },[])

  async function loadRuns(){
    setLoading(true)

    const {data,error}=await supabase
      .from('automation_runs')
      .select(
        'id,workflow_key,student_name,risk_score,weak_topic,action_type,status,created_at'
      )
      .order('created_at',{ascending:false})
      .limit(50)

    if(error){
      console.error('Could not load automation runs',error)
      setLoading(false)
      return
    }

    setRuns(data||[])
    setLoading(false)
  }

  const workflows=[
    {
      key:'at_risk_student',
      title:'At-risk student alert',
      description:'Detect students with risk score 70 or higher.',
      icon:Bell,
      schedule:'Every hour'
    },
    {
      key:'inactive_student_followup',
      title:'Inactive student follow-up',
      description:'Prepare follow-up after 5+ inactive days.',
      icon:MessageCircle,
      schedule:'Every hour'
    },
    {
      key:'low_score_revision',
      title:'Low-score revision plan',
      description:'Generate a revision plan after a score below 65%.',
      icon:Brain,
      schedule:'Event triggered'
    },
    {
      key:'weekly_teacher_report',
      title:'Weekly teacher report',
      description:'Summarize cohort performance and teaching priorities.',
      icon:FileText,
      schedule:'Every Sunday'
    }
  ]

  function latestRun(key){
    return runs.find(x=>x.workflow_key===key)
  }

  function countRuns(key){
    return runs.filter(x=>x.workflow_key===key).length
  }

  return <>
    <PageTitle
      title="Automation Center"
      text="Live server-side automation status from Supabase and n8n."
    />

    <div className="workflow-grid">
      {workflows.map(flow=>{
        const latest=latestRun(flow.key)
        const Icon=flow.icon

        return (
          <Card key={flow.key} className="workflow-card">
            <div className="workflow-head">
              <div className="iconbox">
                <Icon/>
              </div>

              <Badge type="green">
                Active
              </Badge>
            </div>

            <b className="workflow-title">
              {flow.title}
            </b>

            <p className="muted">
              {flow.description}
            </p>

            <div className="workflow-meta">
              <span>
                <Zap size={14}/>
                {countRuns(flow.key)} recent runs
              </span>

              <span>
                <Clock3 size={14}/>
                {flow.schedule}
              </span>
            </div>

            <div className="workflow-footer">
              <span className="muted">
                {latest
                  ? 'Last run: '+
                    new Date(
                      latest.created_at
                    ).toLocaleString()
                  : 'No run recorded yet'}
              </span>
            </div>
          </Card>
        )
      })}
    </div>

    <Card>
      <SectionHead
        eyebrow="Live activity"
        title="Recent automation runs"
        icon={Zap}
      />

      {loading ?
        <p className="muted">
          Loading automation activity...
        </p>
      :
        runs.length===0 ?
          <p className="muted">
            No automation runs recorded yet.
          </p>
        :
          <div className="activity-log">
            {runs.slice(0,15).map(run=>
              <div
                className="activity-item"
                key={run.id}
              >
                <div className="activity-dot success"/>

                <div className="grow">
                  <b>
                    {run.action_type || run.workflow_key}
                  </b>

                  <span>
                    {run.student_name}
                    {run.weak_topic
                      ? ' · '+run.weak_topic
                      : ''}
                    {run.risk_score!==null &&
                     run.risk_score!==undefined
                      ? ' · '+run.risk_score
                      : ''}
                  </span>
                </div>

                <div className="activity-time">
                  <span>
                    {new Date(
                      run.created_at
                    ).toLocaleString()}
                  </span>

                  <Badge type="green">
                    {run.status}
                  </Badge>
                </div>
              </div>
            )}
          </div>
      }
    </Card>
  </>
}

function Announcements(){

  const [title,setTitle]=useState('')
  const [message,setMessage]=useState('')
  const [sending,setSending]=useState(false)
  const [status,setStatus]=useState(null)
  const [announcements,setAnnouncements]=useState([])

  useEffect(()=>{
    loadAnnouncements()
  },[])

  async function loadAnnouncements(){
    const {data,error}=await supabase
      .from('announcements')
      .select('id,title,message,audience,created_at')
      .order('created_at',{ascending:false})
      .limit(10)

    if(error){
      console.error('Could not load announcements',error)
      return
    }

    setAnnouncements(data||[])
  }

  async function sendAnnouncement(e){
    e.preventDefault()

    if(!title.trim() || !message.trim()) return

    setSending(true)
    setStatus(null)

    try{

      const {error:announcementError}=await supabase
        .from('announcements')
        .insert({
          title:title.trim(),
          message:message.trim(),
          audience:'all_students'
        })

      if(announcementError){
        throw announcementError
      }

      const {data:students,error:studentsError}=
        await supabase
          .from('profiles')
          .select('id')
          .eq('role','student')

      if(studentsError){
        throw studentsError
      }

      const notifications=(students||[]).map(student=>({
        profile_id:student.id,
        title:title.trim(),
        message:message.trim(),
        type:'announcement',
        read:false
      }))

      if(notifications.length){
        const {error:notificationError}=await supabase
          .from('notifications')
          .insert(notifications)

        if(notificationError){
          throw notificationError
        }
      }

      setTitle('')
      setMessage('')

      setStatus({
        type:'success',
        message:
          'Announcement sent to '+
          notifications.length+
          ' students.'
      })

      await loadAnnouncements()

    }catch(error){
      console.error(error)

      setStatus({
        type:'error',
        message:'Could not send announcement.'
      })

    }finally{
      setSending(false)
    }
  }

  return <>
    <PageTitle
      title="Announcements"
      text="Send real course updates and notifications to all students."
    />

    <div className="grid two">

      <Card>
        <SectionHead
          eyebrow="Compose"
          title="New announcement"
          icon={Megaphone}
        />

        <form onSubmit={sendAnnouncement}>

          <input
            value={title}
            onChange={e=>setTitle(e.target.value)}
            placeholder="Announcement title"
            disabled={sending}
          />

          <textarea
            value={message}
            onChange={e=>setMessage(e.target.value)}
            placeholder="Write your announcement..."
            disabled={sending}
          />

          <button
            className="primary"
            disabled={
              sending ||
              !title.trim() ||
              !message.trim()
            }
          >
            <Send size={17}/>
            {sending?'Sending...':'Send to all students'}
          </button>

        </form>

        {status&&
          <div className={
            'feedback '+
            (status.type==='success'?'good':'bad')
          }>
            {status.message}
          </div>
        }

      </Card>

      <Card>
        <SectionHead
          eyebrow="Recent"
          title="Latest announcements"
          icon={MessageCircle}
        />

        {announcements.length===0 ?
          <p className="muted">
            No announcements yet.
          </p>
        :
          announcements.map(item=>
            <div
              className="result-row"
              key={item.id}
            >
              <div>
                <b>{item.title}</b>
                <span>{item.message}</span>
                <small>
                  {new Date(
                    item.created_at
                  ).toLocaleString()}
                </small>
              </div>

              <CheckCircle2/>
            </div>
          )
        }

      </Card>

    </div>
  </>
}

function PageTitle({title,text}){return <div className="page-title"><div><h1>{title}</h1><p>{text}</p></div></div>}

export default function App(){
  const [mode,setMode]=useState('student')
  const [page,setPage]=useState('dashboard')
  const [data,setData]=useState(fallback)
  const [loading,setLoading]=useState(true)
  const [tutorPrompt,setTutorPrompt]=useState('')
  const [demoStudentName,setDemoStudentName]=
    useState('Omar Mohamed')
  useEffect(()=>{(async()=>{try{const [{data:profiles},{data:courses},{data:lessons},{data:plans}]=await Promise.all([supabase.from('profiles').select('*'),supabase.from('courses').select('*').limit(1),supabase.from('lessons').select('*').order('position'),supabase.from('study_plans').select('*').limit(1)]);setData({student:profiles?.find(p=>p.role==='student')||fallback.student,teacher:profiles?.find(p=>p.role==='teacher')||fallback.teacher,course:courses?.[0]||fallback.course,lessons:lessons?.length?lessons:fallback.lessons,plan:plans?.[0]?.tasks||fallback.plan})}catch(e){console.warn(e)}setLoading(false)})()},[])
  const menu=mode==='student'?nav:teacherNav

  const studentData={
    ...data,
    student:{
      ...data.student,
      full_name:demoStudentName
    }
  }

  function render(){if(mode==='student'){return page==='dashboard'
  ? <StudentDashboard
      data={studentData}
      setPage={setPage}
      setTutorPrompt={setTutorPrompt}
    />
  : page==='courses'
    ? <Courses
        data={data}
        studentName={demoStudentName}
      />
  : page==='tutor'
    ? <Tutor
        initialPrompt={tutorPrompt}
        studentName={demoStudentName}
      />
  : page==='quizzes'
    ? <Quizzes
        studentName={demoStudentName}
      />:page==='analytics'
    ? <StudentAnalytics
        studentName={demoStudentName}
      />
    : <Achievements/>}return page==='dashboard'?<TeacherDashboard/>:page==='students'?<TeacherStudents/>:page==='content'?<TeacherContent data={data}/>:page==='analytics'?<TeacherAnalytics/>:page==='automation'?<Automation/>:<Announcements/>}
  return <div className="app"><aside><div className="brand"><div className="logo"><GraduationCap/></div><div><b>CourseAI</b><span>Learning OS</span></div></div><nav>{menu.map(([id,label,Icon])=><button key={id} className={page===id?'active':''} onClick={()=>setPage(id)}><Icon/>{label}</button>)}</nav><div className="demo-note"><Sparkles/><div><b>Interactive demo</b><span>Supabase-connected prototype</span></div></div></aside><main><header><div><b>Biology Academy</b><span>{loading?'Syncing demo data...':'Live demo data connected'}</span></div><div className="header-actions">

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

<Bell size={18}/><div className="mode-switch"><button className={mode==='student'?'on':''} onClick={()=>{setMode('student');setPage('dashboard')}}>Student</button><button className={mode==='teacher'?'on':''} onClick={()=>{setMode('teacher');setPage('dashboard')}}>Teacher</button></div></div></header><div className="content">{render()}</div></main></div>
}
