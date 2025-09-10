import { spawn, exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface WindowsPhoneResult {
  success: boolean;
  error?: string;
  messageId?: string;
  timestamp?: string;
  appVersion?: string;
  phoneConnected?: boolean;
}

interface SMSOptions {
  phoneNumber: string;
  message: string;
  timeout?: number;
}

class WindowsPhoneService {
  private scriptPath: string;
  private defaultTimeout: number = 30000; // 30 secondi
  private isDebugMode: boolean = process.env.NODE_ENV !== 'production';

  constructor() {
    // Percorso dello script PowerShell - deve essere nella cartella communication
    this.scriptPath = path.join(__dirname, 'communication', 'windowsPhoneAutomation.ps1');
    console.log(`[WindowsPhoneService] Script path: ${this.scriptPath}`);
  }

  /**
   * Invia SMS tramite automazione dell'app "Collegamento al telefono" Windows
   */
  async sendSMS(options: SMSOptions): Promise<WindowsPhoneResult> {
    const startTime = Date.now();
    
    try {
      this.log(`Invio SMS a ${options.phoneNumber}`);
      this.log(`Messaggio: ${options.message.substring(0, 50)}...`);

      // Valida input
      const validation = this.validateInput(options);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Prepara il comando PowerShell
      const command = this.buildPowerShellCommand('send', options.phoneNumber, options.message);
      
      this.log(`Esecuzione comando: ${command.substring(0, 100)}...`);

      // Esegui automazione con timeout
      const result = await this.executeWithTimeout(command, options.timeout || this.defaultTimeout);
      
      const executionTime = Date.now() - startTime;
      this.log(`Automazione completata in ${executionTime}ms`);

      // Parse del risultato JSON da PowerShell
      const parsedResult = this.parseResult(result);
      
      if (parsedResult.success) {
        this.log(`✅ SMS inviato con successo. MessageId: ${parsedResult.messageId}`);
      } else {
        this.log(`❌ Invio SMS fallito: ${parsedResult.error}`);
      }

      return parsedResult;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      
      this.log(`❌ Errore durante automazione (${executionTime}ms): ${errorMessage}`);
      
      return {
        success: false,
        error: `Automazione fallita: ${errorMessage}`
      };
    }
  }

  /**
   * Testa la connessione con l'app "Collegamento al telefono"
   */
  async testConnection(): Promise<WindowsPhoneResult> {
    try {
      this.log('Test connessione app Windows Phone...');

      const command = this.buildPowerShellCommand('test');
      const result = await this.executeWithTimeout(command, 15000); // Timeout più breve per test

      const parsedResult = this.parseResult(result);
      
      if (parsedResult.success) {
        this.log(`✅ Connessione OK. App versione: ${parsedResult.appVersion}`);
      } else {
        this.log(`❌ Test connessione fallito: ${parsedResult.error}`);
      }

      return parsedResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      this.log(`❌ Errore durante test connessione: ${errorMessage}`);
      
      return {
        success: false,
        error: `Test connessione fallito: ${errorMessage}`
      };
    }
  }

  /**
   * Verifica se il servizio Windows Phone è disponibile
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Controlla se PowerShell è disponibile
      await execAsync('powershell -Command "Get-Host"');
      
      // Controlla se lo script esiste
      const fs = require('fs');
      if (!fs.existsSync(this.scriptPath)) {
        this.log(`❌ Script PowerShell non trovato: ${this.scriptPath}`);
        return false;
      }

      // Test rapido della connessione
      const testResult = await this.testConnection();
      return testResult.success;

    } catch (error) {
      this.log(`❌ Servizio Windows Phone non disponibile: ${error}`);
      return false;
    }
  }

  /**
   * Ottiene le informazioni sullo stato del telefono connesso
   */
  async getPhoneStatus(): Promise<{
    isConnected: boolean;
    deviceName?: string;
    batteryLevel?: number;
    signalStrength?: number;
  }> {
    try {
      const connectionTest = await this.testConnection();
      
      return {
        isConnected: connectionTest.success,
        deviceName: 'Telefono aziendale', // Placeholder - può essere espanso
        batteryLevel: undefined, // Non disponibile tramite l'app
        signalStrength: undefined // Non disponibile tramite l'app
      };
    } catch (error) {
      return {
        isConnected: false
      };
    }
  }

  // ==================== METODI PRIVATI ====================

  private validateInput(options: SMSOptions): { isValid: boolean; error?: string } {
    if (!options.phoneNumber || options.phoneNumber.trim().length === 0) {
      return { isValid: false, error: 'Numero di telefono richiesto' };
    }

    if (!options.message || options.message.trim().length === 0) {
      return { isValid: false, error: 'Messaggio richiesto' };
    }

    // Validazione formato numero (base)
    const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{8,15}$/;
    if (!phoneRegex.test(options.phoneNumber)) {
      return { isValid: false, error: 'Formato numero di telefono non valido' };
    }

    // Verifica lunghezza messaggio (160 caratteri per SMS standard)
    if (options.message.length > 1600) { // Limite esteso per messaggi lunghi
      return { isValid: false, error: 'Messaggio troppo lungo (max 1600 caratteri)' };
    }

    return { isValid: true };
  }

  private buildPowerShellCommand(action: string, phoneNumber?: string, message?: string): string {
    const escapedScriptPath = `"${this.scriptPath}"`;
    
    switch (action) {
      case 'send':
        if (!phoneNumber || !message) {
          throw new Error('Numero telefono e messaggio richiesti per invio SMS');
        }
        
        // Escape delle virgolette nel messaggio
        const escapedMessage = message.replace(/"/g, '""');
        return `powershell -ExecutionPolicy Bypass -File ${escapedScriptPath} send "${phoneNumber}" "${escapedMessage}"`;
      
      case 'test':
        return `powershell -ExecutionPolicy Bypass -File ${escapedScriptPath} test`;
      
      default:
        throw new Error(`Azione non supportata: ${action}`);
    }
  }

  private executeWithTimeout(command: string, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout: operazione non completata entro ${timeoutMs}ms`));
      }, timeoutMs);

      exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
        clearTimeout(timeout);
        
        if (error) {
          this.log(`Errore PowerShell: ${error.message}`);
          reject(error);
          return;
        }

        if (stderr) {
          this.log(`Warning PowerShell: ${stderr}`);
        }

        resolve(stdout);
      });
    });
  }

  private parseResult(output: string): WindowsPhoneResult {
    try {
      // Pulisce l'output da eventuali caratteri di debug
      const cleanOutput = output.trim();
      
      // Cerca il JSON nell'output
      const jsonMatch = cleanOutput.match(/\{.*\}/);
      if (!jsonMatch) {
        throw new Error('Formato output non valido da PowerShell');
      }

      const parsedResult = JSON.parse(jsonMatch[0]);
      
      // Converte le proprietà PowerShell in formato TypeScript
      return {
        success: parsedResult.success || false,
        error: parsedResult.error || parsedResult.message || undefined,
        messageId: parsedResult.messageId || undefined,
        timestamp: parsedResult.timestamp || undefined,
        appVersion: parsedResult.appVersion || (parsedResult.details && parsedResult.details.phoneLinkTest && parsedResult.details.phoneLinkTest.appVersion) || undefined,
        phoneConnected: parsedResult.phoneConnected || false
      };

    } catch (error) {
      this.log(`Errore parsing risultato PowerShell: ${error}`);
      return {
        success: false,
        error: `Errore parsing risultato: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
      };
    }
  }

  private log(message: string): void {
    if (this.isDebugMode) {
      const timestamp = new Date().toISOString().slice(11, 23); // HH:mm:ss.sss
      console.log(`[${timestamp}] [WindowsPhoneService] ${message}`);
    }
  }

  // ==================== METODI STATICI ====================

  /**
   * Factory method per creare un'istanza del servizio
   */
  static create(): WindowsPhoneService {
    return new WindowsPhoneService();
  }

  /**
   * Test rapido per verificare se il servizio può funzionare
   */
  static async quickTest(): Promise<boolean> {
    try {
      const service = new WindowsPhoneService();
      return await service.isAvailable();
    } catch {
      return false;
    }
  }
}

// Esporta servizio singleton
export const windowsPhoneService = WindowsPhoneService.create();
export default WindowsPhoneService;

// Esportazione tipi per uso esterno
export type { WindowsPhoneResult, SMSOptions };