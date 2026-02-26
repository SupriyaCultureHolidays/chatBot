import React, { useState, useEffect, useRef } from 'react';
import './index.css';

const API_URL = 'http://localhost:5000/api/ask';

const HINT_CHIPS = [
  '🌴 Bali itinerary',
  '✈️ Cheap flights to Europe',
  '🏨 Best hotels in Tokyo',
  '🗺️ 2-week Asia trip',
];

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      text: "Welcome aboard. I'm your personal AI travel concierge — ready to craft itineraries, find hidden gems, and turn your dream trip into reality. Where shall we go?",
      isUser: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      contextUsed: false,
    }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const clearChat = () => {
    setMessages([{
      text: "Welcome aboard. I'm your personal AI travel concierge — ready to craft itineraries, find hidden gems, and turn your dream trip into reality. Where shall we go?",
      isUser: false,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      contextUsed: false,
    }]);
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMessage = {
      text,
      isUser: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMessage]);

    const placeholder = {
      text: '',
      isUser: false,
      contextUsed: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, placeholder]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });

      if (!response.ok) throw new Error('Server error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], text: fullText };
          return updated;
        });
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          text: "I'm having trouble reaching the server right now. Please try again in a moment.",
          isUser: false,
          contextUsed: false,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => sendMessage(input);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo">✈️</div>
          <div>
            <h1>Travel AI</h1>
            <p className="subtitle">Personal Concierge</p>
          </div>
        </div>
        <div className="header-right">
          <span className="status-dot" />
          <span className="status-text">Online</span>
          <button className="clear-btn" onClick={clearChat} title="Clear chat">🗑️</button>
        </div>
      </header>

      {/* Chat */}
      <div className="chat-window">
        <div className="date-divider">Today</div>

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message-wrapper ${msg.isUser ? 'user-wrapper' : 'bot-wrapper'}`}
          >
            {!msg.isUser && <div className="avatar bot-avatar">🤖</div>}

            <div className={`message ${msg.isUser ? 'user' : 'bot'}`}>
              {msg.contextUsed && !msg.isUser && (
                <span className="context-badge">✓ Verified</span>
              )}
              <div className="message-text">
                {msg.text || (loading && idx === messages.length - 1
                  ? <span className="typing"><span /><span /><span /></span>
                  : ''
                )}
              </div>
              {msg.time && <span className="message-time">{msg.time}</span>}
            </div>

            {msg.isUser && <div className="avatar user-avatar">👤</div>}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Hint chips */}
      {/* <div className="hints">
        {HINT_CHIPS.map(chip => (
          <button
            key={chip}
            className="hint-chip"
            onClick={() => sendMessage(chip.replace(/^.+? /, ''))}
            disabled={loading}
          >
            {chip}
          </button>
        ))}
      </div> */}

      {/* Input */}
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about destinations, itineraries, hotels…"
          disabled={loading}
          autoFocus
        />
        <button onClick={handleSend} disabled={loading}>
          {loading ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  );
}

export default App;