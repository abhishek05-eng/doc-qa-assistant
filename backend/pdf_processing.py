import fitz  # PyMuPDF


def extract_pages(pdf_bytes: bytes) -> list[dict]:
    """Return a list of {"page": int, "text": str}, one per page."""
    pages = []
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for i, page in enumerate(doc, start=1):
            text = page.get_text().strip()
            if text:  # skip blank or image-only pages
                pages.append({"page": i, "text": text})
    return pages