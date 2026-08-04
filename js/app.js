/* ============ أدوات ============ */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const AR_NUM=n=>String(n).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]);
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2600);}

const TEMPLATES=[
 {n:'رسمي راقٍ',t:'زميلي المعلم الفاضل / [[TO]]   حفظه الله\nالسلام عليكم ورحمة الله وبركاته،\nأستأذن كريمَ خلقكم في السماح للطلاب المدوَّنة أسماؤهم أدناه بدخول حصتكم؛ فقد كانوا لديّ في [[REASON]]، وقد حرصوا على العودة إليكم فور انتهائهم. فلكم مني جزيل الشكر على رحابة صدركم، ودمتم عونًا لأبنائنا.'},
 {n:'ودّي قريب',t:'معلمنا الغالي / [[TO]]\nلم يتأخر هؤلاء عن حصتك رغبةً عنها، بل كانوا لديّ في [[REASON]]. فافتح لهم بابك كعادتك، واحسب هذا التأخير لهم لا عليهم، وأبقِ لهم مقاعدهم بين يديك. شكرًا لك.'},
 {n:'تربوي مباشر',t:'الأستاذ الفاضل / [[TO]]\nنأمل التكرّم بالسماح للطلاب الموضحة أسماؤهم بدخول الحصة، وقد كانوا مشاركين معنا في [[REASON]]. تأخّرهم بعذر مقبول، ونثق بتعويضكم لهم ما فاتهم. جزاكم الله خيرًا.'},
 {n:'بلاغي مميّز',t:'إلى من يزيّن صفَّه بعلمه، الأستاذ / [[TO]]\nهؤلاء أبناؤك عادوا إليك يحملون اعتذارًا صادقًا؛ فقد استأثرنا بوقتهم في [[REASON]]، وما تأخُّرهم إلا لعذر، وما شوقهم إلا إلى مقعدهم بين يديك. فأذن لهم مأجورًا مشكورًا.'},
 {n:'موجز سريع',t:'الأستاذ / [[TO]]\nيرجى السماح للطلاب أدناه بدخول الحصة، وقد كانوا لديّ في [[REASON]]. شاكرًا تعاونكم.'}
];
const REASONS=['الإذاعة المدرسية','نشاط لا صفي','مقابلة الإرشاد الطلابي','تكليف إداري','معالجة درس سابق','اختبار تعويضي','مسابقة مدرسية','العيادة والإسعافات','تنظيم فعالية','اجتماع لجنة طلابية'];

/* ============ التخزين الدائم — IndexedDB ============ */
const DB_NAME='ClassPermitDB', STORE='appState', DKEY='main';
let _db=null, storageMode='memory';
function openDB(){
  return new Promise((res,rej)=>{
    if(_db) return res(_db);
    if(!('indexedDB' in window)) return rej(new Error('no-idb'));
    const rq=indexedDB.open(DB_NAME,1);
    rq.onupgradeneeded=()=>{ const db=rq.result; if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE); };
    rq.onsuccess=()=>{ _db=rq.result; res(_db); };
    rq.onerror=()=>rej(rq.error||new Error('idb-blocked'));
    rq.onblocked=()=>rej(new Error('idb-blocked'));
  });
}
function tx(mode){ return openDB().then(db=>db.transaction(STORE,mode).objectStore(STORE)); }
function dbGet(k){ return tx('readonly').then(st=>new Promise((res,rej)=>{ const r=st.get(k); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); })); }
function dbPut(k,v){ return tx('readwrite').then(st=>new Promise((res,rej)=>{ const r=st.put(v,k); r.onsuccess=()=>res(1); r.onerror=()=>rej(r.error); })); }
function dbDel(k){ return tx('readwrite').then(st=>new Promise((res,rej)=>{ const r=st.delete(k); r.onsuccess=()=>res(1); r.onerror=()=>rej(r.error); })); }

const DEFAULTS={school:{name:'',teacher:'',principal:'',authority:'',cc:'966'},students:[],teachers:[],log:[],serial:1,tpl:0};
let S=JSON.parse(JSON.stringify(DEFAULTS));
let sel=new Set(), selT=new Set(), current=null, curTo=0;

async function loadState(){
  try{
    const v=await dbGet(DKEY);
    storageMode='idb';
    if(v) S=Object.assign(JSON.parse(JSON.stringify(DEFAULTS)),typeof v==='string'?JSON.parse(v):v);
    try{ if(navigator.storage&&navigator.storage.persist) await navigator.storage.persist(); }catch(e){}
  }catch(e){
    try{ if(window.storage){ const r=await window.storage.get('class_permit_state'); storageMode='fallback'; if(r&&r.value) S=Object.assign(JSON.parse(JSON.stringify(DEFAULTS)),JSON.parse(r.value)); } }catch(e2){ storageMode='memory'; }
  }
  paintDbBadge();
}
let saveTimer;
function save(){
  clearTimeout(saveTimer);
  saveTimer=setTimeout(async()=>{
    const data=JSON.parse(JSON.stringify(S));
    if(storageMode==='idb'){ try{ await dbPut(DKEY,data); return; }catch(e){ storageMode='fallback'; paintDbBadge(); } }
    if(storageMode==='fallback'){ try{ if(window.storage) await window.storage.set('class_permit_state',JSON.stringify(data)); }catch(e){ storageMode='memory'; paintDbBadge(); } }
  },140);
}
function paintDbBadge(){
  const b=$('#dbBadge'), i=$('#dbInfo');
  if(storageMode==='idb'){ b.textContent='حفظ دائم ✓'; b.classList.remove('warn');
    i.textContent='التخزين: IndexedDB داخل جهازك. البيانات تبقى بعد إغلاق التطبيق ولا تُحذف إلا بأمرك من زر الحذف بالأسفل.'; }
  else if(storageMode==='fallback'){ b.textContent='حفظ مؤقت'; b.classList.add('warn');
    i.textContent='تعذّر فتح IndexedDB في هذه النافذة، ويُستخدم تخزين بديل. نزّل الملف وافتحه في المتصفح مباشرة ليعمل الحفظ الدائم.'; }
  else{ b.textContent='بدون حفظ'; b.classList.add('warn');
    i.textContent='المتصفح يمنع التخزين هنا. نزّل ملف التطبيق وافتحه مباشرة في المتصفح ليُفعَّل الحفظ الدائم، أو استخدم النسخ الاحتياطي.'; }
}

