# One-off dev provisioning via existing auth/register APIs (not a seeder).
# Creates Dr. Ahmad Nasser + 20 CE students with real PostgreSQL rows.

$ErrorActionPreference = "Stop"
$BaseUrl = "http://localhost:5262/api"
$Password = "Password123!"
$env:SKILLSWAP_PG = "Host=localhost;Port=5432;Database=skillswap_db;Username=postgres;Password=123456789"

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body = $null,
        [string]$Token = $null
    )
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    $uri = "$BaseUrl$Path"
    if ($null -ne $Body) {
        $json = $Body | ConvertTo-Json -Depth 6 -Compress
        return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -Body $json
    }
    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
}

function Register-IfMissing {
    param(
        [string]$Label,
        [scriptblock]$RegisterAction
    )
    try {
        & $RegisterAction | Out-Null
        Write-Host "[created] $Label"
        return $true
    } catch {
        $resp = $_.Exception.Response
        $status = if ($resp) { [int]$resp.StatusCode } else { 0 }
        $msg = $_.ErrorDetails.Message
        if ($status -eq 409 -or ($msg -match "already registered") -or ($msg -match "already exists")) {
            Write-Host "[exists]  $Label"
            return $false
        }
        Write-Error "Failed to register $Label`: $msg"
    }
}

# ── Doctor ───────────────────────────────────────────────────────────────────
Register-IfMissing "Dr. Ahmad Nasser" {
    Invoke-Api POST "/auth/register/doctor" @{
        fullName        = "Dr. Ahmad Nasser"
        email           = "doctor.ai@skillswap.ps"
        password        = $Password
        confirmPassword = $Password
        university      = "An-Najah National University"
        faculty         = "Engineering and Information Technology"
        department      = "Computer Engineering"
        specialization  = "Artificial Intelligence"
        bio             = "Associate professor in Computer Engineering with research focus on artificial intelligence, machine learning, and computer vision."
    }
} | Out-Null

try {
    $docLogin = Invoke-Api POST "/auth/login" @{
        email    = "doctor.ai@skillswap.ps"
        password = $Password
    }
    Invoke-Api PUT "/profile/doctor" @{
        yearsOfExperience = 10
        researchSkills    = @(
            "Artificial Intelligence",
            "Machine Learning",
            "Data Science",
            "Computer Vision"
        )
        technicalSkills   = @("Python", "TensorFlow", "PyTorch", "Machine Learning")
        bio               = "Associate professor in Computer Engineering with 10 years of experience in AI, ML, data science, and computer vision."
    } -Token $docLogin.token
    Write-Host "[updated] Dr. Ahmad Nasser profile (experience + research interests)"
} catch {
    Write-Warning "Doctor profile update skipped: $($_.Exception.Message)"
}

