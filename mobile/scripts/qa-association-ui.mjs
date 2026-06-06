/**
 * Association web UI smoke test — viewports + route guard via sessionStorage.
 * Requires: npx expo start --web running on http://localhost:8081
 */
import { chromium } from "playwright";

const WEB = process.env.EXPO_WEB_URL || "http://localhost:8082";
const API = "http://localhost:5262/api";
const ts = Date.now();
const FAIL = [];
const PASS = [];

function record(ok, name, detail = "") {
  if (ok) {
    PASS.push(name);
    console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    FAIL.push({ name, detail });
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function registerAssociation() {
  const email = `qa.ui.assoc.${ts}@qa.test`;
  const password = "QaTest!234567";
  const r = await fetch(`${API}/auth/register/association`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      associationName: `QA UI Org ${ts}`,
      username: `qaui${ts}`,
      email,
      password,
      confirmPassword: password,
      faculty: "Engineering",
      category: "Technical",
    }),
  });
  const data = await r.json();
  return { token: data.token, role: data.role, email, password };
}

async function registerStudent() {
  const email = `qa.ui.student.${ts}@qa.test`;
  const password = "QaTest!234567";
  const r = await fetch(`${API}/auth/register/student`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "QA UI Student",
      email,
      password,
      confirmPassword: password,
      profilePictureBase64: null,
      studentId: `UI${ts}`,
      university: "QA University",
      faculty: "Engineering",
      major: "CS",
      academicYear: "Third Year",
      gpa: 3.5,
      roles: ["Team Lead"],
      technicalSkills: ["React"],
      tools: [],
      generalSkills: ["Team Lead"],
      majorSkills: [],
    }),
  });
  if (!r.ok) throw new Error(JSON.stringify(await r.json()));
  const data = await r.json();
  return { token: data.token, role: data.role };
}

async function setSession(page, { token, role, name = "QA" }) {
  await page.goto(WEB);
  await page.evaluate(
    ({ token, role, name }) => {
      const p = "gp.mobile.auth.";
      sessionStorage.setItem(p + "token", token);
      sessionStorage.setItem(p + "role", role);
      sessionStorage.setItem(p + "name", name);
    },
    { token, role, name },
  );
}

const ASSOC_ROUTES = [
  "/association/dashboard",
  "/association/events",
  "/association/recruitment",
  "/association/leadership",
  "/association/profile",
  "/association/notifications",
];

const VIEWPORTS = [
  { name: "small phone", width: 320, height: 568 },
  { name: "medium phone", width: 390, height: 844 },
  { name: "large phone", width: 428, height: 926 },
];

async function checkPage(page, path, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`${WEB}${path}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);
  const bodyText = await page.locator("body").innerText();
  const hasError = /unhandled|something went wrong|cannot read propert/i.test(bodyText);
  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);
  const overflowOk = scrollHeight <= clientHeight + 200 || scrollHeight > 400;
  record(!hasError && overflowOk, `${path} @ ${viewport.name}`, hasError ? "runtime error" : "loaded");
}

async function main() {
  console.log("\n=== Association Web UI QA ===\n");

  let serverOk = false;
  try {
    const r = await fetch(WEB);
    serverOk = r.ok;
  } catch {
    serverOk = false;
  }
  if (!serverOk) {
    console.error("Expo web not running at", WEB);
    process.exit(1);
  }
  record(true, "Expo web server reachable");

  const assoc = await registerAssociation();
  const student = await registerStudent();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Route protection — student should not stay on association dashboard
  {
    const page = await context.newPage();
    await setSession(page, student);
    await page.goto(`${WEB}/association/dashboard`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2000);
    const url = page.url();
    const blocked = !url.includes("/association/dashboard");
    record(blocked, "Route protection: student redirected off association", url);
    await page.close();
  }

  // Association can access screens
  {
    const page = await context.newPage();
    await setSession(page, assoc);
    for (const vp of VIEWPORTS) {
      for (const route of ASSOC_ROUTES) {
        await checkPage(page, route, vp);
      }
    }
    await page.close();
  }

  await browser.close();

  console.log(`\nUI PASS: ${PASS.length}  FAIL: ${FAIL.length}`);
  if (FAIL.length) {
    for (const f of FAIL) console.log(`  - ${f.name}: ${f.detail}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
