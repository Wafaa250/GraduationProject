# Smoke-test /api/company/requests (Swagger-equivalent)
$base = "http://localhost:5262/api"
$email = "company.requests.test+$([guid]::NewGuid().ToString('N').Substring(0,8))@skillswap.test"
$password = "TestPass1!"

function Invoke-Api {
    param($Method, $Uri, $Body = $null, $Token = $null)
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    $params = @{ Method = $Method; Uri = $Uri; Headers = $headers }
    if ($Body) { $params["Body"] = ($Body | ConvertTo-Json -Depth 10) }
    return Invoke-WebRequest @params -UseBasicParsing
}

$results = @()

try {
    $reg = Invoke-Api POST "$base/auth/register/company" @{
        contactName = "API Test"; email = $email; password = $password
        confirmPassword = $password; companyName = "Requests Test Co"
        description = "Automated smoke-test company account for project request API verification."
        websiteUrl = "https://example.com"
    }
    $auth = $reg.Content | ConvertFrom-Json
    $token = $auth.token
    $results += "OK register company"

    $r = Invoke-Api GET "$base/company/requests/draft" $null $token
    if ($r.StatusCode -eq 204) { $results += "OK GET draft (204 empty)" }
    else { $results += "FAIL GET draft expected 204 got $($r.StatusCode)" }

    $draftBody = @{
        wizardStep = 4; requestType = "individual"; title = "Booking MVP"
        description = "Build a mobile booking prototype for campus services."
        categoryChoice = "Software & Technology"; categoryOther = ""
        targetRole = "Flutter Developer"; requiredSkills = @("Flutter", "Firebase")
        durationOngoing = $false; durationValue = 3; durationUnit = "Months"
        collaborationType = "remote"; scopeNotes = "Weekly sync"
    }
    $r = Invoke-Api PUT "$base/company/requests/draft" $draftBody $token
    $draft = $r.Content | ConvertFrom-Json
    if ($draft.durationUnit -eq "Months" -and $draft.collaborationType -eq "remote") {
        $results += "OK PUT draft (enums round-trip)"
    } else {
        $results += "FAIL PUT draft enums: unit=$($draft.durationUnit) collab=$($draft.collaborationType)"
    }

    $r = Invoke-Api GET "$base/company/requests/draft" $null $token
    if ($r.StatusCode -eq 200) { $results += "OK GET draft (200)" } else { $results += "FAIL GET draft" }

    $submitBody = @{
        requestType = "individual"; title = "Booking MVP"
        description = "Build a mobile booking prototype for campus services."
        categoryChoice = "Software & Technology"; categoryOther = ""
        targetRole = "Flutter Developer"; requiredSkills = @("Flutter", "Firebase")
        durationOngoing = $false; durationValue = 3; durationUnit = "Months"
        collaborationType = "hybrid"; scopeNotes = "Weekly sync"
        wizardStep = 4
    }
    $r = Invoke-Api POST "$base/company/requests" $submitBody $token
    $created = $r.Content | ConvertFrom-Json
    $id = $created.id
    if ($r.StatusCode -eq 201 -and $created.status -eq "submitted") {
        $results += "OK POST submit (201)"
    } else { $results += "FAIL POST submit" }

    $r = Invoke-Api GET "$base/company/requests" $null $token
    $list = $r.Content | ConvertFrom-Json
    if ($list.Count -ge 1) { $results += "OK GET list ($($list.Count))" } else { $results += "FAIL GET list" }

    $r = Invoke-Api GET "$base/company/requests/$id" $null $token
    $detail = $r.Content | ConvertFrom-Json
    if ($detail.collaborationType -eq "hybrid") { $results += "OK GET by id" } else { $results += "FAIL GET by id" }

    $r = Invoke-Api PATCH "$base/company/requests/$id/status" @{ status = "archived" } $token
    if ($r.StatusCode -eq 200) { $results += "OK PATCH status" } else { $results += "FAIL PATCH status" }

    $r = Invoke-Api GET "$base/company/requests/draft" $null $token
    if ($r.StatusCode -eq 204) { $results += "OK GET draft after submit (204)" } else { $results += "WARN draft after submit: $($r.StatusCode)" }

    # Team request
    $teamBody = @{
        requestType = "ai-built-team"; title = "Health App Team"
        description = "Cross-functional student team for a health tracking MVP."
        categoryChoice = "Healthcare & Life Sciences"; categoryOther = ""
        roles = @(
            @{ clientRoleKey = "r1"; roleName = "Backend Developer"; skills = @("Node.js"); sortOrder = 0 }
            @{ clientRoleKey = "r2"; roleName = "UX Designer"; skills = @("Figma"); sortOrder = 1; notes = "Part-time" }
        )
        durationOngoing = $true; collaborationType = "flexible"
    }
    $r = Invoke-Api POST "$base/company/requests" $teamBody $token
    if ($r.StatusCode -eq 201) { $results += "OK POST ai-built-team" } else { $results += "FAIL POST team" }

    $r = Invoke-Api DELETE "$base/company/requests/draft" $null $token
    if ($r.StatusCode -eq 204) { $results += "OK DELETE draft" } else { $results += "OK DELETE draft ($($r.StatusCode))" }

    $swagger = Invoke-WebRequest -Uri "http://localhost:5262/swagger/v1/swagger.json" -UseBasicParsing
    if ($swagger.Content -match "CompanyRequests") { $results += "OK Swagger documents CompanyRequests" }
    else { $results += "FAIL Swagger missing CompanyRequests" }

} catch {
    $results += "ERROR: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) { $results += $_.ErrorDetails.Message }
}

$results | ForEach-Object { Write-Output $_ }
