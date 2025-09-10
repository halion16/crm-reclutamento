-- Dati di esempio per il CRM

-- Inserimento utenti HR di esempio
INSERT INTO hr_users (username, email, first_name, last_name, role, phone_extension) VALUES
('mario.rossi', 'mario.rossi@azienda.it', 'Mario', 'Rossi', 'HR_MANAGER', '101'),
('giulia.bianchi', 'giulia.bianchi@azienda.it', 'Giulia', 'Bianchi', 'HR_ASSISTANT', '102'),
('luca.verdi', 'luca.verdi@azienda.it', 'Luca', 'Verdi', 'INTERVIEWER', '103');

-- Inserimento template comunicazioni
INSERT INTO communication_templates (template_name, template_type, subject_template, message_template, usage_context) VALUES
('Conferma Colloquio 1', 'EMAIL', 
 'Conferma appuntamento colloquio - {candidate_name}', 
 'Gentile {candidate_name},\n\nLa confermiamo l''appuntamento per il primo colloquio in data {interview_date} alle ore {interview_time}.\n\nLink meeting: {meeting_url}\n\nCordiali saluti,\nTeam HR', 
 'INTERVIEW_CONFIRMATION'),
 
('Reminder Colloquio', 'SMS', 
 '', 
 'Reminder: domani alle {interview_time} colloquio. Link: {meeting_url}', 
 'REMINDER'),
 
('Esito Positivo', 'EMAIL', 
 'Esito colloquio - {candidate_name}', 
 'Gentile {candidate_name},\n\nSiamo lieti di comunicarLe che il colloquio ha avuto esito positivo. La contatteremo presto per i prossimi passi.\n\nCordiali saluti,\nTeam HR', 
 'OUTCOME_POSITIVE'),
 
('Esito Negativo', 'EMAIL', 
 'Esito colloquio - {candidate_name}', 
 'Gentile {candidate_name},\n\nLa ringraziamo per il tempo dedicato al colloquio. Purtroppo non possiamo procedere con la Sua candidatura.\n\nCordiali saluti,\nTeam HR', 
 'OUTCOME_NEGATIVE');

-- Inserimento candidati di esempio
INSERT INTO candidates (first_name, last_name, email, phone, mobile, position_applied, experience_years, source_channel, application_date, current_status) VALUES
('Andrea', 'Ferrari', 'andrea.ferrari@email.com', '0123456789', '3331234567', 'Sviluppatore Frontend', 3, 'LinkedIn', '2024-01-15', 'IN_PROCESS'),
('Sara', 'Colombo', 'sara.colombo@email.com', '0123456788', '3331234568', 'UI/UX Designer', 5, 'Indeed', '2024-01-18', 'NEW'),
('Marco', 'Romano', 'marco.romano@email.com', '0123456787', '3331234569', 'Backend Developer', 7, 'Referral', '2024-01-20', 'IN_PROCESS'),
('Elena', 'Ricci', 'elena.ricci@email.com', '0123456786', '3331234570', 'Project Manager', 4, 'Website', '2024-01-22', 'NEW');

-- Inserimento colloqui programmati
INSERT INTO interviews (candidate_id, interview_phase, scheduled_date, scheduled_time, interview_type, meeting_url, primary_interviewer_id, status) VALUES
(1, 1, '2024-01-25', '10:00:00', 'VIDEO_CALL', 'https://meet.google.com/abc-defg-hij', 1, 'COMPLETED'),
(1, 2, '2024-01-30', '14:30:00', 'VIDEO_CALL', 'https://meet.google.com/klm-nopq-rst', 2, 'SCHEDULED'),
(3, 1, '2024-01-26', '09:00:00', 'VIDEO_CALL', 'https://meet.google.com/uvw-xyza-bcd', 1, 'COMPLETED');

-- Aggiornamento esiti colloqui completati
UPDATE interviews SET 
    outcome = 'POSITIVE',
    interviewer_notes = 'Candidato molto preparato tecnicamente, buone soft skills',
    technical_rating = 8,
    soft_skills_rating = 7,
    overall_rating = 8,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1;

UPDATE interviews SET 
    outcome = 'POSITIVE',
    interviewer_notes = 'Esperienza solida, da approfondire competenze su microservizi',
    technical_rating = 7,
    soft_skills_rating = 8,
    overall_rating = 7,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 3;

-- Inserimento comunicazioni di esempio
INSERT INTO communications (candidate_id, interview_id, communication_type, direction, subject, message_content, sent_at, delivery_status) VALUES
(1, 1, 'EMAIL', 'OUTBOUND', 'Conferma appuntamento colloquio - Andrea Ferrari', 
 'Gentile Andrea Ferrari,\n\nLa confermiamo l''appuntamento per il primo colloquio in data 25/01/2024 alle ore 10:00.\n\nLink meeting: https://meet.google.com/abc-defg-hij\n\nCordiali saluti,\nTeam HR',
 '2024-01-23 16:30:00', 'DELIVERED'),
 
(1, NULL, 'SMS', 'OUTBOUND', '', 'Reminder: domani alle 10:00 colloquio. Link: https://meet.google.com/abc-defg-hij',
 '2024-01-24 18:00:00', 'DELIVERED');

-- Inserimento log attività
INSERT INTO activity_log (candidate_id, interview_id, activity_type, description, performed_by) VALUES
(1, NULL, 'CANDIDATE_CREATED', 'Nuovo candidato inserito per posizione Sviluppatore Frontend', 1),
(1, 1, 'INTERVIEW_SCHEDULED', 'Programmato colloquio fase 1 per il 25/01/2024', 1),
(1, 1, 'OUTCOME_RECORDED', 'Registrato esito positivo per colloquio fase 1', 1),
(1, 2, 'INTERVIEW_SCHEDULED', 'Programmato colloquio fase 2 per il 30/01/2024', 2),
(2, NULL, 'CANDIDATE_CREATED', 'Nuovo candidato inserito per posizione UI/UX Designer', 2),
(3, NULL, 'CANDIDATE_CREATED', 'Nuovo candidato inserito per posizione Backend Developer', 1),
(3, 3, 'INTERVIEW_SCHEDULED', 'Programmato colloquio fase 1 per il 26/01/2024', 1),
(3, 3, 'OUTCOME_RECORDED', 'Registrato esito positivo per colloquio fase 1', 1);