/* ============ التواريخ ============ */
function fmtDate(iso,mode){
  if(!iso) return '—';
  const d=new Date(iso+'T00:00:00');
  const g=new Intl.DateTimeFormat('ar-u-ca-gregory-nu-latn',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d)+' م';
  let h=''; try{ h=new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d).replace(/\s*هـ.*/,'')+' هـ'; }catch(e){}
  if(mode==='g'||!h) return g; if(mode==='h') return h; return h+' · '+g;
}
function fmtTime(t){ if(!t) return '—'; const [H,M]=t.split(':').map(Number); const s=H>=12?'م':'ص'; const h=H%12===0?12:H%12; return `${h}:${String(M).padStart(2,'0')} ${s}`; }

/* ============ التنقّل ============ */
function setTab(name){
  $$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.tab===name));
  $$('.page').forEach(p=>p.classList.remove('active'));
  const pg=$('#page-'+name); if(pg) pg.classList.add('active');
  closeSidebar(); window.scrollTo({top:0,behavior:'smooth'}); syncSticky();
}
$$('.nav-item').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
function openSidebar(){ $('#sidebar').classList.add('open'); $('#scrim').classList.add('on'); }
function closeSidebar(){ $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('on'); }
$('#burger').onclick=openSidebar;
$('#scrim').onclick=closeSidebar;
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ closeSidebar(); closeModal(); } });
function goTab(n){ setTab(n); }

/* ============ نافذة ============ */
function openModal(html){ $('#modal').innerHTML=html; $('#overlay').classList.add('open'); }
function closeModal(){ $('#overlay').classList.remove('open'); $('#modal').innerHTML=''; }
window.closeModal=closeModal;
$('#overlay').addEventListener('click',e=>{ if(e.target.id==='overlay') closeModal(); });
function confirmBox(title,msg,ok,fn){
  openModal(`<h3>${esc(title)}<button class="x" onclick="closeModal()">×</button></h3>
  <p style="font-size:13.5px;font-weight:600;line-height:1.9;color:var(--ink-2);margin:0 0 16px">${esc(msg)}</p>
  <div class="row"><button class="btn danger" id="cfYes">${esc(ok)}</button><button class="btn ghost" onclick="closeModal()">تراجع</button></div>`);
  $('#cfYes').onclick=()=>{ closeModal(); fn(); };
}

