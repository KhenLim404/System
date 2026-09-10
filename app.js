const records = [
 {id:"24100969",name:"Zach Bacolod",department:"DCISM",program:"BSIT",status:"Active",year:"2024",email:"24100969@usc.edu",phone:"0909123456"},
 {id:"24105516",name:"Khen Lim",department:"DCISM",program:"BSIT",status:"Active",year:"2024",email:"24105516@usc.edu",phone:""},
 {id:"24400014",name:"Cris Arquiza",department:"SOE",program:"Civil Engineering",status:"Pending",year:"2023",email:"24400014@usc.edu",phone:"+1 555 019 3232"},
 {id:"07500881",name:"Ritz Montalban",department:"SHCP",program:"Nursing",status:"Active",year:"2012",email:"07500881@usc.edu",phone:"0912345678"}
];

const page=document.body.dataset.page;

function drawDashboard(){
 if(page!=='dashboard')return;
 const total=records.length, active=records.filter(r=>r.status==='Active').length, pending=records.filter(r=>r.status==='Pending').length;
 document.getElementById('totalRecords').textContent=total;
 document.getElementById('activeRecords').textContent=active;
 document.getElementById('pendingRecords').textContent=pending;
 document.getElementById('departmentCount').textContent=new Set(records.map(r=>r.department)).size;
 const deptMap={}; records.forEach(r=>deptMap[r.department]=(deptMap[r.department]||0)+1);
 const bars=document.getElementById('chartBars'); bars.innerHTML='';
 const max=Math.max(...Object.values(deptMap));
 for(const d of Object.keys(deptMap)){
  const item=document.createElement('div'); item.className='chart-bar-wrap';
  const val=document.createElement('span'); val.className='chart-bar-value'; val.textContent=deptMap[d];
  const bar=document.createElement('div'); bar.className='chart-bar'; bar.style.height=Math.round(24+(deptMap[d]/max)*160)+'px';
  const label=document.createElement('span'); label.className='chart-bar-label'; label.textContent=d.slice(0,3);
  item.append(val,bar,label); bars.appendChild(item);
 }
 const latest=[...records].sort((a,b)=>b.year-a.year)[0];
 document.getElementById('latestRecord').innerHTML='<span class="latest-name">'+latest.name+'</span><span class="latest-meta">'+latest.department+' � '+latest.id+'</span>';
 document.getElementById('lastUpdated').textContent=new Date().toLocaleDateString();
 document.getElementById('latestProgram').textContent=latest.program;
}

function drawRecords(){
 if(page!=='records')return;
 const table=document.getElementById('recordsTableBody');
 function render(items){
  table.innerHTML = items.map(r=>`<tr><td class="student-id">${r.id}</td><td class="student-name">${r.name}</td><td>${r.department}</td><td>${r.program}</td><td><span class="status status-${r.status.toLowerCase()}">${r.status}</span></td><td>${r.year}</td><td>${r.email}</td><td><button class="table-button edit-button" data-id="${r.id}">Edit</button><button class="table-button delete-button" data-id="${r.id}">Delete</button></td></tr>`).join('');
  table.querySelectorAll('button').forEach(b=>b.onclick=()=>b.textContent==='Edit'?location.href='edit.html?id='+b.dataset.id:deleteRecord(b.dataset.id));
 }
 document.getElementById('searchRecords').addEventListener('input',e=>render(records.filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(e.target.value.toLowerCase())))));
 render(records);
}

function deleteRecord(id){ if(confirm('Delete '+id+'?')){ const i=records.findIndex(r=>r.id===id); if(i>=0){records.splice(i,1); drawRecords();} } }

function addRecord(){
 if(page!=='add')return;
 document.getElementById('recordForm').addEventListener('submit',e=>{e.preventDefault(); const f=new FormData(e.target); records.push({id:f.get('studentId').toString().trim(),name:f.get('studentName').toString().trim(),department:f.get('department'),program:f.get('program').toString().trim(),status:f.get('status'),year:f.get('year'),email:f.get('email').toString().trim(),phone:f.get('phone').toString().trim()}); e.target.reset(); location.href='records.html';});
}

function editRecord(){
 if(page!=='edit')return;
 const id=new URLSearchParams(location.search).get('id')||records[0].id;
 const r=records.find(x=>x.id===id)||records[0];
 for(const k of ['StudentName','StudentId','Department','Program','Email','Phone','Year','Status']){
  const el=document.getElementById('edit'+k); if(el) el.value = k==='StudentId'?r.id:k==='StudentName'?r.name:k==='Department'?r.department:k==='Program'?r.program:k==='Email'?r.email:k==='Phone'?r.phone:k==='Year'?r.year:r.status;
 }
 document.getElementById('editRecordForm').addEventListener('submit',e=>{e.preventDefault(); const f=new FormData(e.target); const idx=records.findIndex(x=>x.id===r.id); records[idx]={id:f.get('studentId').toString().trim(),name:f.get('studentName').toString().trim(),department:f.get('department'),program:f.get('program').toString().trim(),status:f.get('status'),year:f.get('year'),email:f.get('email').toString().trim(),phone:f.get('phone').toString().trim()}; location.href='records.html';});
}

drawDashboard(); drawRecords(); addRecord(); editRecord();
