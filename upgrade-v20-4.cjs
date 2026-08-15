const fs = require('fs');

const path = './src/App.jsx';
let s = fs.readFileSync(path, 'utf8');

const oldBlock = `<div className="detail-stats"><div><b>{selected.progress}%</b><span>Progress</span></div><div><b>{selected.score}%</b><span>Quiz avg.</span></div><div><b>{selected.risk}</b><span>Risk score</span></div><div><b>{selected.trend}</b><span>Trend</span></div></div>`;

const newBlock = `<div className="detail-stats">

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

</div>`;

if(!s.includes(oldBlock)){
  throw new Error('Could not find StudentTableCustom detail stats');
}

s=s.replace(oldBlock,newBlock);

fs.writeFileSync(path,s,'utf8');

console.log('');
console.log('CourseAI V20.4 Students page recovery added successfully.');
console.log('');
