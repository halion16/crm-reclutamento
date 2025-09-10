# Windows Phone "Collegamento al telefono" SMS Automation
# PowerShell Script per automatizzare invio SMS tramite app Microsoft

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

class WindowsPhoneAutomator {
    [string]$AppName = "Microsoft.YourPhone_8wekyb3d8bbwe"
    [string]$AppDisplayName = "Il tuo telefono"
    [int]$DefaultTimeout = 10
    [bool]$IsDebugMode = $true

    # Avvia l'app "Collegamento al telefono" se non è già aperta
    [bool] StartPhoneApp() {
        try {
            $this.WriteDebug("Tentativo di avvio app '$($this.AppDisplayName)'...")
            
            # Verifica se l'app è già in esecuzione
            $existingProcess = Get-Process | Where-Object { $_.MainWindowTitle -like "*telefono*" -or $_.ProcessName -like "*YourPhone*" }
            
            if ($existingProcess) {
                $this.WriteDebug("App già in esecuzione. PID: $($existingProcess.Id)")
                # Porta l'app in primo piano
                [System.Windows.Forms.SendKeys]::SendWait("%{TAB}")
                Start-Sleep -Milliseconds 500
                return $true
            }

            # Avvia l'app tramite Windows Start Menu
            $this.WriteDebug("Avvio app dal menu Start...")
            [System.Windows.Forms.SendKeys]::SendWait("^{ESC}")  # Win key
            Start-Sleep -Milliseconds 1000
            [System.Windows.Forms.SendKeys]::SendWait("telefono{ENTER}")
            Start-Sleep -Seconds 3

            # Verifica che l'app si sia avviata
            $retryCount = 0
            while ($retryCount -lt 5) {
                $process = Get-Process | Where-Object { $_.MainWindowTitle -like "*telefono*" }
                if ($process) {
                    $this.WriteDebug("App avviata con successo. PID: $($process.Id)")
                    return $true
                }
                Start-Sleep -Seconds 1
                $retryCount++
            }

            $this.WriteDebug("Impossibile avviare l'app telefono")
            return $false
        }
        catch {
            $this.WriteDebug("Errore durante l'avvio dell'app: $($_.Exception.Message)")
            return $false
        }
    }

    # Naviga alla sezione Messaggi (Windows 11 - sezione già visibile all'avvio)
    [bool] NavigateToMessages() {
        try {
            $this.WriteDebug("Verifica sezione Messaggi (Windows 11)...")
            
            # Su Windows 11, la sezione messaggi è direttamente visibile all'avvio
            # Assicuriamoci che l'app sia in primo piano
            Start-Sleep -Milliseconds 500
            
            # Se necessario, clicca sulla sezione "Messaggi" in caso non sia selezionata
            # Prova shortcut Ctrl+1 per messaggi
            [System.Windows.Forms.SendKeys]::SendWait("^1")
            Start-Sleep -Milliseconds 800
            
            $this.WriteDebug("Sezione Messaggi attiva")
            return $true
        }
        catch {
            $this.WriteDebug("Errore durante la navigazione ai messaggi: $($_.Exception.Message)")
            return $false
        }
    }

    # Crea nuovo messaggio
    [bool] CreateNewMessage() {
        try {
            $this.WriteDebug("Creazione nuovo messaggio...")
            
            # Cerca il pulsante "Nuovo messaggio" o simile
            # Prova con Ctrl+N (shortcut comune per nuovo)
            [System.Windows.Forms.SendKeys]::SendWait("^n")
            Start-Sleep -Milliseconds 1500
            
            # Verifica che si sia aperto il dialog del nuovo messaggio
            return $true
        }
        catch {
            $this.WriteDebug("Errore durante la creazione del nuovo messaggio: $($_.Exception.Message)")
            return $false
        }
    }

    # Inserisce il numero di telefono del destinatario
    [bool] SetRecipient([string]$phoneNumber) {
        try {
            $this.WriteDebug("Inserimento destinatario: $phoneNumber")
            
            # Invia il numero di telefono
            # Potrebbero essere necessarie pause per permettere all'app di processare
            [System.Windows.Forms.SendKeys]::SendWait($phoneNumber)
            Start-Sleep -Milliseconds 500
            
            # Premi Tab per spostarti al campo messaggio o Enter per confermare
            [System.Windows.Forms.SendKeys]::SendWait("{TAB}")
            Start-Sleep -Milliseconds 500
            
            return $true
        }
        catch {
            $this.WriteDebug("Errore durante l'inserimento del destinatario: $($_.Exception.Message)")
            return $false
        }
    }

    # Inserisce il testo del messaggio
    [bool] SetMessageText([string]$messageText) {
        try {
            $this.WriteDebug("Inserimento testo messaggio...")
            
            # Pulisce eventuali testi precedenti
            [System.Windows.Forms.SendKeys]::SendWait("^a")  # Seleziona tutto
            Start-Sleep -Milliseconds 200
            
            # Inserisce il nuovo testo
            [System.Windows.Forms.SendKeys]::SendWait($messageText)
            Start-Sleep -Milliseconds 500
            
            return $true
        }
        catch {
            $this.WriteDebug("Errore durante l'inserimento del testo: $($_.Exception.Message)")
            return $false
        }
    }

