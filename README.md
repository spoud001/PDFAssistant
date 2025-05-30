# Smart PDF AI Assistant

This is a full-stack application that allows users to upload a PDF file, enter a natural-language prompt, and receive an AI-generated summary and flash questions.

---

## ✨ Features

- Upload and display PDF files interactively
- Ask questions or give instructions about the PDF using natural language
- AI-generated:
  - Summary of the document
  - Flashcard-style questions and answers
- All pages scrollable in a contained viewer
- Built with React, FastAPI, and Gemini AI

---

## 📦 Technologies Used

- **Frontend**: React (with TypeScript), TailwindCSS, React-PDF
- **Backend**: FastAPI, pdfplumber, Google Generative AI (Gemini API)
- **Other**: pdf.js, CORS, Axios

---

## 🛠 Setup Instructions

### 🔹 1. Clone the Repository

```bash
git clone https://github.com/yourusername/smart-pdf-ai-assistant.git
cd smart-pdf-ai-assistant
```

---

### 🔹 2. Backend Setup

1. Navigate to the backend folder:

```bash
cd backend
```

2. Create a virtual environment (optional but recommended):

```bash
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file and add your Gemini API key:

```
GEMINI_API_KEY=your_google_generative_ai_key
```

5. Run the FastAPI backend:

```bash
uvicorn main:app --reload
```

---

### 🔹 3. Frontend Setup

1. Navigate to the frontend folder:

```bash
cd ../frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

> The app will be available at `http://localhost:3000`

---

## ✅ Usage

1. Upload a PDF file
2. Enter a prompt (e.g., "Summarize this contract and ask me 3 quiz questions")
3. Click **Analyze**
4. Scroll through the PDF and review the summary and flash questions below

---

## 📁 File Structure

```
backend/
│   main.py               # FastAPI app
│   requirements.txt
│   .env
frontend/
│   pages/
│       index.tsx         # React + React-PDF viewer
│   styles/
│       globals.css       # Custom styling
│   package.json
```

---

## 📌 To Do

- [ ] Jump to specific pages
- [ ] Support PDF text search
- [ ] Export summary and questions

---

## 📄 License

This project is licensed under the MIT License.
