# Chatbot Sổ tay sinh viên

RAG chatbot đọc file PDF và trả lời câu hỏi bằng Ollama (local LLM).

## Yêu cầu

- Python 3.10+
- [Ollama](https://ollama.com) đã cài và đang chạy

## Setup

```bash
# 1. Cài dependencies
cd python-backend/chatbot
pip install -r requirements.txt

# 2. Cài Ollama model (chọn 1)
ollama pull llama3.2          # tiếng Anh tốt, ~2GB
ollama pull qwen2.5:7b        # tiếng Việt tốt hơn, ~4.7GB

# 3. Nạp dữ liệu PDF (chạy 1 lần, hoặc khi đổi PDF)
python ingest.py ../../so-tay-sinh-vien.pdf

# 4. Chạy API server
python main.py
# → http://localhost:5001
```

## Đổi model

Sửa `OLLAMA_MODEL` trong `config.py` hoặc set env:
```bash
OLLAMA_MODEL=qwen2.5:7b python main.py
```

## API

- `GET /health` — kiểm tra trạng thái
- `POST /chat` — `{ "question": "..." }` → `{ "answer": "...", "sources": [...] }`
- `POST /ingest` — upload PDF mới để ingest lại
