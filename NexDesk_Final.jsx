import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════
   NEXDESK  —  Enterprise IT Helpdesk Portal
   Portfolio project demonstrating:
   • Ticketing workflows (Zendesk / ManageEngine equivalent)
   • SLA tracking & escalation logic
   • Role-based access (Agent vs End User)
   • Active Directory / M365 user simulation
   • Knowledge Base with smart suggestions
   • Real-time analytics dashboard
   • Audit logging
═══════════════════════════════════════════════════════════ */

// ── CONSTANTS ──────────────────────────────────────────────
const PRIORITIES = ["Critical","High","Medium","Low"];
const STATUSES   = ["Open","In Progress","Pending User","Resolved","Closed"];
const CATEGORIES = ["Hardware","Software","Network","Account Access","Email / M365","Printer","Security","Other"];

const SLA_HOURS = { Critical:1, High:4, Medium:8, Low:24 };

const P_COLOR = {
  Critical: ["#ff3b5c","#ff3b5c22"],
  High:     ["#ff9f0a","#ff9f0a22"],
  Medium:   ["#0a84ff","#0a84ff22"],
  Low:      ["#34c759","#34c75922"],
};
const S_COLOR = {
  "Open":         "#0a84ff",
  "In Progress":  "#bf5af2",
  "Pending User": "#ff9f0a",
  "Resolved":     "#34c759",
  "Closed":       "#48484a",
};

const AGENTS = [
  { id:"ag1", name:"Maya Chen",     role:"agent", dept:"IT Support L1",  init:"MC", email:"m.chen@corp.com"    },
  { id:"ag2", name:"Derek Ross",    role:"agent", dept:"Network Ops",     init:"DR", email:"d.ross@corp.com"    },
  { id:"ag3", name:"Priya Sharma",  role:"agent", dept:"IT Support L2",  init:"PS", email:"p.sharma@corp.com"  },
  { id:"ag4", name:"Alex Kim",      role:"admin", dept:"IT Manager",      init:"AK", email:"a.kim@corp.com"     },
];
const USERS = [
  { id:"u1", name:"Jordan Blake",   role:"user",  dept:"Marketing",       init:"JB", email:"j.blake@corp.com"  },
  { id:"u2", name:"Sam Torres",     role:"user",  dept:"Finance",         init:"ST", email:"s.torres@corp.com" },
  { id:"u3", name:"Riley Park",     role:"user",  dept:"Operations",      init:"RP", email:"r.park@corp.com"   },
];
const ALL_USERS = [...AGENTS, ...USERS];

const KB = [
  { id:"kb1", title:"Reset Your Active Directory Password",
    tags:["password","account","AD","access","login"],
    steps:["Navigate to portal.corp.com/selfservice","Click 'Forgot Password'","Verify via Microsoft Authenticator MFA","Enter new password (12+ chars, 1 uppercase, 1 number, 1 special)","Allow 15 min for AD sync across all systems"],
    cat:"Account Access" },
  { id:"kb2", title:"Connect to Cisco AnyConnect VPN",
    tags:["vpn","network","remote","cisco","anyconnect"],
    steps:["Open Cisco AnyConnect from Start Menu","Server: vpn.corp.com","Enter your AD credentials","Complete MFA push notification","If error 403: submit ticket — VPN profile may need re-provisioning"],
    cat:"Network" },
  { id:"kb3", title:"Printer Not Appearing on Network",
    tags:["printer","network","driver","print"],
    steps:["Run: Settings → Bluetooth & Devices → Printers → Add Device","If not found, open CMD as Admin: printui /s /t2","Check printer IP label — ping it to confirm it's online","Download driver from \\\\fileserver\\drivers\\printers\\[model]","Still failing? Note the printer asset tag and submit a ticket"],
    cat:"Printer" },
  { id:"kb4", title:"Microsoft 365 / Outlook Not Syncing",
    tags:["outlook","email","m365","microsoft","office","sync"],
    steps:["Close all Office apps","File → Account Settings → Remove your account","Re-add with corp email — it will auto-configure via Autodiscover","If license error: open CMD → slmgr /ato","Persistent issues likely require IT to re-provision your M365 license"],
    cat:"Email / M365" },
  { id:"kb5", title:"BitLocker Recovery Key Request",
    tags:["bitlocker","encryption","recovery","security","locked"],
    steps:["Never share recovery keys via email or chat","Call IT Service Desk directly: ext. 4357","Verify identity with employee ID + manager name","Agent will retrieve key from Azure AD (Entra ID)","Key is single-use — drive re-encrypts automatically"],
    cat:"Security" },
];

