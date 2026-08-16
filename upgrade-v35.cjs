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
   1. Add daysInactive to live student stats
========================================= */

mustReplace(
`    weakTopic:'General review',
    points:0,
    streak:0`,
`    weakTopic:'General review',
    points:0,
    streak:0,
    daysInactive:0`,
'student stats state'
);

mustReplace(
`.from('enrollments')
        .select('progress')`,
`.from('enrollments')
        .select('progress,last_activity_at')`,
'student enrollment activity'
);

mustReplace(
`    setLiveStudentStats({
      progress:Number(enrollment?.progress||0),
      quizAverage,
      weakTopic,
      points:Number(profile.points||0),
      streak:Number(profile.streak||0)
    })`,
`    const lastActivity=
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

    setLiveStudentStats({
      progress:Number(enrollment?.progress||0),
      quizAverage,
      weakTopic,
      points:Number(profile.points||0),
      streak:Number(profile.streak||0),
      daysInactive
    })`,
'live student activity calculation'
);

/* =========================================
   2. Replace last hardcoded dashboard cards
========================================= */

mustReplace(
`<Card><SectionHead eyebrow="Next milestone" title="Quiz Master" icon={Trophy}/><p className="muted">Score 90%+ in two more quizzes to unlock 500 XP.</p><Progress value={67}/></Card><Card><SectionHead eyebrow="Upcoming" title="Weekly biology challenge" icon={CalendarDays}/><p className="muted">Saturday · 8:00 PM · 20 questions</p><Badge type="blue">Starts in 2 days</Badge></Card>`,
`<Card>
      <SectionHead
        eyebrow="Learning momentum"
        title="Current progress"
        icon={Trophy}
      />

      <p className="muted">
        Course completion based on your live enrollment record.
      </p>

      <Progress value={liveStudentStats.progress}/>

      <Badge type="green">
        {liveStudentStats.progress}% complete
      </Badge>
    </Card>

    <Card>
      <SectionHead
        eyebrow="Engagement"
        title="Activity status"
        icon={CalendarDays}
      />

      <p className="muted">
        {liveStudentStats.daysInactive===0
          ? 'Active today.'
          : 'Last active '+liveStudentStats.daysInactive+
            ' day'+
            (liveStudentStats.daysInactive===1?'':'s')+
            ' ago.'}
      </p>

      <Badge type={
        liveStudentStats.daysInactive>=5
          ? 'red'
          : liveStudentStats.daysInactive>=3
            ? 'blue'
            : 'green'
      }>
        {liveStudentStats.daysInactive>=5
          ? 'Inactive'
          : liveStudentStats.daysInactive>=3
            ? 'Monitor'
            : 'Active'}
      </Badge>
    </Card>`,
'student hardcoded cards'
);

/* =========================================
   3. Remove visible demo/prototype language
========================================= */

s=s.replaceAll(
  'Interactive demo',
  'CourseAI Platform'
);

s=s.replaceAll(
  'Supabase-connected prototype',
  'Supabase + n8n connected'
);

s=s.replaceAll(
  'Live demo data connected',
  'Live data connected'
);

s=s.replaceAll(
  'Syncing demo data...',
  'Syncing live data...'
);

s=s.replaceAll(
  'Student performance demo data.',
  'Student performance data.'
);

s=s.replaceAll(
  'Demo data',
  'Fallback data'
);

/* =========================================
   4. Cleaner app labels
========================================= */

s=s.replaceAll(
  'Learning OS',
  'AI Learning System'
);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log(
  'CourseAI V35 final production polish applied successfully.'
);
console.log('');
