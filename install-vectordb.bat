@echo off
echo Installing NLP + Vector Database Dependencies...
echo.

cd rasa\actions
echo [1/2] Installing Python packages...
pip install -r requirements.txt

echo.
echo [2/2] Downloading spaCy language model...
python -m spacy download en_core_web_sm

echo.
echo ✅ NLP + Vector Database Setup Complete!
echo - ChromaDB: Semantic search
echo - spaCy: Advanced NLP
echo - Sentence Transformers: Embeddings
echo.
pause
