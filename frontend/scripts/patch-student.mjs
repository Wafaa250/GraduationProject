import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src/app/pages/forms/StudentRegisterForm.tsx");
let s = fs.readFileSync(file, "utf8");

const openRe = /  return \(\r\n    <div style=\{S\.page\}><Blobs \/>\r\n      <div style=\{S\.wrap\}>[\s\S]*?\r\n        <div style=\{S\.card\}>\r\n/;

const repl = `  return (\r\n    <RegisterFormShell\r\n      roleLabel="Student"\r\n      steps={STEPS.map((s) => s.label)}\r\n      currentStep={step}\r\n      onChangeRole={onBack ?? undefined}\r\n      subtitle="Tell us about yourself so AI can find the right teammates and projects."\r\n    >\r\n`;

if (!openRe.test(s)) throw new Error("open not found");
s = s.replace(openRe, repl);

const closeOld = `        </div>\r\n\r\n        <p style={{textAlign:'center' as const,color:'#cbd5e1',fontSize:12,marginTop:24}}>SkillSwap · Academic Collaboration Platform</p>\r\n      </div>\r\n      <style>{\`input::placeholder{color:#94a3b8;}input:focus,select:focus{outline:none;border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,0.1);}button:hover{opacity:0.92;}\`}</style>\r\n    </div>\r\n  )\r\n}`;

if (!s.includes(closeOld)) throw new Error("close not found");
s = s.replace(closeOld, `    </RegisterFormShell>\r\n  )\r\n}`);

s = s.replace(
  `{apiError&&<div style={{marginTop:16,padding:'12px 16px',background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:10,color:'#dc2626',fontSize:13,fontWeight:500}}>❌ {apiError}</div>}`,
  `{apiError ? <motion.div className="register-api-error">{apiError}</motion.div> : null}`.replace(/motion\.div/g, "motion.div"),
);
s = s.replace(
  `{apiError&&<div style={{marginTop:16,padding:'12px 16px',background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:10,color:'#dc2626',fontSize:13,fontWeight:500}}>❌ {apiError}</div>}`,
  `{apiError ? <div className="register-api-error">{apiError}</div> : null}`,
);

const navOld = `          <div style={S.navRow}>\r\n            {step>0?<button style={S.btnBack} onClick={back}>← Back</button>:<div/>}\r\n            <div style={{display:'flex',alignItems:'center',gap:14}}>\r\n              <span style={{fontSize:12,color:'#94a3b8',fontWeight:600}}>{step+1} / {STEPS.length}</span>\r\n              {step<STEPS.length-1\r\n                ?<button style={S.btnPrimary} onClick={next}>Continue →</button>\r\n                :<button style={{...S.btnPrimary,opacity:isLoading?0.7:1}} onClick={submit} disabled={isLoading}>{isLoading?'⏳ Creating...':'✦ Create Account'}</button>\r\n              }\r\n            </div>\r\n          </div>`;

const navNew = `          <div className="register-nav-row">\r\n            {step > 0 ? (\r\n              <button type="button" className="register-btn-back" onClick={back}>← Back</button>\r\n            ) : (\r\n              <div />\r\n            )}\r\n            <div className="flex items-center gap-3">\r\n              <span className="text-sm font-semibold text-muted-foreground">{step + 1} / {STEPS.length}</span>\r\n              {step < STEPS.length - 1 ? (\r\n                <button type="button" className="register-btn-primary" onClick={next}>Continue →</button>\r\n              ) : (\r\n                <button type="button" className="register-btn-primary" onClick={submit} disabled={isLoading}>\r\n                  {isLoading ? "Creating account…" : "Create account"}\r\n                </button>\r\n              )}\r\n            </div>\r\n          </div>`;

s = s.replace(navOld, navNew);

fs.writeFileSync(file, s);
console.log("student ok");