/* ============ الطلاب ============ */
const WA_ICON='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.13c-.24.68-1.42 1.31-1.96 1.35-.5.04-.98.22-3.3-.69-2.79-1.1-4.55-3.95-4.69-4.14-.14-.19-1.12-1.49-1.12-2.84s.71-2.01.96-2.29c.25-.28.55-.35.73-.35h.52c.17 0 .4-.06.62.47.24.57.8 1.97.87 2.11.07.14.12.31.02.5-.09.19-.14.31-.28.47-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.28.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.17-.19.69-.8.87-1.08.19-.28.37-.23.62-.14.25.09 1.6.75 1.87.89.28.14.46.21.53.33.07.12.07.68-.17 1.36z"/></svg>';
function studentCards(list){
  if(!list.length) return `<div class="empty"><b>لا يوجد طلاب بعد</b>أضف الأسماء من «الطلاب» أو استوردها من ملف إكسل.</div>`;
  return `<div class="students-grid">`+list.map(s=>`
    <div class="srow ${sel.has(s.id)?'sel':''}" data-id="${s.id}">
      <span class="pick"></span>
      <div class="sinfo">
        <b class="sname">${esc(s.name)}</b>
        <span class="smeta">${s.count?('تصاريحه: '+s.count+' · آخرها '+esc(s.last||'—')):'لا تصاريح سابقة'}</span>
      </div>
      <span class="tally ${s.count?'':'zero'}">${s.count||0}</span>
      <button class="wa-mini" data-wa="${s.id}" aria-label="إرسال تصريح لهذا الطالب">${WA_ICON}</button>
    </div>`).join('')+`</div>`;
}
function renderIssueStudents(){
  const q=($('#qStudents').value||'').trim();
  $('#issueStudents').innerHTML=studentCards(S.students.filter(s=>!q||s.name.includes(q)));
  const root=$('#issueStudents');
  $$('.srow',root).forEach(c=>c.onclick=e=>{ if(e.target.closest('[data-wa]')) return;
    const id=c.dataset.id; sel.has(id)?sel.delete(id):sel.add(id); c.classList.toggle('sel'); syncSticky(); });
  $$('[data-wa]',root).forEach(b=>b.onclick=()=>{ sel=new Set([b.dataset.wa]); renderIssueStudents(); makePermit(true); });
}
function syncSticky(){
  const on=sel.size>0&&$('#page-issue').classList.contains('active');
  $('#stickyBar').classList.toggle('on',on);
  $('#stickyInfo').innerHTML=`محدَّد: <b>${AR_NUM(sel.size)}</b> من الطلاب`;
  $('#selSide').textContent=`${AR_NUM(sel.size)} محدَّد`;
}
function renderStudentsList(){
  const q=($('#qStudents2').value||'').trim();
  const list=S.students.filter(s=>!q||s.name.includes(q));
  $('#stCount').textContent=`${AR_NUM(S.students.length)} طالب`;
  $('#studentsList').innerHTML=list.length?list.map(s=>`
    <div class="list-item">
      <div class="av ${s.count?'red':''}">${s.count||0}</div>
      <div class="nm"><b>${esc(s.name)}</b><span>${s.count?('آخر تصريح: '+esc(s.last||'—')):'بلا تصاريح'}</span></div>
      <button class="icon-btn" data-ed="${s.id}">✎</button>
      <button class="icon-btn del" data-rm="${s.id}">✕</button>
    </div>`).join(''):`<div class="empty"><b>القائمة فارغة</b>أضف الأسماء بالأعلى أو استوردها من ملف.</div>`;
  $$('[data-rm]',$('#studentsList')).forEach(b=>b.onclick=()=>{ S.students=S.students.filter(x=>x.id!==b.dataset.rm); sel.delete(b.dataset.rm); save(); renderAll(); });
  $$('[data-ed]',$('#studentsList')).forEach(b=>b.onclick=()=>{
    const s=S.students.find(x=>x.id===b.dataset.ed);
    openModal(`<h3>تعديل بيانات الطالب<button class="x" onclick="closeModal()">×</button></h3>
      <div class="field"><label>الاسم</label><input type="text" id="edN" value="${esc(s.name)}"></div>
      <div class="field"><label>عدد التصاريح</label><input type="text" id="edC" value="${s.count||0}"></div>
      <div class="row"><button class="btn green" id="edGo">حفظ التعديل</button><button class="btn ghost" onclick="closeModal()">إلغاء</button></div>`);
    $('#edGo').onclick=()=>{ const n=$('#edN').value.trim(); if(n) s.name=n; s.count=Math.max(0,parseInt($('#edC').value)||0); save(); closeModal(); renderAll(); toast('حُفظ التعديل'); };
  });
}
function renderTeachers(){
  $('#thCount').textContent=`${AR_NUM(S.teachers.length)} معلم`;
  $('#teachersList').innerHTML=S.teachers.length?S.teachers.map(t=>`
    <div class="list-item">
      <div class="av">${esc(t.name.trim().replace(/^أ\.\s*/,'').charAt(0))}</div>
      <div class="nm"><b>${esc(t.name)}</b><span>${t.phone?esc(t.phone):'بدون رقم'}</span></div>
      <button class="icon-btn" data-ed="${t.id}">✎</button>
      <button class="icon-btn del" data-rm="${t.id}">✕</button>
    </div>`).join(''):`<div class="empty"><b>لا يوجد معلمون</b>أضف زملاءك لإرسال التصاريح إليهم مباشرة.</div>`;
  $$('[data-rm]',$('#teachersList')).forEach(b=>b.onclick=()=>{ S.teachers=S.teachers.filter(x=>x.id!==b.dataset.rm); selT.delete(b.dataset.rm); save(); renderAll(); });
  $$('[data-ed]',$('#teachersList')).forEach(b=>b.onclick=()=>{
    const t=S.teachers.find(x=>x.id===b.dataset.ed);
    openModal(`<h3>تعديل بيانات المعلم<button class="x" onclick="closeModal()">×</button></h3>
      <div class="field"><label>الاسم</label><input type="text" id="edN" value="${esc(t.name)}"></div>
      <div class="field"><label>رقم الجوال</label><input type="tel" id="edP" value="${esc(t.phone||'')}"></div>
      <div class="row"><button class="btn green" id="edGo">حفظ التعديل</button><button class="btn ghost" onclick="closeModal()">إلغاء</button></div>`);
    $('#edGo').onclick=()=>{ const n=$('#edN').value.trim(); if(n) t.name=n; t.phone=$('#edP').value.trim(); save(); closeModal(); renderAll(); toast('حُفظ التعديل'); };
  });
  $('#issueTeachers').innerHTML=S.teachers.length?S.teachers.map(t=>`
    <div class="tsel ${selT.has(t.id)?'on':''}" data-t="${t.id}">
      <div class="box">${selT.has(t.id)?'✓':''}</div>
      <div class="nm"><b>${esc(t.name)}</b><span>${t.phone?esc(t.phone):'بدون رقم — يُفتح واتساب لاختيار المستلم'}</span></div>
    </div>`).join(''):`<div class="empty"><b>لم تُضِف معلمين</b>أضفهم من تبويب «المعلمون»، أو أصدر التصريح دون تحديد معلم.</div>`;
  $$('[data-t]',$('#issueTeachers')).forEach(el=>el.onclick=()=>{ const id=el.dataset.t; selT.has(id)?selT.delete(id):selT.add(id); renderTeachers(); });
}
function renderLog(){
  $('#lgCount').textContent=`${AR_NUM(S.log.length)} تصريح`;
  $('#logList').innerHTML=S.log.length?S.log.slice().reverse().map(p=>{
    const nm=p.names.join('، ');
    return `<div class="list-item">
      <div class="av">#${p.serial}</div>
      <div class="nm"><b>${esc(nm.slice(0,40))}${nm.length>40?'…':''}</b>
      <span>${esc(fmtDate(p.date,'g'))} · ${esc(fmtTime(p.time))} · ${esc(p.subject||'—')} · ${AR_NUM(p.names.length)} طالب</span></div>
      <button class="icon-btn" data-open="${p.id}">↗</button>
      <button class="icon-btn del" data-rm="${p.id}">✕</button></div>`;
  }).join(''):`<div class="empty"><b>السجل فارغ</b>كل تصريح تُصدره يُحفظ هنا لإعادة إرساله لاحقًا.</div>`;
  $$('[data-open]',$('#logList')).forEach(b=>b.onclick=()=>{ current=S.log.find(x=>x.id===b.dataset.open); curTo=0; showPermit(); });
  $$('[data-rm]',$('#logList')).forEach(b=>b.onclick=()=>{ S.log=S.log.filter(x=>x.id!==b.dataset.rm); save(); renderLog(); renderKpi(); });
}
function renderSchool(){
  $('#sSchool').value=S.school.name||''; $('#sTeacher').value=S.school.teacher||'';
  $('#sPrincipal').value=S.school.principal||''; $('#sAuthority').value=S.school.authority||''; $('#sCC').value=S.school.cc||'966';
  const t=S.school.name?(S.school.name+(S.school.teacher?' · '+S.school.teacher:'')):'أدخل بيانات المدرسة من الإعدادات';
  $('#brandSchool').textContent=t; if($('#brandSchool2')) $('#brandSchool2').textContent=t;
}
function renderKpi(){
  const today=new Date().toISOString().slice(0,10);
  $('#kpiStudents').textContent=AR_NUM(S.students.length);
  $('#kpiTeachers').textContent=AR_NUM(S.teachers.length);
  $('#kpiToday').textContent=AR_NUM(S.log.filter(p=>p.date===today).length);
  $('#navStudents').textContent=AR_NUM(S.students.length);
  $('#navTeachers').textContent=AR_NUM(S.teachers.length);
  $('#navLog').textContent=AR_NUM(S.log.length);
}
function renderAll(){ renderIssueStudents(); renderStudentsList(); renderTeachers(); renderLog(); renderSchool(); renderKpi(); syncSticky(); }

