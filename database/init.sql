-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Admins Table
CREATE TABLE IF NOT EXISTS admins 
(
    admin_id        SERIAL PRIMARY KEY,
    full_name       TEXT NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Homework Table
CREATE TABLE IF NOT EXISTS homeworks
(
    homework_id     SERIAL PRIMARY KEY,
    title           VARCHAR(255) UNIQUE NOT NULL,
    admin_id        INTEGER NOT NULL,
    card_color      VARCHAR(7) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_admin FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_homework_name ON homeworks (title);

-- homework_participants Table
CREATE TABLE IF NOT EXISTS homework_participants
(
    participant_id      SERIAL PRIMARY KEY,
    homework_id         INTEGER NOT NULL,
    repo_url            TEXT NOT NULL UNIQUE,
    full_name           VARCHAR(255) NOT NULL,
    ssh_key             TEXT UNIQUE NOT NULL,
    last_build_time     TIMESTAMP,
    build_success       BOOLEAN DEFAULT FALSE,
    pr_payload          JSON,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_group FOREIGN KEY (homework_id) REFERENCES homeworks(homework_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_full_name ON homework_participants(full_name);
CREATE INDEX IF NOT EXISTS idx_repo_url ON homework_participants(repo_url);

-- Tests Table
CREATE TABLE IF NOT EXISTS tests
(
    test_id         SERIAL PRIMARY KEY,
    homework_id     INTEGER NOT NULL,
    name            VARCHAR(255) UNIQUE NOT NULL,
    file_content    TEXT NOT NULL,
    is_active       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_homework FOREIGN KEY (homework_id) REFERENCES homeworks(homework_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_test_name ON tests (name);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports
(
    report_id           SERIAL PRIMARY KEY,
    participant_id      INTEGER NOT NULL,
    title               VARCHAR(255) NOT NULL,
    content             TEXT DEFAULT '',
    is_submited         BOOLEAN DEFAULT FALSE,
    is_rejected         BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user FOREIGN KEY (participant_id) REFERENCES homework_participants(participant_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_report_title ON reports (title);
CREATE INDEX IF NOT EXISTS idx_participant_id ON reports (participant_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports USING BRIN (created_at);

-- Triggers for updated_at column
CREATE TRIGGER trigger_admins_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_homeworks_updated_at
BEFORE UPDATE ON homeworks
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_homework_participants_updated_at
BEFORE UPDATE ON homework_participants
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_tests_updated_at
BEFORE UPDATE ON tests
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_reports_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
