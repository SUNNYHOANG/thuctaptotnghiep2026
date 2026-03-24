"""
Đọc PDF, chunk text, tạo embeddings và lưu vào ChromaDB.
Chạy một lần: python ingest.py
"""
import os
import sys
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
import chromadb
from config import PDF_PATH, CHROMA_DIR, COLLECTION_NAME, EMBED_MODEL, CHUNK_SIZE, CHUNK_OVERLAP


def extract_text(pdf_path: str) -> str:
    reader = PdfReader(pdf_path)
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        if text.strip():
            pages.append(f"[Trang {i+1}]\n{text}")
    return "\n\n".join(pages)


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        start += size - overlap
    return [c.strip() for c in chunks if c.strip()]


def ingest(pdf_path: str = PDF_PATH):
    if not os.path.exists(pdf_path):
        print(f"[ERROR] Không tìm thấy file PDF: {pdf_path}")
        sys.exit(1)

    print(f"[1/4] Đọc PDF: {pdf_path}")
    text = extract_text(pdf_path)
    print(f"      Tổng {len(text)} ký tự")

    print(f"[2/4] Chia thành chunks (size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})")
    chunks = chunk_text(text)
    print(f"      Tổng {len(chunks)} chunks")

    print(f"[3/4] Tạo embeddings với model '{EMBED_MODEL}'...")
    model = SentenceTransformer(EMBED_MODEL)
    embeddings = model.encode(chunks, show_progress_bar=True, batch_size=32).tolist()

    print(f"[4/4] Lưu vào ChromaDB tại '{CHROMA_DIR}'")
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    # Xóa collection cũ nếu có để ingest lại
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    collection = client.create_collection(COLLECTION_NAME)
    ids = [f"chunk_{i}" for i in range(len(chunks))]
    collection.add(documents=chunks, embeddings=embeddings, ids=ids)
    print(f"[DONE] Đã lưu {len(chunks)} chunks vào collection '{COLLECTION_NAME}'")


if __name__ == "__main__":
    pdf = sys.argv[1] if len(sys.argv) > 1 else PDF_PATH
    ingest(pdf)
