import { useState } from "react";
import axios from "axios";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import '../index.css';


pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

type QA = {
  question: string;
  answer: string;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [messages, setMessages] = useState<{ type: "user" | "ai"; content: string }[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [qaPairs, setQaPairs] = useState<QA[]>([]);
  const [loading, setLoading] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);

  const handleUploadAndAnalyze = async () => {
    if (!file || !userPrompt.trim()) return;
    setLoading(true);
    setMessages([...messages, { type: "user", content: userPrompt }]);
    setQaPairs([]);
    setSummary(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await axios.post("http://localhost:8000/upload", formData);
      const textContent = uploadRes.data.content;

      const analysisRes = await axios.post("http://localhost:8000/analyze", {
        text: textContent,
        user_prompt: userPrompt,
      });

      if (analysisRes.data.summary) {
        setSummary(analysisRes.data.summary);
        setMessages((prev) => [...prev, { type: "ai", content: analysisRes.data.summary }]);
      }

      if (analysisRes.data.questions?.length) {
        setQaPairs(analysisRes.data.questions);
      }
    } catch (error) {
      console.error("Error during analysis:", error);
    } finally {
      setLoading(false);
      setUserPrompt("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <div className="max-w-7xl mx-auto p-6 flex flex-col lg:flex-row gap-6">
        {/* Left Side: Interaction */}
        <div className="flex-1 space-y-6">
          <header>
            <h1 className="text-4xl font-extrabold text-blue-700 mb-2 flex items-center gap-2">
              🤖 Smart PDF AI Assistant
            </h1>
            <p className="text-gray-600">Upload a PDF and interact with it using AI.</p>
          </header>

          <div className="space-y-4">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0] || null;
                setFile(selectedFile);
                if (selectedFile?.type === "application/pdf") {
                  const blobUrl = URL.createObjectURL(selectedFile);
                  setPdfUrl(blobUrl);
                }
              }}
              className="block w-full px-4 py-2 border border-gray-300 rounded shadow-sm bg-white"
            />

            {/* Summary */}
            {summary && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded shadow">
                <h2 className="font-semibold text-blue-700 mb-2 text-lg">📌 Summary</h2>
                <p className="whitespace-pre-wrap text-gray-800">{summary}</p>
              </div>
            )}

            {/* Flashcards */}
            {qaPairs.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-purple-700 mb-3">🧠 Flashcard Questions:</h2>
                <ul className="space-y-3">
                  {qaPairs.map((qa, idx) => (
                    <li key={idx} className="bg-white p-4 rounded shadow border border-gray-200">
                      <p className="text-blue-800 font-semibold">Q: {qa.question}</p>
                      <p className="text-gray-800 mt-1">A: {qa.answer}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Chat Bubbles */}
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[75%] px-4 py-2 rounded-xl ${
                    msg.type === "user"
                      ? "bg-blue-600 text-white self-end ml-auto"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask something about the PDF..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUploadAndAnalyze();
                }}
              />
              <button
                onClick={handleUploadAndAnalyze}
                className="bg-blue-600 text-white px-4 py-2 rounded-full shadow hover:bg-blue-700 transition"
                disabled={loading}
              >
                {loading ? "Analyzing..." : "Send"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: PDF Preview */}
        <div className="w-full lg:w-[40%] h-[80vh] overflow-y-auto bg-white border border-gray-200 rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">📄 PDF Preview</h2>
          {pdfUrl ? (
            <Document
              file={pdfUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onLoadError={(err) => console.error("PDF load error:", err.message)}
            >
              {Array.from({ length: numPages }, (_, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  renderTextLayer={false}
                  renderAnnotationLayer={true}
                />
              ))}
            </Document>
          ) : (
            <p className="text-gray-500">No PDF loaded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
