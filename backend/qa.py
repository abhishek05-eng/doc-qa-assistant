import os
from google import genai
from google.genai import types

# Current Flash model
MODEL = "gemini-3.5-flash"

SYSTEM_PROMPT = """You are a document Q&A assistant.
Answer the user's question using ONLY the document excerpts provided.
Each excerpt is labelled with its page number, like [Page 7].
Rules:
- After each fact, cite the page it came from, like (Page 7).
- If the excerpts do not contain the answer, reply exactly:
  "I couldn't find this in the document."
- Never use outside knowledge and never guess.
- Keep answers clear and concise."""


def answer_question(question: str, chunks: list[dict]) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_key_here":
        raise RuntimeError("GEMINI_API_KEY is not set in backend/.env")

    client = genai.Client(api_key=api_key)

    context = "\n\n".join(f"[Page {c['page']}]\n{c['text']}" for c in chunks)
    user_message = f"Document excerpts:\n\n{context}\n\nQuestion: {question}"

    response = client.models.generate_content(
        model=MODEL,
        contents=user_message,
        config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
    )
    return response.text