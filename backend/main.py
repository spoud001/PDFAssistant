from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pdfplumber
import os
import uuid
from pydantic import BaseModel
import google.generativeai as genai
import re
import json

from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials = True,
    allow_methods=['*'],
    allow_headers=['*'],
)
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-2.0-flash')  # Use gemini-2.0-flash
def extract_json(text: str):
    try:
        match = re.search(r'\{[\s\S]*\}', text)
        if not match:
            print("❌ No JSON block found.")
            return {"summary": "", "questions": []}
        
        parsed = json.loads(match.group())

        # Handle case where questions are returned as a JSON string
        if isinstance(parsed.get("questions"), str):
            try:
                parsed["questions"] = json.loads(parsed["questions"])
            except Exception as e:
                print("⚠️ Failed to parse 'questions' string:", e)
                parsed["questions"] = []

        return parsed

    except Exception as e:
        print("JSON extraction error:", e)
        return {"summary": "", "questions": []}
 
def instruct_gemini_to_rewrite_prompt(user_input: str) ->str:
    prompt =   f"""
                Take the following instruction and rewrite it into a clean, structured prompt that will be used to analyze the text of a PDF.

                    Keep the goal clear, focused, and in one paragraph. Do not include formatting or explanation.

                        User instruction:
                        \"\"\"{user_input}\"\"\"

                    Only return the reworded prompt. Do not return JSON or commentary.
                    """ 
    response = model.generate_content(prompt)
    return response.text.strip()

def make_json_prompt(instruction_prompt: str, json_schema: dict, text: str) -> str:
    schema_str = json.dumps(json_schema, indent=2)
    return f"""{instruction_prompt}

Return only valid JSON in this format:
{schema_str}

Do not return any explanation, markdown, or extra content.

Here is the document:
\"\"\"{text}\"\"\"
"""
def analyze_with_gemini(final_prompt: str):
    response = model.generate_content(final_prompt)
    print("🧠 Gemini Final Output:\n", response.text)
    return extract_json(response.text) or {"error": "Analysis failed"}

@app.post('/upload')

async def upload_file(file: UploadFile = File(...)):
    filename= f"temp_{uuid.uuid4()}.pdf"
    with open(filename, "wb") as f:
        f.write(await file.read())

    with pdfplumber.open(filename) as pdf:
        text = "\n".join(page.extract_text() or "" for page in pdf.pages)

    os.remove(filename)
    return {"content" : text}

class AnalyzeRequest(BaseModel):
    text:str
    user_prompt: str

@app.post("/analyze")
async def analyze(request : AnalyzeRequest):
    print("📩 User prompt:", request.user_prompt)
    structured_prompt = instruct_gemini_to_rewrite_prompt(request.user_prompt)
    print("📄 Structured prompt:", structured_prompt)

    # Step 2: Wrap with JSON format expectations
    json_schema = {"summary": "string",
                   "questions" : [
                       {
                           "question": "string",
                           "answer" :"string"
                       }
                   ]}
    final_prompt = make_json_prompt(structured_prompt, json_schema, request.text)

    # Step 3: Analyze with Gemini
    summary_json = analyze_with_gemini(final_prompt)

    return JSONResponse(content={
        "summary": summary_json.get("summary", ""),
        "questions": summary_json.get("questions", [])
    })


    