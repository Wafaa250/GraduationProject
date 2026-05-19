import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const [, , filename, roleLabel, subtitle] = process.argv;
if (!filename || !roleLabel) {
  console.error("Usage: node patch-role-form.mjs <file> <roleLabel> [subtitle]");
  process.exit(1);
}

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src/app/pages/forms", filename);
let s = fs.readFileSync(file, "utf8");

if (!s.includes("RegisterFormShell")) {
  const importAnchor =
    filename === "CompanyRegisterForm.tsx"
      ? "import './company-register-mobile.css'"
      : filename === "DoctorRegisterForm.tsx"
        ? "import api from '../../../api/axiosInstance'"
        : null;
  if (importAnchor) {
    s = s.replace(
      importAnchor,
      `${importAnchor}\nimport { RegisterFormShell, RegisterSuccessShell } from '../../components/auth/RegisterFormShell'\nimport { Button } from '../../components/ui/button'`,
    );
  }
}

const sub = subtitle || `Complete your ${roleLabel.toLowerCase()} profile on SkillSwap.`;

const openRe = /  return \(\r\n    <div[^>]*style=\{S\.page\}[^>]*>[\s\S]*?\r\n        <div style=\{S\.card\}[^>]*>\r\n/;

const repl = `  return (\r\n    <RegisterFormShell\r\n      roleLabel="${roleLabel}"\r\n      steps={STEPS.map((s) => s.label)}\r\n      currentStep={step}\r\n      onChangeRole={onBack ?? undefined}\r\n      subtitle="${sub}"\r\n    >\r\n`;

if (!openRe.test(s)) {
  // company uses className on page div
  const openRe2 = /  return \(\r\n    <div className="co-company-register" style=\{S\.page\}>[\s\S]*?\r\n        <div style=\{S\.card\}[^>]*>\r\n/;
  if (!openRe2.test(s)) throw new Error(`open not found in ${filename}`);
  s = s.replace(openRe2, `  return (\r\n    <RegisterFormShell\r\n      roleLabel="${roleLabel}"\r\n      steps={STEPS.map((s) => s.label)}\r\n      currentStep={step}\r\n      onChangeRole={onBack ?? undefined}\r\n      subtitle="${sub}"\r\n    >\r\n`);
} else {
  s = s.replace(openRe, repl);
}

// close patterns - try multiple
const closes = [
  `        </div>\r\n\r\n        <p style={{textAlign:'center' as const,color:'#cbd5e1',fontSize:12,marginTop:24}}>SkillSwap · Academic Collaboration Platform</p>\r\n      </div>\r\n      <style>{\`input::placeholder{color:#94a3b8;}input:focus,select:focus{outline:none;border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,0.1);}button:hover{opacity:0.92;}\`}</style>\r\n    </motion.div>\r\n  )\r\n}`,
  `        </div>\r\n\r\n        <p style={{textAlign:'center' as const,color:'#cbd5e1',fontSize:12,marginTop:24}}>SkillSwap · Academic Collaboration Platform</p>\r\n      </div>\r\n      <style>{\`input::placeholder{color:#94a3b8;}input:focus,select:focus{outline:none;border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,0.1);}button:hover{opacity:0.92;}\`}</style>\r\n    </div>\r\n  )\r\n}`,
  `        </div>\r\n      </div>\r\n    </div>\r\n  )\r\n}`,
];

let closed = false;
for (const c of closes) {
  if (s.includes(c)) {
    s = s.replace(c, `    </RegisterFormShell>\r\n  )\r\n}`);
    closed = true;
    break;
  }
}
if (!closed) {
  // company may end differently - find navRow close
  const idx = s.lastIndexOf("<style>{`input::placeholder");
  if (idx > 0) {
    const end = s.indexOf("  )\r\n}", idx);
    const chunk = s.slice(idx - 400, end + 6);
    console.log("manual close chunk tail:\n", chunk.slice(-200));
  }
  throw new Error(`close not found in ${filename}`);
}

// api error variants
s = s.replace(/<div style=\{S\.apiError\}>/g, '<div className="register-api-error">');
if (s.includes("{apiError && <motion.div style={S.apiError}>")) {
  s = s.replace("{apiError && <div style={S.apiError}>", "{apiError ? <div className=\"register-api-error\">");
}

const navPatterns = [
  `          <div style={S.navRow}>\r\n            {step>0?<button style={S.btnBack} onClick={back}>← Back</button>:<div/>}\r\n            <motion.div style={{display:'flex',alignItems:'center',gap:14}}>`,
  `          <div style={S.navRow}>\r\n            {step>0?<button style={S.btnBack} onClick={back}>← Back</button>:<div/>}\r\n            <div style={{display:'flex',alignItems:'center',gap:14}}>`,
];

const navNew = `          <div className="register-nav-row">\r\n            {step > 0 ? (\r\n              <button type="button" className="register-btn-back" onClick={back}>← Back</button>\r\n            ) : (\r\n              <div />\r\n            )}\r\n            <div className="flex items-center gap-3">`;

for (const n of navPatterns) {
  if (s.includes(n)) {
    s = s.replace(n, navNew);
    break;
  }
}

// replace primary/back button classes in nav area - heuristic replace btnPrimary in last nav block
s = s.replace(/<button style=\{S\.btnBack\} onClick=\{back\}>/g, '<button type="button" className="register-btn-back" onClick={back}>');
s = s.replace(/<button style=\{S\.btnPrimary\} onClick=\{next\}>/g, '<button type="button" className="register-btn-primary" onClick={next}>');
s = s.replace(/<button style=\{\{\.\.\.S\.btnPrimary,opacity:isLoading\?0\.7:1\}\} onClick=\{submit\} disabled=\{isLoading\}>/g, '<button type="button" className="register-btn-primary" onClick={submit} disabled={isLoading}>');
s = s.replace(/<button type="button" style=\{S\.btnPrimary\} onClick=\{next\}>/g, '<button type="button" className="register-btn-primary" onClick={next}>');
s = s.replace(/<button type="button" style=\{\{\.\.\.S\.btnPrimary,opacity:isLoading\?0\.7:1\}\} onClick=\{submit\} disabled=\{isLoading\}>/g, '<button type="button" className="register-btn-primary" onClick={submit} disabled={isLoading}>');

fs.writeFileSync(file, s);
console.log(`${filename} ok`);
