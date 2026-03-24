from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os, shutil

from retriever import retrieve
from llm import ask_ollama, check_ollama
from config import PDF_PATH, CHROMA_DIR, COLLECTION_NAME

app = FastAPI(title="Chatbot Sổ tay sinh viên")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    question: str
    history: list[dict] = []  # [{"role": "user"|"assistant", "content": "..."}]


class ChatResponse(BaseModel):
    answer: str
    sources: list[str] = []


def _is_ingested() -> bool:
    import chromadb
    try:
        client = chromadb.PersistentClient(path=CHROMA_DIR)
        col = client.get_collection(COLLECTION_NAME)
        return col.count() > 0
    except Exception:
        return False


@app.get("/health")
async def health():
    ollama = await check_ollama()
    return {
        "status": "ok",
        "ingested": _is_ingested(),
        "ollama": ollama,
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Câu hỏi không được để trống")

    if not _is_ingested():
        raise HTTPException(
            status_code=503,
            detail="Dữ liệu chưa được nạp. Vui lòng chạy ingest trước."
        )

    # Tìm context liên quan
    chunks = retrieve(req.question)
    if not chunks:
        return ChatResponse(answer="Tôi không tìm thấy thông tin liên quan trong Sổ tay sinh viên.", sources=[])

    # Gọi LLM
    try:
        answer = await ask_ollama(req.question, chunks)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Lỗi kết nối Ollama: {str(e)}")

    return ChatResponse(answer=answer, sources=chunks[:2])


@app.post("/ingest")
async def ingest_pdf(file: UploadFile = File(None)):
    """Upload PDF mới và ingest lại. Nếu không upload thì dùng file mặc định."""
    from ingest import ingest
    if file:
        tmp_path = f"/tmp/{file.filename}"
        with open(tmp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        ingest(tmp_path)
        os.remove(tmp_path)
    else:
        if not os.path.exists(PDF_PATH):
            raise HTTPException(status_code=404, detail=f"Không tìm thấy file PDF tại {PDF_PATH}")
        ingest(PDF_PATH)
    return {"status": "ok", "message": "Ingest thành công"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5001, reload=True)
