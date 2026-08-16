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
   1. Student notification state
========================================= */

mustReplace(
`  const [atRiskIntervention,setAtRiskIntervention]=useState(null)`,
`  const [atRiskIntervention,setAtRiskIntervention]=useState(null)
  const [studentNotifications,setStudentNotifications]=useState([])
  const [notificationsLoading,setNotificationsLoading]=useState(false)`,
'student notification state'
);

/* =========================================
   2. Load notifications when student changes
========================================= */

mustReplace(
`    loadRevisionPlan()
    loadInactiveFollowup()
    loadAtRiskIntervention()`,
`    loadRevisionPlan()
    loadInactiveFollowup()
    loadAtRiskIntervention()
    loadStudentNotifications()`,
'notification loader call'
);

/* =========================================
   3. Notification functions
========================================= */

mustReplace(
`  async function loadAtRiskIntervention(){`,
`  async function loadStudentNotifications(){
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

  async function loadAtRiskIntervention(){`,
'student notification functions'
);

/* =========================================
   4. Student notification panel
========================================= */

mustReplace(
`    {atRiskIntervention&&
      <Card className="welcome-back-card">`,
`    {studentNotifications.length>0&&
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
      <Card className="welcome-back-card">`,
'student notification panel'
);

/* =========================================
   5. Replace Teacher Announcements page
========================================= */

const start=s.indexOf('function Announcements(){');
const end=s.indexOf('function PageTitle({title,text})');

if(start===-1 || end===-1 || end<=start){
  throw new Error('Announcements block not found');
}

const announcementsBlock=`function Announcements(){

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

`;

s=
  s.slice(0,start)+
  announcementsBlock+
  s.slice(end);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log(
  'CourseAI V26 live announcements and notifications applied successfully.'
);
console.log('');
