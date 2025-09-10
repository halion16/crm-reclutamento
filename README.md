# CRM Gestione Colloqui di Reclutamento

Sistema CRM per la gestione completa del processo di reclutamento con funzionalità di scheduling, tracking colloqui e comunicazioni automatizzate.

## Architettura del Sistema

### Stack Tecnologico
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 15+
- **UI Framework**: Material-UI (MUI)
- **Autenticazione**: JWT + bcrypt
- **ORM**: Prisma
- **Comunicazioni**: Integrazione Windows Phone API per SMS/chiamate

## Struttura del Progetto

```
crm-reclutamento/
├── backend/                 # API Server Node.js
│   ├── src/
│   │   ├── routes/         # Endpoint REST API
│   │   ├── models/         # Modelli database (Prisma)
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Middleware (auth, validation)
│   │   ├── utils/          # Utilities
│   │   └── integrations/   # API esterne (Google Meet, Windows Phone)
│   ├── prisma/            # Schema database e migrations
│   └── package.json
├── frontend/               # App React
│   ├── src/
│   │   ├── components/    # Componenti React
│   │   ├── pages/         # Pagine principali
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API calls
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utilities frontend
│   └── package.json
└── database/              # Schema SQL e dati di esempio
    ├── schema.sql
    └── sample_data.sql
```

## Funzionalità Principali

### 1. Gestione Candidati
- ✅ Inserimento dati anagrafici e professionali
- ✅ Caricamento CV e documenti
- ✅ Tracking provenienza candidatura
- ✅ Gestione status avanzamento

### 2. Sistema Colloqui (3 Fasi)
- ✅ Programmazione appuntamenti
- ✅ Integrazione Google Meet
- ✅ Gestione intervistatori multipli
- ✅ Sistema valutazioni e rating

### 3. Comunicazioni Automatizzate
- ✅ Template email personalizzabili
- ✅ SMS via Windows Phone Integration
- ✅ Reminder automatici
- ✅ Tracking stato consegna

### 4. Dashboard e Reporting
- ✅ Monitor candidati attivi
- ✅ Statistiche colloqui
- ✅ Report performance team HR
- ✅ Timeline attività

## Setup e Installazione

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm o yarn

### 1. Database Setup
```bash
# Creare database PostgreSQL
createdb crm_reclutamento

# Importare schema
psql -d crm_reclutamento -f database/schema.sql

# Dati di esempio (opzionale)
psql -d crm_reclutamento -f database/sample_data.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend  
npm install
npm run dev
```

## API Endpoints

### Candidati
- `GET /api/candidates` - Lista candidati
- `POST /api/candidates` - Crea nuovo candidato
- `PUT /api/candidates/:id` - Aggiorna candidato
- `DELETE /api/candidates/:id` - Elimina candidato

### Colloqui
- `GET /api/interviews` - Lista colloqui
- `POST /api/interviews` - Programma nuovo colloquio
- `PUT /api/interviews/:id` - Aggiorna colloquio/esito
- `GET /api/interviews/candidate/:id` - Colloqui per candidato

### Comunicazioni
- `POST /api/communications/email` - Invia email
- `POST /api/communications/sms` - Invia SMS
- `GET /api/communications/templates` - Template disponibili

## Integrazioni Esterne

### Google Meet
- Creazione automatica meeting
- Gestione inviti partecipanti
- Link diretti da CRM

### Windows Phone Integration
- Invio SMS tramite crediti aziendali
- Gestione chiamate dirette
- Sincronizzazione rubrica

## Status del Progetto

- [x] Database Schema Design
- [x] Project Structure Setup
- [ ] Backend API Development
- [ ] Frontend Components
- [ ] Authentication System
- [ ] Google Meet Integration
- [ ] Windows Phone Integration
- [ ] Testing & Deployment