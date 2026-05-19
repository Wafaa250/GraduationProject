import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function patchStudent() {
  const p = path.join(root, "src/app/pages/forms/StudentRegisterForm.tsx");
  let s = fs.readFileSync(p, "utf8");

  if (!s.includes("RegisterFormShell")) {
    s = s.replace(
      "import { navigateHome } from '../../../utils/homeNavigation'",
      `import { navigateHome } from '../../../utils/homeNavigation'\nimport { RegisterFormShell, RegisterSuccessShell } from '../../components/auth/RegisterFormShell'\nimport { Button } from '../../components/ui/button'`,
    );
  }

  const startIdx = s.indexOf("  return (\n    <div style={S.page}><Blobs />");
  if (startIdx < 0) throw new Error("student main return not found");

  const cardMarker = "        <motion.div style={S.card}>";
  const cardMarker2 = "        <div style={S.card}>";
  let cardStart = s.indexOf(cardMarker2, startIdx);
  if (cardStart < 0) cardStart = s.indexOf(cardMarker, startIdx);
  if (cardStart < 0) throw new Error("student card not found");

  const openNew = `  return (
    <RegisterFormShell
      roleLabel="Student"
      steps={STEPS.map((s) => s.label)}
      currentStep={step}
      onChangeRole={onBack ?? undefined}
      subtitle="Tell us about yourself so AI can find the right teammates and projects."
    >
`;

  const cardTag = s.startsWith(cardMarker2, cardStart) ? cardMarker2 : cardMarker;
  s = s.slice(0, startIdx) + openNew + s.slice(cardStart + cardTag.length);

  const closeOld = `        </div>

        <p style={{textAlign:'center' as const,color:'#cbd5e1',fontSize:12,marginTop:24}}>SkillSwap · Academic Collaboration Platform</p>
      </div>
      <style>{\`input::placeholder{color:#94a3b8;}input:focus,select:focus{outline:none;border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,0.1);}button:hover{opacity:0.92;}\`}</style>
    </div>
  )
}`;

  const closeNew = `    </RegisterFormShell>
  )
}`;

  if (!s.includes(closeOld)) throw new Error("student close not found");
  s = s.replace(closeOld, closeNew);

  s = s.replace(
    `{apiError&&<motion.div style={{marginTop:16,padding:'12px 16px',background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:10,color:'#dc2626',fontSize:13,fontWeight:500}}>❌ {apiError}</div>}`,
    `{apiError ? <div className="register-api-error">{apiError}</div> : null}`,
  );
  s = s.replace(
    `{apiError&&<div style={{marginTop:16,padding:'12px 16px',background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:10,color:'#dc2626',fontSize:13,fontWeight:500}}>❌ {apiError}</div>}`,
    `{apiError ? <div className="register-api-error">{apiError}</div> : null}`,
  );

  const navOld = `          <div style={S.navRow}>
            {step>0?<button style={S.btnBack} onClick={back}>← Back</button>:<div/>}
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <span style={{fontSize:12,color:'#94a3b8',fontWeight:600}}>{step+1} / {STEPS.length}</span>
              {step<STEPS.length-1
                ?<button style={S.btnPrimary} onClick={next}>Continue →</button>
                :<button style={{...S.btnPrimary,opacity:isLoading?0.7:1}} onClick={submit} disabled={isLoading}>{isLoading?'⏳ Creating...':'✦ Create Account'}</button>
              }
            </div>
          </div>`;

  const navNew = `          <div className="register-nav-row">
            {step > 0 ? (
              <button type="button" className="register-btn-back" onClick={back}>← Back</button>
            ) : (
              <motion.div />
            )}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-muted-foreground">{step + 1} / {STEPS.length}</span>
              {step < STEPS.length - 1 ? (
                <button type="button" className="register-btn-primary" onClick={next}>Continue →</button>
              ) : (
                <button type="button" className="register-btn-primary" onClick={submit} disabled={isLoading}>
                  {isLoading ? "Creating account…" : "Create account"}
                </button>
              )}
            </motion.div>
          </motion.div>`;

  if (s.includes(navOld)) s = s.replace(navOld, navNew.replace(/motion\.div/g, "motion.div").replace(/<motion\.div \/>/g, "<div />").replace(/<\/motion\.motion.div>/g, "</div>").replace(/<\/motion\.motion.div>/g, "</div>"));

  const navNewFixed = navNew.replace(/motion\.div/g, "div");
  if (s.includes(navOld)) s = s.replace(navOld, navNewFixed);

  // success block
  const succStart = s.indexOf("  if (submitted) return (");
  const succEnd = s.indexOf("  return (\n    <RegisterFormShell", succStart);
  if (succStart >= 0 && succEnd > succStart) {
    const succNew = `  if (submitted) return (
    <RegisterSuccessShell>
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
          <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="2"/>
          <path d="M9 16l5 5 9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
      <h2 className="font-display text-2xl font-bold text-foreground">You&apos;re all set</h2>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        Welcome to SkillSwap, <strong className="text-primary">{form.fullName}</strong>. Our AI will use your profile for smarter team matches.
      </p>
      <div className="mt-6 flex items-center justify-center gap-4 rounded-xl border border-border bg-muted/40 px-4 py-4">
        <div className="text-center"><span className="block text-xl font-bold text-primary">{form.roles.length}</span><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Roles</span></motion.div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center"><span className="block text-xl font-bold text-ai">{form.technicalSkills.length}</span><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills</span></motion.div>
        <div className="h-8 w-px bg-border" />
        <motion.div className="text-center"><span className="block text-xl font-bold text-primary">{form.tools.length}</span><span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tools</span></motion.div>
      </motion.div>
      <div className="mt-6 flex flex-col gap-3">
        <Button variant="gradient" className="h-12 w-full rounded-xl" onClick={()=>{sessionStorage.removeItem('selectedRole');navigate('/profile')}}>View my profile</Button>
        <Button variant="outline" className="h-12 w-full rounded-xl" onClick={()=>{sessionStorage.removeItem('selectedRole');navigateHome(navigate)}}>Go to dashboard</Button>
      </motion.div>
    </RegisterSuccessShell>
  )

`;
    s = s.slice(0, succStart) + succNew.replace(/motion\.div/g, "div") + s.slice(succEnd);
  }

  fs.writeFileSync(p, s);
  console.log("patched student");
}

patchStudent();
