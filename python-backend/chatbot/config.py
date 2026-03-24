import os

PDF_PATH = os.getenv("PDF_PATH", "../../so-tay-sinh-vien.pdf")
CHROMA_DIR = os.getenv("CHROMA_DIR", "./chroma_db")
COLLECTION_NAME = "sotay_sv"
EMBED_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"  # hỗ trợ tiếng Việt, ~120MB
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:0.5b")  # nhỏ ~400MB, cần ~600MB RAM; đổi sang 7b nếu RAM đủ
CHUNK_SIZE = 500   # ký tự mỗi chunk
CHUNK_OVERLAP = 100
TOP_K = 5          # số chunk lấy làm context
