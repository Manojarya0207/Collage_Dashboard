// RENDER HELPERS
// ============================
function svgProgress(pct,color,size=60){
  const r=24, c=30, circ=2*Math.PI*r;
  const dash=pct/100*circ;
  return `<div class="attendance-ring">
    <svg width="${size}" height="${size}" viewBox="0 0 60 60">
      <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="var(--border)" stroke-width="5"/>
      <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="5"
        stroke-dasharray="${dash} ${circ}" stroke-linecap="round"/>
    </svg>
    <span class="pct" style="font-size:11px;color:${color}">${Math.round(pct)}%</span>
  </div>`;
}

// ============================
// LOGIN PAGE
// ============================
function renderLogin(){
  const tmpl = document.createElement('div');
  tmpl.innerHTML = `
  <div class="login-page">
    <div class="login-bg">
      <div class="login-blob login-blob-1"></div>
      <div class="login-blob login-blob-2"></div>
    </div>
    <div class="login-center">
      <div class="login-header">
        <div class="login-logo">
          <div class="login-logo-icon">E</div>
          <div class="login-logo-text">Edu<span>Track</span></div>
        </div>
        <p class="login-subtitle">Polytechnic Student Information System</p>
      </div>
      <div class="login-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
          <h2 style="font-size:17px;color:var(--text)">Sign in</h2>
          <button class="theme-btn" id="loginTheme" style="border-radius:8px">
            ${state.theme==='dark'?'☀️':'🌙'}
          </button>
        </div>
        <div class="role-tabs" id="roleTabs">
          <div class="role-tab ${state._loginRole==='HOD'?'active':''}" data-role="HOD">👩‍💼 HOD / Principal</div>
          <div class="role-tab ${state._loginRole!=='HOD'?'active':''}" data-role="STUDENT">🎓 Student</div>
        </div>
        <div style="margin-bottom:14px">
          <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Select Department</div>
          <div class="dept-tabs" id="deptTabs">
            ${DEPTS.map(d=>`<div class="dept-tab ${state._loginDept===d?'active':''}" data-dept="${d}">
              ${d}<br><span style="font-weight:400;font-size:10px;opacity:0.7">${DEPT_NAMES[d].split(' ').slice(0,3).join(' ')}</span>
            </div>`).join('')}
          </div>
        </div>
        <div class="creds-hint">
          <strong>Demo Credentials</strong>
          ${state._loginRole==='HOD'
            ?`HOD ID: <b>hod_${(state._loginDept||'dtdm').toLowerCase()}</b> &nbsp; Pass: <b>${(state._loginDept||'DTDM').toLowerCase()}123</b>`
            :`Student ID: <b>${(state._loginDept||'dtdm').toLowerCase()}001</b> &nbsp; Pass: <b>pass123</b>`
          }
        </div>
        ${state._loginError?`<div class="login-error">⚠️ ${state._loginError}</div>`:''}
        <div class="form-group">
          <label class="form-label">User ID</label>
          <input class="form-input" id="loginId" placeholder="Enter your ID" value="${state._loginId||''}">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input class="form-input" id="loginPass" type="password" placeholder="Enter password" value="${state._loginPass||''}">
        </div>
        <button class="login-btn" id="loginBtn">Sign In →</button>
      </div>
    </div>
  </div>`;

  // Bind
  tmpl.querySelector('#loginTheme').onclick = ()=>{
    const t = state.theme==='dark'?'light':'dark';
    document.documentElement.setAttribute('data-theme',t);
    setState({theme:t});
  };
  tmpl.querySelectorAll('[data-role]').forEach(el=>{
    el.onclick=()=>setState({_loginRole:el.dataset.role,_loginError:null,_loginId:'',_loginPass:''});
  });
  tmpl.querySelectorAll('[data-dept]').forEach(el=>{
    el.onclick=()=>setState({_loginDept:el.dataset.dept,_loginError:null,_loginId:'',_loginPass:''});
  });
  tmpl.querySelector('#loginBtn').onclick = ()=>{
    const id = document.getElementById('loginId')?.value.trim();
    const pass = document.getElementById('loginPass')?.value.trim();
    doLogin(id,pass,state._loginRole||'STUDENT',state._loginDept||'DTDM');
  };
  document.getElementById('root').innerHTML='';
  document.getElementById('root').appendChild(tmpl.firstElementChild);
}

