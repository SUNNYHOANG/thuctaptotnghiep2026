"""
Tìm kiếm context từ ChromaDB theo câu hỏi.
"""
import chromadb
from sentence_transformers import SentenceTransformer
from config import CHROMA_DIR, COLLECTION_NAME, EMBED_MODEL, TOP_K

_model = None
_collection = None


def _get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBED_MODEL)
    return _model


def _get_collection():
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path=CHROMA_DIR)
        _collection = client.get_collection(COLLECTION_NAME)
    return _collection


def retrieve(query: str, top_k: int = TOP_K) -> list[str]:
    model = _get_model()
    collection = _get_collection()
    query_embedding = model.encode([query]).tolist()
    results = collection.query(query_embeddings=query_embedding, n_results=top_k)
    return results["documents"][0] if results["documents"] else []
