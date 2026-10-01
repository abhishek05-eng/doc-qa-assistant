\# Document Q\&A Assistant



Upload a PDF and ask questions about it. Answers come only from the document and include page citations.



!\[App screenshot](docs/screenshot.png)



\## Problem



Long documents (reports, handbooks, manuals) are slow to search. Generic chatbots answer from memory and can invent facts. This app answers only from the uploaded file and shows which pages it used.



\## How it works



User → React UI → FastAPI backend → PDF text extraction → chunking → TF-IDF retrieval → Gemini → answer with page citations



1\. \*\*Extract\*\*: PyMuPDF reads the PDF page by page, keeping page numbers.

2\. \*\*Chunk\*\*: each page is split into overlapping \~800-character chunks.

3\. \*\*Retrieve\*\*: TF-IDF scores every chunk against the question and picks the top 4.

4\. \*\*Generate\*\*: only those chunks are sent to Gemini with strict instructions to answer from them and cite pages.

5\. \*\*Refuse\*\*: if nothing relevant is found, the app says it couldn't find the answer instead of guessing.



\## Features



\- PDF upload with document name and page count

\- Chat interface with conversation history

\- Page-number citations on every answer

\- "Couldn't find this in the document" behaviour for off-topic questions

\- Clear chat button



\## Tech stack



React (Vite), FastAPI, PyMuPDF, scikit-learn, Google Gemini API



\## Run it locally



You need Python 3.10+, Node.js 18+ and a free Gemini API key from aistudio.google.com/apikey.



\*\*Backend\*\*



```bash

cd backend

python -m venv venv

venv\\Scripts\\activate

pip install -r requirements.txt

copy .env.example .env

```



Open `.env` and replace `your\_key\_here` with your key, then:



```bash

uvicorn main:app --reload

```



\*\*Frontend\*\* (in a second terminal)



```bash

cd frontend

npm install

npm run dev

```



Open http://localhost:5173



\## What I learned



\- Building a retrieval-augmented generation (RAG) pipeline end to end

\- Why chunking and keeping page metadata matter for citations

\- Prompting an LLM to stay grounded and refuse when evidence is missing

\- Connecting a React front end to a FastAPI back end



\## Future improvements



\- Replace TF-IDF with embeddings for true semantic search

\- Support multiple documents and persistent storage

\- Highlight the exact source passage next to each answer

\- Handle scanned PDFs with OCR

