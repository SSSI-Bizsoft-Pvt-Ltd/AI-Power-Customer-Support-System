import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Service to handle outgoing Meta WhatsApp Cloud API requests
 */
class WhatsAppService {
  constructor() {
    this.token = process.env.WHATSAPP_API_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.version = 'v19.0';
    this.baseUrl = `https://graph.facebook.com/${this.version}`;
  }

  /**
   * Send a simple text message back to a user/group natively via Meta Cloud API.
   */
  async sendTextMessage(to, messageText) {
    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          preview_url: false,
          body: messageText
        }
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error.response?.data || error.message);
      throw new Error('Failed to send WhatsApp message');
    }
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId) {
    try {
      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error.response?.data || error.message);
      // We don't necessarily want to throw here and crash the flow if read receipt fails
    }
  }
}

export const whatsappService = new WhatsAppService();
