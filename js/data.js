// ============================
// DATA STORE
// ============================
const DEPTS = ['DTDM','DMCH','DEEE','DAIML'];
const DEPT_NAMES = {
  DTDM:'Diploma in Tool & Die Making',
  DMCH:'Diploma in Mechanical Engineering',
  DEEE:'Diploma in Electrical & Electronics',
  DAIML:'Diploma in AI & Machine Learning'
};
const SUBJECTS = {
  DTDM:['Mathematics','Physics','Tool Design','CNC Programming','Metrology'],
  DMCH:['Mathematics','Physics','Thermodynamics','Fluid Mechanics','Manufacturing'],
  DEEE:['Mathematics','Circuit Theory','Electrical Machines','Power Systems','Electronics'],
  DAIML:['Mathematics','Python Programming','Machine Learning','Deep Learning','Data Science']
};

const CREDENTIALS = {
  HOD:{
    DTDM:{id:'hod_dtdm',pass:'dtdm123',name:'Dr. Ramesh Kumar'},
    DMCH:{id:'hod_dmch',pass:'dmch123',name:'Dr. Priya Sharma'},
    DEEE:{id:'hod_deee',pass:'deee123',name:'Dr. Anil Verma'},
    DAIML:{id:'hod_daiml',pass:'daiml123',name:'Dr. Sneha Patel'}
  },
  STUDENT:{
    DTDM:[
      {id:'dtdm001',pass:'pass123',name:'Arjun Nair',roll:'2024DTDM001',sem:3},
      {id:'dtdm002',pass:'pass123',name:'Meera Krishnan',roll:'2024DTDM002',sem:3},
      {id:'dtdm003',pass:'pass123',name:'Rohit Singh',roll:'2024DTDM003',sem:3},
      {id:'dtdm004',pass:'pass123',name:'Kavya Reddy',roll:'2024DTDM004',sem:3},
    ],
    DMCH:[
      {id:'dmch001',pass:'pass123',name:'Sanjay Kumar',roll:'2024DMCH001',sem:2},
      {id:'dmch002',pass:'pass123',name:'Ananya Das',roll:'2024DMCH002',sem:2},
      {id:'dmch003',pass:'pass123',name:'Vikram Rao',roll:'2024DMCH003',sem:2},
    ],
    DEEE:[
      {id:'deee001',pass:'pass123',name:'Pooja Mehta',roll:'2024DEEE001',sem:4},
      {id:'deee002',pass:'pass123',name:'Rahul Gupta',roll:'2024DEEE002',sem:4},
      {id:'deee003',pass:'pass123',name:'Sunita Joshi',roll:'2024DEEE003',sem:4},
    ],
    DAIML:[
      {id:'daiml001',pass:'pass123',name:'Aditya Sharma',roll:'2024DAIML001',sem:1},
      {id:'daiml002',pass:'pass123',name:'Divya Nair',roll:'2024DAIML002',sem:1},
      {id:'daiml003',pass:'pass123',name:'Kiran Patel',roll:'2024DAIML003',sem:1},
    ]
  }
};

// Generate student academic data
function genData(studentId,dept){
  const subjs = SUBJECTS[dept] || [];
  const idStr = String(studentId);
  const seed = idStr.charCodeAt(4)||5;
  const marks = {};
  const internal = {};
  const attendance = {};
  subjs.forEach((s,i)=>{
    const base = 55 + ((seed*7+i*13)%36);
    marks[s] = {obtained: Math.min(100,base + Math.floor(Math.random()*15)), max:100};
    internal[s] = {cie1: Math.min(30,Math.floor(15+(seed+i*3)%15)), cie2: Math.min(30,Math.floor(14+(seed*2+i*2)%16)), max:30};
    const att = Math.min(100,Math.max(55,60+(seed*3+i*11)%36));
    attendance[s] = {present: Math.floor(att*0.6), total:60, pct: att};
  });
  return {marks, internal, attendance};
}

// Build student DB
const studentDB = {};
DEPTS.forEach(dept=>{
  (CREDENTIALS.STUDENT[dept]||[]).forEach(st=>{
    studentDB[st.roll] = {...st, dept, ...genData(st.id,dept)};
  });
});

// HOD can see/edit all students in dept
// ============================
// STATE
// ============================
let state = {
  theme:'light',
  user:null,
  role:null,
  dept:null,
  page:'dashboard',
  search:'',
  modal:null,
  editStudent:null,
  importedStudents:[]
};

function setState(patch){
  Object.assign(state,patch);
  render();
}

// ============================
// UTILS
// ============================
function showNotif(msg,color='var(--success)'){
  const n=document.getElementById('notif');
  n.textContent=msg;n.style.background=color;
  n.classList.add('show');
  setTimeout(()=>n.classList.remove('show'),2500);
}
function initials(name){return name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
function getStudentsForDept(dept){
  const base = Object.values(studentDB).filter(s=>s.dept===dept);
  return [...base,...state.importedStudents.filter(s=>s.dept===dept)];
}
function getDeptColor(dept){
  return {DTDM:'#8b5cf6',DMCH:'#06b6d4',DEEE:'#f59e0b',DAIML:'#10b981'}[dept]||'#6366f1';
}
function getAttColor(pct){
  if(pct>=75)return 'var(--success)';
  if(pct>=60)return 'var(--warning)';
  return 'var(--danger)';
}
function getMarksColor(pct){
  if(pct>=75)return 'var(--success)';
  if(pct>=50)return 'var(--warning)';
  return 'var(--danger)';
}
function marksBadge(pct){
  if(pct>=75)return '<span class="badge badge-success">Distinction</span>';
  if(pct>=60)return '<span class="badge badge-primary">First Class</span>';
  if(pct>=50)return '<span class="badge badge-warning">Second Class</span>';
  return '<span class="badge badge-danger">Fail</span>';
}

// ============================
