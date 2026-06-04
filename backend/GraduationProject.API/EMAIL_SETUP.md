# SkillSwap email setup (company member invitations)

The API sends **real** welcome emails via SMTP (MailKit). Nothing is simulated once SMTP is configured.

**Recommended provider: [Brevo](https://www.brevo.com)** (formerly Sendinblue)

| Why Brevo |
|-----------|
| Free tier (~300 emails/day) — enough for development and graduation demos |
| Real delivery to any inbox (Gmail, Outlook, etc.) |
| Works with the existing SMTP code — no API rewrite |
| Quick setup: verify one sender email, generate an SMTP key |
| Good deliverability for transactional mail |

**Alternatives:** Resend (SMTP + API, needs domain for production), SendGrid, Amazon SES (more setup).

---

## 1. Create a Brevo account and SMTP key

1. Sign up at [https://www.brevo.com](https://www.brevo.com).
2. **Senders & IP → Senders** → add and verify the email you will send from (e.g. your Gmail). Brevo sends a confirmation link.
3. **SMTP & API → SMTP** → create an SMTP key. Copy the key (starts with `xsmtpsib-`). This is **not** your Brevo login password.
4. Note your Brevo login email (used as SMTP username).

Brevo SMTP settings used by this project:

| Setting | Value |
|---------|--------|
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Encryption | STARTTLS (`UseSsl: true` in appsettings) |
| Username | Your Brevo account email |
| Password | SMTP key (`xsmtpsib-...`) |
| From | Same verified sender email |

---

## 2. Configure the API (choose one method)

### Option A — `appsettings.Development.json` (simplest for local dev)

```powershell
cd backend\GraduationProject.API
copy appsettings.Development.example.json appsettings.Development.json
```

Edit `appsettings.Development.json` and replace:

- `YOUR_BREVO_LOGIN_EMAIL` → Brevo account email
- `YOUR_BREVO_SMTP_KEY` → SMTP key
- `YOUR_VERIFIED_SENDER_EMAIL` → verified sender (usually same email)

Ensure `"Email": { "Enabled": true, ... }`.

### Option B — Environment variables (CI / production)

See `.env.example`. In PowerShell before `dotnet run`:

```powershell
$env:Email__Enabled = "true"
$env:Email__SmtpHost = "smtp-relay.brevo.com"
$env:Email__SmtpPort = "587"
$env:Email__UseSsl = "true"
$env:Email__Username = "you@example.com"
$env:Email__Password = "xsmtpsib-your-key"
$env:Email__FromAddress = "you@example.com"
$env:Email__FromName = "SkillSwap Support"
$env:Email__ReplyToAddress = "you@example.com"
$env:Email__ReplyToName = "SkillSwap Support"
$env:App__FrontendLoginUrl = "http://localhost:5173/login"
```

### Option C — .NET user secrets (password not in files)

```powershell
cd backend\GraduationProject.API
dotnet user-secrets init
dotnet user-secrets set "Email:Enabled" "true"
dotnet user-secrets set "Email:SmtpHost" "smtp-relay.brevo.com"
dotnet user-secrets set "Email:SmtpPort" "587"
dotnet user-secrets set "Email:UseSsl" "true"
dotnet user-secrets set "Email:Username" "you@example.com"
dotnet user-secrets set "Email:Password" "xsmtpsib-your-key"
dotnet user-secrets set "Email:FromAddress" "you@example.com"
dotnet user-secrets set "Email:FromName" "SkillSwap Support"
dotnet user-secrets set "Email:ReplyToAddress" "you@example.com"
dotnet user-secrets set "Email:ReplyToName" "SkillSwap Support"
dotnet user-secrets set "App:FrontendLoginUrl" "http://localhost:5173/login"
```

---

## 3. Required configuration keys

| Key | Environment variable | Description |
|-----|----------------------|-------------|
| `Email:Enabled` | `Email__Enabled` | Must be `true` |
| `Email:SmtpHost` | `Email__SmtpHost` | `smtp-relay.brevo.com` |
| `Email:SmtpPort` | `Email__SmtpPort` | `587` |
| `Email:UseSsl` | `Email__UseSsl` | `true` (STARTTLS on 587) |
| `Email:Username` | `Email__Username` | Brevo login email |
| `Email:Password` | `Email__Password` | Brevo SMTP key |
| `Email:FromAddress` | `Email__FromAddress` | Verified sender email |
| `Email:FromName` | `Email__FromName` | `SkillSwap Support` |
| `Email:ReplyToAddress` | `Email__ReplyToAddress` | Same as verified sender (e.g. `skillswap742@gmail.com`) |
| `Email:ReplyToName` | `Email__ReplyToName` | `SkillSwap Support` |
| `App:FrontendLoginUrl` | `App__FrontendLoginUrl` | e.g. `http://localhost:5173/login` |

Never commit real SMTP keys. `appsettings.Development.json` is gitignored.

---

## 4. Verify configuration at startup

Restart the API (`dotnet run`). In the console you should see:

```
Email ready (configuration): host=smtp-relay.brevo.com, from=you@example.com
```

If you see a warning about `Email:Enabled is false` or missing host/password, fix config before testing.

---

## 5. Test a real invitation email locally

1. Start PostgreSQL and run the API: `dotnet run` in `backend/GraduationProject.API`.
2. Start the frontend: `npm run dev` in `frontend`.
3. Log in as a **company owner**.
4. Open **Company Members** → **Add Member**.
5. Use a **new email** you can access (e.g. a second Gmail address).
6. Submit the form.

**Expected:**

- UI: “Member added successfully” and “Login credentials were sent to the member's email.”
- Inbox: email with subject **Welcome to SkillSwap**, temporary password, and login URL.
- Member signs in at `/login` → forced to **Change password** → then company workspace.

**If add member fails:**

- Read the API error message (email failure rolls back account creation).
- Check API logs for `Failed to send welcome email`.
- In Brevo: **Transactional → Logs** for bounces or blocks.
- Confirm sender is verified and `FromAddress` matches it.

---

## 6. Troubleshooting

| Problem | Fix |
|---------|-----|
| “Email delivery is disabled” | Set `Email:Enabled` to `true` |
| Authentication failed | Use SMTP key, not Brevo account password |
| Mail not received | Check spam; verify sender in Brevo |
| “Sender not valid” | `FromAddress` must be a verified sender in Brevo |
| SSL errors | Port `587` + `UseSsl: true`; do not use port 465 unless you change SSL mode |

---

## 7. Deliverability (SPF, DKIM, DMARC)

The API sends **multipart/alternative** messages (plain text + HTML), sets **From**, **Reply-To**, **Sender**, and **Message-ID**, and uses the display name **SkillSwap Support**. Keep `Email:FromAddress` identical to the SMTP authenticated account (`Email:Username`) so providers can align SPF and DKIM signatures.

| Provider | SPF / DKIM / DMARC |
|----------|-------------------|
| **Gmail SMTP** (`smtp.gmail.com`) | Google signs mail when you authenticate with the same `@gmail.com` account. Use an [App Password](https://myaccount.google.com/apppasswords), not your main password. No custom DNS records are required for `@gmail.com`. |
| **Brevo / custom domain** | In Brevo, add your domain and publish the **SPF**, **DKIM**, and **DMARC** DNS records they provide. Set `FromAddress` to an address on that domain. |

**Practices that reduce spam-folder placement:**

1. **From = Username** — e.g. both `skillswap742@gmail.com`.
2. **Stable sender name** — `SkillSwap Support` (configured via `Email:FromName`).
3. **Reply-To** — `Email:ReplyToAddress` should be a monitored inbox users can reach.
4. **Transactional wording** — avoid ALL CAPS, “URGENT”, or link-heavy promotional language in subjects and bodies.
5. **Warm up** — new senders should start with low volume; ask testers to mark the first message as “Not spam”.

For production on a custom domain, verify DNS with [Google Admin Toolbox](https://toolbox.googleapps.com/apps/checkmx/) or [MXToolbox](https://mxtoolbox.com/).

---

## Production note

For a public deployment, use environment variables on your host (Azure, Railway, etc.), set `App:FrontendLoginUrl` to your production URL (e.g. `https://app.skillswap.com/login`), and use a verified domain with SPF/DKIM/DMARC in Brevo (or Google Workspace) for best deliverability.
