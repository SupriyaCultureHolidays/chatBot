import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ChatBot.css';

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "👋 Hello! I'm your Agent Information Assistant. I can help you find agent details, company information, login history, and more. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const stripMailto = (text) => text.replace(/^mailto:/i, '').trim();

  const sendMessage = async (e) => {
    e.preventDefault();

    const cleanInput = stripMailto(input);
    if (!cleanInput) return;

    const userMessage = {
      type: 'user',
      text: cleanInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5000/api/chat', {
        message: cleanInput
      }, { timeout: 30000 });

      const botMessage = {
        type: 'bot',
        text: response.data.message,
        corrected: response.data.correctedMessage !== cleanInput,
        intent: response.data.intent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setError('Unable to connect to server');
      const errorMessage = {
        type: 'bot',
        text: '❌ Sorry, I encountered an error. Please make sure the backend server is running.',
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const retryLastMessage = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.type === 'user');
    if (lastUserMessage) {
      setInput(lastUserMessage.text);
      setError(null);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="header-content">
          <div className="bot-avatar">🤖</div>
          <div className="header-text">
            <h1>Agent Assistant</h1>
            <p className="status">
              <span className="status-dot"></span>
              {error ? 'Offline' : 'Online'}
            </p>
          </div>
          <button
            className="debug-toggle"
            onClick={() => setDebugMode(!debugMode)}
            title="Toggle debug mode"
          >
            {debugMode ? '🐛' : '⚙️'}
          </button>
        </div>
      </div>

      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            <div className="message-content">
              <div className="message-bubble">
                {msg.corrected && (
                  <div className="correction-notice">
                    ✓ Auto-corrected your message
                  </div>
                )}
                <p>{msg.text}</p>
                {debugMode && msg.intent && (
                  <span className="intent-badge">{msg.intent}</span>
                )}
              </div>
              <span className="message-time">{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="message bot">
            <div className="message-content">
              <div className="message-bubble">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={retryLastMessage}>Retry</button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chatbot-input" onSubmit={sendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question here..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatBot;