function doLogin(id,pass,role,dept){
  if(role==='HOD'){
    const cred = CREDENTIALS.HOD[dept];
    if(cred&&id===cred.id&&pass===cred.pass){
      setState({user:cred,role:'HOD',dept,page:'dashboard',_loginError:null,_loginId:'',_loginPass:''});
      return;
    }
  } else {
    const list = CREDENTIALS.STUDENT[dept]||[];
    const st = list.find(s=>s.id===id&&s.pass===pass);
    if(st){
      setState({user:studentDB[st.roll]||st,role:'STUDENT',dept,page:'my-marks',_loginError:null,_loginId:'',_loginPass:''});
      return;
    }
  }
  setState({_loginError:'Invalid credentials. Please try again.',_loginId:id,_loginPass:pass,_loginRole:role,_loginDept:dept});
}

// ============================
// APP SHELL
// ============================
function renderApp(){
  const isHOD = state.role==='HOD';
  const u = state.user;
  const dept = state.dept;
  const deptColor = getDeptColor(dept);

  const navItems = isHOD ? [
    {id:'dashboard',icon:'📊',label:'Dashboard'},
    {id:'students',icon:'👥',label:'All Students'},
    {id:'marks',icon:'📝',label:'Marks Management'},
    {id:'attendance',icon:'📅',label:'Attendance'},
    {id:'internal',icon:'📋',label:'Internal Marks'},
    {id:'import',icon:'📥',label:'Import Data'},
  ] : [
    {id:'my-marks',icon:'📝',label:'My Marks'},
    {id:'my-attendance',icon:'📅',label:'My Attendance'},
    {id:'my-internal',icon:'📋',label:'Internal Marks'},
    {id:'my-profile',icon:'👤',label:'My Profile'},
  ];

  const pageTitle = navItems.find(n=>n.id===state.page)?.label||'Dashboard';

  const shell = document.createElement('div');
  shell.className='app';
  shell.innerHTML=`
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="logo-mark">
        <div class="logo-icon">E</div>
        <div class="logo-text">Edu<span>Track</span></div>
      </div>
    </div>
    <div class="dept-badge" style="color:${deptColor};background:${deptColor}18">${dept} — ${isHOD?'HOD Panel':'Student Portal'}</div>
    <nav class="sidebar-nav">
      <div class="nav-section">Navigation</div>
      ${navItems.map(n=>`
        <div class="nav-item ${state.page===n.id?'active':''}" data-page="${n.id}">
          <span class="nav-icon">${n.icon}</span>${n.label}
        </div>`).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="user-card">
        <div class="user-avatar" style="background:${deptColor}">${initials(u.name||'User')}</div>
        <div class="user-info">
          <div class="user-name">${u.name||'User'}</div>
          <div class="user-role">${isHOD?'HOD':'Student'} · ${dept}</div>
        </div>
      </div>
    </div>
  </aside>
  <div class="main">
    <div class="topbar">
      <div class="topbar-title">${pageTitle}</div>
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input id="searchBar" placeholder="Search students, subjects…" value="${state.search}">
      </div>
      <div class="topbar-actions">
        <button class="theme-btn" id="themeToggle">${state.theme==='dark'?'☀️':'🌙'}</button>
        <button class="logout-btn" id="logoutBtn">Sign Out</button>
      </div>
    </div>
    <div class="content" id="pageContent"></div>
  </div>
  ${state.modal?renderModal():''}
  `;

  shell.querySelectorAll('[data-page]').forEach(el=>{
    el.onclick=()=>setState({page:el.dataset.page,search:''});
  });
  shell.querySelector('#themeToggle').onclick=()=>{
    const t=state.theme==='dark'?'light':'dark';
    document.documentElement.setAttribute('data-theme',t);
    setState({theme:t});
  };
  shell.querySelector('#logoutBtn').onclick=()=>setState({user:null,role:null,dept:null,page:'dashboard',search:'',_loginError:null,_loginId:'',_loginPass:''});
  shell.querySelector('#searchBar').oninput=e=>setState({search:e.target.value});

  document.getElementById('root').innerHTML='';
  document.getElementById('root').appendChild(shell);

  // Render page content
  const pc = document.getElementById('pageContent');
  if(isHOD) renderHODPage(pc);
  else renderStudentPage(pc);

  // Modal
  if(state.modal) bindModal();
}

