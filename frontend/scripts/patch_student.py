import re
from pathlib import Path

path = Path(__file__).resolve().parent.parent / "src/app/pages/forms/StudentRegisterForm.tsx"
s = path.read_text(encoding="utf-8")

if "RegisterFormShell" not in s:
    s = s.replace(
        "import { navigateHome } from '../../../utils/homeNavigation'",
        "import { navigateHome } from '../../../utils/homeNavigation'\n"
        "import { RegisterFormShell, RegisterSuccessShell } from '../../components/auth/RegisterFormShell'\n"
        "import { Button } from '../../components/ui/button'",
    )

pat = re.compile(
    r"  return \(\n    <div style=\{S\.page\}><Blobs />\n      <motion.div style=\{S\.wrap\}>.*?\n        <motion.div style=\{S\.card\}>\n",
    re.DOTALL,
)
pat = re.compile(
    r"  return \(\n    <motion.div style=\{S\.page\}><Blobs />\n      <motion.div style=\{S\.wrap\}>.*?\n        <motion.div style=\{S\.card\}>\n",
    re.DOTALL,
)
# actual file uses div
pat = re.compile(
    r"  return \(\n    <div style=\{S\.page\}><Blobs />\n      <div style=\{S\.wrap\}>.*?\n        <div style=\{S\.card\}>\n",
    re.DOTALL,
)

repl = """  return (
    <RegisterFormShell
      roleLabel="Student"
      steps={STEPS.map((s) => s.label)}
      currentStep={step}
      onChangeRole={onBack ?? undefined}
      subtitle="Tell us about yourself so AI can find the right teammates and projects."
    >
"""

m = pat.search(s)
if not m:
    raise SystemExit("opening pattern not found")

s = pat.sub(repl, s, count=1)

close_old = """        </div>

        <p style={{textAlign:'center' as const,color:'#cbd5e1',fontSize:12,marginTop:24}}>SkillSwap · Academic Collaboration Platform</p>
      </div>
      <style>{`input::placeholder{color:#94a3b8;}input:focus,select:focus{outline:none;border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,0.1);}button:hover{opacity:0.92;}`}</style>
    </div>
  )
}"""

close_new = """    </RegisterFormShell>
  )
}"""

if close_old not in s:
    raise SystemExit("close pattern not found")

s = s.replace(close_old, close_new, 1)

api_old = "{apiError&&<motion.div style={{marginTop:16,padding:'12px 16px',background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:10,color:'#dc2626',fontSize:13,fontWeight:500}}>❌ {apiError}</div>}"
api_old2 = "{apiError&&<div style={{marginTop:16,padding:'12px 16px',background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:10,color:'#dc2626',fontSize:13,fontWeight:500}}>❌ {apiError}</div>}"
s = s.replace(api_old2, "{apiError ? <div className=\"register-api-error\">{apiError}</div> : null}")

nav_old = """          <div style={S.navRow}>
            {step>0?<button style={S.btnBack} onClick={back}>← Back</button>:<div/>}
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <span style={{fontSize:12,color:'#94a3b8',fontWeight:600}}>{step+1} / {STEPS.length}</span>
              {step<STEPS.length-1
                ?<button style={S.btnPrimary} onClick={next}>Continue →</button>
                :<button style={{...S.btnPrimary,opacity:isLoading?0.7:1}} onClick={submit} disabled={isLoading}>{isLoading?'⏳ Creating...':'✦ Create Account'}</button>
              }
            </div>
          </div>"""

nav_new = """          <div className="register-nav-row">
            {step > 0 ? (
              <button type="button" className="register-btn-back" onClick={back}>← Back</button>
            ) : (
              <div />
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
            </div>
          </div>"""

s = s.replace(nav_old, nav_new)

path.write_text(s, encoding="utf-8")
print("student patched")