// ── SEED DATA ──────────────────────────────────────────────
function seed() {
  const n = Date.now();
  const h = 3600000;
  return [
    { id:"TKT-00001", title:"Cannot log into SharePoint after password reset", cat:"Account Access", priority:"High", status:"In Progress",
      createdBy:"u1", assignedTo:"ag1", createdAt:n-h*6, updatedAt:n-h*2, resolvedAt:null,
      desc:"After resetting my AD password yesterday morning, I can no longer access the SharePoint intranet portal. Error reads: 'Access Denied — You do not have permission to view this directory or page.' I can still log into my laptop and Outlook is working fine.",
      comments:[
        { id:"c1", by:"ag1", body:"Hi Jordan! I've looked at your account in Active Directory — looks like the SharePoint permission group sync hasn't propagated yet after the password reset. I'm forcing an AAD Connect sync now.", internal:false, at:n-h*4 },
        { id:"c2", by:"ag1", body:"AAD sync logs show 20min delay on tenant side. Escalating to L2 if not resolved by EOD.", internal:true, at:n-h*3 },
        { id:"c3", by:"u1", body:"Still getting the same error as of 9am this morning.", internal:false, at:n-h*2 },
      ], rating:null, audit:[
        { at:n-h*6, by:"u1",  action:"Ticket created" },
        { at:n-h*5, by:"ag1", action:"Assigned to Maya Chen" },
        { at:n-h*5, by:"ag1", action:"Status → In Progress" },
      ]},
    { id:"TKT-00002", title:"Dell XPS laptop screen flickering every ~10 minutes", cat:"Hardware", priority:"Medium", status:"Open",
      createdBy:"u2", assignedTo:null, createdAt:n-h*14, updatedAt:n-h*14, resolvedAt:null,
      desc:"My Dell XPS 15 (Asset #DL-4421) screen flickers for about 3 seconds every 10-15 minutes. Tried updating display drivers via Device Manager — no improvement. Happens on both battery and plugged in. Monitor cable is secure.",
      comments:[], rating:null, audit:[
        { at:n-h*14, by:"u2", action:"Ticket created" },
      ]},
    { id:"TKT-00003", title:"Outlook stopped syncing new emails — desktop only", cat:"Email / M365", priority:"High", status:"Pending User",
      createdBy:"u3", assignedTo:"ag3", createdAt:n-h*50, updatedAt:n-h*8, resolvedAt:null,
      desc:"Since last Friday around 3pm, new emails stopped appearing on my desktop Outlook (v2309). Everything appears normally on Outlook mobile and OWA (webmail). Send/receive gives no error. Tried restarting — same issue.",
      comments:[
        { id:"c4", by:"ag3", body:"Hi Riley! Please try removing and re-adding your account: File → Account Settings → select your account → Remove. Then re-add it. Autodiscover will handle the config automatically.", internal:false, at:n-h*10 },
        { id:"c5", by:"ag3", body:"Also ran remote diagnostics via SCCM — OST file may be corrupted. Sent rename script.", internal:true, at:n-h*9 },
      ], rating:null, audit:[
        { at:n-h*50, by:"u3",  action:"Ticket created" },
        { at:n-h*48, by:"ag3", action:"Assigned to Priya Sharma" },
        { at:n-h*48, by:"ag3", action:"Status → In Progress" },
        { at:n-h*10, by:"ag3", action:"Status → Pending User" },
      ]},
    { id:"TKT-00004", title:"Cisco AnyConnect VPN drops every 20 minutes exactly", cat:"Network", priority:"Critical", status:"Resolved",
      createdBy:"u1", assignedTo:"ag2", createdAt:n-h*75, updatedAt:n-h*26, resolvedAt:n-h*26,
      desc:"Working from home. VPN disconnects at exactly the 20-minute mark every time. Cisco AnyConnect v4.10.07073. ISP confirmed no packet loss on my end. This is blocking me from accessing all internal systems.",
      comments:[
        { id:"c6", by:"ag2", body:"Found it — the ASA firewall had a 1200-second idle session timeout misconfigured during last week's firmware update. Increased to 28800s (8 hours). Please reconnect and confirm.", internal:false, at:n-h*28 },
        { id:"c7", by:"ag2", body:"Root cause: ASA 5506 firmware update 9.18.3 reset idle timeout to default. Changed in ASDM. Documenting for change log.", internal:true, at:n-h*28 },
        { id:"c8", by:"u1", body:"Confirmed — been connected for 2 hours straight now. Thank you Derek, that was driving me crazy!", internal:false, at:n-h*26 },
      ], rating:5, audit:[
        { at:n-h*75, by:"u1",  action:"Ticket created" },
        { at:n-h*74, by:"ag2", action:"Priority escalated → Critical" },
        { at:n-h*74, by:"ag2", action:"Assigned to Derek Ross" },
        { at:n-h*30, by:"ag2", action:"Status → In Progress" },
        { at:n-h*26, by:"ag2", action:"Status → Resolved" },
      ]},
    { id:"TKT-00005", title:"Software Center stuck on loading spinner — new laptop", cat:"Software", priority:"Low", status:"Closed",
      createdBy:"u2", assignedTo:"ag1", createdAt:n-h*100, updatedAt:n-h*52, resolvedAt:n-h*52,
      desc:"Brand new laptop issued by IT today (Asset #HP-7789). Microsoft Endpoint Configuration Manager / Software Center shows an infinite loading spinner. Need to install MS Project and Adobe Acrobat.",
      comments:[
        { id:"c9", by:"ag1", body:"Pushed a new SCCM client reinstall via remote tools. Please reboot when you get a chance — Software Center should load within 5 minutes of the restart.", internal:false, at:n-h*54 },
        { id:"c10", by:"u2", body:"Rebooted and it's working perfectly now. All apps installing. Thanks!", internal:false, at:n-h*52 },
      ], rating:4, audit:[
        { at:n-h*100, by:"u2",  action:"Ticket created" },
        { at:n-h*98,  by:"ag1", action:"Assigned to Maya Chen" },
        { at:n-h*55,  by:"ag1", action:"Status → In Progress" },
        { at:n-h*52,  by:"u2",  action:"Status → Resolved" },
        { at:n-h*50,  by:"ag1", action:"Status → Closed" },
      ]},
    { id:"TKT-00006", title:"BitLocker recovery key needed — locked out after BIOS update", cat:"Security", priority:"High", status:"In Progress",
      createdBy:"u3", assignedTo:"ag4", createdAt:n-h*3, updatedAt:n-h*1, resolvedAt:null,
      desc:"IT pushed a BIOS update overnight. Now laptop requires BitLocker recovery key on boot. I never set this up manually — was it configured by IT? Asset tag: LN-2291. I have files I need urgently for a 10am meeting.",
      comments:[
        { id:"c11", by:"ag4", body:"Hi Riley — yes, BitLocker was auto-configured by Intune policy. I'm pulling your recovery key from Azure AD / Entra ID now. I'll call you directly in 5 minutes to read it securely. Do NOT enter the key via chat or email.", internal:false, at:n-h*2 },
        { id:"c12", by:"ag4", body:"Key retrieved from Entra ID. Calling user now. Key used = single-use, will auto-rotate.", internal:true, at:n-h*1 },
      ], rating:null, audit:[
        { at:n-h*3, by:"u3",  action:"Ticket created" },
        { at:n-h*2, by:"ag4", action:"Escalated to IT Manager — Security ticket" },
        { at:n-h*2, by:"ag4", action:"Assigned to Alex Kim" },
        { at:n-h*2, by:"ag4", action:"Status → In Progress" },
      ]},
  ];
}

