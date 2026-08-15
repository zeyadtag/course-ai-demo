const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path, 'utf8');

const oldText = `<div>
  <b>
    {selected.improvement!==null && selected.improvement!==undefined
      ? '+'+selected.improvement+' pts'
      : '—'}
  </b>
  <span>Recovery</span>
</div>
<div><b>{selected.trend}</b><span>Trend</span></div>`;

const newText = `<div>
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
</div>`;

if(!s.includes(oldText)){
  throw new Error('Could not find teacher recovery block');
}

s = s.replace(oldText,newText);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log('CourseAI V20.3 teacher score comparison added successfully.');
console.log('');
