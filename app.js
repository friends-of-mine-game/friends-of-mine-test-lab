(() => {
  const T = window.FOM_TEST;
  const key = `fom-test-lab:${T.id}:${T.version}`;
  let i = 0, responses = {}, startedAt;
  const $ = id => document.getElementById(id);
  const show = id => ['start','quiz','done'].forEach(x => $(x).classList.toggle('hidden', x !== id));
  $('title').textContent=T.title; $('intro').textContent=T.intro;
  const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  const persist=()=>localStorage.setItem(key,JSON.stringify({test_id:T.id,version:T.version,participant:$('participant').value.trim()||null,started_at:startedAt,current_question:i,responses}));
  const draft=read();
  if(draft?.responses&&Object.keys(draft.responses).length){responses=draft.responses;startedAt=draft.started_at;i=Math.min(Number(draft.current_question)||0,T.questions.length-1);$('participant').value=draft.participant||'';$('draftNotice').textContent=`Hay un borrador guardado con ${Object.keys(responses).length} respuestas.`;$('draftNotice').classList.remove('hidden');$('resetDraft').classList.remove('hidden');$('begin').textContent='Continuar'}
  $('participant').oninput=()=>{if(startedAt)persist()};
  $('begin').onclick=()=>{if(!startedAt)startedAt=new Date().toISOString();persist();show('quiz');render()};
  $('resetDraft').onclick=()=>{localStorage.removeItem(key);location.reload()};
  function save(q,field,value){responses[q.id]={...(responses[q.id]||{}),[field]:value};persist()}
  function render(){const q=T.questions[i];$('progressText').textContent=`${i+1} de ${T.questions.length}`;$('progressBar').style.width=`${(i+1)/T.questions.length*100}%`;$('section').textContent=q.section||'';$('question').textContent=q.text;$('context').textContent=q.context||'';$('answers').innerHTML='';$('confidence').innerHTML='';$('whyWrap').classList.toggle('hidden',!q.why);$('why').value=responses[q.id]?.why||'';
    if(q.type==='open'){const ta=document.createElement('textarea');ta.className='open';ta.placeholder='Escribe tu respuesta';ta.value=responses[q.id]?.value||'';ta.oninput=()=>save(q,'value',ta.value);$('answers').appendChild(ta)}else q.options.forEach(o=>{const l=document.createElement('label');l.className='option';const inp=document.createElement('input');inp.type=q.type==='multi'?'checkbox':'radio';inp.name=q.id;inp.value=o.id;const old=responses[q.id]?.value;inp.checked=Array.isArray(old)?old.includes(o.id):old===o.id;inp.onchange=()=>{if(q.type==='multi'){const v=[...document.querySelectorAll(`input[name="${q.id}"]:checked`)].map(x=>x.value);if(q.max&&v.length>q.max){inp.checked=false;return}save(q,'value',v)}else save(q,'value',inp.value)};l.append(inp,document.createTextNode(`${o.id}. ${o.text}`));$('answers').appendChild(l)});
    for(let v=1;v<=5;v++){const l=document.createElement('label');l.className='confidence-option';const inp=document.createElement('input');inp.type='radio';inp.name=`confidence-${q.id}`;inp.value=String(v);inp.checked=responses[q.id]?.confidence===v;inp.onchange=()=>save(q,'confidence',v);l.append(inp,document.createTextNode(String(v)));$('confidence').appendChild(l)}$('back').disabled=i===0;$('next').textContent=i===T.questions.length-1?'Terminar':'Siguiente';persist()}
  $('why').oninput=()=>save(T.questions[i],'why',$('why').value);
  $('back').onclick=()=>{if(i>0){i--;persist();render()}};
  $('next').onclick=()=>{const q=T.questions[i],r=responses[q.id];if(!r||r.value===''||(Array.isArray(r.value)&&!r.value.length)){alert('Responde antes de continuar.');return}if(!r.confidence){alert('Indica tu confianza de 1 a 5.');return}if(q.why&&!$('why').value.trim()){alert('Añade una frase explicando por qué.');return}if(i<T.questions.length-1){i++;persist();render()}else{persist();show('done')}};
  const payload=()=>({test_id:T.id,version:T.version,participant:$('participant').value.trim()||null,started_at:startedAt,completed_at:new Date().toISOString(),responses});
  $('download').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload(),null,2)],{type:'application/json'}));a.download=`${T.id}-${$('participant').value.trim()||'anonimo'}-${Date.now()}.json`;a.click()};
  $('preview').onclick=()=>{const p=$('jsonPreview');p.textContent=JSON.stringify(payload(),null,2);p.classList.toggle('hidden');$('preview').textContent=p.classList.contains('hidden')?'Ver JSON guardado':'Ocultar JSON'};
})();