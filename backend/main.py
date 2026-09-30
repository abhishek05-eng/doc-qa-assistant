from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from pdf_processing import extract_pages
from retrieval import chunk_pages, Retriever

load_dotenv()

app = FastAPI(title="Document Q&A Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store (fine for a portfolio demo)
DOCUMENT = {"name": None, "pages": [], "retriever": None}


class Question(BaseModel):
    question: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Please upload a PDF file.")

    pdf_bytes = await file.read()
    pages = extract_pages(pdf_bytes)

    if not pages:
        raise HTTPException(
            400, "No text found. The PDF may be scanned or image-only."
        )

    chunks = chunk_pages(pages)
    DOCUMENT["name"] = file.filename
    DOCUMENT["pages"] = pages
    DOCUMENT["retriever"] = Retriever(chunks)

    return {
        "filename": file.filename,
        "total_pages": len(pages),
        "total_chunks": len(chunks),
        "preview": pages[0]["text"][:200],
    }


@app.post("/search")
def search(body: Question):
    """Temporary test endpoint: shows which chunks retrieval picks."""
    if DOCUMENT["retriever"] is None:
        raise HTTPException(400, "Upload a PDF first.")
    return DOCUMENT["retriever"].search(body.question)