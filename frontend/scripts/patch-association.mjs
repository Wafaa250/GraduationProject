import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const file = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src/app/pages/auth/StudentAssociationRegisterPage.tsx",
);
let s = fs.readFileSync(file, "utf8");

if (!s.includes("RegisterFormShell")) {
  s = s.replace(
    "} from '../../../api/associationApi'",
    `} from '../../../api/associationApi'
import { RegisterFormShell, RegisterSuccessShell } from '../../components/auth/RegisterFormShell'
import { Button } from '../../components/ui/button'`,
  );
}

const openRe =
  /  return \(\r\n    <div style=\{S\.page\}>\r\n      <Blobs \/>\r\n      <div style=\{S\.wrap\}>[\s\S]*?\r\n        <div style=\{S\.card\}>\r\n          \{step === 0 &&/;

const repl = `  return (\r\n    <RegisterFormShell\r\n      roleLabel="Student Organization"\r\n      steps={STEPS.map((s) => s.label)}\r\n      currentStep={step}\r\n      subtitle="Register your student organization for campaigns and team collaboration."\r\n    >\r\n          <motion.div className="mb-4 flex flex-wrap items-center justify-center gap-2">\r\n            <Link to="/register" className="text-sm font-semibold text-primary hover:text-primary/80">\r\n              ← Change role\r\n            </Link>\r\n          </motion.div>\r\n          {step === 0 &&`;

if (!openRe.test(s)) throw new Error("open not found");
s = s.replace(openRe, repl.replace(/motion\.div/g, "motion.div").replace("<motion.div", "<div").replace("</motion.div>", "</motion.div>"));
// fix - use div only
s = fs.readFileSync(file, "utf8");
if (!s.includes("RegisterFormShell")) {
  s = s.replace(
    "} from '../../../api/associationApi'",
    `} from '../../../api/associationApi'
import { RegisterFormShell, RegisterSuccessShell } from '../../components/auth/RegisterFormShell'
import { Button } from '../../components/ui/button'`,
  );
}
s = s.replace(openRe, `  return (\r\n    <RegisterFormShell\r\n      roleLabel="Student Organization"\r\n      steps={STEPS.map((s) => s.label)}\r\n      currentStep={step}\r\n      subtitle="Register your student organization for campaigns and team collaboration."\r\n    >\r\n          <div className="mb-4 flex justify-center">\r\n            <Link to="/register" className="text-sm font-semibold text-primary hover:text-primary/80">\r\n              ← Change role\r\n            </Link>\r\n          </div>\r\n          {step === 0 &&`);

const closeOld = `        </div>\r\n      </div>\r\n      <style>{\`\r\n        input::placeholder, textarea::placeholder { color: #94a3b8; }\r\n        input:focus, select:focus, textarea:focus { outline: none; border-color: #f59e0b !important; box-shadow: 0 0 0 3px rgba(245,158,11,0.15); }\r\n      \`}</style>\r\n    </div>\r\n  )\r\n}`;

if (!s.includes(closeOld)) throw new Error("close not found");
s = s.replace(closeOld, `    </RegisterFormShell>\r\n  )\r\n}`);

const navOld = `          <div style={S.navRow}>\r\n            {step > 0 ? (\r\n              <button type="button" style={S.btnBack} onClick={back}>\r\n                ← Back\r\n              </button>\r\n            ) : (\r\n              <span />\r\n            )}\r\n            {step < STEPS.length - 1 ? (\r\n              <button type="button" style={S.btnPrimary} onClick={next}>\r\n                Continue →\r\n              </button>\r\n            ) : (\r\n              <button type="button" style={S.btnPrimary} onClick={submit} disabled={isLoading}>\r\n                {isLoading ? 'Creating account…' : 'Create account'}\r\n              </button>\r\n            )}\r\n          </div>`;

const navNew = `          <div className="register-nav-row">\r\n            {step > 0 ? (\r\n              <button type="button" className="register-btn-back" onClick={back}>← Back</button>\r\n            ) : (\r\n              <div />\r\n            )}\r\n            <motion.div className="flex items-center gap-3">\r\n              {step < STEPS.length - 1 ? (\r\n                <button type="button" className="register-btn-primary" onClick={next}>Continue →</button>\r\n              ) : (\r\n                <button type="button" className="register-btn-primary" onClick={submit} disabled={isLoading}>\r\n                  {isLoading ? "Creating account…" : "Create account"}\r\n                </button>\r\n              )}\r\n            </motion.div>\r\n          </motion.div>`.replace(/motion\.div/g, "div");

s = s.replace(navOld, navNew);

const succOld = `  if (submitted) {\r\n    return (\r\n      <div style={S.page}>\r\n        <Blobs />\r\n        <motion.div style={S.successWrap}>\r\n          <div style={S.successIcon}>✓</div>\r\n          <h2 style={S.successH2}>Welcome, {form.associationName}!</h2>\r\n          <p style={S.successP}>Your student organization account is ready on SkillSwap.</p>\r\n          <button type="button" style={S.btnPrimary} onClick={() => navigate('/association/dashboard')}>\r\n            Go to Dashboard →\r\n          </button>\r\n        </motion.div>\r\n      </motion.div>\r\n    )\r\n  }`;

const succOld2 = succOld.replace(/motion\.motion.div/g, "div").replace(/<motion\.div/g, "<div").replace(/<\/motion\.motion.div>/g, "</div>").replace(/motion\.div/g, "motion.div");
const succOld3 = `  if (submitted) {\r\n    return (\r\n      <div style={S.page}>\r\n        <Blobs />\r\n        <div style={S.successWrap}>\r\n          <div style={S.successIcon}>✓</div>\r\n          <h2 style={S.successH2}>Welcome, {form.associationName}!</h2>\r\n          <p style={S.successP}>Your student organization account is ready on SkillSwap.</p>\r\n          <button type="button" style={S.btnPrimary} onClick={() => navigate('/association/dashboard')}>\r\n            Go to Dashboard →\r\n          </button>\r\n        </div>\r\n      </div>\r\n    )\r\n  }`;

const succNew = `  if (submitted) {\r\n    return (\r\n      <RegisterSuccessShell>\r\n        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">✓</div>\r\n        <h2 className="font-display text-2xl font-bold text-foreground">Welcome, {form.associationName}!</h2>\r\n        <p className="mt-2 text-sm text-muted-foreground sm:text-base">Your student organization account is ready on SkillSwap.</p>\r\n        <Button variant="gradient" className="mt-6 h-12 w-full rounded-xl" onClick={() => navigate('/association/dashboard')}>\r\n          Go to dashboard\r\n        </Button>\r\n      </RegisterSuccessShell>\r\n    )\r\n  }`;

if (s.includes(succOld3)) s = s.replace(succOld3, succNew);

fs.writeFileSync(file, s);
console.log("association ok");