# ── Students ─────────────────────────────────────────────────────────────────
$students = @(
    @{ Name = "Ali Hamdan";      Email = "ali.hamdan@student.skillswap.ps";      Id = "CE2025001"; Role = "Frontend Developer"; Tech = @("React", "JavaScript", "TypeScript"); Tools = @("VS Code", "GitHub", "Git") }
    @{ Name = "Omar Saleh";      Email = "omar.saleh@student.skillswap.ps";      Id = "CE2025002"; Role = "Backend Developer";  Tech = @("Node.js", "PostgreSQL", "Docker"); Tools = @("VS Code", "Postman", "GitHub") }
    @{ Name = "Layla Khoury";    Email = "layla.khoury@student.skillswap.ps";    Id = "CE2025003"; Role = "AI Engineer";         Tech = @("Python", "TensorFlow", "Machine Learning"); Tools = @("VS Code", "GitHub", "Notion") }
    @{ Name = "Youssef Mansour"; Email = "youssef.mansour@student.skillswap.ps"; Id = "CE2025004"; Role = "Mobile Developer";   Tech = @("React Native", "Firebase", "JavaScript"); Tools = @("VS Code", "Firebase", "Git") }
    @{ Name = "Nour Abed";       Email = "nour.abed@student.skillswap.ps";       Id = "CE2025005"; Role = "Frontend Developer"; Tech = @("React", "PostgreSQL", "Git"); Tools = @("VS Code", "GitHub", "Figma") }
    @{ Name = "Karim Zeidan";    Email = "karim.zeidan@student.skillswap.ps";    Id = "CE2025006"; Role = "Backend Developer";  Tech = @(".NET", "C#", "PostgreSQL"); Tools = @("VS Code", "Azure", "Postman") }
    @{ Name = "Rana Halabi";     Email = "rana.halabi@student.skillswap.ps";     Id = "CE2025007"; Role = "UI/UX Designer";     Tech = @("Figma", "React", "JavaScript"); Tools = @("Figma", "Notion", "GitHub") }
    @{ Name = "Tareq Nabulsi";   Email = "tareq.nabulsi@student.skillswap.ps";   Id = "CE2025008"; Role = "DevOps Engineer";    Tech = @("Docker", "Node.js", "MongoDB"); Tools = @("GitHub", "Azure", "Jira") }
    @{ Name = "Hala Issa";       Email = "hala.issa@student.skillswap.ps";       Id = "CE2025009"; Role = "QA Tester";          Tech = @("Git", "Postman", "JavaScript"); Tools = @("Jira", "Notion", "VS Code") }
    @{ Name = "Fadi Awad";       Email = "fadi.awad@student.skillswap.ps";       Id = "CE2025010"; Role = "Project Manager";    Tech = @("Git", "Notion", "Jira"); Tools = @("Jira", "Notion", "GitHub") }
    @{ Name = "Mira Sabbah";     Email = "mira.sabbah@student.skillswap.ps";     Id = "CE2025011"; Role = "Frontend Developer"; Tech = @("React", "Node.js", "Docker"); Tools = @("VS Code", "GitHub", "Postman") }
    @{ Name = "Sami Darwish";    Email = "sami.darwish@student.skillswap.ps";    Id = "CE2025012"; Role = "Backend Developer";  Tech = @("Python", "PostgreSQL", "MongoDB"); Tools = @("VS Code", "GitHub", "Docker") }
    @{ Name = "Dina Barakat";    Email = "dina.barakat@student.skillswap.ps";    Id = "CE2025013"; Role = "AI Engineer";         Tech = @("Python", "TensorFlow", "Computer Vision"); Tools = @("VS Code", "GitHub", "Notion") }
    @{ Name = "Ziad Qasem";      Email = "ziad.qasem@student.skillswap.ps";      Id = "CE2025014"; Role = "Mobile Developer";   Tech = @("Flutter", "Firebase", "Dart"); Tools = @("VS Code", "Firebase", "Git") }
    @{ Name = "Leen Shahin";     Email = "leen.shahin@student.skillswap.ps";     Id = "CE2025015"; Role = "UI/UX Designer";     Tech = @("Figma", "React Native", "JavaScript"); Tools = @("Figma", "Notion", "GitHub") }
    @{ Name = "Adam Hamed";      Email = "adam.hamed@student.skillswap.ps";      Id = "CE2025016"; Role = "DevOps Engineer";    Tech = @("Docker", "Git", "Node.js"); Tools = @("Azure", "GitHub", "Jira") }
    @{ Name = "Yasmin Farah";    Email = "yasmin.farah@student.skillswap.ps";    Id = "CE2025017"; Role = "QA Tester";          Tech = @("Postman", "Git", "React"); Tools = @("Jira", "VS Code", "Notion") }
    @{ Name = "Bilal Najjar";    Email = "bilal.najjar@student.skillswap.ps";    Id = "CE2025018"; Role = "Frontend Developer"; Tech = @("React", "MongoDB", "Node.js"); Tools = @("VS Code", "GitHub", "Postman") }
    @{ Name = "Salma Jaber";     Email = "salma.jaber@student.skillswap.ps";     Id = "CE2025019"; Role = "Backend Developer";  Tech = @("C#", ".NET", "PostgreSQL"); Tools = @("VS Code", "Azure", "GitHub") }
    @{ Name = "Mahmoud Odeh";    Email = "mahmoud.odeh@student.skillswap.ps";    Id = "CE2025020"; Role = "AI Engineer";         Tech = @("Python", "Machine Learning", "TensorFlow"); Tools = @("VS Code", "GitHub", "Notion") }
)

$created = @()
foreach ($s in $students) {
    $gpa = [math]::Round((3.1 + (Get-Random -Minimum 0 -Maximum 9) / 10), 1)
    $wasNew = Register-IfMissing $s.Name {
        Invoke-Api POST "/auth/register/student" @{
            fullName        = $s.Name
            email           = $s.Email
            password        = $Password
            confirmPassword = $Password
            studentId       = $s.Id
            university      = "An-Najah National University"
            faculty         = "Engineering and Information Technology"
            major           = "Computer Engineering"
            academicYear    = "Fourth Year"
            gpa             = $gpa
            roles           = @($s.Role)
            technicalSkills = $s.Tech
            tools           = $s.Tools
            generalSkills   = @("Problem Solving", "Team Collaboration")
            majorSkills     = @("Computer Engineering")
        }
    }
    if (-not $wasNew) {
        try {
            $login = Invoke-Api POST "/auth/login" @{ email = $s.Email; password = $Password }
            Invoke-Api PUT "/profile" @{
                roles           = @($s.Role)
                technicalSkills = $s.Tech
                tools           = $s.Tools
                generalSkills   = @("Problem Solving", "Team Collaboration")
                majorSkills     = @("Computer Engineering")
            } -Token $login.token | Out-Null
            Write-Host "[updated] $($s.Name) skills/profile"
        } catch {
            Write-Warning "Could not update $($s.Name): $($_.Exception.Message)"
        }
    }
    $created += $s
}

# Academic year label (API enum uses Fourth Year; store display label in DB)
Write-Host "`nUpdating academic year labels in PostgreSQL..."
$targetEmails = ($students | ForEach-Object { $_.Email }) -join ";"
dotnet run --project "$PSScriptRoot\ProvisionTool\ProvisionTool.csproj" -- update-academic-year $targetEmails

Write-Host "`nFetching records from database..."
$doctorEmail = "doctor.ai@skillswap.ps"
dotnet run --project "$PSScriptRoot\ProvisionTool\ProvisionTool.csproj" -- print-table $Password $doctorEmail $targetEmails