// ── UTILS ──────────────────────────────────────────────────
const genId = (ts) => `TKT-${String(ts.reduce((m,t)=>Math.max(m,+t.id.split("-")[1]),0)+1).padStart(5,"0")}`;
const ago = (ts) => { const d=Date.now()-ts; if(d<60000)return"just now"; if(d<3600000)return`${~~(d/60000)}m ago`; if(d<86400000)return`${~~(d/3600000)}h ago`; return`${~~(d/86400000)}d ago`; };
const byId = (id) => ALL_USERS.find(u=>u.id===id);
const sla = (t) => {
  if(t.status==="Resolved"||t.status==="Closed") return null;
  const ms = SLA_HOURS[t.priority]*3600000, el=Date.now()-t.createdAt;
  const pct=Math.min(el/ms*100,100), rem=Math.max(ms-el,0);
  const h=~~(rem/3600000), m=~~((rem%3600000)/60000);
  return { pct, rem, label: rem===0?"⚠ BREACHED":`${h}h ${m}m left`, color: pct<50?"#34c759":pct<80?"#ff9f0a":"#ff3b5c" };
};
const kbSuggest = (text) => {
  if(!text||text.length<4) return [];
  const w = text.toLowerCase().split(/\W+/);
  return KB.filter(a=>a.tags.some(t=>w.some(ww=>t.includes(ww)||ww.includes(t)))).slice(0,2);
};

// ── MICRO COMPONENTS ───────────────────────────────────────
const Pill = ({label, bg, fg="#fff", sm}) => (
  <span style={{background:bg+"22",color:bg,border:`1px solid ${bg}44`,padding:sm?"2px 7px":"3px 10px",borderRadius:4,fontSize:sm?10:11,fontWeight:700,letterSpacing:".05em",whiteSpace:"nowrap"}}>
    {label}
  </span>
);

