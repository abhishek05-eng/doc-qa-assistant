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

  function clearChat() {
    setMessages([]);
    setError("");
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="brand">
            <div className="brand-icon">Q</div>
            <div>
              <h1>Document Q&amp;A Assistant</h1>
              <p>Ask questions and get answers directly from your document.</p>
            </div>
          </div>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          <span>AI Ready</span>
        </div>
      </header>

      <main className="workspace">
        <section className="document-card">
          <div className="document-info">
            <div className="pdf-icon">PDF</div>

            <div className="document-text">
              <span className="section-label">CURRENT DOCUMENT</span>

              <h2>
                {doc ? doc.filename : "No document uploaded"}
              </h2>

              <p>
                {doc
                  ? `${doc.total_pages} pages • Ready for questions`
                  : "Upload a PDF to begin"}
              </p>
            </div>
          </div>

          <div className="document-actions">
            <label className="btn primary">
              {doc ? "Change PDF" : "Upload PDF"}

              <input
                type="file"
                accept=".pdf"
                onChange={handleUpload}
                hidden
              />
            </label>

            <button
              className="btn secondary"
              onClick={clearChat}
              disabled={messages.length === 0}
            >
              Clear Chat
            </button>
          </div>
        </section>

        <section className="chat-card">
          <div className="chat-header">
            <div>
              <span className="section-label">CONVERSATION</span>
              <h2>Ask about your document</h2>
            </div>

            {doc && (
              <span className="document-ready">
                Document loaded
              </span>
            )}
          </div>

          <div className="chat">
            {messages.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">?</div>

                <h3>
                  {doc
                    ? "What would you like to know?"
                    : "Upload a PDF to get started"}
                </h3>

                <p>
                  {doc
                    ? "Ask a question about the content of your document."
                    : "Your answers will be generated using only the uploaded document."}
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`message-row ${m.role}`}
              >
                <div className="message-avatar">
                  {m.role === "ai" ? "AI" : "You"}
                </div>

                <div className={`bubble ${m.role}`}>
                  <div className="message-content">
                    {m.role === "ai" ? (
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    ) : (
                      m.text
                    )}
                  </div>

                  {m.sources && m.sources.length > 0 && (
                    <div className="sources">
                      <span className="sources-label">
                        Sources
                      </span>

                      {m.sources.map((p) => (
                        <span key={p} className="chip">
                          Page {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="message-row ai">
                <div className="message-avatar">AI</div>

                <div className="bubble ai">
                  <div className="thinking">
                    <span></span>
                    <span></span>
                    <span></span>
                    <strong>Thinking...</strong>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="error">
              <strong>Something went wrong</strong>
              <span>{error}</span>
            </div>
          )}

          <form className="inputbar" onSubmit={handleAsk}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                doc
                  ? "Ask a question about your document..."
                  : "Upload a PDF first"
              }
              disabled={!doc || loading}
            />

            <button
              className="send-btn"
              type="submit"
              disabled={!doc || loading || !input.trim()}
            >
              Send
            </button>
          </form>

          <p className="privacy-note">
            Answers are generated from the uploaded document only.
          </p>
        </section>
      </main>

      <footer>
        <span>Document Q&amp;A Assistant</span>
        <span>Powered by FastAPI + Gemini</span>
      </footer>
    </div>
  );
}