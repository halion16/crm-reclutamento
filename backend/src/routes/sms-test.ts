import express from 'express';
import { windowsPhoneService } from '../services/windowsPhoneService';
import { skebbyService } from '../services/skebbyService';

const router = express.Router();

// Test endpoint per verificare connessione Windows Phone
router.get('/windows-phone/test', async (req, res) => {
  try {
    console.log('🔍 Testing Windows Phone connection...');
    
    const result = await windowsPhoneService.testConnection();
    
    res.json({
      success: result.success,
      message: result.error || result.message || 'Test completato',
      details: result.details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Windows Phone test error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel test della connessione Windows Phone',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint per verificare Skebby
router.get('/skebby/test', async (req, res) => {
  try {
    console.log('🔍 Testing Skebby connection...');
    
    const result = await skebbyService.testConnection();
    
    res.json({
      success: result.success,
      message: result.message,
      credits: result.credits,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Skebby test error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel test della connessione Skebby',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint per inviare SMS di test tramite Windows Phone
router.post('/windows-phone/send-test', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: 'phoneNumber e message sono richiesti'
      });
    }

    console.log(`📱 Testing SMS send to ${phoneNumber}...`);
    
    const result = await windowsPhoneService.sendSMS({
      phoneNumber,
      message
    });
    
    res.json({
      success: result.success,
      message: result.message,
      method: 'windows_phone',
      cost: 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Windows Phone SMS test error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'invio SMS di test',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Status endpoint per verificare tutti i servizi
router.get('/status', async (req, res) => {
  try {
    console.log('🔍 Checking all SMS services status...');
    
    // Test Windows Phone
    const windowsResult = await windowsPhoneService.testConnection();
    
    // Test Skebby
    const skebbyResult = await skebbyService.testConnection();
    
    res.json({
      timestamp: new Date().toISOString(),
      services: {
        windowsPhone: {
          status: windowsResult.success ? 'online' : 'offline',
          message: windowsResult.message,
          cost: 0,
          priority: 1
        },
        skebby: {
          status: skebbyResult.success ? 'online' : 'offline',
          message: skebbyResult.message,
          credits: skebbyResult.credits || 0,
          cost: 0.045,
          priority: 2
        }
      },
      recommendations: {
        primary: windowsResult.success ? 'windows_phone' : 'skebby',
        fallback: windowsResult.success ? 'skebby' : null
      }
    });
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella verifica dello stato dei servizi',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as smsTestRouter };