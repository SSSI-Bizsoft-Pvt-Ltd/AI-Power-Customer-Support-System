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

        // Acknowledge receipt immediately to avoid Meta retries (within 3 seconds)
        // Note: For a true production robust system, we would push this to a queue (like BullMQ)
        // and process it asynchronously. Since we just returned status 200 below, the execution 
        // continues here for demonstration purposes.

        // 1. Mark as read
        await whatsappService.markAsRead(msg_id);

        // 2. Process via AI Task Engine
        const aiResult = await processIncomingMessage(msg_body);

        // 3. Store the Message in DB
        // (Assuming project_id is handled dynamically later when we register WA groups, setting it to NULL for now or assuming default)
        const msgInsertResult = await query(
          'INSERT INTO messages (whatsapp_msg_id, sender_phone, content, is_actionable) VALUES ($1, $2, $3, $4) RETURNING id',
          [msg_id, from, msg_body, !aiResult.ignored]
        );
        const internal_msg_id = msgInsertResult.rows[0].id;

        if (!aiResult.ignored) {
          // It's actionable. We have a task!
          const { task } = aiResult;
          
          if (task.confidenceScore >= 70) {
            // Task creation logic (To DB) goes here
            await query(
              'INSERT INTO tasks (title, summary, category, confidence_score, priority, message_id) VALUES ($1, $2, $3, $4, $5, $6)',
              [task.title, task.summary, task.category, task.confidenceScore, task.priority, internal_msg_id]
            );
            
            console.log(`[Task Created] ${task.category}: ${task.title} (Confidence: ${task.confidenceScore}%)`);
            
            // 4. Delayed Response Service
            setTimeout(async () => {
              try {
                await whatsappService.sendTextMessage(
                  from, 
                  `Hi! We've received your request: *${task.title}* and categorized it as a ${task.category}. Our team is looking into it!`
                );
              } catch(e) {
                console.error('Failed to send delayed response', e);
              }
            }, 3000); // 3-second delay
          } else {
            console.log(`[Validation Failed] Task confidence too low (${task.confidenceScore}%) for auto-creation.`);
          }
        } else {
          console.log(`[Filtered] Message was ignored. Reason: ${aiResult.reason}`);
        }
      }
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(500);
  }
});

export default router;
