# Vector Database Integration

## Overview
This Rasa chatbot now uses **ChromaDB** for semantic query understanding, enabling better natural language processing.

## What's Added

### 1. ChromaDB Vector Store
- **File**: `rasa/actions/vector_store.py`
- Stores query patterns as embeddings
- Enables semantic similarity search
- Uses `all-MiniLM-L6-v2` model for embeddings

### 2. Query Types Supported
- **agent_lookup**: Find agents by email, ID, or name
- **field_query**: Get specific fields (email, company, nationality)
- **login_query**: Login history, counts, dates
- **filter_query**: Filter by company or nationality
- **stats_query**: Most/least active agents, statistics

## Installation

Run the installation script:
```bash
install-vectordb.bat
```

Or manually:
```bash
cd rasa\actions
pip install -r requirements.txt
```

## How It Works

1. User sends a query
2. Query is converted to vector embedding
3. ChromaDB finds semantically similar patterns
4. Action handler uses the match to route the query
5. Backend API returns the data

## Benefits

✅ Better understanding of natural language queries
✅ Handles typos and variations
✅ Faster query classification
✅ Persistent storage of query patterns
✅ Easy to extend with new patterns

## Storage

Vector data is stored in: `rasa/actions/chroma_db/`

This directory is automatically created on first run.
