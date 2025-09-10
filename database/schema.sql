-- CRM Database Schema per Gestione Colloqui di Reclutamento

-- Tabella Candidati
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    mobile VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    province VARCHAR(50),
    birth_date DATE,
    
    -- Dati professionali
    position_applied VARCHAR(200),
    experience_years INTEGER,
    education_level VARCHAR(100),
    cv_file_path VARCHAR(500),
    linkedin_profile VARCHAR(300),
    
    -- Dati di provenienza candidatura
    source_channel VARCHAR(100), -- LinkedIn, Indeed, Referral, etc.
    referral_person VARCHAR(200),
    application_date DATE DEFAULT CURRENT_DATE,
    
    -- Status generale candidato
    current_status VARCHAR(50) DEFAULT 'NEW', -- NEW, IN_PROCESS, HIRED, REJECTED, WITHDRAWN
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

-- Tabella Utenti HR
CREATE TABLE hr_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'HR_ASSISTANT', -- HR_MANAGER, HR_ASSISTANT, INTERVIEWER
    is_active BOOLEAN DEFAULT TRUE,
    phone_extension VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Colloqui (Master per i 3 step)
CREATE TABLE interviews (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    interview_phase INTEGER NOT NULL CHECK (interview_phase IN (1, 2, 3)),
    
    -- Programmazione appuntamento
    scheduled_date DATE,
    scheduled_time TIME,
    duration_minutes INTEGER DEFAULT 60,
    interview_type VARCHAR(50) DEFAULT 'VIDEO_CALL', -- VIDEO_CALL, IN_PERSON, PHONE
    
    -- Meeting details
    meeting_url VARCHAR(500), -- Google Meet, Teams, etc.
    meeting_id VARCHAR(100),
    meeting_password VARCHAR(50),
    location VARCHAR(200), -- per colloqui in presenza
    
    -- Partecipanti
    primary_interviewer_id INTEGER REFERENCES hr_users(id),
    secondary_interviewer_id INTEGER REFERENCES hr_users(id),
    
    -- Status e esito
    status VARCHAR(50) DEFAULT 'SCHEDULED', -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, RESCHEDULED
    outcome VARCHAR(50), -- POSITIVE, NEGATIVE, CANDIDATE_DECLINED, TO_RESCHEDULE, PENDING
    
    -- Note e valutazioni
    interviewer_notes TEXT,
    technical_rating INTEGER CHECK (technical_rating BETWEEN 1 AND 10),
    soft_skills_rating INTEGER CHECK (soft_skills_rating BETWEEN 1 AND 10),
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 10),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES hr_users(id),
    updated_by INTEGER REFERENCES hr_users(id)
);

-- Tabella Comunicazioni
CREATE TABLE communications (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    interview_id INTEGER REFERENCES interviews(id) ON DELETE CASCADE,
    
    -- Tipo comunicazione
    communication_type VARCHAR(50) NOT NULL, -- EMAIL, SMS, PHONE_CALL
    direction VARCHAR(20) NOT NULL, -- OUTBOUND, INBOUND
    
    -- Contenuto
    subject VARCHAR(500),
    message_content TEXT,
    
    -- Dettagli invio
    sent_at TIMESTAMP,
    delivery_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, SENT, DELIVERED, FAILED
    
    -- Per chiamate telefoniche
    call_duration_seconds INTEGER,
    call_outcome VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES hr_users(id)
);

-- Tabella Template Comunicazioni
CREATE TABLE communication_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(200) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- EMAIL, SMS
    subject_template VARCHAR(500),
    message_template TEXT NOT NULL,
    
    -- Utilizzo specifico
    usage_context VARCHAR(100), -- INTERVIEW_CONFIRMATION, REMINDER, OUTCOME_POSITIVE, OUTCOME_NEGATIVE, etc.
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES hr_users(id)
);

-- Tabella Allegati/Documenti
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    
    document_type VARCHAR(50) NOT NULL, -- CV, COVER_LETTER, PORTFOLIO, CONTRACT, etc.
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size_kb INTEGER,
    mime_type VARCHAR(100),
    
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INTEGER REFERENCES hr_users(id)
);

-- Tabella Log Attività
CREATE TABLE activity_log (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    interview_id INTEGER REFERENCES interviews(id) ON DELETE CASCADE,
    
    activity_type VARCHAR(100) NOT NULL, -- CANDIDATE_CREATED, INTERVIEW_SCHEDULED, OUTCOME_RECORDED, etc.
    description TEXT NOT NULL,
    
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    performed_by INTEGER REFERENCES hr_users(id)
);

-- Indici per performance
CREATE INDEX idx_candidates_status ON candidates(current_status);
CREATE INDEX idx_candidates_application_date ON candidates(application_date);
CREATE INDEX idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX idx_interviews_date ON interviews(scheduled_date);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_communications_candidate ON communications(candidate_id);
CREATE INDEX idx_activity_log_candidate ON activity_log(candidate_id);
CREATE INDEX idx_activity_log_date ON activity_log(performed_at);

-- Trigger per aggiornamento automatico updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_candidates_updated_at 
    BEFORE UPDATE ON candidates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at 
    BEFORE UPDATE ON interviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();