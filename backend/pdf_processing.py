import re
import fitz  # PyMuPDF


def extract_pages(pdf_bytes: bytes) -> list[dict]:
    """Return cleaned page text while removing repeated PDF header/footer text."""
    raw_pages = []

    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for i, page in enumerate(doc, start=1):
            text = page.get_text().strip()

            if text:
                raw_pages.append({
                    "page": i,
                    "text": text
                })

    # Count how often each line appears across the document.
    line_counts = {}

    for page in raw_pages:
        lines = [line.strip() for line in page["text"].splitlines() if line.strip()]

        for line in lines:
            line_counts[line] = line_counts.get(line, 0) + 1

    total_pages = len(raw_pages)

    pages = []

    for page in raw_pages:
        lines = []

        for line in page["text"].splitlines():
            line = line.strip()

            if not line:
                continue

            # Remove repeated document title/header text.
            if line == "AI projects" and line_counts.get(line, 0) >= total_pages / 2:
                continue

            # Remove repeated Google Docs URL.
            if line.startswith("https://docs.google.com/"):
                continue

            # Remove repeated exported date/time line.
            if re.match(r"^\d{1,2}/\d{1,2}/\d{2},\s*\d{1,2}:\d{2}\s*(AM|PM)$", line):
                continue

            # Remove PDF page-number markers such as 6/18 or 18/18.
            if re.match(r"^\d+/\d+$", line):
                continue

            lines.append(line)

        cleaned_text = "\n".join(lines).strip()

        if cleaned_text:
            pages.append({
                "page": page["page"],
                "text": cleaned_text
            })

    return pages