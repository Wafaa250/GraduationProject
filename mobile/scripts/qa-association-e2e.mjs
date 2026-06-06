/**
 * Association mobile E2E QA against live backend (http://localhost:5262/api).
 * Run: node scripts/qa-association-e2e.mjs
 */
const API = process.env.EXPO_PUBLIC_API_BASE_URL?.trim()?.replace(/\/+$/, "") || "http://localhost:5262/api";
const ts = Date.now();
const PASS = [];
const FAIL = [];

function ok(name, detail = "") {
  PASS.push({ name, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, detail = "") {
  FAIL.push({ name, detail });
  console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

async function req(method, path, { token, body, formData } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !formData) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: formData ? body : body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data, ok: res.ok };
}

async function registerAssociation(suffix) {
  const email = `qa.assoc.${suffix}.${ts}@qa.test`;
  const payload = {
    associationName: `QA Org ${suffix}`,
    username: `qaorg${suffix}${ts}`,
    email,
    password: "QaTest!234567",
    confirmPassword: "QaTest!234567",
    description: "QA test organization",
    faculty: "Engineering",
    category: "Technical",
  };
  const r = await req("POST", "/auth/register/association", { body: payload });
  if (r.status !== 201 && r.status !== 200) {
    const login = await req("POST", "/auth/login", { body: { email, password: payload.password } });
    if (!login.ok) throw new Error(`Register/login failed: ${JSON.stringify(r.data)}`);
    return { token: login.data.token, email, role: login.data.role, userId: login.data.userId };
  }
  return { token: r.data.token, email, role: r.data.role, userId: r.data.userId };
}

async function registerStudent(suffix) {
  const email = `qa.student.${suffix}.${ts}@qa.test`;
  const payload = {
    fullName: `QA Student ${suffix}`,
    email,
    password: "QaTest!234567",
    confirmPassword: "QaTest!234567",
    profilePictureBase64: null,
    studentId: `STU${ts}${suffix}`,
    university: "QA University",
    faculty: "Engineering",
    major: "Computer Science",
    academicYear: "Third Year",
    gpa: 3.5,
    roles: ["Team Lead"],
    technicalSkills: ["React", "Leadership"],
    tools: [],
    generalSkills: ["Team Lead"],
    majorSkills: [],
  };
  const r = await req("POST", "/auth/register/student", { body: payload });
  if (!r.ok && r.status !== 201) {
    const login = await req("POST", "/auth/login", { body: { email, password: payload.password } });
    if (!login.ok) throw new Error(`Student register failed: ${JSON.stringify(r.data)}`);
    return { token: login.data.token, email, role: login.data.role };
  }
  return { token: r.data.token, email, role: r.data.role };
}

async function registerDoctor() {
  const email = `qa.doctor.${ts}@qa.test`;
  const payload = {
    fullName: "QA Doctor",
    email,
    password: "QaTest!234567",
    confirmPassword: "QaTest!234567",
    university: "QA University",
    faculty: "Engineering",
    department: "CS",
    specialization: "Software",
    bio: "QA",
    profilePictureBase64: null,
    role: "doctor",
  };
  const r = await req("POST", "/auth/register/doctor", { body: payload });
  if (!r.ok && r.status !== 201) {
    const login = await req("POST", "/auth/login", { body: { email, password: payload.password } });
    return { token: login.data?.token, role: login.data?.role };
  }
  return { token: r.data.token, role: r.data.role };
}

async function registerCompany() {
  const email = `qa.company.${ts}@qa.test`;
  const payload = {
    contactName: "QA Company",
    email,
    password: "QaTest!234567",
    confirmPassword: "QaTest!234567",
    companyName: `QA Co ${ts}`,
    description: "QA test company",
    websiteUrl: "https://example.com",
  };
  const r = await req("POST", "/auth/register/company", { body: payload });
  if (!r.ok && r.status !== 201) {
    const login = await req("POST", "/auth/login", { body: { email, password: payload.password } });
    return { token: login.data?.token, role: login.data?.role };
  }
  return { token: r.data.token, role: r.data.role };
}

// 1x1 PNG
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function main() {
  console.log(`\n=== Association Mobile E2E QA ===\nAPI: ${API}\n`);

  // Backend reachable
  const ping = await req("POST", "/auth/login", { body: { email: "ping@test.com", password: "x" } });
  if (ping.status === 0 || ping.data?.toString?.().includes("fetch failed")) {
    fail("Backend reachable", "Cannot connect to API");
    printSummary();
    process.exit(1);
  }
  ok("Backend reachable");

  let assoc, student, doctor;
  try {
    assoc = await registerAssociation("main");
    ok("Association account auth", assoc.role);
  } catch (e) {
    fail("Association account auth", String(e.message));
    printSummary();
    process.exit(1);
  }

  const { token } = assoc;

  // Dashboard / profile load
  const profile = await req("GET", "/association/profile", { token });
  if (profile.ok) ok("Dashboard/Profile load", profile.data?.associationName);
  else fail("Dashboard/Profile load", JSON.stringify(profile.data));

  const publicOrg = profile.ok
    ? await req("GET", `/organizations/${profile.data.id}`, { token })
    : { ok: false };
  if (publicOrg.ok) ok("Organization profile followers", `count=${publicOrg.data?.followersCount ?? 0}`);
  else fail("Organization profile followers", JSON.stringify(publicOrg.data));

  // Profile edit
  const profileUpdate = await req("PUT", "/association/profile", {
    token,
    body: { description: `QA updated ${ts}`, faculty: "Engineering", category: "Technical" },
  });
  if (profileUpdate.ok) ok("Profile edit save");
  else fail("Profile edit save", JSON.stringify(profileUpdate.data));

  // Logo upload
  const logoForm = new FormData();
  logoForm.append("file", new Blob([TINY_PNG], { type: "image/png" }), "logo.png");
  const logoUp = await req("POST", "/association/upload-logo", { token, body: logoForm, formData: true });
  if (logoUp.ok && logoUp.data?.logoUrl) ok("Logo upload");
  else fail("Logo upload", JSON.stringify(logoUp.data));

  // --- Events ---
  const future = new Date(Date.now() + 7 * 86400000).toISOString();
  const deadline = new Date(Date.now() + 5 * 86400000).toISOString();
  const eventCreate = await req("POST", "/organization/events", {
    token,
    body: {
      title: `QA Event ${ts}`,
      description: "QA event description",
      eventType: "Workshop",
      category: "Technical",
      location: "Campus Hall",
      isOnline: false,
      eventDate: future,
      registrationDeadline: deadline,
      isPublished: false,
    },
  });
  if (!eventCreate.ok) {
    fail("Event create", JSON.stringify(eventCreate.data));
  } else {
    const eventId = eventCreate.data.id;
    ok("Event create", `id=${eventId}`);

    const coverForm = new FormData();
    coverForm.append("file", new Blob([TINY_PNG], { type: "image/png" }), "cover.png");
    const coverUp = await req("POST", "/organization/events/upload-cover", {
      token,
      body: coverForm,
      formData: true,
    });
    if (coverUp.ok && coverUp.data?.coverImageUrl) {
      ok("Event cover upload");
      await req("PUT", `/organization/events/${eventId}`, {
        token,
        body: { coverImageUrl: coverUp.data.coverImageUrl },
      });
    } else fail("Event cover upload", JSON.stringify(coverUp.data));

    const eventEdit = await req("PUT", `/organization/events/${eventId}`, {
      token,
      body: { title: `QA Event Edited ${ts}` },
    });
    if (eventEdit.ok) ok("Event edit");
    else fail("Event edit", JSON.stringify(eventEdit.data));

    const eventGet = await req("GET", `/organization/events/${eventId}`, { token });
    if (eventGet.ok) ok("Event details");
    else fail("Event details", JSON.stringify(eventGet.data));

    // Registration form builder
    let form = await req("GET", `/organization/events/${eventId}/registration-form`, { token });
    if (form.status === 404) {
      form = await req("POST", `/organization/events/${eventId}/registration-form`, {
        token,
        body: { title: "Registration" },
      });
    }
    if (form.ok) ok("Registration form load/create");
    else fail("Registration form load/create", JSON.stringify(form.data));

    await req("PUT", `/organization/events/${eventId}/registration-form`, {
      token,
      body: { title: "QA Registration Form", description: "Please fill out" },
    });
    ok("Registration form title/description save");

    const field1 = await req("POST", `/organization/events/${eventId}/registration-form/fields`, {
      token,
      body: {
        label: "Why attend?",
        fieldType: "ShortText",
        isRequired: true,
        displayOrder: 0,
      },
    });
    const field2 = await req("POST", `/organization/events/${eventId}/registration-form/fields`, {
      token,
      body: {
        label: "Track",
        fieldType: "Dropdown",
        isRequired: true,
        options: ["A", "B"],
        displayOrder: 1,
      },
    });
    if (field1.ok && field2.ok) ok("Registration form builder add fields");
    else fail("Registration form builder", JSON.stringify({ field1: field1.data, field2: field2.data }));

    if (field1.ok) {
      const fid = field1.data.id;
      const editField = await req("PUT", `/organization/events/${eventId}/registration-form/fields/${fid}`, {
        token,
        body: { label: "Why attend? (edited)" },
      });
      if (editField.ok) ok("Registration form edit field");
      else fail("Registration form edit field", JSON.stringify(editField.data));

      const dup = await req("POST", `/organization/events/${eventId}/registration-form/fields`, {
        token,
        body: {
          label: "Why attend? (copy)",
          fieldType: "ShortText",
          isRequired: true,
          displayOrder: 2,
        },
      });
      if (dup.ok) ok("Registration form duplicate field");
      else fail("Registration form duplicate field", JSON.stringify(dup.data));
    }

    const publish = await req("POST", `/organization/events/${eventId}/publish`, { token });
    if (publish.ok) ok("Event publish");
    else fail("Event publish", JSON.stringify(publish.data));

    const regs = await req("GET", `/organization/events/${eventId}/registrations`, { token });
    if (regs.ok) ok("Registration submissions list", `count=${Array.isArray(regs.data) ? regs.data.length : 0}`);
    else fail("Registration submissions list", JSON.stringify(regs.data));

    const eventDel = await req("DELETE", `/organization/events/${eventId}`, { token });
    if (eventDel.ok || eventDel.status === 204) ok("Event delete");
    else fail("Event delete", JSON.stringify(eventDel.data));
  }

  // --- Recruitment ---
  const campDeadline = new Date(Date.now() + 14 * 86400000).toISOString();
  const campCreate = await req("POST", "/organization/recruitment-campaigns", {
    token,
    body: {
      title: `QA Campaign ${ts}`,
      description: "QA recruitment",
      applicationDeadline: campDeadline,
      isPublished: false,
      positions: [
        {
          roleTitle: "QA Lead",
          neededCount: 1,
          description: "Lead role",
          requirements: "2+ years experience",
          requiredSkills: "React, Leadership",
          displayOrder: 0,
        },
      ],
    },
  });
  if (!campCreate.ok) {
    fail("Recruitment campaign create", JSON.stringify(campCreate.data));
  } else {
    const campaignId = campCreate.data.id;
    const positionId = campCreate.data.positions?.[0]?.id;
    ok("Recruitment campaign create", `id=${campaignId}`);

    const campCoverForm = new FormData();
    campCoverForm.append("file", new Blob([TINY_PNG], { type: "image/png" }), "cover.png");
    const campCover = await req("POST", "/organization/recruitment-campaigns/upload-cover", {
      token,
      body: campCoverForm,
      formData: true,
    });
    if (campCover.ok) ok("Recruitment cover upload");
    else fail("Recruitment cover upload", JSON.stringify(campCover.data));

    const campEdit = await req("PUT", `/organization/recruitment-campaigns/${campaignId}`, {
      token,
      body: {
        title: `QA Campaign Edited ${ts}`,
        coverImageUrl: campCover.data?.coverImageUrl ?? null,
        positions: [
          {
            id: positionId,
            roleTitle: "QA Lead Edited",
            neededCount: 2,
            requirements: "Updated reqs",
            requiredSkills: "React, Node",
            displayOrder: 0,
          },
        ],
      },
    });
    if (campEdit.ok) ok("Recruitment campaign edit / position edit");
    else fail("Recruitment campaign edit", JSON.stringify(campEdit.data));

    const q1 = await req("POST", `/organization/recruitment-campaigns/${campaignId}/questions`, {
      token,
      body: {
        questionTitle: "Motivation",
        questionType: "Paragraph",
        isRequired: true,
        displayOrder: 0,
        positionId,
      },
    });
    const q2 = await req("POST", `/organization/recruitment-campaigns/${campaignId}/questions`, {
      token,
      body: {
        questionTitle: "Skill level",
        questionType: "Dropdown",
        isRequired: true,
        options: ["Beginner", "Advanced"],
        displayOrder: 1,
        positionId,
      },
    });
    if (q1.ok && q2.ok) ok("Position form builder add questions");
    else fail("Position form builder", JSON.stringify({ q1: q1.data, q2: q2.data }));

    if (q1.ok) {
      const qid = q1.data.id;
      const qEdit = await req("PUT", `/organization/recruitment-campaigns/${campaignId}/questions/${qid}`, {
        token,
        body: { questionTitle: "Motivation (edited)" },
      });
      if (qEdit.ok) ok("Position form edit question");
      else fail("Position form edit question", JSON.stringify(qEdit.data));
    }

    const campPublish = await req("POST", `/organization/recruitment-campaigns/${campaignId}/publish`, { token });
    if (campPublish.ok) ok("Recruitment campaign publish");
    else fail("Recruitment campaign publish", JSON.stringify(campPublish.data));

    // Student applies
    try {
      student = await registerStudent("applicant");
      ok("Student applicant auth", student.role);
    } catch (e) {
      fail("Student applicant auth", e.message);
    }

    const orgId = profile.data?.id;
    if (student?.token && orgId && positionId && q1.ok) {
      const apply = await req(
        "POST",
        `/organizations/${orgId}/recruitment-campaigns/${campaignId}/positions/${positionId}/applications`,
        {
          token: student.token,
          body: {
            answers: [
              { questionId: q1.data.id, value: "I want to join because QA" },
              ...(q2.ok ? [{ questionId: q2.data.id, value: "Advanced" }] : []),
            ],
          },
        },
      );
      if (apply.ok) ok("Student application submit", `id=${apply.data?.applicationId}`);
      else fail("Student application submit", JSON.stringify(apply.data));
    }

    const apps = await req("GET", `/organization/recruitment-campaigns/${campaignId}/applications`, { token });
    if (apps.ok) ok("Applicant list", `count=${apps.data?.length ?? 0}`);
    else fail("Applicant list", JSON.stringify(apps.data));

    const appsFiltered = await req(
      "GET",
      `/organization/recruitment-campaigns/${campaignId}/applications?status=Pending`,
      { token },
    );
    if (appsFiltered.ok) ok("Applicant status filter");
    else fail("Applicant status filter", JSON.stringify(appsFiltered.data));

    const appId = apps.data?.[0]?.id;
    if (appId) {
      const appDetail = await req("GET", `/organization/recruitment-campaigns/${campaignId}/applications/${appId}`, {
        token,
      });
      if (appDetail.ok) ok("Applicant details");
      else fail("Applicant details", JSON.stringify(appDetail.data));

      const aiAnalyze = await req(
        "POST",
        `/organization/recruitment-campaigns/${campaignId}/positions/${positionId}/analyze-applicants`,
        { token },
      );
      if (aiAnalyze.ok) ok("AI Analyze", `results=${aiAnalyze.data?.results?.length ?? 0}`);
      else fail("AI Analyze", JSON.stringify(aiAnalyze.data));

      const aiRegen = await req(
        "POST",
        `/organization/recruitment-campaigns/${campaignId}/positions/${positionId}/ai-regenerate`,
        {
          token,
          body: { minMatch: 70, excludeRejectedApplicants: true },
        },
      );
      if (aiRegen.ok) ok("AI Regenerate");
      else fail("AI Regenerate", JSON.stringify(aiRegen.data));

      const reject = await req("POST", `/organization/recruitment-applications/${appId}/reject`, { token });
      if (reject.ok) ok("Applicant reject");
      else fail("Applicant reject", JSON.stringify(reject.data));

      // Re-apply flow for accept test - create second student
      try {
        const student2 = await registerStudent("accept");
        const apply2 = await req(
          "POST",
          `/organizations/${orgId}/recruitment-campaigns/${campaignId}/positions/${positionId}/applications`,
          {
            token: student2.token,
            body: { answers: [{ questionId: q1.data.id, value: "Accept test" }] },
          },
        );
        if (apply2.ok) {
          const accept = await req("POST", `/organization/recruitment-applications/${apply2.data.applicationId}/accept`, {
            token,
          });
          if (accept.ok) ok("Applicant accept");
          else fail("Applicant accept", JSON.stringify(accept.data));
        } else fail("Applicant accept setup", JSON.stringify(apply2.data));
      } catch (e) {
        fail("Applicant accept", e.message);
      }
    } else {
      fail("Applicant details", "No applications to test");
      fail("AI Analyze", "No applicants");
      fail("AI Regenerate", "No applicants");
      fail("Applicant accept/reject", "No applicants");
    }

    const campDel = await req("DELETE", `/organization/recruitment-campaigns/${campaignId}`, { token });
    if (campDel.ok || campDel.status === 204) ok("Recruitment campaign delete");
    else fail("Recruitment campaign delete", JSON.stringify(campDel.data));
  }

  // --- Leadership ---
  const memberCreate = await req("POST", "/organization/team-members", {
    token,
    body: {
      fullName: "QA Leader",
      roleTitle: "President",
      major: "CS",
      linkedInUrl: null,
    },
  });
  if (memberCreate.ok) {
    const memberId = memberCreate.data.id;
    ok("Leadership add member", `id=${memberId}`);

    const portraitForm = new FormData();
    portraitForm.append("file", new Blob([TINY_PNG], { type: "image/png" }), "portrait.png");
    const portraitUp = await req("POST", "/organization/team-members/upload-image", {
      token,
      body: portraitForm,
      formData: true,
    });
    if (portraitUp.ok && portraitUp.data?.imageUrl) {
      ok("Leadership image upload");
      await req("PUT", `/organization/team-members/${memberId}`, {
        token,
        body: { imageUrl: portraitUp.data.imageUrl },
      });
    } else fail("Leadership image upload", JSON.stringify(portraitUp.data));

    const memberEdit = await req("PUT", `/organization/team-members/${memberId}`, {
      token,
      body: { fullName: "QA Leader Edited", roleTitle: "President" },
    });
    if (memberEdit.ok) ok("Leadership edit member");
    else fail("Leadership edit member", JSON.stringify(memberEdit.data));

    const memberDel = await req("DELETE", `/organization/team-members/${memberId}`, { token });
    if (memberDel.ok || memberDel.status === 204) ok("Leadership delete member");
    else fail("Leadership delete member", JSON.stringify(memberDel.data));
  } else fail("Leadership add member", JSON.stringify(memberCreate.data));

  // --- Notifications ---
  const notifs = await req("GET", "/notifications?take=20&category=all", { token });
  if (notifs.ok) ok("Notifications load", `count=${notifs.data?.length ?? 0}`);
  else fail("Notifications load", JSON.stringify(notifs.data));

  if (Array.isArray(notifs.data) && notifs.data.length > 0) {
    const n = notifs.data[0];
    const mark = await req("POST", `/notifications/${n.id}/read`, { token });
    if (mark.ok || mark.status === 204) ok("Notification mark read");
    else fail("Notification mark read", JSON.stringify(mark.data));
  } else {
    ok("Notification mark read", "skipped — no notifications");
  }

  // --- Route protection (API) ---
  try {
    doctor = await registerDoctor();
  } catch {
    doctor = { token: null };
  }

  if (student?.token) {
    const blocked = await req("GET", "/association/profile", { token: student.token });
    if (blocked.status === 401 || blocked.status === 403) ok("Route protection: student blocked from association API");
    else fail("Route protection: student", `expected 401/403 got ${blocked.status}`);
  }

  if (doctor?.token) {
    const blocked = await req("GET", "/association/profile", { token: doctor.token });
    if (blocked.status === 401 || blocked.status === 403) ok("Route protection: doctor blocked from association API");
    else fail("Route protection: doctor", `expected 401/403 got ${blocked.status}`);
  }

  let company;
  try {
    company = await registerCompany();
  } catch {
    company = { token: null };
  }
  if (company?.token) {
    const blocked = await req("GET", "/association/profile", { token: company.token });
    if (blocked.status === 401 || blocked.status === 403) ok("Route protection: company blocked from association API");
    else fail("Route protection: company", `expected 401/403 got ${blocked.status}`);
  }

  ok("Route protection: association allowed", "profile OK");

  printSummary();
  process.exit(FAIL.length > 0 ? 1 : 0);
}

function printSummary() {
  console.log(`\n=== SUMMARY ===`);
  console.log(`PASS: ${PASS.length}`);
  console.log(`FAIL: ${FAIL.length}`);
  if (FAIL.length) {
    console.log("\nFailed checks:");
    for (const f of FAIL) console.log(`  - ${f.name}: ${f.detail}`);
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
