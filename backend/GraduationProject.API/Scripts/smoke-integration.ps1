$ErrorActionPreference = "Continue"
$base = "http://localhost:5262/api"
$pwd = "SkillSwap2026!"
$studentEmail = "mohammad.hammad1@gmail.com"
$doctorEmail = "dr.sami-barakat@gmail.com"
$errors = [System.Collections.Generic.List[string]]::new()

function Login($email) {
  $body = @{ email = $email; password = $pwd } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -Body $body -ContentType "application/json"
  return @{ Token = $r.token; UserId = [int]$r.userId; Role = $r.role }
}

function AuthHeaders($token) {
  return @{ Authorization = "Bearer $token" }
}

function Test-Step($name, [scriptblock]$Action) {
  try {
    & $Action
    Write-Host "PASS: $name"
  } catch {
    $msg = $_.Exception.Message
    if ($_.ErrorDetails.Message) { $msg = $_.ErrorDetails.Message }
    Write-Host "FAIL: $name -> $msg"
    [void]$errors.Add("$name`: $msg")
  }
}

Write-Host "=== Smoke test start ==="

try {
  $student = Login $studentEmail
  $doctor = Login $doctorEmail
} catch {
  Write-Host "FAIL: login -> $($_.Exception.Message)"
  exit 1
}

Test-Step "student profile preferences save/load" {
  $prefs = @{
    collaborationPreferences = @{ workingStyle = "deep-focus"; teamwork = "Pair"; collaboration = "Async-first" }
    otherLinks = @(@{ label = "Blog"; url = "https://example.com/blog" })
    expectedGraduation = "June 2027"
    personalWebsite = "https://example.com"
  }
  Invoke-RestMethod -Uri "$base/profile" -Method Put -Headers (AuthHeaders $student.Token) -Body ($prefs | ConvertTo-Json -Depth 5) -ContentType "application/json" | Out-Null
  $me = Invoke-RestMethod -Uri "$base/me" -Headers (AuthHeaders $student.Token)
  if (-not $me.collaborationPreferences.workingStyle) { throw "collaborationPreferences not returned" }
  if ($me.expectedGraduation -ne "June 2027") { throw "expectedGraduation mismatch: $($me.expectedGraduation)" }
  $settings = Invoke-RestMethod -Uri "$base/profile/settings" -Headers (AuthHeaders $student.Token)
  if ($null -eq $settings) { throw "settings null" }
  $settings.teamInvitations = $false
  Invoke-RestMethod -Uri "$base/profile/settings" -Method Put -Headers (AuthHeaders $student.Token) -Body ($settings | ConvertTo-Json -Depth 5) -ContentType "application/json" | Out-Null
  $settings2 = Invoke-RestMethod -Uri "$base/profile/settings" -Headers (AuthHeaders $student.Token)
  if ($settings2.teamInvitations -ne $false) { throw "settings not persisted" }
}

Test-Step "graduation project draft save/load" {
  $draft = @{ title = "Smoke Draft"; teamSize = 3; interests = @("ai", "web") }
  Invoke-RestMethod -Uri "$base/graduation-projects/draft" -Method Put -Headers (AuthHeaders $student.Token) -Body (@{ payload = $draft } | ConvertTo-Json -Depth 5) -ContentType "application/json" | Out-Null
  $loaded = Invoke-RestMethod -Uri "$base/graduation-projects/draft" -Headers (AuthHeaders $student.Token)
  if (-not $loaded.payload) { throw "draft payload missing" }
}

Test-Step "abstract file upload/download" {
  $my = Invoke-RestMethod -Uri "$base/graduation-projects/my" -Headers (AuthHeaders $student.Token)
  $projectId = $my.project.id
  if (-not $projectId) { throw "student has no graduation project for abstract test" }
  $tinyPdfB64 = "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCg=="
  Invoke-RestMethod -Uri "$base/graduation-projects/$projectId/abstract-file" -Method Post -Headers (AuthHeaders $student.Token) -Body (@{ fileName = "smoke.pdf"; fileBase64 = $tinyPdfB64 } | ConvertTo-Json) -ContentType "application/json" | Out-Null
  $file = Invoke-RestMethod -Uri "$base/graduation-projects/$projectId/abstract-file" -Headers (AuthHeaders $student.Token)
  if (-not $file.downloadUrl) { throw "downloadUrl missing" }
}

Test-Step "student to doctor message" {
  $conv = Invoke-RestMethod -Uri "$base/conversations/start/$($doctor.UserId)" -Method Post -Headers (AuthHeaders $student.Token)
  $id = $conv.id
  if (-not $id) { $id = $conv.conversationId }
  if (-not $id) { throw "no conversation id returned" }
}

Test-Step "doctor to student message" {
  $conv = Invoke-RestMethod -Uri "$base/conversations/start/$($student.UserId)" -Method Post -Headers (AuthHeaders $doctor.Token)
  if (-not $conv) { throw "no conversation returned" }
}

Test-Step "notification click routing data" {
  $notes = Invoke-RestMethod -Uri "$base/notifications?take=20" -Headers (AuthHeaders $student.Token)
  if ($notes.Count -eq 0) {
    Write-Host "  (no notifications - list endpoint OK)"
    return
  }
  $sample = $notes | Select-Object -First 1
  if (-not $sample.category) { throw "notification missing category" }
}

Test-Step "SignalR hub negotiate" {
  $neg = Invoke-WebRequest -Uri "http://localhost:5262/hubs/notifications/negotiate?negotiateVersion=1" -Method Post -Headers (AuthHeaders $student.Token) -ContentType "application/json" -Body "{}"
  if ($neg.StatusCode -ge 400) { throw "negotiate failed $($neg.StatusCode)" }
}

Test-Step "doctor students directory" {
  $rows = Invoke-RestMethod -Uri "$base/students?search=mohammad" -Headers (AuthHeaders $doctor.Token)
  if ($rows.Count -lt 1) { throw "no students returned" }
}

Write-Host "=== Smoke test complete ==="
if ($errors.Count -gt 0) {
  Write-Host "ERRORS:"
  $errors | ForEach-Object { Write-Host " - $_" }
  exit 1
}
exit 0