/* ============ إصدار التصريح ============ */
function makePermit(quick){
  if(!sel.size){ toast('اختر طالبًا واحدًا على الأقل'); goTab('issue'); return; }
  const names=S.students.filter(s=>sel.has(s.id)).map(s=>s.name);
  const p={id:uid(),serial:S.serial,tpl:+$('#fTemplate').value||0,date:$('#fDate').value,time:$('#fTime').value,cal:$('#fCal').value,
    cls:$('#fClass').value.trim(),period:$('#fPeriod').value,subject:$('#fSubject').value.trim(),
    reason:$('#fReason').value.trim()||'مهمة مدرسية',ids:[...sel],names,teacherIds:[...selT],school:JSON.parse(JSON.stringify(S.school))};
  S.serial++; S.log.push(p);
  const today=fmtDate(p.date,'g');
  S.students.forEach(s=>{ if(sel.has(s.id)){ s.count=(s.count||0)+1; s.last=today; } });
  sel.clear(); save(); current=p; curTo=0; renderAll(); showPermit();
  if(quick) toast('تصريح سريع جاهز للإرسال');
}
function recipients(p){
  const ts=(p.teacherIds||[]).map(id=>S.teachers.find(t=>t.id===id)).filter(Boolean);
  return ts.length?ts:[{id:'-',name:'معلم الحصة القادمة',phone:''}];
}
function bodyText(p,to,html){
  const tpl=TEMPLATES[p.tpl]||TEMPLATES[0];
  if(!html) return tpl.t.replace(/\[\[TO\]\]/g,to).replace(/\[\[REASON\]\]/g,p.reason);
  return esc(tpl.t).replace(/\[\[TO\]\]/g,`<span class="to">${esc(to)}</span>`)
                   .replace(/\[\[REASON\]\]/g,`<span class="reason">${esc(p.reason)}</span>`).replace(/\n/g,'<br>');
}
function permitHTML(p,to){
  const sc=p.school||{}, cols=p.names.length>4?2:1;
  return `<div class="pc-band">
    <div><div class="auth">${esc(sc.authority||'وزارة التعليم')}</div><div class="sch">${esc(sc.name||'اسم المدرسة')}</div></div>
    <div class="sr"><span>رقم التصريح</span><b>${p.serial}</b></div></div>
   <div class="pc-title"><h2>تصريح دخول الصف</h2><div class="rule"></div><p>يُقدَّم إلى معلم الحصة</p></div>
   <div class="pc-meta">
     <div><span>الصف</span><b>${esc(p.cls||'—')}</b></div>
     <div><span>الحصة</span><b>${esc(p.period||'—')}</b></div>
     <div><span>المادة</span><b>${esc(p.subject||'—')}</b></div>
     <div><span>التاريخ</span><b>${esc(fmtDate(p.date,p.cal))}</b></div>
     <div><span>الوقت</span><b>${esc(fmtTime(p.time))}</b></div>
     <div><span>عدد الطلاب</span><b>${p.names.length}</b></div>
   </div>
   <div class="pc-body">${bodyText(p,to.name,true)}</div>
   <div class="pc-names"><div class="h"><span>أسماء الطلاب</span><span>${p.names.length} طالب</span></div>
     <div class="body">${p.names.map((n,i)=>`<div class="nm-item" style="width:${100/cols}%"><i>${i+1}</i>${esc(n)}</div>`).join('')}</div></div>
   <div class="pc-foot">
     <div class="pc-sign">المعلم المُصدِر<b>${esc(sc.teacher||'—')}</b></div>
     <div class="pc-stamp"><span>${esc((sc.name||'المدرسة').slice(0,20))}<br>تصريح معتمد</span></div>
     <div class="pc-sign">مدير المدرسة<b>${esc(sc.principal||'—')}</b></div>
   </div>
   <div class="pc-note">هذا التصريح صادر من معلم بالمدرسة، وهو إذن بدخول الحصة فقط ولا يُعد إذنًا بمغادرة المبنى.</div>
   <div class="pc-strip"></div>`;
}
function permitText(p,to){
  const L=[];
  L.push(`🏫 *${p.school.name||'المدرسة'}*`);
  if(p.school.authority) L.push(p.school.authority);
  L.push('━━━━━━━━━━━━━');
  L.push(`📋 *تصريح دخول الصف* — رقم ${p.serial}`);
  L.push('━━━━━━━━━━━━━');
  L.push(bodyText(p,to.name,false));
  L.push('━━━━━━━━━━━━━');
  L.push(`👨‍🏫 المعلم المُصدِر: ${p.school.teacher||'—'}`);
  L.push(`📚 المادة: ${p.subject||'—'}  |  الصف: ${p.cls||'—'}`);
  L.push(`⏱ الحصة: ${p.period||'—'}  |  الوقت: ${fmtTime(p.time)}`);
  L.push(`🗓 التاريخ: ${fmtDate(p.date,p.cal)}`);
  L.push(`👥 عدد الطلاب: ${p.names.length}`);
  L.push('━━━━━━━━━━━━━');
  L.push('*أسماء الطلاب:*');
  p.names.forEach((n,i)=>L.push(`${i+1}. ${n}`));
  L.push('━━━━━━━━━━━━━');
  L.push(`✍️ مدير المدرسة: ${p.school.principal||'—'}`);
  return L.join('\n');
}
function waNum(ph){
  let d=String(ph||'').replace(/\D/g,''); if(!d) return '';
  const cc=String(S.school.cc||'966').replace(/\D/g,'')||'966';
  if(d.startsWith('00')) d=d.slice(2); else if(d.startsWith('0')) d=cc+d.slice(1);
  else if(!d.startsWith(cc)&&d.length<=10) d=cc+d;
  return d;
}
function showPermit(){
  const p=current, tos=recipients(p);
  openModal(`<h3>التصريح جاهز — رقم ${p.serial}<button class="x" onclick="closeModal()">×</button></h3>
    ${tos.length>1?`<div class="row" style="margin-bottom:11px" id="toTabs">${tos.map((t,i)=>`<button class="chip ${i===curTo?'on':''}" data-i="${i}">${esc(t.name)}</button>`).join('')}</div>`:''}
    <div class="paper-scroll"><div id="cardWrap"><div id="permitCard"></div></div></div>
    <p class="lbl" style="margin:14px 0 7px">اختر طريقة الإرسال لكل معلم</p>
    <div id="sendList">${tos.map((t,i)=>`
      <div class="send-row">
        <div class="who"><b>${esc(t.name)}</b><span>${t.phone?esc(t.phone):'بدون رقم'}</span></div>
        <button class="btn wa sm" data-txt="${i}">نص</button>
        <button class="btn gold sm" data-img="${i}">صورة</button>
      </div>`).join('')}</div>
    <p style="margin:9px 0 0;font-size:11.5px;font-weight:600;color:var(--ink-2);line-height:1.7">
      «نص» يفتح محادثة المعلم مباشرة بالنص جاهزًا. و«صورة» تُنشئ بطاقة التصريح ثم تفتح مشاركة الجهاز — اختر واتساب ثم المعلم، لأن واتساب لا يسمح بإرفاق صورة تلقائيًا داخل محادثة محددة.</p>
    <div class="grid2" style="margin-top:12px">
      <button class="btn" id="copyTxt">نسخ النص</button>
      <button class="btn ghost" id="dlImg">حفظ الصورة في الجهاز</button>
    </div>`);
  paintCard();
  $$('#toTabs .chip').forEach(b=>b.onclick=()=>{ curTo=+b.dataset.i; showPermit(); });
  $$('[data-txt]').forEach(b=>b.onclick=()=>{ curTo=+b.dataset.txt; paintCard(); waSend(tos[curTo]); });
  $$('[data-img]').forEach(b=>b.onclick=()=>{ curTo=+b.dataset.img; paintCard(); shot(true,tos[curTo]); });
  $('#copyTxt').onclick=async()=>{ try{ await navigator.clipboard.writeText(permitText(p,tos[curTo])); toast('نُسخ نص التصريح'); }catch(e){ toast('تعذّر النسخ التلقائي'); } };
  $('#dlImg').onclick=()=>shot(false);
}
function paintCard(){
  const tos=recipients(current);
  $('#permitCard').innerHTML=permitHTML(current,tos[curTo]);
  const w=$('#cardWrap').clientWidth||700, k=Math.min(1,w/700);
  $('#permitCard').style.transform=`scale(${k})`;
  $('#cardWrap').style.height=($('#permitCard').offsetHeight*k)+'px';
}
function waSend(t){
  const txt=encodeURIComponent(permitText(current,t)), n=waNum(t.phone);
  const isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if(!n){ window.open(`https://wa.me/?text=${txt}`,'_blank'); toast('أضف رقم المعلم لفتح محادثته مباشرة'); return; }
  const web=`https://wa.me/${n}?text=${txt}`;
  if(isMobile){
    const app=`whatsapp://send?phone=${n}&text=${txt}`;
    let left=false;
    const mark=()=>{ if(document.hidden) left=true; };
    document.addEventListener('visibilitychange',mark,{once:true});
    window.location.href=app;
    setTimeout(()=>{ document.removeEventListener('visibilitychange',mark); if(!left&&!document.hidden) window.location.href=web; },1400);
  }else{
    window.open(web,'_blank');
  }
}
async function shot(share,teacher){
  const el=$('#permitCard'), wrap=$('#cardWrap'), tr=el.style.transform, h=wrap.style.height;
  el.style.transform='none'; wrap.style.height='auto';
  if(share) toast('جارٍ تجهيز الصورة…');
  try{
    const canvas=await html2canvas(el,{scale:2,backgroundColor:'#FFFDF8',useCORS:true,windowWidth:760});
    el.style.transform=tr; wrap.style.height=h;
    canvas.toBlob(async blob=>{
      const nm=teacher?String(teacher.name).replace(/[\\/:*?"<>|]/g,'') : '';
      const file=new File([blob],`تصريح-${current.serial}${nm?'-'+nm:''}.png`,{type:'image/png'});
      if(share&&navigator.canShare&&navigator.canShare({files:[file]})){
        try{ await navigator.share({files:[file],title:'تصريح دخول الصف',text:teacher?`تصريح دخول الصف — ${teacher.name}`:''}); return; }catch(e){ if(e&&e.name==='AbortError') return; }
      }
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=file.name; a.click();
      if(share&&teacher){ toast('حُفظت الصورة — أرفقها في محادثة المعلم'); setTimeout(()=>waSend(teacher),1200); }
      else toast('حُفظت الصورة في جهازك');
    },'image/png');
  }catch(e){ el.style.transform=tr; wrap.style.height=h; toast('تعذّر إنشاء الصورة — استخدم إرسال النص'); }
}

/* ============ الاستيراد ============ */
function pickFile(accept,cb){ const f=$('#filePicker'); f.value=''; f.accept=accept; f.onchange=e=>{ const file=e.target.files[0]; if(file) cb(file); }; f.click(); }
function splitRows(text){
  const lines=text.split(/\r?\n/).filter(l=>l.trim()!=='');
  const d=lines.some(l=>l.includes('\t'))?'\t':lines.some(l=>l.includes(','))?',':lines.some(l=>l.includes(';'))?';':lines.some(l=>l.includes('|'))?'|':null;
  return lines.map(l=>d?l.split(d).map(c=>c.trim()):[l.trim()]);
}
function colLetters(i){ let s=''; i++; while(i>0){ const m=(i-1)%26; s=String.fromCharCode(65+m)+s; i=Math.floor((i-1)/26); } return s; }
function chooseColumns(rows,mode,sheets,onSheet){
  const width=Math.max(...rows.map(r=>r.length),1);
  const opts=i=>Array.from({length:width},(_,c)=>`<option value="${c}" ${c===i?'selected':''}>العمود ${colLetters(c)} — ${esc(String(rows[0][c]||'').slice(0,18))||'فارغ'}</option>`).join('');
  openModal(`<h3>اختر العمود المطلوب<button class="x" onclick="closeModal()">×</button></h3>
    ${sheets?`<div class="field"><label>ورقة العمل</label><select id="mSheet">${sheets.map((s,i)=>`<option value="${i}">${esc(s)}</option>`).join('')}</select></div>`:''}
    <div class="field"><label>${mode==='teachers'?'عمود أسماء المعلمين':'عمود أسماء الطلاب'}</label><select id="mCol">${opts(0)}</select></div>
    ${mode==='teachers'?`<div class="field"><label>عمود أرقام الجوال (اختياري)</label><select id="mPhone"><option value="-1">بدون</option>${opts(-1)}</select></div>`:''}
    <label class="chip" style="display:inline-flex;gap:8px;align-items:center;margin-bottom:12px"><input type="checkbox" id="mHead" style="width:auto"> الصف الأول عناوين — تجاهله</label>
    <div class="field"><label>معاينة</label><div id="mPrev" style="font-size:13px;font-weight:600;line-height:1.9;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 12px;max-height:150px;overflow:auto"></div></div>
    <div class="row"><button class="btn green" id="mGo">استيراد</button><button class="btn ghost" onclick="closeModal()">إلغاء</button></div>`);
  const prev=()=>{
    const c=+$('#mCol').value, ph=$('#mPhone')?+$('#mPhone').value:-1, skip=$('#mHead').checked?1:0;
    const vals=rows.slice(skip).map(r=>({n:(r[c]||'').toString().trim(),p:ph>=0?(r[ph]||'').toString().trim():''})).filter(v=>v.n);
    $('#mPrev').innerHTML=vals.slice(0,8).map((v,i)=>`${i+1}. ${esc(v.n)}${v.p?' — '+esc(v.p):''}`).join('<br>')+(vals.length>8?`<br>… و${vals.length-8} أخرى`:'')||'لا توجد قيم في هذا العمود';
    return vals;
  };
  ['mCol','mPhone','mHead'].forEach(id=>{ const el=$('#'+id); if(el) el.onchange=prev; });
  if($('#mSheet')&&onSheet) $('#mSheet').onchange=e=>onSheet(+e.target.value);
  prev();
  $('#mGo').onclick=()=>{ const vals=prev(); if(!vals.length) return toast('العمود المختار فارغ');
    mode==='teachers'?addTeachers(vals):addStudents(vals.map(v=>v.n)); closeModal(); };
}
function importExcel(mode){
  pickFile('.xlsx,.xls,.csv',file=>{
    const r=new FileReader();
    r.onload=e=>{ try{
        const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});
        const get=i=>XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[i]],{header:1,defval:'',blankrows:false});
        const open=i=>{ const rows=get(i); if(!rows.length) return toast('الورقة فارغة'); chooseColumns(rows,mode,wb.SheetNames,open); };
        open(0);
      }catch(err){ toast('تعذّرت قراءة الملف'); } };
    r.readAsArrayBuffer(file);
  });
}
function importText(mode){
  pickFile('.txt,.csv,text/plain',file=>{
    const r=new FileReader();
    r.onload=e=>{ const rows=splitRows(e.target.result); if(!rows.length) return toast('الملف فارغ'); chooseColumns(rows,mode,null,null); };
    r.readAsText(file,'utf-8');
  });
}
function addStudents(names){
  let add=0; names.forEach(n=>{ n=String(n).trim(); if(!n||S.students.some(s=>s.name===n)) return; S.students.push({id:uid(),name:n,count:0,last:''}); add++; });
  save(); renderAll(); toast(add?`أُضيف ${add} طالبًا`:'الأسماء موجودة مسبقًا');
}
function addTeachers(list){
  let add=0; list.forEach(v=>{ const n=String(v.n).trim(); if(!n||S.teachers.some(t=>t.name===n)) return; S.teachers.push({id:uid(),name:n,phone:(v.p||'').trim()}); add++; });
  save(); renderAll(); toast(add?`أُضيف ${add} معلمًا`:'الأسماء موجودة مسبقًا');
}