const Avi = ({id, size=32}) => {
  const u=byId(id)||{init:"?",name:"?"};
  return(
    <div title={u.name} style={{width:size,height:size,borderRadius:"50%",background:"linear-gradient(135deg,#0a84ff,#bf5af2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.34,fontWeight:800,color:"#fff",flexShrink:0,fontFamily:"'IBM Plex Mono',monospace"}}>
      {u.init}
    </div>
  );
};

const Input = ({label,...p}) => (
  <div style={{marginBottom:16}}>
    {label&&<div style={{fontSize:11,color:"#636366",fontWeight:700,letterSpacing:".06em",marginBottom:5}}>{label}</div>}
    <input {...p} style={{width:"100%",padding:"11px 14px",background:"#0c0c14",border:"1px solid #ffffff12",borderRadius:8,color:"#f2f2f7",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",...p.style}} />
  </div>
);

const Sel = ({label,opts,...p}) => (
  <div>
    {label&&<div style={{fontSize:11,color:"#636366",fontWeight:700,letterSpacing:".06em",marginBottom:5}}>{label}</div>}
    <select {...p} style={{width:"100%",padding:"10px 12px",background:"#0c0c14",border:"1px solid #ffffff12",borderRadius:8,color:"#f2f2f7",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
      {opts.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
    </select>
  </div>
);

const Card = ({children,style,onClick,hover=true}) => {
  const [ov,setOv]=useState(false);
  return(
    <div onClick={onClick} onMouseEnter={()=>hover&&setOv(true)} onMouseLeave={()=>setOv(false)}
      style={{background:"#0f0f1a",border:`1px solid ${ov&&onClick?"#0a84ff44":"#ffffff0a"}`,borderRadius:12,
        transform:ov&&onClick?"translateX(3px)":"none",transition:"all .15s",cursor:onClick?"pointer":"default",...style}}>
      {children}
    </div>
  );
};

const SLABar = ({ticket}) => {
  const s=sla(ticket); if(!s) return null;
  return(
    <div style={{marginTop:6}}>
      <div style={{height:3,background:"#ffffff0a",borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${s.pct}%`,background:s.color,transition:"width .5s",borderRadius:2}}/>
      </div>
      <div style={{fontSize:10,color:s.color,marginTop:3,fontFamily:"'IBM Plex Mono',monospace"}}>{s.label}</div>
    </div>
  );
};

// ── LOGIN ──────────────────────────────────────────────────
function Login({onLogin}) {
  const [tab,setTab]=useState("agent");
  const [email,setEmail]=useState("m.chen@corp.com");
  const [pass,setPass]=useState("demo1234");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const accounts = {
    "m.chen@corp.com":"ag1","d.ross@corp.com":"ag2","p.sharma@corp.com":"ag3","a.kim@corp.com":"ag4",
    "j.blake@corp.com":"u1","s.torres@corp.com":"u2","r.park@corp.com":"u3",
  };

  const go = () => {
    if(!email||!pass){setErr("All fields required.");return;}
    setLoading(true);
    setTimeout(()=>{
      const uid=accounts[email.toLowerCase()];
      const u=ALL_USERS.find(x=>x.id===uid);
      if(!u){setErr("Account not found.");setLoading(false);return;}
      if(tab==="agent"&&u.role==="user"){setErr("End-user account — use 'Employee' tab.");setLoading(false);return;}
      if(tab==="user"&&u.role!=="user"){setErr("IT staff account — use 'IT Staff' tab.");setLoading(false);return;}
      onLogin(u);
    },600);
  };

  const fill=(e)=>{ setEmail(e); setErr(""); };

  return(
    <div style={{minHeight:"100vh",background:"#07070f",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'DM Sans',sans-serif"}}>
      {/* grid bg */}
      <div style={{position:"fixed",inset:0,backgroundImage:"linear-gradient(#ffffff04 1px,transparent 1px),linear-gradient(90deg,#ffffff04 1px,transparent 1px)",backgroundSize:"40px 40px",pointerEvents:"none"}}/>

      <div style={{width:"100%",maxWidth:420,position:"relative"}}>
        {/* glow */}
        <div style={{position:"absolute",top:-80,left:"50%",transform:"translateX(-50%)",width:300,height:300,background:"radial-gradient(circle,#0a84ff18,transparent 70%)",pointerEvents:"none"}}/>

        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:36,fontWeight:900,color:"#f2f2f7",letterSpacing:-2,fontFamily:"'Syne',sans-serif"}}>
            NEX<span style={{color:"#0a84ff"}}>DESK</span>
          </div>
          <div style={{color:"#48484a",fontSize:13,marginTop:4,letterSpacing:".1em",textTransform:"uppercase"}}>IT Service Management Portal</div>
        </div>

        <Card style={{padding:"32px 36px"}}>
          {/* tabs */}
          <div style={{display:"flex",gap:6,marginBottom:28,background:"#ffffff05",borderRadius:10,padding:4}}>
            {[["agent","🛠 IT Staff"],["user","👤 Employee"]].map(([v,l])=>(
              <button key={v} onClick={()=>{setTab(v);setEmail(v==="agent"?"m.chen@corp.com":"j.blake@corp.com");setErr("");}}
                style={{flex:1,padding:"9px 0",borderRadius:7,border:"none",background:tab===v?"#0a84ff":"transparent",
                  color:tab===v?"#fff":"#636366",fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .15s",fontFamily:"'DM Sans',sans-serif"}}>
                {l}
              </button>
            ))}
          </div>

          <Input label="CORPORATE EMAIL" value={email} onChange={e=>fill(e.target.value)} placeholder="you@corp.com" type="email"/>
          <Input label="PASSWORD" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" type="password"/>

          {err&&<div style={{color:"#ff3b5c",fontSize:13,marginBottom:12,padding:"8px 12px",background:"#ff3b5c10",borderRadius:6}}>{err}</div>}

          <button onClick={go} disabled={loading}
            style={{width:"100%",padding:14,background:loading?"#0a84ff88":"#0a84ff",border:"none",borderRadius:9,color:"#fff",
              fontWeight:800,fontSize:15,cursor:loading?"default":"pointer",fontFamily:"'Syne',sans-serif",letterSpacing:.5,marginTop:4,transition:"background .2s"}}>
            {loading?"Authenticating…":"Sign In →"}
          </button>

          {/* demo accounts */}
          <div style={{marginTop:24,padding:"14px 16px",background:"#ffffff04",borderRadius:9,border:"1px solid #ffffff08"}}>
            <div style={{fontSize:11,color:"#48484a",fontWeight:700,letterSpacing:".08em",marginBottom:10}}>DEMO ACCOUNTS (password: demo1234)</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {(tab==="agent"?AGENTS:USERS).map(u=>(
                <button key={u.id} onClick={()=>fill(u.email)}
                  style={{padding:"6px 10px",background:email===u.email?"#0a84ff18":"#ffffff05",border:`1px solid ${email===u.email?"#0a84ff40":"transparent"}`,
                    borderRadius:6,color:email===u.email?"#0a84ff":"#8e8e93",fontSize:12,cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
                  {u.name}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── TICKET ROW ─────────────────────────────────────────────
function TRow({t,onClick}) {
  const ag=byId(t.assignedTo);
  return(
    <Card onClick={onClick} style={{padding:"15px 20px",marginBottom:8}}>
      <div style={{display:"flex",gap:14,alignItems:"center"}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:7,alignItems:"center"}}>
            <span style={{fontSize:11,color:"#48484a",fontFamily:"'IBM Plex Mono',monospace"}}>{t.id}</span>
            <Pill label={t.priority} bg={P_COLOR[t.priority][0]} sm/>
            <Pill label={t.status}   bg={S_COLOR[t.status]} sm/>
            <Pill label={t.cat}      bg="#ffffff" fg="#fff" sm style={{background:"#ffffff10",color:"#8e8e93",border:"1px solid #ffffff10"}}/>
          </div>
          <div style={{fontSize:14,fontWeight:600,color:"#f2f2f7",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginBottom:4}}>{t.title}</div>
          <div style={{fontSize:12,color:"#636366"}}>{ago(t.createdAt)} · {t.comments.length} repl{t.comments.length===1?"y":"ies"}</div>
          <SLABar ticket={t}/>
        </div>
        <div style={{flexShrink:0}}>
          {ag
            ? <Avi id={t.assignedTo} size={30}/>
            : <div style={{width:30,height:30,borderRadius:"50%",border:"1.5px dashed #ffffff15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#48484a"}}>?</div>
          }
        </div>
      </div>
    </Card>
  );
}

// ── NEW TICKET MODAL ────────────────────────────────────────
function NewModal({onClose,onCreate,userId}) {
  const [f,setF]=useState({title:"",desc:"",cat:"Software",priority:"Medium"});
  const [kb,setKb]=useState([]);
  const [openKb,setOpenKb]=useState(null);
  const s=(k,v)=>{ const nf={...f,[k]:v}; setF(nf); setKb(kbSuggest(nf.title+" "+nf.desc)); };

  return(
    <Overlay onClose={onClose}>
      <div style={{fontSize:18,fontWeight:800,color:"#f2f2f7",marginBottom:24,fontFamily:"'Syne',sans-serif"}}>Open New Ticket</div>

      <Input label="ISSUE TITLE" value={f.title} onChange={e=>s("title",e.target.value)} placeholder="Brief description of your issue"/>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,color:"#636366",fontWeight:700,letterSpacing:".06em",marginBottom:5}}>DESCRIPTION</div>
        <textarea value={f.desc} onChange={e=>s("desc",e.target.value)} rows={4} placeholder="Steps to reproduce, error messages, asset numbers…"
          style={{width:"100%",padding:"11px 14px",background:"#0c0c14",border:"1px solid #ffffff12",borderRadius:8,color:"#f2f2f7",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
        <Sel label="CATEGORY" value={f.cat} onChange={e=>s("cat",e.target.value)} opts={CATEGORIES}/>
        <Sel label="PRIORITY"  value={f.priority} onChange={e=>s("priority",e.target.value)}
          opts={PRIORITIES.map(p=>({v:p,l:`${p==="Critical"?"🔴":p==="High"?"🟠":p==="Medium"?"🔵":"🟢"} ${p}`}))}/>
      </div>

      {kb.length>0&&(
        <div style={{marginBottom:20,padding:"14px 16px",background:"#0a84ff08",border:"1px solid #0a84ff20",borderRadius:10}}>
          <div style={{fontSize:11,fontWeight:700,color:"#0a84ff",letterSpacing:".08em",marginBottom:10}}>💡 BEFORE YOU SUBMIT — KNOWLEDGE BASE</div>
          {kb.map(a=>(
            <div key={a.id} style={{marginBottom:8}}>
              <div onClick={()=>setOpenKb(openKb===a.id?null:a.id)}
                style={{fontSize:13,color:"#0a84ff",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>→ {a.title}</span>
                <span style={{fontSize:10}}>{openKb===a.id?"▲":"▼"}</span>
              </div>
              {openKb===a.id&&(
                <ol style={{margin:"8px 0 0 16px",padding:0,fontSize:12,color:"#8e8e93",lineHeight:1.8}}>
                  {a.steps.map((st,i)=><li key={i}>{st}</li>)}
                </ol>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{display:"flex",gap:10}}>
        <button onClick={onClose} style={{flex:1,padding:12,background:"transparent",border:"1px solid #ffffff10",borderRadius:8,color:"#8e8e93",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
        <button onClick={()=>{if(f.title.trim())onCreate(f);}} style={{flex:2,padding:12,background:"#0a84ff",border:"none",borderRadius:8,color:"#fff",fontWeight:800,cursor:"pointer",fontFamily:"'Syne',sans-serif"}}>Submit Ticket →</button>
      </div>
    </Overlay>
  );
}

// ── TICKET DETAIL ───────────────────────────────────────────
function Detail({ticket,onClose,onUpdate,isAgent}) {
  const [reply,setReply]=useState("");
  const [internal,setInternal]=useState(false);
  const [tab,setTab]=useState("thread");
  const [rating,setRating]=useState(ticket.rating||0);
  const s=sla(ticket);

  const send=()=>{
    if(!reply.trim())return;
    const c={id:`c${Date.now()}`,by:isAgent?"ag1":"u1",body:reply,internal,at:Date.now()};
    const upd={...ticket,comments:[...ticket.comments,c],updatedAt:Date.now(),
      audit:[...ticket.audit,{at:Date.now(),by:isAgent?"ag1":"u1",action:`${internal?"[Internal] ":""}Comment added`}]};
    onUpdate(upd); setReply(""); setInternal(false);
  };

  const setStatus=(v)=>onUpdate({...ticket,status:v,updatedAt:Date.now(),
    resolvedAt:v==="Resolved"?Date.now():ticket.resolvedAt,
    audit:[...ticket.audit,{at:Date.now(),by:"ag1",action:`Status → ${v}`}]});

  const setAssign=(v)=>onUpdate({...ticket,assignedTo:v||null,updatedAt:Date.now(),
    audit:[...ticket.audit,{at:Date.now(),by:"ag1",action:v?`Assigned to ${byId(v)?.name}`:"Unassigned"}]});

  const rate=(r)=>{ setRating(r); onUpdate({...ticket,rating:r}); };

  return(
    <Overlay onClose={onClose} wide>
      {/* header */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>
          <span style={{fontSize:12,color:"#48484a",fontFamily:"'IBM Plex Mono',monospace"}}>{ticket.id}</span>
          <Pill label={ticket.priority} bg={P_COLOR[ticket.priority][0]} sm/>
          <Pill label={ticket.status}   bg={S_COLOR[ticket.status]} sm/>
          <Pill label={ticket.cat}      bg="#ffffff10" sm style={{color:"#8e8e93"}}/>
        </div>
        <div style={{fontSize:18,fontWeight:700,color:"#f2f2f7",lineHeight:1.4}}>{ticket.title}</div>
        <div style={{fontSize:12,color:"#636366",marginTop:6}}>Opened by {byId(ticket.createdBy)?.name} · {ago(ticket.createdAt)}</div>
      </div>

      {/* SLA banner */}
      {s&&(
        <div style={{marginBottom:20,padding:"12px 16px",background:`${s.color}0a`,border:`1px solid ${s.color}28`,borderRadius:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:11,fontWeight:700,color:s.color,letterSpacing:".06em"}}>⏱ SLA TIMER — {ticket.priority.toUpperCase()} ({SLA_HOURS[ticket.priority]}h target)</span>
            <span style={{fontSize:12,fontFamily:"'IBM Plex Mono',monospace",color:s.color}}>{s.label}</span>
          </div>
          <div style={{height:5,background:"#ffffff08",borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${s.pct}%`,background:s.color,borderRadius:3}}/>
          </div>
        </div>
      )}

      {/* agent panel */}
      {isAgent&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24,padding:"16px",background:"#ffffff03",borderRadius:10,border:"1px solid #ffffff08"}}>
          <Sel label="STATUS" value={ticket.status} onChange={e=>setStatus(e.target.value)} opts={STATUSES}/>
          <Sel label="ASSIGNEE" value={ticket.assignedTo||""} onChange={e=>setAssign(e.target.value)}
            opts={[{v:"",l:"— Unassigned —"},...AGENTS.map(a=>({v:a.id,l:`${a.name} (${a.dept})`}))]}/>
        </div>
      )}

      {/* tabs */}
      <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:"1px solid #ffffff08"}}>
        {[["thread","💬 Thread"],["desc","📄 Description"],["audit","📋 Audit Log"]].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)}
            style={{padding:"9px 16px",background:"none",border:"none",borderBottom:`2px solid ${tab===v?"#0a84ff":"transparent"}`,
              color:tab===v?"#0a84ff":"#636366",fontWeight:tab===v?700:400,fontSize:13,cursor:"pointer",marginBottom:-1,fontFamily:"'DM Sans',sans-serif"}}>
            {l}
          </button>
        ))}
      </div>

      {tab==="desc"&&(
        <div style={{padding:"16px",background:"#0c0c14",borderRadius:10,fontSize:13,color:"#aeaeb2",lineHeight:1.8,marginBottom:20}}>{ticket.desc}</div>
      )}

      {tab==="audit"&&(
        <div style={{marginBottom:20}}>
          {ticket.audit.map((a,i)=>(
            <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:"1px solid #ffffff06",alignItems:"flex-start"}}>
              <Avi id={a.by} size={24}/>
              <div>
                <span style={{fontSize:13,color:"#f2f2f7"}}>{a.action}</span>
                <div style={{fontSize:11,color:"#48484a",marginTop:2,fontFamily:"'IBM Plex Mono',monospace"}}>{byId(a.by)?.name} · {ago(a.at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="thread"&&(
        <div style={{marginBottom:20}}>
          {ticket.comments.filter(c=>isAgent||!c.internal).length===0&&(
            <div style={{textAlign:"center",padding:"28px 0",color:"#48484a",fontSize:13}}>No replies yet.</div>
          )}
          {ticket.comments.filter(c=>isAgent||!c.internal).map(c=>{
            const u=byId(c.by);
            return(
              <div key={c.id} style={{marginBottom:12,padding:"14px 16px",background:c.internal?"#bf5af208":"#0c0c14",border:`1px solid ${c.internal?"#bf5af222":"#ffffff08"}`,borderRadius:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <Avi id={c.by} size={26}/>
                  <span style={{fontSize:13,fontWeight:600,color:"#f2f2f7"}}>{u?.name}</span>
                  <span style={{fontSize:11,color:"#48484a"}}>{u?.dept}</span>
                  {c.internal&&<Pill label="INTERNAL" bg="#bf5af2" sm/>}
                  <span style={{fontSize:11,color:"#48484a",marginLeft:"auto",fontFamily:"'IBM Plex Mono',monospace"}}>{ago(c.at)}</span>
                </div>
                <div style={{fontSize:13,color:"#aeaeb2",lineHeight:1.7}}>{c.body}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* reply */}
      {ticket.status!=="Closed"&&(
        <div style={{borderTop:"1px solid #ffffff08",paddingTop:20}}>
          <textarea value={reply} onChange={e=>setReply(e.target.value)} rows={3} placeholder="Write a reply…"
            style={{width:"100%",padding:"11px 14px",background:"#0c0c14",border:"1px solid #ffffff12",borderRadius:8,color:"#f2f2f7",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"vertical",boxSizing:"border-box",marginBottom:10}}/>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {isAgent&&(
              <label style={{display:"flex",alignItems:"center",gap:7,fontSize:13,color:"#8e8e93",cursor:"pointer",flexShrink:0}}>
                <input type="checkbox" checked={internal} onChange={e=>setInternal(e.target.checked)} style={{accentColor:"#bf5af2"}}/>
                Internal note
              </label>
            )}
            <button onClick={send} style={{marginLeft:"auto",padding:"9px 20px",background:"#0a84ff",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Syne',sans-serif"}}>
              Send {internal?"(Internal)":"Reply"}
            </button>
          </div>
        </div>
      )}

      {/* rating */}
      {ticket.status==="Resolved"&&!isAgent&&(
        <div style={{marginTop:20,padding:"16px",background:"#34c75908",border:"1px solid #34c75922",borderRadius:10}}>
          <div style={{fontSize:13,fontWeight:700,color:"#34c759",marginBottom:12}}>✓ Ticket Resolved — How did we do?</div>
          <div style={{display:"flex",gap:8}}>
            {[1,2,3,4,5].map(r=>(
              <button key={r} onClick={()=>rate(r)} style={{fontSize:22,background:"none",border:"none",cursor:"pointer",opacity:r<=rating?1:.25,transition:"opacity .15s,transform .1s",transform:r<=rating?"scale(1.1)":"scale(1)"}}>⭐</button>
            ))}
            {rating>0&&<span style={{fontSize:13,color:"#34c759",marginLeft:8,alignSelf:"center"}}>Thanks for the feedback!</span>}
          </div>
        </div>
      )}
    </Overlay>
  );
}

// ── ANALYTICS ──────────────────────────────────────────────
function Analytics({tickets}) {
  const total=tickets.length;
  const open=tickets.filter(t=>t.status==="Open").length;
  const crit=tickets.filter(t=>t.priority==="Critical"&&!["Resolved","Closed"].includes(t.status)).length;
  const res=tickets.filter(t=>t.resolvedAt);
  const avgH=res.length?Math.round(res.reduce((s,t)=>s+(t.resolvedAt-t.createdAt),0)/res.length/3600000):0;
  const rated=tickets.filter(t=>t.rating);
  const avgR=rated.length?(rated.reduce((s,t)=>s+t.rating,0)/rated.length).toFixed(1):"—";

  const statCounts=STATUSES.map(s=>({s,n:tickets.filter(t=>t.status===s).length}));
  const catCounts=CATEGORIES.map(c=>({c,n:tickets.filter(t=>t.cat===c).length})).filter(x=>x.n>0).sort((a,b)=>b.n-a.n);
  const maxCat=Math.max(...catCounts.map(x=>x.n),1);

  return(
    <div>
      <div style={{fontSize:22,fontWeight:900,color:"#f2f2f7",letterSpacing:-1,marginBottom:24,fontFamily:"'Syne',sans-serif"}}>Analytics Dashboard</div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
        {[
          ["Total Tickets",total,"#0a84ff"],
          ["Open / Unresolved",open,"#ff9f0a"],
          ["Avg Resolution",`${avgH}h`,"#34c759"],
          ["Avg CSAT",avgR==="—"?avgR:avgR+" ★","#bf5af2"],
        ].map(([l,v,c])=>(
          <Card key={l} style={{padding:"20px 22px"}}>
            <div style={{fontSize:30,fontWeight:900,color:c,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:-1}}>{v}</div>
            <div style={{fontSize:12,color:"#48484a",marginTop:4}}>{l}</div>
          </Card>
        ))}
      </div>

      {crit>0&&(
        <div style={{marginBottom:20,padding:"14px 18px",background:"#ff3b5c0a",border:"1px solid #ff3b5c28",borderRadius:10,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>🚨</span>
          <div>
            <span style={{fontSize:14,fontWeight:700,color:"#ff3b5c"}}>{crit} Critical ticket{crit>1?"s":""} breaching SLA</span>
            <span style={{fontSize:13,color:"#8e8e93",marginLeft:8}}>— immediate action required</span>
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        {/* status */}
        <Card style={{padding:"20px 22px"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#f2f2f7",marginBottom:16}}>By Status</div>
          {statCounts.map(({s,n})=>(
            <div key={s} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <Pill label={s} bg={S_COLOR[s]} sm/>
              <div style={{flex:1,height:6,background:"#ffffff08",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(n/Math.max(total,1))*100}%`,background:S_COLOR[s],borderRadius:3}}/>
              </div>
              <span style={{fontSize:13,color:"#f2f2f7",fontFamily:"'IBM Plex Mono',monospace",width:18,textAlign:"right"}}>{n}</span>
            </div>
          ))}
        </Card>

        {/* category */}
        <Card style={{padding:"20px 22px"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#f2f2f7",marginBottom:16}}>By Category</div>
          {catCounts.map(({c,n})=>(
            <div key={c} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <span style={{fontSize:12,color:"#8e8e93",width:88,flexShrink:0,fontSize:11}}>{c}</span>
              <div style={{flex:1,height:6,background:"#ffffff08",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(n/maxCat)*100}%`,background:"#0a84ff",borderRadius:3}}/>
              </div>
              <span style={{fontSize:13,color:"#f2f2f7",fontFamily:"'IBM Plex Mono',monospace",width:18,textAlign:"right"}}>{n}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* agent perf */}
      <Card style={{padding:"20px 22px"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#f2f2f7",marginBottom:16}}>Agent Performance</div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:8}}>
          {["Agent","Dept","Assigned","Resolved","CSAT"].map(h=>(
            <div key={h} style={{fontSize:10,color:"#48484a",fontWeight:700,letterSpacing:".07em",paddingBottom:8,borderBottom:"1px solid #ffffff08"}}>{h}</div>
          ))}
          {AGENTS.map(a=>{
            const at=tickets.filter(t=>t.assignedTo===a.id);
            const ar=at.filter(t=>t.resolvedAt);
            const ag=at.filter(t=>t.rating);
            const avgAg=ag.length?(ag.reduce((s,t)=>s+t.rating,0)/ag.length).toFixed(1):"—";
            return[
              <div key={a.id+"n"} style={{display:"flex",alignItems:"center",gap:8}}><Avi id={a.id} size={24}/><div><div style={{fontSize:13,color:"#f2f2f7"}}>{a.name}</div></div></div>,
              <div key={a.id+"d"} style={{fontSize:11,color:"#636366",alignSelf:"center"}}>{a.dept}</div>,
              <div key={a.id+"a"} style={{fontSize:13,color:"#f2f2f7",fontFamily:"'IBM Plex Mono',monospace",alignSelf:"center"}}>{at.length}</div>,
              <div key={a.id+"r"} style={{fontSize:13,color:"#34c759",fontFamily:"'IBM Plex Mono',monospace",alignSelf:"center"}}>{ar.length}</div>,
              <div key={a.id+"g"} style={{fontSize:13,color:"#bf5af2",fontFamily:"'IBM Plex Mono',monospace",alignSelf:"center"}}>{avgAg}{avgAg!=="—"?" ★":""}</div>,
            ];
          })}
        </div>
      </Card>
    </div>
  );
}

// ── KNOWLEDGE BASE ──────────────────────────────────────────
function KnowledgeBase() {
  const [q,setQ]=useState("");
  const [open,setOpen]=useState(null);
  const hits=KB.filter(a=>!q||[a.title,...a.tags].some(x=>x.toLowerCase().includes(q.toLowerCase())));

  return(
    <div>
      <div style={{fontSize:22,fontWeight:900,color:"#f2f2f7",letterSpacing:-1,marginBottom:6,fontFamily:"'Syne',sans-serif"}}>Knowledge Base</div>
      <div style={{fontSize:13,color:"#48484a",marginBottom:20}}>Self-service guides — try these before opening a ticket.</div>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍  Search articles, tags, categories…"
        style={{width:"100%",padding:"12px 16px",background:"#0f0f1a",border:"1px solid #ffffff10",borderRadius:10,color:"#f2f2f7",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",marginBottom:16,boxSizing:"border-box"}}/>
      {hits.map(a=>(
        <Card key={a.id} style={{marginBottom:10,overflow:"hidden"}}>
          <div onClick={()=>setOpen(open===a.id?null:a.id)} style={{padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:"#f2f2f7",marginBottom:6}}>{a.title}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <Pill label={a.cat} bg="#0a84ff" sm/>
                {a.tags.slice(0,4).map(t=><span key={t} style={{fontSize:10,color:"#636366",background:"#ffffff06",padding:"2px 7px",borderRadius:4}}>{t}</span>)}
              </div>
            </div>
            <span style={{color:"#48484a",fontSize:14,marginLeft:16}}>{open===a.id?"▲":"▼"}</span>
          </div>
          {open===a.id&&(
            <div style={{padding:"0 20px 20px",borderTop:"1px solid #ffffff06"}}>
              <div style={{fontSize:12,color:"#48484a",fontWeight:700,letterSpacing:".07em",margin:"14px 0 10px"}}>STEPS TO RESOLVE</div>
              <ol style={{paddingLeft:20,margin:0}}>
                {a.steps.map((s,i)=><li key={i} style={{fontSize:13,color:"#aeaeb2",lineHeight:1.8,marginBottom:4}}>{s}</li>)}
              </ol>
              <div style={{marginTop:14,padding:"10px 14px",background:"#0a84ff08",borderRadius:8,fontSize:12,color:"#0a84ff"}}>
                Still stuck? <strong>Open a ticket</strong> with category "{a.cat}" and reference this article.
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ── OVERLAY ─────────────────────────────────────────────────
function Overlay({children,onClose,wide}) {
  return(
    <div style={{position:"fixed",inset:0,background:"#000000d0",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:wide?700:540,background:"#0f0f1a",border:"1px solid #ffffff10",borderRadius:16,padding:"28px 32px",maxHeight:"90vh",overflowY:"auto",position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:20,right:20,background:"none",border:"none",color:"#48484a",cursor:"pointer",fontSize:18,lineHeight:1}}>✕</button>
        {children}
      </div>
    </div>
  );
}

// ── TOAST ───────────────────────────────────────────────────
function Toast({msg,color}) {
  return(
    <div style={{position:"fixed",bottom:28,right:28,background:color||"#34c759",color:"#fff",padding:"12px 22px",borderRadius:10,fontSize:14,fontWeight:700,zIndex:300,boxShadow:"0 12px 40px #00000060",animation:"toastIn .25s ease",fontFamily:"'DM Sans',sans-serif"}}>
      {msg}
    </div>
  );
}

// ── APP ─────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(null);
  const [tickets,setTickets]=useState(seed());
  const [view,setView]=useState("tickets");
  const [sel,setSel]=useState(null);
  const [newOpen,setNewOpen]=useState(false);
  const [filter,setFilter]=useState({status:"All",priority:"All",cat:"All"});
  const [search,setSearch]=useState("");
  const [toast,setToast]=useState(null);

  const pop=(msg,color)=>{ setToast({msg,color}); setTimeout(()=>setToast(null),3000); };

  const isAgent=user?.role==="agent"||user?.role==="admin";

  const visible=tickets.filter(t=>{
    if(!isAgent&&t.createdBy!==user?.id) return false;
    if(filter.status!=="All"&&t.status!==filter.status) return false;
    if(filter.priority!=="All"&&t.priority!==filter.priority) return false;
    if(filter.cat!=="All"&&t.cat!==filter.cat) return false;
    if(search&&!t.title.toLowerCase().includes(search.toLowerCase())&&!t.id.includes(search)) return false;
    return true;
  });

  const upd=useCallback((t)=>{ setTickets(ts=>ts.map(x=>x.id===t.id?t:x)); setSel(t); pop("Ticket updated ✓"); },[]);

  const create=(f)=>{
    const t={id:genId(tickets),...f,cat:f.cat,status:"Open",createdBy:user.id,assignedTo:null,
      createdAt:Date.now(),updatedAt:Date.now(),resolvedAt:null,comments:[],rating:null,
      audit:[{at:Date.now(),by:user.id,action:"Ticket created"}]};
    setTickets(ts=>[t,...ts]); setNewOpen(false); pop(`${t.id} created!`,"#0a84ff");
  };

  if(!user) return <Login onLogin={setUser}/>;

  const NAV=isAgent
    ?[["tickets","🎫","Queue"],["analytics","📊","Analytics"],["kb","📚","Knowledge Base"]]
    :[["tickets","🎫","My Tickets"],["kb","📚","Help Articles"]];

  const openCount=tickets.filter(t=>t.status==="Open").length;

  return(
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#07070f;}
        select option{background:#0f0f1a;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#ffffff15;border-radius:4px;}
        @keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      `}</style>

      <div style={{minHeight:"100vh",background:"#07070f",display:"flex",fontFamily:"'DM Sans',sans-serif"}}>
        {/* grid */}
        <div style={{position:"fixed",inset:0,backgroundImage:"linear-gradient(#ffffff03 1px,transparent 1px),linear-gradient(90deg,#ffffff03 1px,transparent 1px)",backgroundSize:"48px 48px",pointerEvents:"none"}}/>

        {/* SIDEBAR */}
        <div style={{width:210,background:"#0a0a15",borderRight:"1px solid #ffffff08",padding:"22px 14px",display:"flex",flexDirection:"column",flexShrink:0,position:"relative",zIndex:10}}>
          <div style={{fontSize:22,fontWeight:900,color:"#f2f2f7",letterSpacing:-1,fontFamily:"'Syne',sans-serif",marginBottom:32,paddingLeft:6}}>
            NEX<span style={{color:"#0a84ff"}}>DESK</span>
          </div>

          {NAV.map(([v,icon,label])=>(
            <button key={v} onClick={()=>setView(v)} style={{
              width:"100%",padding:"10px 12px",borderRadius:9,border:"none",textAlign:"left",display:"flex",alignItems:"center",gap:10,
              background:view===v?"#0a84ff18":"transparent",
              color:view===v?"#0a84ff":"#636366",
              fontWeight:view===v?700:400,fontSize:14,cursor:"pointer",marginBottom:3,
              fontFamily:"'DM Sans',sans-serif",position:"relative",
            }}>
              <span>{icon}</span>{label}
              {v==="tickets"&&openCount>0&&(
                <span style={{marginLeft:"auto",background:view===v?"#0a84ff":"#0a84ff22",color:view===v?"#fff":"#0a84ff",fontSize:10,fontWeight:800,padding:"2px 6px",borderRadius:10,fontFamily:"'IBM Plex Mono',monospace"}}>{openCount}</span>
              )}
            </button>
          ))}

          <div style={{marginTop:"auto",padding:"14px 0 0",borderTop:"1px solid #ffffff08"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"0 6px"}}>
              <Avi id={user.id} size={32}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:"#f2f2f7",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name}</div>
                <div style={{fontSize:11,color:"#48484a"}}>{user.dept}</div>
              </div>
              <button onClick={()=>setUser(null)} title="Sign out" style={{background:"none",border:"none",color:"#48484a",cursor:"pointer",fontSize:15,flexShrink:0}}>⎋</button>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div style={{flex:1,overflowY:"auto",padding:"32px 36px",maxHeight:"100vh",position:"relative",zIndex:1}}>
          {view==="tickets"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
                <div>
                  <div style={{fontSize:24,fontWeight:900,color:"#f2f2f7",letterSpacing:-1,fontFamily:"'Syne',sans-serif"}}>
                    {isAgent?"Ticket Queue":"My Tickets"}
                  </div>
                  <div style={{fontSize:13,color:"#48484a",marginTop:2}}>{visible.length} ticket{visible.length!==1?"s":""} shown</div>
                </div>
                <button onClick={()=>setNewOpen(true)} style={{padding:"11px 22px",background:"#0a84ff",border:"none",borderRadius:9,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"'Syne',sans-serif",letterSpacing:.3}}>
                  + New Ticket
                </button>
              </div>

              {/* filters */}
              <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tickets or IDs…"
                  style={{flex:1,minWidth:180,padding:"9px 14px",background:"#0f0f1a",border:"1px solid #ffffff0c",borderRadius:8,color:"#f2f2f7",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
                {[
                  ["status",["All",...STATUSES]],
                  ["priority",["All",...PRIORITIES]],
                  ["cat",["All",...CATEGORIES]],
                ].map(([k,opts])=>(
                  <select key={k} value={filter[k]} onChange={e=>setFilter(f=>({...f,[k]:e.target.value}))}
                    style={{padding:"9px 12px",background:"#0f0f1a",border:"1px solid #ffffff0c",borderRadius:8,color:"#f2f2f7",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
                    {opts.map(o=><option key={o}>{o}</option>)}
                  </select>
                ))}
              </div>

              {visible.length===0
                ?<div style={{textAlign:"center",padding:"60px 0",color:"#48484a",fontSize:14}}>No tickets match your filters.</div>
                :visible.map(t=><TRow key={t.id} t={t} onClick={()=>setSel(t)}/>)
              }
            </div>
          )}

          {view==="analytics"&&isAgent&&<Analytics tickets={tickets}/>}
          {view==="kb"&&<KnowledgeBase/>}
        </div>
      </div>

      {newOpen&&<NewModal onClose={()=>setNewOpen(false)} onCreate={create} userId={user.id}/>}
      {sel&&<Detail ticket={sel} isAgent={isAgent} onClose={()=>setSel(null)} onUpdate={upd}/>}
      {toast&&<Toast msg={toast.msg} color={toast.color}/>}
    </>
  );
}

