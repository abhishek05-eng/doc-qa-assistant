import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getCitedPages(answer) {
  const matches = [
    ...answer.matchAll(/\bPage\s+(\d+)\b/gi),
  ];

  return [...new Set(matches.map((match) => Number(match[1])))];
}

export default function App() {
  const [doc, setDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleUpload(e) {
    const file = e.target.files[0];

    if (!file) return;

    setError("");
    setLoading(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${API}/upload`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      setDoc({
        filename: data.filename,
        total_pages: data.total_pages,
      });

      setMessages([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  async function handleAsk(e) {
    e.preventDefault();

    const question = input.trim();

    if (!question || !doc || loading) return;

    setInput("");
    setError("");

    setMessages((m) => [
      ...m,
      {
        role: "user",
        text: question,
      },
    ]);

    setLoading(true);

    try {
      const res = await fetch(`${API}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Request failed");
      }

      // Show only the pages cited in the final AI answer.
      const citedPages = getCitedPages(data.answer);

      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: data.answer,
          sources: citedPages,
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Document Q&amp;A Assistant</h1>

        <p>
          Upload a PDF and ask questions. Answers come only from the document.
        </p>
      </header>

      <div className="toolbar">
        <label className="btn">
          Upload PDF

          <input
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            hidden
          />
        </label>

        <span className="docname">
          {doc
            ? `${doc.filename} (${doc.total_pages} pages)`
            : "No document uploaded"}
        </span>

        <button
          className="btn secondary"
          onClick={() => setMessages([])}
          disabled={messages.length === 0}
        >
          Clear chat
        </button>
      </div>

      <div className="chat">
        {messages.length === 0 && (
          <p className="hint">
            {doc
              ? "Ask a question about your document."
              : "Upload a PDF to start."}
          </p>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <div>
              {m.role === "ai" ? (
                <ReactMarkdown>{m.text}</ReactMarkdown>
              ) : (
                m.text
              )}
            </div>

            {m.sources && m.sources.length > 0 && (
              <div className="sources">
                Sources:{" "}

                {m.sources.map((p) => (
                  <span key={p} className="chip">
                    Page {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="bubble ai">
            Thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <form className="inputbar" onSubmit={handleAsk}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            doc ? "Ask a question..." : "Upload a PDF first"
          }
          disabled={!doc}
        />

        <button
          className="btn"
          type="submit"
          disabled={!doc || loading}
        >
          Send
        </button>
      </form>
    </div>
  );
}