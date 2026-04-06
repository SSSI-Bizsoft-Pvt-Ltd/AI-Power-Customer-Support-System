import express from 'express';
import { processIncomingMessage } from '../services/aiService.js';
import { whatsappService } from '../services/whatsappService.js';
import { query } from '../db/index.js';
const router = express.Router();

/**
 * GET: Webhook Verification
 * Meta requires this endpoint to verify the webhook URL.
 */
router.get('/webhook', (req, res) => {
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  } else {
    res.status(400).send('Missing parameters');
  }
});

/**
 * POST: Incoming Webhook Messages from Meta
 */
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Check if it's a WhatsApp App webhook event
    if (body.object) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        
        // Extract required metadata
        const phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
        const from = body.entry[0].changes[0].value.messages[0].from; // Sender's phone number
        const msg_body = body.entry[0].changes[0].value.messages[0].text.body; // Text payload
        const msg_id = body.entry[0].changes[0].value.messages[0].id;
        
        console.log(`Received message from ${from}: ${msg_body}`);

        // 1. Store the Raw Message in DB IMMEDIATELY
        // This ensures the dashboard reflects receipts even if AI processing fails.
        let internal_msg_id;
        try {
          const msgInsertResult = await query(
            'INSERT INTO messages (whatsapp_msg_id, sender_phone, content, is_actionable) VALUES ($1, $2, $3, $4) RETURNING id',
            [msg_id, from, msg_body, true] // Default to true initially to ensure it shows up in "total messages"
          );
          internal_msg_id = msgInsertResult.rows[0].id;
        } catch (dbErr) {
          if (dbErr.code === '23505') {
            console.log('Duplicate message received (already processed)');
            return res.sendStatus(200);
          }
          throw dbErr; // Let the main catch block handle other DB errors
        }

        // 2. Respond 200 immediately to Meta to prevent retries
        res.sendStatus(200);

        // 3. Process enrichment in the background (Non-blocking)
        (async () => {
          try {
            // A. Mark as read
            await whatsappService.markAsRead(msg_id);

            // B. Process via AI Task Engine
            const aiResult = await processIncomingMessage(msg_body);

            // C. Update the DB message actionable status
            await query('UPDATE messages SET is_actionable = $1 WHERE id = $2', [!aiResult.ignored, internal_msg_id]);

            if (!aiResult.ignored) {
              const { task } = aiResult;
              if (task.confidenceScore >= 70) {
                await query(
                  'INSERT INTO tasks (title, summary, category, confidence_score, priority, message_id) VALUES ($1, $2, $3, $4, $5, $6)',
                  [task.title, task.summary, task.category, task.confidenceScore, task.priority, internal_msg_id]
                );
                
                console.log(`[Task Created] ${task.category}: ${task.title}`);

                // D. Send Auto-Response
                await whatsappService.sendTextMessage(
                  from, 
                  `Hi! We've received your request: *${task.title}* and categorized it as a ${task.category}. Our team is looking into it!`
                );
              }
            }
          } catch (bgErr) {
            console.error('Failure in background webhook processing:', bgErr.message);
          }
        })();
        return; // Already sent 200
      }
      return res.sendStatus(200); // Acknowledge status updates too
    }
    res.sendStatus(404);
  } catch (err) {
    console.error('Critical Webhook error:', err);
    if (!res.headersSent) res.sendStatus(500);
  }
});

export default router;