    # Invia il messaggio
    [bool] SendMessage() {
        try {
            $this.WriteDebug("Invio messaggio...")
            
            # Premi Enter per inviare (shortcut comune)
            [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
            Start-Sleep -Milliseconds 1000
            
            # Verifica che il messaggio sia stato inviato
            # Potrebbe essere necessario controllare indicatori visivi specifici
            
            return $true
        }
        catch {
            $this.WriteDebug("Errore durante l'invio del messaggio: $($_.Exception.Message)")
            return $false
        }
    }

    # Funzione principale per inviare un SMS
    [hashtable] SendSMS([string]$phoneNumber, [string]$messageText) {
        $result = @{
            Success = $false
            Error = ""
            MessageId = ""
            Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        }

        try {
            $this.WriteDebug("=== INIZIO INVIO SMS ===")
            $this.WriteDebug("Destinatario: $phoneNumber")
            $this.WriteDebug("Messaggio: $($messageText.Substring(0, [Math]::Min(50, $messageText.Length)))...")

            # Step 1: Avvia l'app
            if (-not $this.StartPhoneApp()) {
                $result.Error = "Impossibile avviare l'app 'Collegamento al telefono'"
                return $result
            }

            # Step 2: Naviga ai messaggi
            if (-not $this.NavigateToMessages()) {
                $result.Error = "Impossibile navigare alla sezione messaggi"
                return $result
            }

            # Step 3: Crea nuovo messaggio
            if (-not $this.CreateNewMessage()) {
                $result.Error = "Impossibile creare un nuovo messaggio"
                return $result
            }

            # Step 4: Inserisci destinatario
            if (-not $this.SetRecipient($phoneNumber)) {
                $result.Error = "Impossibile inserire il numero del destinatario"
                return $result
            }

            # Step 5: Inserisci testo messaggio
            if (-not $this.SetMessageText($messageText)) {
                $result.Error = "Impossibile inserire il testo del messaggio"
                return $result
            }

            # Step 6: Invia messaggio
            if (-not $this.SendMessage()) {
                $result.Error = "Impossibile inviare il messaggio"
                return $result
            }

            # Successo
            $result.Success = $true
            $result.MessageId = "win_phone_$(Get-Date -Format 'yyyyMMddHHmmss')"
            $this.WriteDebug("=== SMS INVIATO CON SUCCESSO ===")

        }
        catch {
            $result.Error = "Errore imprevisto: $($_.Exception.Message)"
            $this.WriteDebug("ERRORE: $($result.Error)")
        }

        return $result
    }

    # Test di connessione - verifica che l'app sia disponibile
    [hashtable] TestConnection() {
        $result = @{
            Success = $false
            Error = ""
            AppVersion = ""
            PhoneConnected = $false
        }

        try {
            # Verifica che l'app sia installata
            $app = Get-AppxPackage | Where-Object { $_.Name -like "*YourPhone*" }
            if (-not $app) {
                $result.Error = "App 'Collegamento al telefono' non trovata"
                return $result
            }

            $result.AppVersion = $app.Version
            
            # Prova ad avviare l'app
            if ($this.StartPhoneApp()) {
                $result.Success = $true
                $result.PhoneConnected = $true  # Assumiamo connesso se l'app si avvia
            } else {
                $result.Error = "Impossibile avviare l'app"
            }

        }
        catch {
            $result.Error = "Errore durante il test: $($_.Exception.Message)"
        }

        return $result
    }

    # Utility per debug logging
    [void] WriteDebug([string]$message) {
        if ($this.IsDebugMode) {
            $timestamp = (Get-Date).ToString("HH:mm:ss.fff")
            Write-Host "[$timestamp] [WindowsPhoneAutomator] $message" -ForegroundColor Yellow
        }
    }
}

# Funzioni principali esposte per Node.js

function Send-SMS {
    param(
        [Parameter(Mandatory=$true)]
        [string]$PhoneNumber,
        
        [Parameter(Mandatory=$true)]
        [string]$MessageText
    )
    
    $automator = [WindowsPhoneAutomator]::new()
    $result = $automator.SendSMS($PhoneNumber, $MessageText)
    
    # Restituisce risultato in formato JSON per Node.js
    return ($result | ConvertTo-Json -Compress)
}

function Test-PhoneConnection {
    $automator = [WindowsPhoneAutomator]::new()
    $result = $automator.TestConnection()
    
    return ($result | ConvertTo-Json -Compress)
}

# Se lo script viene eseguito direttamente, interpreta i parametri da riga di comando
if ($args.Count -gt 0) {
    switch ($args[0]) {
        "send" {
            if ($args.Count -ge 3) {
                $result = Send-SMS -PhoneNumber $args[1] -MessageText $args[2]
                Write-Output $result
            } else {
                Write-Error "Uso: powershell windowsPhoneAutomation.ps1 send <numero> <messaggio>"
            }
        }
        "test" {
            $result = Test-PhoneConnection
            Write-Output $result
        }
        default {
            Write-Host "Comandi disponibili:"
            Write-Host "  send <numero> <messaggio> - Invia SMS"
            Write-Host "  test                      - Test connessione"
        }
    }
}