"""
Gọi Ollama để sinh câu trả lời từ context + câu hỏi.
"""
import httpx
from config import OLLAMA_URL, OLLAMA_MODEL

SYSTEM_PROMPT = """Bạn là trợ lý tư vấn sinh viên của trường đại học.
Bạn chỉ trả lời dựa trên nội dung Sổ tay sinh viên được cung cấp.
Nếu thông tin không có trong tài liệu, hãy nói rõ "Tôi không tìm thấy thông tin này trong Sổ tay sinh viên."
Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng."""


async def ask_ollama(question: str, context_chunks: list[str]) -> str:
    context = "\n\n---\n\n".join(context_chunks)
    user_message = f"""Dựa vào nội dung Sổ tay sinh viên sau đây:

{context}

Hãy trả lời câu hỏi: {question}"""

    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        "stream": False,
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["message"]["content"]


async def check_ollama() -> dict:
    """Kiểm tra Ollama có đang chạy không và model có sẵn không."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{OLLAMA_URL}/api/tags")
            models = [m["name"] for m in resp.json().get("models", [])]
            return {"ok": True, "models": models, "current": OLLAMA_MODEL}
    except Exception as e:
        return {"ok": False, "error": str(e)}