/* ============ التصدير ============ */
function dl(blob,name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); }
function xlsxOut(rows,sheet,name){ const ws=XLSX.utils.aoa_to_sheet(rows), wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,sheet); XLSX.writeFile(wb,name); }

/* ============ الربط ============ */
$('#qStudents').oninput=renderIssueStudents;
$('#qStudents2').oninput=renderStudentsList;
$('#selAll').onclick=()=>{ S.students.forEach(s=>sel.add(s.id)); renderIssueStudents(); syncSticky(); };
$('#selNone').onclick=()=>{ sel.clear(); renderIssueStudents(); syncSticky(); };
$('#stickyGo').onclick=()=>makePermit(false);
$('#makePermit').onclick=()=>makePermit(false);
$('#stAdd').onclick=()=>{ const v=$('#stBulk').value.split(/\r?\n|،|,/).map(x=>x.trim()).filter(Boolean); if(!v.length) return toast('اكتب اسمًا واحدًا على الأقل'); addStudents(v); $('#stBulk').value=''; };
$('#stImportX').onclick=()=>importExcel('students');
$('#stImportT').onclick=()=>importText('students');
$('#stExport').onclick=()=>{ if(!S.students.length) return toast('لا يوجد طلاب'); xlsxOut([['الاسم','عدد التصاريح','آخر تصريح'],...S.students.map(s=>[s.name,s.count||0,s.last||''])],'الطلاب','الطلاب.xlsx'); };
$('#stClear').onclick=()=>confirmBox('حذف كل الطلاب','ستُحذف قائمة الطلاب وعدّاداتها نهائيًا.','احذف الطلاب',()=>{ S.students=[]; sel.clear(); save(); renderAll(); toast('حُذف الطلاب'); });
$('#stResetCounts').onclick=()=>confirmBox('تصفير العدادات','تعود عدادات التصاريح إلى صفر وتبقى الأسماء كما هي.','صفّر العدادات',()=>{ S.students.forEach(s=>{s.count=0;s.last='';}); save(); renderAll(); toast('صُفّرت العدادات'); });
$('#thAdd').onclick=()=>{ const n=$('#thName').value.trim(); if(!n) return toast('اكتب اسم المعلم'); addTeachers([{n,p:$('#thPhone').value.trim()}]); $('#thName').value=''; $('#thPhone').value=''; };
$('#thImportX').onclick=()=>importExcel('teachers');
$('#thImportT').onclick=()=>importText('teachers');
$('#thExport').onclick=()=>{ if(!S.teachers.length) return toast('لا يوجد معلمون'); xlsxOut([['الاسم','الجوال'],...S.teachers.map(t=>[t.name,t.phone||''])],'المعلمون','المعلمون.xlsx'); };
$('#thClear').onclick=()=>confirmBox('حذف كل المعلمين','ستُحذف قائمة المعلمين وأرقامهم.','احذف المعلمين',()=>{ S.teachers=[]; selT.clear(); save(); renderAll(); toast('حُذف المعلمون'); });
$('#lgExport').onclick=()=>{ if(!S.log.length) return toast('السجل فارغ'); xlsxOut([['رقم','التاريخ','الوقت','الصف','الحصة','المادة','السبب','عدد الطلاب','الطلاب','المعلمون'],...S.log.map(p=>[p.serial,fmtDate(p.date,'g'),fmtTime(p.time),p.cls,p.period,p.subject,p.reason,p.names.length,p.names.join('، '),recipients(p).map(t=>t.name).join('، ')])],'السجل','سجل-التصاريح.xlsx'); };
$('#lgClear').onclick=()=>confirmBox('حذف السجل','ستُحذف التصاريح المحفوظة، وتبقى قوائم الطلاب والمعلمين.','احذف السجل',()=>{ S.log=[]; save(); renderLog(); renderKpi(); toast('حُذف السجل'); });
$('#saveSchool').onclick=()=>{ S.school={name:$('#sSchool').value.trim(),teacher:$('#sTeacher').value.trim(),principal:$('#sPrincipal').value.trim(),authority:$('#sAuthority').value.trim(),cc:$('#sCC').value.trim()||'966'}; save(); renderSchool(); toast('حُفظت بيانات المدرسة'); };
$('#expAll').onclick=()=>{ dl(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}),'نسخة-تصريح-دخول-الصف.json'); toast('صُدّرت النسخة الاحتياطية'); };
$('#impAll').onclick=()=>pickFile('.json,application/json',f=>{ const r=new FileReader(); r.onload=e=>{ try{ S=Object.assign(JSON.parse(JSON.stringify(DEFAULTS)),JSON.parse(e.target.result)); sel.clear(); selT.clear(); save(); renderAll(); toast('استُعيدت البيانات'); }catch(err){ toast('الملف غير صالح'); } }; r.readAsText(f,'utf-8'); });
$('#wipeAll').onclick=()=>confirmBox('حذف كل البيانات','سيُحذف الطلاب والمعلمون والسجل وبيانات المدرسة من ذاكرة الجهاز. لا يمكن التراجع.','احذف كل شيء',async()=>{
  S=JSON.parse(JSON.stringify(DEFAULTS)); sel.clear(); selT.clear();
  try{ await dbDel(DKEY); }catch(e){}
  try{ if(window.storage) await window.storage.delete('class_permit_state'); }catch(e){}
  save(); renderAll(); $('#fReason').value=''; $$('#reasonChips .chip').forEach(x=>x.classList.remove('on')); toast('حُذفت كل البيانات');
});

