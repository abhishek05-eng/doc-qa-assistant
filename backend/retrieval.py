import re

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
                chunks.append({
                    "page": p["page"],
                    "text": piece
                })

            start += size - overlap

    return chunks


class Retriever:
    def __init__(self, chunks: list[dict]):
        self.chunks = chunks

        self.vectorizer = TfidfVectorizer(stop_words="english")

        self.matrix = self.vectorizer.fit_transform(
            [c["text"] for c in chunks]
        )

    def search(self, question: str, top_k: int = 8) -> list[dict]:
        q_vec = self.vectorizer.transform([question])
        scores = cosine_similarity(q_vec, self.matrix)[0]

        question_lower = question.lower()

        # Handle questions that ask for multiple numbered projects.
        # Example: "What are the five AI projects mentioned?"
        project_match = re.search(
            r"\b(?:five|5|four|4|three|3|two|2)\b.*\bprojects?\b",
            question_lower
        )

        results = []
        selected_indexes = set()
        selected_pages = set()

        if project_match:
            # Find the strongest chunk for each numbered project.
            for project_number in range(1, 6):
                pattern = re.compile(
                    rf"\bproject\s+{project_number}\b",
                    re.IGNORECASE
                )

                candidates = [
                    i
                    for i, chunk in enumerate(self.chunks)
                    if pattern.search(chunk["text"])
                    and scores[i] > 0
                ]

                if candidates:
                    best_index = max(
                        candidates,
                        key=lambda i: scores[i]
                    )

                    selected_indexes.add(best_index)

                    results.append({
                        **self.chunks[best_index],
                        "score": float(scores[best_index])
                    })

                    selected_pages.add(
                        self.chunks[best_index]["page"]
                    )

        # Add normal TF-IDF results to fill remaining slots.
        best = scores.argsort()[::-1]

        for i in best:
            if scores[i] <= 0:
                continue

            if i in selected_indexes:
                continue

            # Avoid duplicate pages when possible.
            if self.chunks[i]["page"] in selected_pages:
                continue

            results.append({
                **self.chunks[i],
                "score": float(scores[i])
            })

            selected_indexes.add(i)
            selected_pages.add(self.chunks[i]["page"])

            if len(results) >= top_k:
                break

        # Keep the final result count within top_k.
        return results[:top_k]