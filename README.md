# 🌍 AI Travel Chatbot

An intelligent travel assistant powered by AI that helps users plan trips, find destinations, get itinerary suggestions, and discover travel information through natural language conversations.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Services Overview](#services-overview)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **Natural Language Processing**: Understands travel-related queries in conversational language
- **Real-time Streaming Responses**: Get answers as they're generated for a smooth user experience
- **Intent Recognition**: Automatically detects user intent (greetings, travel queries, etc.)
- **Vector Search**: Uses semantic search to find relevant travel information from the knowledge base
- **Context-Aware Responses**: Maintains conversation context for more relevant answers
- **Rate Limiting**: Built-in protection against API abuse
- **Comprehensive Logging**: Winston-based logging for debugging and monitoring
- **Error Handling**: Robust error handling with user-friendly messages
- **Analytics Dashboard**: Track query statistics and system performance
- **SQLite Database**: Stores agent data and analytics locally

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **Ollama** - Local LLM inference (Llama 3.2)
- **Pinecone** - Vector database for semantic search
- **Xenova Transformers** - Text embeddings generation
- **SQLite3** - Local database for agent data
- **Winston** - Logging framework
- **Express Rate Limit** - API rate limiting

### Frontend
- **React 19** - UI framework
- **CSS3** - Custom styling
- **Fetch API** - HTTP client for streaming responses

## 🏗 Architecture

```
┌─────────────┐
│   Frontend  │ (React)
│   (Port     │
│    3000)    │
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────┐
│   Backend   │ (Express.js)
│   (Port     │
│    5000)    │
└──────┬──────┘
       │
       ├──► Ollama (Local LLM - Port 11434)
       │
       ├──► Pinecone (Vector DB - Cloud)
       │
       └──► SQLite (Local DB)
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Ollama** - [Download](https://ollama.ai/)
- **Pinecone Account** - [Sign up](https://www.pinecone.io/)

### Install Ollama and Model

1. Install Ollama from [ollama.ai](https://ollama.ai/)
2. Pull the required model:
   ```bash
   ollama pull llama3.2:1b
   ```
3. Verify Ollama is running:
   ```bash
   ollama list
   ```

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai_chatbot-botSupriya
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## ⚙️ Configuration

### Backend Configuration

1. Navigate to the `backend` directory
2. Create a `.env` file (or modify the existing one):

```env
# Server Configuration
PORT=5000

# LLM Configuration - Ollama (Local)
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3.2:1b

# LLM Timeout and Retries
LLM_TIMEOUT=15000
LLM_MAX_RETRIES=1

# Cache Configuration
CACHE_TTL=300000

# Pinecone Configuration (Add these)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name
PINECONE_ENVIRONMENT=your_environment

# Optional: Fallback LLM (if Ollama fails)
# FALLBACK_LLM_URL=
# FALLBACK_LLM_TYPE=vllm
# FALLBACK_MODEL=meta-llama/Llama-2-7b-chat-hf
```

### Frontend Configuration

The frontend is configured to connect to `http://localhost:5000` by default. If you change the backend port, update the `API_URL` in `frontend/src/App.js`:

```javascript
const API_URL = 'http://localhost:5000/api/ask';
```

## 🎯 Running the Application

### Option 1: Run Both Services Separately

#### Terminal 1 - Backend
```bash
cd backend
npm start
# For development with auto-reload:
# npm run dev
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm start
```

The application will open automatically at `http://localhost:3000`

### Option 2: Production Build

#### Build Frontend
```bash
cd frontend
npm run build
```

#### Serve Frontend from Backend
Configure Express to serve the built frontend files.

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### 1. Ask Question
**POST** `/api/ask`

Send a travel-related question and receive a streaming response.

**Request Body:**
```json
{
  "question": "What are the best places to visit in Bali?"
}
```

**Response:**
- Content-Type: `text/plain; charset=utf-8`
- Streaming response with AI-generated answer

**Example:**
```bash
curl -X POST http://localhost:5000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Best time to visit Japan?"}'
```

#### 2. Get Statistics
**GET** `/api/stats`

Retrieve system statistics and analytics.

**Response:**
```json
{
  "totalQueries": 150,
  "avgResponseTime": 2.5,
  "topIntents": ["travel_query", "greeting"],
  "successRate": 98.5
}
```

## 📁 Project Structure

```
ai_chatbot-botSupriya/
│
├── backend/
│   ├── config/
│   │   └── logger.js              # Winston logger configuration
│   ├── controllers/
│   │   ├── queryController.js     # Handles query requests
│   │   └── statsController.js     # Analytics endpoints
│   ├── data/
│   │   ├── agentData.json         # Agent knowledge base
│   │   ├── agentLoginData.json    # Agent credentials
│   │   └── agents.db              # SQLite database
│   ├── logs/
│   │   ├── combined.log           # All logs
│   │   └── error.log              # Error logs only
│   ├── middleware/
│   │   └── errorHandler.js        # Error handling middleware
│   ├── routes/
│   │   └── api.js                 # API route definitions
│   ├── scripts/
│   │   ├── generateData.js        # Data generation utilities
│   │   └── migrateData.js         # Database migration scripts
│   ├── services/
│   │   ├── databaseService.js     # SQLite operations
│   │   ├── intentService.js       # Intent classification
│   │   ├── llmService.js          # LLM communication
│   │   ├── promptService.js       # Prompt engineering
│   │   └── vectorService.js       # Vector search operations
│   ├── utils/
│   │   ├── answerExtractor.js     # Response parsing
│   │   └── errors.js              # Custom error classes
│   ├── .env                       # Environment variables
│   ├── package.json
│   └── server.js                  # Entry point
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── ...
│   ├── src/
│   │   ├── App.js                 # Main React component
│   │   ├── App.css                # Component styles
│   │   ├── index.js               # React entry point
│   │   └── index.css              # Global styles
│   └── package.json
│
└── README.md
```

## 🔧 Services Overview

### 1. LLM Service (`llmService.js`)
- Communicates with Ollama for text generation
- Handles streaming responses
- Implements retry logic and timeout handling

### 2. Vector Service (`vectorService.js`)
- Manages Pinecone vector database connections
- Generates embeddings using Xenova Transformers
- Performs semantic search for relevant context

### 3. Intent Service (`intentService.js`)
- Classifies user queries into intents (greeting, travel_query, etc.)
- Routes queries to appropriate handlers

### 4. Database Service (`databaseService.js`)
- Manages SQLite database operations
- Stores and retrieves agent data
- Pre-computes analytics for performance

### 5. Prompt Service (`promptService.js`)
- Constructs prompts for the LLM
- Injects context from vector search
- Maintains conversation flow

## 🐛 Troubleshooting

### Common Issues

#### 1. Ollama Connection Error
**Error:** `Cannot connect to Ollama`

**Solution:**
- Ensure Ollama is running: `ollama serve`
- Verify the model is installed: `ollama list`
- Check the OLLAMA_URL in `.env`

#### 2. Pinecone Connection Error
**Error:** `Pinecone initialization failed`

**Solution:**
- Verify your Pinecone API key
- Check if the index exists in your Pinecone dashboard
- Ensure the environment name is correct

#### 3. Port Already in Use
**Error:** `Port 5000 is already in use`

**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Change port in .env
PORT=5001
```

#### 4. Frontend Cannot Connect to Backend
**Error:** `Failed to fetch`

**Solution:**
- Ensure backend is running on port 5000
- Check CORS configuration in `server.js`
- Verify API_URL in `App.js`

#### 5. Slow Response Times
**Solution:**
- Use a smaller/faster model (e.g., `llama3.2:1b`)
- Increase LLM_TIMEOUT in `.env`
- Check system resources (CPU/RAM)

## 📊 Performance Optimization

- **Caching**: Responses are cached for 5 minutes (configurable via CACHE_TTL)
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Pre-computed Analytics**: Database analytics are computed on startup
- **Streaming**: Responses stream in real-time for better UX

## 🔒 Security Features

- Input validation using express-validator
- Rate limiting to prevent abuse
- Error messages don't expose internal details
- Environment variables for sensitive data
- CORS configuration for frontend access

## 🧪 Testing

### Automated Query Testing

We've created a comprehensive test suite to verify query handling:

```bash
# Run all 39 test queries
cd backend
node test-queries.js
```

**Test Coverage:** 100% (39/39 queries passing)

See [TEST_RESULTS.md](TEST_RESULTS.md) for detailed test results and [TESTING_GUIDE.md](TESTING_GUIDE.md) for testing instructions.

### Manual Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📈 Monitoring

Logs are stored in `backend/logs/`:
- `combined.log` - All application logs
- `error.log` - Error logs only

Monitor logs in real-time:
```bash
# Windows
type backend\logs\combined.log

# Or use a log viewer
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

- **Supriya** - Initial work

## 🙏 Acknowledgments

- Ollama for local LLM inference
- Pinecone for vector database
- Xenova for transformer models
- React team for the amazing framework

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review logs in `backend/logs/`

---

**Happy Traveling! ✈️🌍**
