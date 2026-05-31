-- Company project requests (wizard) — new schema alongside legacy company_talent_requests.
-- Run after reviewing; prefer: dotnet ef migrations add AddCompanyProjectRequests

CREATE TABLE IF NOT EXISTS company_requests (
    id SERIAL PRIMARY KEY,
    company_profile_id INTEGER NOT NULL REFERENCES company_profiles(id) ON DELETE CASCADE,
    request_type VARCHAR(32) NOT NULL DEFAULT '',
    status VARCHAR(32) NOT NULL DEFAULT 'draft',
    wizard_step INTEGER NULL,
    title VARCHAR(200) NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    category VARCHAR(120) NOT NULL DEFAULT '',
    category_choice VARCHAR(120) NULL,
    category_other VARCHAR(120) NULL,
    duration_ongoing BOOLEAN NOT NULL DEFAULT FALSE,
    duration_value INTEGER NULL,
    duration_unit VARCHAR(20) NULL,
    duration_label VARCHAR(80) NULL,
    collaboration_format VARCHAR(32) NULL,
    scope_notes TEXT NULL,
    matching_status VARCHAR(32) NULL,
    matched_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS "IX_company_requests_company_profile_id"
    ON company_requests (company_profile_id);

CREATE INDEX IF NOT EXISTS "IX_company_requests_company_profile_id_status"
    ON company_requests (company_profile_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_company_requests_one_draft_per_company"
    ON company_requests (company_profile_id)
    WHERE status = 'draft';

CREATE TABLE IF NOT EXISTS company_request_roles (
    id SERIAL PRIMARY KEY,
    company_request_id INTEGER NOT NULL REFERENCES company_requests(id) ON DELETE CASCADE,
    client_role_key VARCHAR(64) NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    role_name VARCHAR(120) NOT NULL DEFAULT '',
    notes TEXT NULL
);

CREATE INDEX IF NOT EXISTS "IX_company_request_roles_company_request_id"
    ON company_request_roles (company_request_id);

CREATE TABLE IF NOT EXISTS company_request_skills (
    id SERIAL PRIMARY KEY,
    company_request_role_id INTEGER NOT NULL REFERENCES company_request_roles(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    skill_name VARCHAR(120) NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS "IX_company_request_skills_company_request_role_id"
    ON company_request_skills (company_request_role_id);