// ============================
// HOD PAGES
// ============================
function renderHODPage(el){
  const students = getStudentsForDept(state.dept);
  const filtered = students.filter(s=>{
    const q = state.search.toLowerCase();
    return !q||s.name?.toLowerCase().includes(q)||s.roll?.toLowerCase().includes(q)||s.dept?.toLowerCase().includes(q);
  });

  switch(state.page){
    case 'dashboard': el.innerHTML=renderHODDashboard(students,filtered); break;
    case 'students': el.innerHTML=renderStudentList(filtered); break;
    case 'marks': el.innerHTML=renderMarksPage(filtered); break;
    case 'attendance': el.innerHTML=renderAttendancePage(filtered); break;
    case 'internal': el.innerHTML=renderInternalPage(filtered); break;
    case 'import': el.innerHTML=renderImportPage(); bindImport(); break;
  }
  bindTableActions();
}

function renderHODDashboard(students,filtered){
  const avgAtt = students.length?Math.round(students.reduce((a,s)=>{
    const atts = Object.values(s.attendance||{});
    return a+(atts.length?atts.reduce((x,v)=>x+v.pct,0)/atts.length:75);
  },0)/students.length):0;
  const avgMarks = students.length?Math.round(students.reduce((a,s)=>{
    const mks = Object.values(s.marks||{});
    return a+(mks.length?mks.reduce((x,v)=>x+v.obtained/v.max*100,0)/mks.length:65);
  },0)/students.length):0;

  return `
  <div class="welcome-banner">
    <h2>Welcome back, ${state.user.name} 👋</h2>
    <p>Here's what's happening in your department today.</p>
    <div class="dept-pill">${state.dept} · ${DEPT_NAMES[state.dept]}</div>
  </div>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon" style="background:#eef2ff">👥</div>
      <div class="stat-val">${students.length}</div>
      <div class="stat-label">Total Students</div>
      <div class="stat-change up">↑ Active Enrollment</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#ecfdf5">📅</div>
      <div class="stat-val">${avgAtt}%</div>
      <div class="stat-label">Avg Attendance</div>
      <div class="stat-change ${avgAtt>=75?'up':'down'}">${avgAtt>=75?'✓ Good':'⚠ Low'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#fffbeb">📝</div>
      <div class="stat-val">${avgMarks}%</div>
      <div class="stat-label">Avg Marks</div>
      <div class="stat-change ${avgMarks>=60?'up':'down'}">${avgMarks>=60?'✓ Good':'⚠ Needs attention'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:#ecfeff">🏫</div>
      <div class="stat-val">${SUBJECTS[state.dept].length}</div>
      <div class="stat-label">Subjects</div>
      <div class="stat-change up">Current Semester</div>
    </div>
  </div>
  <div class="card">
    <div class="card-header">
      <span class="card-title">Student Overview — ${state.dept}</span>
      <button class="btn btn-primary" onclick="document.querySelectorAll('[data-page=\\'students\\']')[0]?.click()">View All</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Student</th><th>Roll No.</th><th>Avg Marks</th><th>Attendance</th><th>Status</th></tr></thead>
        <tbody>
          ${students.slice(0,6).map(s=>{
            const mks=Object.values(s.marks||{});
            const avg=mks.length?Math.round(mks.reduce((a,v)=>a+v.obtained/v.max*100,0)/mks.length):0;
            const atts=Object.values(s.attendance||{});
            const att=atts.length?Math.round(atts.reduce((a,v)=>a+v.pct,0)/atts.length):0;
            return `<tr>
              <td><div style="display:flex;align-items:center;gap:8px">
                <div class="user-avatar" style="width:30px;height:30px;font-size:11px;background:${getDeptColor(s.dept)}">${initials(s.name)}</div>
                <div><div style="font-weight:600;font-size:13px">${s.name}</div><div style="font-size:11px;color:var(--text3)">Sem ${s.sem}</div></div>
              </div></td>
              <td><code style="font-size:11px;background:var(--surface2);padding:2px 6px;border-radius:4px">${s.roll}</code></td>
              <td><div style="display:flex;align-items:center;gap:8px">
                <div class="progress-bar" style="width:60px"><div class="progress-fill" style="width:${avg}%;background:${getMarksColor(avg)}"></div></div>
                <span style="font-size:12px;font-weight:600">${avg}%</span>
              </div></td>
              <td><div style="display:flex;align-items:center;gap:8px">
                <div class="progress-bar" style="width:60px"><div class="progress-fill" style="width:${att}%;background:${getAttColor(att)}"></div></div>
                <span style="font-size:12px;font-weight:600">${att}%</span>
              </div></td>
              <td>${marksBadge(avg)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderStudentList(filtered){
  return `
  <div class="page-header">
    <div><div class="page-title">All Students</div><div class="page-sub">${filtered.length} students in ${state.dept}</div></div>
    <button class="btn btn-success" onclick="setState({page:'import'})">📥 Import Excel</button>
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Student</th><th>Roll No.</th><th>Sem</th><th>Avg Marks</th><th>Attendance</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${filtered.length?filtered.map(s=>{
            const mks=Object.values(s.marks||{});
            const avg=mks.length?Math.round(mks.reduce((a,v)=>a+v.obtained/v.max*100,0)/mks.length):0;
            const atts=Object.values(s.attendance||{});
            const att=atts.length?Math.round(atts.reduce((a,v)=>a+v.pct,0)/atts.length):0;
            return `<tr>
              <td><div style="display:flex;align-items:center;gap:8px">
                <div class="user-avatar" style="width:32px;height:32px;font-size:12px;flex-shrink:0;background:${getDeptColor(s.dept)}">${initials(s.name)}</div>
                <div><div style="font-weight:600">${s.name}</div></div>
              </div></td>
              <td><code style="font-size:11px;background:var(--surface2);padding:2px 6px;border-radius:4px">${s.roll}</code></td>
              <td>${s.sem}</td>
              <td><div style="display:flex;align-items:center;gap:6px">
                <div class="progress-bar" style="width:50px"><div class="progress-fill" style="width:${avg}%;background:${getMarksColor(avg)}"></div></div>
                <span style="font-size:12px;font-weight:600">${avg}%</span>
              </div></td>
              <td><div style="display:flex;align-items:center;gap:6px">
                <div class="progress-bar" style="width:50px"><div class="progress-fill" style="width:${att}%;background:${getAttColor(att)}"></div></div>
                <span style="font-size:12px;font-weight:600">${att}%</span>
              </div></td>
              <td>${marksBadge(avg)}</td>
              <td><button class="btn btn-outline btn-sm edit-btn" data-roll="${s.roll}">✏️ Edit</button></td>
            </tr>`;
          }).join(''):`<tr><td colspan="7" class="empty"><span class="empty-icon">🔍</span><br>No students found</td></tr>`}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderMarksPage(filtered){
  const subjs = SUBJECTS[state.dept];
  return `
  <div class="page-header">
    <div><div class="page-title">Marks Management</div><div class="page-sub">End semester examination marks</div></div>
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Student</th>${subjs.map(s=>`<th style="white-space:nowrap">${s}</th>`).join('')}<th>Avg</th><th>Grade</th><th>Action</th></tr></thead>
        <tbody>
          ${filtered.map(s=>{
            const mks = s.marks||{};
            const vals = subjs.map(sub=>mks[sub]?.obtained||'-');
            const avg = subjs.length?Math.round(vals.filter(v=>typeof v==='number').reduce((a,v)=>a+v,0)/subjs.length):0;
            return `<tr>
              <td><div style="font-weight:600;white-space:nowrap">${s.name}</div><div style="font-size:11px;color:var(--text3)">${s.roll}</div></td>
              ${subjs.map(sub=>{
                const v=mks[sub]?.obtained;
                return `<td><span style="font-weight:600;color:${v!=null?getMarksColor(v):''}">${v!=null?v:'-'}</span></td>`;
              }).join('')}
              <td><strong>${avg}%</strong></td>
              <td>${marksBadge(avg)}</td>
              <td><button class="btn btn-outline btn-sm edit-btn" data-roll="${s.roll}">✏️</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderAttendancePage(filtered){
  const subjs = SUBJECTS[state.dept];
  return `
  <div class="page-header">
    <div><div class="page-title">Attendance</div><div class="page-sub">Subject-wise attendance tracking</div></div>
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Student</th>${subjs.map(s=>`<th>${s}</th>`).join('')}<th>Overall</th><th>Status</th></tr></thead>
        <tbody>
          ${filtered.map(s=>{
            const att = s.attendance||{};
            const vals = subjs.map(sub=>att[sub]?.pct||0);
            const overall = Math.round(vals.reduce((a,v)=>a+v,0)/vals.length);
            return `<tr>
              <td><div style="font-weight:600">${s.name}</div><div style="font-size:11px;color:var(--text3)">${s.roll}</div></td>
              ${subjs.map(sub=>{
                const pct=att[sub]?.pct||0;
                return `<td><span style="font-weight:600;color:${getAttColor(pct)}">${Math.round(pct)}%</span></td>`;
              }).join('')}
              <td><div style="display:flex;align-items:center;gap:6px">
                <div class="progress-bar" style="width:50px"><div class="progress-fill" style="width:${overall}%;background:${getAttColor(overall)}"></div></div>
                <strong>${overall}%</strong>
              </div></td>
              <td>${overall>=75?'<span class="badge badge-success">Regular</span>':overall>=60?'<span class="badge badge-warning">At Risk</span>':'<span class="badge badge-danger">Detained</span>'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderInternalPage(filtered){
  const subjs = SUBJECTS[state.dept];
  return `
  <div class="page-header">
    <div><div class="page-title">Internal Assessment</div><div class="page-sub">CIE-1 and CIE-2 marks (Max: 30 each)</div></div>
  </div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Student</th>${subjs.map(s=>`<th colspan="2" style="text-align:center;border-left:1px solid var(--border)">${s.substring(0,8)}</th>`).join('')}<th>Total CIE</th></tr></thead>
        <thead><tr><th></th>${subjs.map(()=>`<th style="font-size:10px;border-left:1px solid var(--border)">CIE-1</th><th style="font-size:10px">CIE-2</th>`).join('')}<th></th></tr></thead>
        <tbody>
          ${filtered.map(s=>{
            const int = s.internal||{};
            let total=0,maxTotal=0;
            return `<tr>
              <td><div style="font-weight:600">${s.name}</div></td>
              ${subjs.map(sub=>{
                const c1=int[sub]?.cie1||0,c2=int[sub]?.cie2||0;
                total+=c1+c2;maxTotal+=60;
                return `<td style="border-left:1px solid var(--border);color:${getMarksColor(c1/30*100)};font-weight:600">${c1}/30</td>
                <td style="color:${getMarksColor(c2/30*100)};font-weight:600">${c2}/30</td>`;
              }).join('')}
              <td><strong>${total}/${maxTotal}</strong></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderImportPage(){
  return `
  <div class="page-header">
    <div><div class="page-title">Import Student Data</div><div class="page-sub">Upload Excel or CSV files to bulk import students</div></div>
  </div>
  <div class="card" style="margin-bottom:20px">
    <div class="card-body">
      <div class="import-zone" id="dropZone" onclick="document.getElementById('fileInput').click()">
        <span class="import-icon">📥</span>
        <div class="import-text">Drop Excel / CSV file here or click to browse</div>
        <div class="import-sub">Supports .xlsx, .xls, .csv — Columns: Name, Roll, Sem, Department</div>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="card-header">
      <span class="card-title">Template Format</span>
      <button class="btn btn-outline btn-sm" onclick="downloadTemplate()">⬇️ Download Template</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Roll</th><th>Sem</th><th>Department</th></tr></thead>
        <tbody>
          <tr><td>John Doe</td><td>2025DTDM005</td><td>1</td><td>DTDM</td></tr>
          <tr><td>Jane Smith</td><td>2025DEEE004</td><td>2</td><td>DEEE</td></tr>
        </tbody>
      </table>
    </div>
  </div>
  ${state.importedStudents.length?`
  <div class="card" style="margin-top:20px">
    <div class="card-header"><span class="card-title">Imported Students (${state.importedStudents.length})</span>
      <button class="btn btn-danger btn-sm" onclick="setState({importedStudents:[]})">🗑 Clear</button>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Name</th><th>Roll</th><th>Sem</th><th>Dept</th></tr></thead>
      <tbody>${state.importedStudents.map(s=>`<tr><td>${s.name}</td><td>${s.roll}</td><td>${s.sem}</td><td>${s.dept}</td></tr>`).join('')}</tbody>
    </table></div>
  </div>`:''}`;
}

// ============================
// STUDENT PAGES
// ============================
function renderStudentPage(el){
  const s = state.user;
  if(!s||!s.marks) return;
  const subjs = SUBJECTS[state.dept];
  switch(state.page){
    case 'my-marks': el.innerHTML = renderMyMarks(s,subjs); break;
    case 'my-attendance': el.innerHTML = renderMyAttendance(s,subjs); break;
    case 'my-internal': el.innerHTML = renderMyInternal(s,subjs); break;
    case 'my-profile': el.innerHTML = renderMyProfile(s); break;
  }
}

function renderMyMarks(s,subjs){
  const mks=s.marks||{};
  const avg=subjs.length?Math.round(subjs.reduce((a,sub)=>a+(mks[sub]?.obtained||0)/100*100,0)/subjs.length):0;
  return `
  <div class="welcome-banner">
    <h2>My Examination Marks 📝</h2>
    <p>${s.roll} · Semester ${s.sem} · ${state.dept}</p>
    <div class="dept-pill">Overall: ${avg}% — ${avg>=75?'Distinction':avg>=60?'First Class':avg>=50?'Second Class':'Needs Improvement'}</div>
  </div>
  <div class="card">
    <div class="card-header"><span class="card-title">Subject-wise Marks</span></div>
    <div class="marks-grid" style="padding:20px">
      ${subjs.map(sub=>{
        const v=mks[sub]||{obtained:0,max:100};
        const pct=Math.round(v.obtained/v.max*100);
        return `<div class="marks-card">
          <div class="marks-sub">${sub}</div>
          <div class="marks-val" style="color:${getMarksColor(pct)}">${v.obtained}</div>
          <div class="marks-max">out of ${v.max}</div>
          <div style="margin-top:8px">${marksBadge(pct)}</div>
          <div class="progress-bar" style="margin-top:8px"><div class="progress-fill" style="width:${pct}%;background:${getMarksColor(pct)}"></div></div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function renderMyAttendance(s,subjs){
  const att=s.attendance||{};
  const overall=Math.round(subjs.reduce((a,sub)=>a+(att[sub]?.pct||0),0)/subjs.length);
  return `
  <div class="welcome-banner">
    <h2>My Attendance 📅</h2>
    <p>${s.roll} · Semester ${s.sem}</p>
    <div class="dept-pill">Overall Attendance: ${overall}% ${overall>=75?'✓ Regular':'⚠ At Risk'}</div>
  </div>
  <div class="stats-grid">
    ${subjs.map(sub=>{
      const d=att[sub]||{present:0,total:60,pct:0};
      const pct=Math.round(d.pct);
      return `<div class="stat-card" style="text-align:center">
        ${svgProgress(pct,getAttColor(pct),70)}
        <div style="margin-top:8px;font-size:12px;font-weight:600;color:var(--text2)">${sub}</div>
        <div style="font-size:11px;color:var(--text3)">${d.present}/${d.total} classes</div>
      </div>`;
    }).join('')}
  </div>`;
}

function renderMyInternal(s,subjs){
  const int=s.internal||{};
  let total=0,maxT=0;
  subjs.forEach(sub=>{total+=(int[sub]?.cie1||0)+(int[sub]?.cie2||0);maxT+=60;});
  return `
  <div class="welcome-banner">
    <h2>Internal Assessment 📋</h2>
    <p>Continuous Internal Evaluation (CIE) marks</p>
    <div class="dept-pill">Total CIE: ${total}/${maxT} (${Math.round(total/maxT*100)}%)</div>
  </div>
  <div class="marks-grid">
    ${subjs.map(sub=>{
      const d=int[sub]||{cie1:0,cie2:0};
      return `<div class="marks-card" style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px">
        <div class="marks-sub" style="margin-bottom:10px">${sub}</div>
        <div style="display:flex;gap:12px;justify-content:center">
          <div style="text-align:center">
            <div style="font-size:10px;color:var(--text3);margin-bottom:2px">CIE-1</div>
            <div style="font-size:20px;font-weight:700;color:${getMarksColor(d.cie1/30*100)}">${d.cie1}</div>
            <div style="font-size:10px;color:var(--text3)">/30</div>
          </div>
          <div style="width:1px;background:var(--border)"></div>
          <div style="text-align:center">
            <div style="font-size:10px;color:var(--text3);margin-bottom:2px">CIE-2</div>
            <div style="font-size:20px;font-weight:700;color:${getMarksColor(d.cie2/30*100)}">${d.cie2}</div>
            <div style="font-size:10px;color:var(--text3)">/30</div>
          </div>
        </div>
        <div style="margin-top:10px;font-size:11px;font-weight:600;color:var(--text2)">Total: ${d.cie1+d.cie2}/60</div>
      </div>`;
    }).join('')}
  </div>`;
}

function renderMyProfile(s){
  const mks=Object.values(s.marks||{});
  const avgM=mks.length?Math.round(mks.reduce((a,v)=>a+v.obtained/v.max*100,0)/mks.length):0;
  const atts=Object.values(s.attendance||{});
  const avgA=atts.length?Math.round(atts.reduce((a,v)=>a+v.pct,0)/atts.length):0;
  return `
  <div class="page-header">
    <div class="page-title">My Profile</div>
  </div>
  <div class="card" style="max-width:480px">
    <div class="card-body">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid var(--border)">
        <div class="user-avatar" style="width:64px;height:64px;font-size:22px;border-radius:16px;background:${getDeptColor(s.dept)}">${initials(s.name)}</div>
        <div>
          <div style="font-size:20px;font-weight:700;color:var(--text)">${s.name}</div>
          <div style="font-size:13px;color:var(--text2)">${s.roll}</div>
          <div class="badge badge-primary" style="margin-top:6px">${s.dept}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="padding:14px;background:var(--surface2);border-radius:10px">
          <div style="font-size:11px;color:var(--text3);margin-bottom:4px">Department</div>
          <div style="font-weight:600">${DEPT_NAMES[s.dept]}</div>
        </div>
        <div style="padding:14px;background:var(--surface2);border-radius:10px">
          <div style="font-size:11px;color:var(--text3);margin-bottom:4px">Semester</div>
          <div style="font-weight:600">Semester ${s.sem}</div>
        </div>
        <div style="padding:14px;background:var(--success-light);border-radius:10px">
          <div style="font-size:11px;color:var(--success);margin-bottom:4px">Avg Marks</div>
          <div style="font-weight:700;font-size:20px;color:var(--success)">${avgM}%</div>
        </div>
        <div style="padding:14px;background:${avgA>=75?'var(--success-light)':'var(--warning-light)'};border-radius:10px">
          <div style="font-size:11px;color:${avgA>=75?'var(--success)':'var(--warning)'};margin-bottom:4px">Attendance</div>
          <div style="font-weight:700;font-size:20px;color:${avgA>=75?'var(--success)':'var(--warning)'}">${avgA}%</div>
        </div>
      </div>
    </div>
  </div>`;
}

// ============================
// MODAL (EDIT)
// ============================
function renderModal(){
  const s = state.editStudent;
  if(!s) return '';
  const subjs = SUBJECTS[s.dept||state.dept]||[];
  const mks = s.marks||{};
  const int = s.internal||{};
  const att = s.attendance||{};
  return `<div class="modal-overlay" id="modalOverlay">
  <div class="modal">
    <div class="modal-title">✏️ Edit Student — ${s.name}</div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:16px">${s.roll} · ${s.dept}</div>
    <div style="font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">End Semester Marks</div>
    <div class="form-row" style="grid-template-columns:repeat(3,1fr)">
      ${subjs.map(sub=>`
        <div class="form-group">
          <label class="form-label" style="font-size:10px">${sub.substring(0,12)}</label>
          <input class="form-input" style="padding:8px 10px" type="number" min="0" max="100" 
            id="mark_${sub.replace(/\s/g,'_')}" value="${mks[sub]?.obtained||0}" placeholder="0-100">
        </div>`).join('')}
    </div>
    <div style="font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin:12px 0 10px">Internal Marks (CIE)</div>
    ${subjs.map(sub=>`
      <div class="form-row" style="margin-bottom:8px;align-items:center">
        <div style="font-size:12px;font-weight:500;color:var(--text2);grid-column:1/-1;margin-bottom:4px">${sub}</div>
        <div class="form-group" style="margin:0">
          <label class="form-label" style="font-size:10px">CIE-1 (max 30)</label>
          <input class="form-input" style="padding:8px 10px" type="number" min="0" max="30"
            id="cie1_${sub.replace(/\s/g,'_')}" value="${int[sub]?.cie1||0}">
        </div>
        <div class="form-group" style="margin:0">
          <label class="form-label" style="font-size:10px">CIE-2 (max 30)</label>
          <input class="form-input" style="padding:8px 10px" type="number" min="0" max="30"
            id="cie2_${sub.replace(/\s/g,'_')}" value="${int[sub]?.cie2||0}">
        </div>
      </div>`).join('')}
    <div style="font-size:12px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin:12px 0 10px">Attendance %</div>
    <div class="form-row" style="grid-template-columns:repeat(3,1fr)">
      ${subjs.map(sub=>`
        <div class="form-group">
          <label class="form-label" style="font-size:10px">${sub.substring(0,12)}</label>
          <input class="form-input" style="padding:8px 10px" type="number" min="0" max="100"
            id="att_${sub.replace(/\s/g,'_')}" value="${Math.round(att[sub]?.pct||0)}" placeholder="0-100">
        </div>`).join('')}
    </div>
    <div class="modal-actions">
      <button class="btn btn-outline" id="cancelEdit">Cancel</button>
      <button class="btn btn-primary" id="saveEdit">💾 Save Changes</button>
    </div>
  </div></div>`;
}

function bindModal(){
  const ov = document.getElementById('modalOverlay');
  if(!ov) return;
  ov.onclick=e=>{if(e.target===ov)setState({modal:null,editStudent:null})};
  const btn = document.getElementById('cancelEdit');
  if(btn) btn.onclick=()=>setState({modal:null,editStudent:null});
  const save = document.getElementById('saveEdit');
  if(save) save.onclick=()=>saveEdits();
}

function saveEdits(){
  const s = state.editStudent;
  if(!s) return;
  const subjs = SUBJECTS[s.dept||state.dept]||[];
  subjs.forEach(sub=>{
    const key=sub.replace(/\s/g,'_');
    const m=document.getElementById('mark_'+key);
    const c1=document.getElementById('cie1_'+key);
    const c2=document.getElementById('cie2_'+key);
    const a=document.getElementById('att_'+key);
    if(m&&s.marks[sub]) s.marks[sub].obtained=Math.min(100,Math.max(0,parseInt(m.value)||0));
    if(c1&&s.internal[sub]) s.internal[sub].cie1=Math.min(30,Math.max(0,parseInt(c1.value)||0));
    if(c2&&s.internal[sub]) s.internal[sub].cie2=Math.min(30,Math.max(0,parseInt(c2.value)||0));
    if(a&&s.attendance[sub]) {s.attendance[sub].pct=Math.min(100,Math.max(0,parseInt(a.value)||0));}
  });
  showNotif('✅ Student data updated successfully!');
  setState({modal:null,editStudent:null});
}

function bindTableActions(){
  document.querySelectorAll('.edit-btn').forEach(btn=>{
    btn.onclick=()=>{
      const roll=btn.dataset.roll;
      const st = getStudentsForDept(state.dept).find(s=>s.roll===roll)||studentDB[roll];
      if(st) setState({modal:'edit',editStudent:st});
    };
  });
}

function bindImport(){
  const dz=document.getElementById('dropZone');
  if(!dz) return;
  dz.ondragover=e=>{e.preventDefault();dz.classList.add('drag')};
  dz.ondragleave=()=>dz.classList.remove('drag');
  dz.ondrop=e=>{e.preventDefault();dz.classList.remove('drag');handleFile(e.dataTransfer.files[0])};

  const fi=document.getElementById('fileInput');
  if(fi) fi.onchange=e=>handleFile(e.target.files[0]);
}

function handleFile(file){
  if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const data = new Uint8Array(e.target.result);
      const wb=XLSX.read(data,{type:'array'});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const json=XLSX.utils.sheet_to_json(ws);
      const imported=json.map((row,i)=>{
        const rawDept = row.Department||row.dept||state.dept;
        const dept=String(rawDept).toUpperCase();
        const name=String(row.Name||row.name||`Student ${i+1}`);
        const roll=String(row.Roll||row.roll||`IMP${Date.now()}${i}`);
        const sem=parseInt(row.Sem||row.sem||1);
        const subjs=SUBJECTS[dept]||SUBJECTS[state.dept];
        const {marks,internal,attendance}=genData(roll,dept);
        return{name,roll,sem,dept,marks,internal,attendance,id:roll};
      }).filter(s=>s.dept===state.dept||!s.dept);
      state.importedStudents=[...state.importedStudents,...imported];
      showNotif(`✅ Imported ${imported.length} students from ${file.name}`);
      setState({});
    }catch(err){
      console.error(err);
      showNotif('❌ Error reading file. Check format.','var(--danger)');
    }
  };
  reader.readAsArrayBuffer(file);
}

function downloadTemplate(){
  if(typeof XLSX==='undefined'){showNotif('XLSX not loaded','var(--danger)');return;}
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.aoa_to_sheet([
    ['Name','Roll','Sem','Department'],
    ['John Doe','2025DTDM005','1','DTDM'],
    ['Jane Smith','2025DEEE004','2','DEEE']
  ]);
  XLSX.utils.book_append_sheet(wb,ws,'Students');
  XLSX.writeFile(wb,'EduTrack_Template.xlsx');
}

// ============================
// MAIN RENDER
// ============================
function render(){
  if(!state._loginRole) state._loginRole='STUDENT';
  if(!state._loginDept) state._loginDept='DTDM';
  if(state.theme==='dark') document.documentElement.setAttribute('data-theme','dark');
  else document.documentElement.removeAttribute('data-theme');
  if(!state.user){ renderLogin(); return; }
  renderApp();
}

// ============================
// INIT
// ============================
render();
