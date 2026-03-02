import axios from 'axios';

const RASA_URL = process.env.RASA_URL || 'http://localhost:5005';

class RasaService {
  async sendMessage(message, sender = 'user') {
    try {
      const response = await axios.post(
        `${RASA_URL}/webhooks/rest/webhook`,
        {
          sender,
          message
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('[RasaService] Error:', error.message);
      throw new Error('Failed to communicate with Rasa. Please ensure Rasa server is running.');
    }
  }

  formatRasaResponse(rasaResponses) {
    if (!rasaResponses || rasaResponses.length === 0) {
      return 'I apologize, but I couldn\'t process your request. Please try again.';
    }
    
    // Extract text from all responses
    const messages = rasaResponses
      .filter(response => response.text)
      .map(response => response.text);
    
    return messages.join('\n\n');
  }
}

export default new RasaService();
