import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src/app/pages/forms/DoctorRegisterForm.tsx");
let s = fs.readFileSync(file, "utf8");

if (!s.includes("RegisterFormShell")) {
  s = s.replace(
    "import api from '../../../api/axiosInstance'",
    `import api from '../../../api/axiosInstance'
import { RegisterFormShell, RegisterSuccessShell } from '../../components/auth/RegisterFormShell'
import { Button } from '../../components/ui/button'`,
  );
}

const openRe = /  return \(\r\n    <motion.div style=\{S\.page\}><Blobs \/>\r\n      <motion.div style=\{S\.wrap\}>[\s\S]*?\r\n        <motion.div style=\{S\.card\}>\r\n\r\n          \{\/\* STEP 0/;
const openRe2 = /  return \(\r\n    <div style=\{S\.page\}><Blobs \/>\r\n      <div style=\{S\.wrap\}>[\s\S]*?\r\n        <div style=\{S\.card\}>\r\n\r\n          \{\/\* STEP 0/;

const repl = `  return (\r\n    <RegisterFormShell\r\n      roleLabel="Doctor / Supervisor"\r\n      steps={STEPS.map((s) => s.label)}\r\n      currentStep={step}\r\n      onChangeRole={onBack ?? undefined}\r\n      subtitle="Set up your supervisor profile for research and project collaboration."\r\n    >\r\n\r\n          {/* STEP 0`;

if (!openRe2.test(s)) throw new Error("open not found");
s = s.replace(openRe2, repl);

const closeOld = `        </div>\r\n\r\n        <p style={{ textAlign: 'center' as const, color: '#cbd5e1', fontSize: 12, marginTop: 24 }}>\r\n          SkillSwap · Academic Collaboration Platform\r\n        </p>\r\n      </div>\r\n\r\n      <style>{\`\r\n        input::placeholder, textarea::placeholder { color: #94a3b8; }\r\n        input:focus, select:focus, textarea:focus { outline: none; border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }\r\n        button:hover { opacity: 0.92; }\r\n      \`}</style>\r\n    </div>\r\n  )\r\n}`;

if (!s.includes(closeOld)) throw new Error("close not found");
s = s.replace(closeOld, `    </RegisterFormShell>\r\n  )\r\n}`);

const navOld = `          <div style={S.navRow}>\r\n            {step > 0\r\n              ? <button style={S.btnBack} onClick={back}>← Back</button>\r\n              : <motion.div />\r\n            }\r\n            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>\r\n              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{step + 1} / {STEPS.length}</span>\r\n              {step < STEPS.length - 1\r\n                ? <button style={{ ...S.btnPrimary, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }} onClick={next}>Continue →</button>\r\n                : <button style={{ ...S.btnPrimary, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', opacity: isLoading ? 0.7 : 1 }} onClick={submit} disabled={isLoading}>\r\n                    {isLoading ? '⏳ Creating...' : '✦ Create Account'}\r\n                  </button>\r\n              }\r\n            </div>\r\n          </div>`;

const navOld2 = navOld.replace("<motion.div />", "<div />");

const navNew = `          <div className="register-nav-row">\r\n            {step > 0 ? (\r\n              <button type="button" className="register-btn-back" onClick={back}>← Back</button>\r\n            ) : (\r\n              <div />\r\n            )}\r\n            <div className="flex items-center gap-3">\r\n              <span className="text-sm font-semibold text-muted-foreground">{step + 1} / {STEPS.length}</span>\r\n              {step < STEPS.length - 1 ? (\r\n                <button type="button" className="register-btn-primary" onClick={next}>Continue →</button>\r\n              ) : (\r\n                <button type="button" className="register-btn-primary" onClick={submit} disabled={isLoading}>\r\n                  {isLoading ? "Creating account…" : "Create account"}\r\n                </button>\r\n              )}\r\n            </div>\r\n          </div>`;

const navOldReal = `          <div style={S.navRow}>\r\n            {step > 0\r\n              ? <button style={S.btnBack} onClick={back}>← Back</button>\r\n              : <div />\r\n            }\r\n            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>\r\n              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{step + 1} / {STEPS.length}</span>\r\n              {step < STEPS.length - 1\r\n                ? <button style={{ ...S.btnPrimary, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }} onClick={next}>Continue →</button>\r\n                : <button style={{ ...S.btnPrimary, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', opacity: isLoading ? 0.7 : 1 }} onClick={submit} disabled={isLoading}>\r\n                    {isLoading ? '⏳ Creating...' : '✦ Create Account'}\r\n                  </button>\r\n              }\r\n            </div>\r\n          </div>`;

s = s.replace(navOldReal, navNew);

s = s.replace(
  `{apiError && (\r\n            <div style={{ marginTop: 16, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, color: '#dc2626', fontSize: 13, fontWeight: 500 }}>\r\n              ❌ {apiError}\r\n            </div>\r\n          )}`,
  `{apiError ? <div className="register-api-error">{apiError}</div> : null}`,
);

fs.writeFileSync(file, s);
console.log("doctor ok");
