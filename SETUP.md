# Setup CRM Reclutamento

Guida completa per l'installazione e configurazione del CRM per la gestione colloqui di reclutamento.

## Prerequisiti

- **Node.js** 18+
- **PostgreSQL** 15+
- **npm** o **yarn**

## 1. Setup Database PostgreSQL

### Installazione PostgreSQL
```bash
# Windows (con chocolatey)
choco install postgresql

# Mac (con homebrew)
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
```

### Creazione Database
```bash
# Accesso a PostgreSQL
sudo -u postgres psql

# Creazione database e utente
CREATE DATABASE crm_reclutamento;
CREATE USER crm_user WITH PASSWORD 'crm_password_2024';
GRANT ALL PRIVILEGES ON DATABASE crm_reclutamento TO crm_user;
\q
```

### Importazione Schema
```bash
# Importa schema database
psql -U crm_user -d crm_reclutamento -f database/schema.sql

# Importa dati di esempio (opzionale)
psql -U crm_user -d crm_reclutamento -f database/sample_data.sql
```

## 2. Setup Backend

```bash
cd backend

# Installa dipendenze
npm install

# Copia configurazione environment
cp .env.example .env
```

### Configurazione .env
Modifica il file `.env` con le tue configurazioni:

```env
# Database
DATABASE_URL="postgresql://crm_user:crm_password_2024@localhost:5432/crm_reclutamento"

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Email (Nodemailer - Gmail example)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="noreply@azienda.it"

# Google Meet Integration
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/auth/google/callback"

# Windows Phone Integration
WINDOWS_PHONE_API_ENDPOINT="https://api.windows-phone.local"
WINDOWS_PHONE_API_KEY="your-api-key"

# CORS
CORS_ORIGIN="http://localhost:3000"
```

### Avvio Backend
```bash
# Genera Prisma Client
npm run db:generate

# Avvia server di sviluppo
npm run dev
```

Il backend sarà disponibile su: `http://localhost:3001`

## 3. Setup Frontend

```bash
cd frontend

# Installa dipendenze
npm install

# Avvia server di sviluppo
npm run dev
```

Il frontend sarà disponibile su: `http://localhost:5173`

## 4. Configurazione Email

### Gmail (Consigliato per sviluppo)

1. Vai su [Google Account Settings](https://myaccount.google.com)
2. Abilita "2-Step Verification"
3. Genera una "App Password" per l'applicazione
4. Usa la App Password nel campo `SMTP_PASS` del file `.env`

### Esempio configurazione Gmail:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-digit-app-password"
```

## 5. Integrazione Windows Phone

Il sistema supporta l'integrazione con l'app "Collegamento al telefono di Windows" per:
- Invio SMS tramite telefoni aziendali
- Avvio chiamate dirette
- Controllo crediti SMS

### Configurazione:
```env
WINDOWS_PHONE_API_ENDPOINT="https://your-windows-phone-api.local"
WINDOWS_PHONE_API_KEY="your-api-key"
```

**Nota**: In modalità sviluppo, le funzionalità SMS/chiamate sono simulate senza necessità di configurazione.

## 6. Test Setup

### Verifica Backend
```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Dovrebbe restituire:
# {"status":"OK","timestamp":"...","version":"1.0.0"}
```

### Verifica Database
```bash
# Test endpoint candidati
curl http://localhost:3001/api/candidates

# Test endpoint dashboard
curl http://localhost:3001/api/dashboard/stats
```

### Verifica Frontend
Apri il browser su `http://localhost:5173` e verifica che:
- La dashboard si carica correttamente
- Le sezioni Candidati e Colloqui sono accessibili
- Non ci sono errori nella console del browser

## 7. Utilizzo con Docker (Opzionale)

```bash
# Avvia tutti i servizi
docker-compose up

# Solo database
docker-compose up postgres

# Con build
docker-compose up --build
```

## 8. Funzionalità Implementate

### ✅ Gestione Candidati
- CRUD completo candidati
- Filtri e ricerca
- Upload CV e documenti
- Tracking status

### ✅ Sistema Colloqui
- Programmazione 3 fasi colloquio
- Integrazione Google Meet
- Valutazioni e rating
- Registrazione esiti

### ✅ Comunicazioni
- Invio email con template
- SMS via Windows Phone
- Storico comunicazioni complete
- Sistema chiamate integrato

### ✅ Dashboard e Monitoring
- Statistiche in tempo reale
- Grafici e metriche
- Performance team HR
- Alert e notifiche

## 9. Troubleshooting

### Database Connection Error
```bash
# Verifica che PostgreSQL sia in esecuzione
sudo systemctl status postgresql

# Verifica connessione
psql -U crm_user -d crm_reclutamento -c "SELECT 1;"
```

### Prisma Issues
```bash
# Rigenera client Prisma
npm run db:generate

# Reset database (ATTENZIONE: elimina tutti i dati)
npm run db:push -- --force-reset
```

### Email Issues
- Verifica credenziali SMTP nel file `.env`
- Per Gmail, usa App Password invece della password normale
- Controlla che la 2FA sia abilitata su Gmail

### Frontend Build Issues
```bash
# Clear cache e reinstalla
rm -rf node_modules package-lock.json
npm install

# Build manuale
npm run build
```

## 10. Sviluppo e Contributi

### Struttura del progetto
```
crm-reclutamento/
├── backend/           # API Node.js + Express + Prisma
├── frontend/          # React + TypeScript + MUI
├── database/          # Schema SQL e dati di esempio
└── docker-compose.yml # Orchestrazione container
```

### Scripts utili
```bash
# Backend
npm run dev          # Sviluppo con hot reload
npm run build        # Build produzione
npm run db:studio    # UI per database
npm run lint         # Linting codice

# Frontend  
npm run dev          # Sviluppo con hot reload
npm run build        # Build produzione
npm run preview      # Preview build produzione
```

Il sistema è pronto per l'uso! 🚀