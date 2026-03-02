import rasaService from '../services/rasaService.js';

export const handleChat = async (req, res, next) => {
  try {
    const { message, originalMessage } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    // Send to Rasa
    const rasaResponses = await rasaService.sendMessage(message);
    const botResponse = rasaService.formatRasaResponse(rasaResponses);
    
    res.json({
      success: true,
      message: botResponse,
      originalMessage: originalMessage || message,
      correctedMessage: message !== originalMessage ? message : undefined
    });
    
  } catch (error) {
    next(error);
  }
};