/* ============ التهيئة ============ */
$('#fTemplate').innerHTML=TEMPLATES.map((t,i)=>`<option value="${i}">${t.n}</option>`).join('');
$('#fTemplate').onchange=()=>{ S.tpl=+$('#fTemplate').value; save(); };
$('#reasonChips').innerHTML=REASONS.map(r=>`<button class="chip" data-r="${esc(r)}">${esc(r)}</button>`).join('');
$$('#segCal button').forEach(b=>b.onclick=()=>{ $('#fCal').value=b.dataset.v; $$('#segCal button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); });
$$('#reasonChips .chip').forEach(b=>b.onclick=()=>{ $('#fReason').value=b.dataset.r; $$('#reasonChips .chip').forEach(x=>x.classList.remove('on')); b.classList.add('on'); });
$$('[data-toggle]').forEach(h=>h.onclick=()=>{ const c=$('#'+h.dataset.toggle); if(c) c.classList.toggle('collapsed'); });
window.addEventListener('resize',()=>{ if($('#permitCard')) paintCard(); });

(async()=>{
  await loadState();
  const now=new Date();
  $('#fDate').value=now.toISOString().slice(0,10);
  $('#fTime').value=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  $('#fTemplate').value=S.tpl||0;
  renderAll();
  if(!S.students.length) $('#addStudentsCard').classList.remove('collapsed');
  if(!S.teachers.length) $('#addTeacherCard').classList.remove('collapsed');
})();

/* ============ PWA: عامل الخدمة والتثبيت ============ */
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
let deferredPrompt=null;
const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=/iPhone|iPad|iPod/i.test(navigator.userAgent);
function showInstallCard(ios){
  const c=$('#installCard'); if(!c||standalone) return;
  c.style.display='';
  if(ios){ $('#installBtn').style.display='none'; $('#iosHint').style.display='block'; }
}
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferredPrompt=e; showInstallCard(false); });
window.addEventListener('appinstalled',()=>{ const c=$('#installCard'); if(c) c.style.display='none'; toast('تم تثبيت التطبيق'); });
if($('#installBtn')) $('#installBtn').onclick=async()=>{
  if(!deferredPrompt) return toast('التثبيت متاح من قائمة المتصفح: «إضافة إلى الشاشة الرئيسية»');
  deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null;
};
if(isIOS) showInstallCard(true);
