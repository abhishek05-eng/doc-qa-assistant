from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def chunk_pages(pages: list[dict], size: int = 800, overlap: int = 150) -> list[dict]:
    """Split each page into overlapping chunks, keeping the page number."""
    chunks = []
    for p in pages:
        text = p["text"]
        start = 0
        while start < len(text):
            piece = text[start:start + size].strip()
            if piece:
                chunks.append({"page": p["page"], "text": piece})
            start += size - overlap
    return chunks


class Retriever:
    def __init__(self, chunks: list[dict]):
        self.chunks = chunks
        self.vectorizer = TfidfVectorizer(stop_words="english")
        self.matrix = self.vectorizer.fit_transform([c["text"] for c in chunks])

    def search(self, question: str, top_k: int = 4) -> list[dict]:
        q_vec = self.vectorizer.transform([question])
        scores = cosine_similarity(q_vec, self.matrix)[0]
        best = scores.argsort()[::-1][:top_k]
        return [
            {**self.chunks[i], "score": float(scores[i])}
            for i in best
            if scores[i] > 0
        ]