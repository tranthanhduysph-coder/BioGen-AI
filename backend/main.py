import json
import os
import re
from typing import Any, Literal

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from google import genai
except Exception:
    genai = None

try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth
except Exception:
    firebase_admin = None
    firebase_auth = None

APP_ENV = os.getenv('APP_ENV', 'development')
FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID', 'biogen-ai').strip()
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '').strip()
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash').strip()
CORS_ORIGINS = [
    item.strip()
    for item in os.getenv(
        'CORS_ORIGINS',
        'https://biogenai-blueprint-preview.onrender.com,https://biogenai.onrender.com',
    ).split(',')
    if item.strip()
]

app = FastAPI(
    title='BioGen AI API',
    version='0.1.0',
    docs_url='/docs' if APP_ENV != 'production' else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=['GET', 'POST', 'OPTIONS'],
    allow_headers=['Content-Type', 'Authorization'],
)

if firebase_admin is not None:
    try:
        if not firebase_admin._apps:
            firebase_admin.initialize_app(options={'projectId': FIREBASE_PROJECT_ID})
    except Exception:
        firebase_admin = None
        firebase_auth = None

def require_firebase_user(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    if firebase_auth is None:
        raise HTTPException(status_code=503, detail='Firebase token verification is unavailable.')

    if not authorization or not authorization.lower().startswith('bearer '):
        raise HTTPException(status_code=401, detail='Firebase ID token is required.')

    token = authorization.split(' ', 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail='Firebase ID token is required.')

    try:
        decoded = firebase_auth.verify_id_token(token, check_revoked=False)
    except Exception:
        raise HTTPException(status_code=401, detail='Invalid or expired Firebase ID token.')

    if decoded.get('aud') != FIREBASE_PROJECT_ID:
        raise HTTPException(status_code=401, detail='Firebase token project mismatch.')

    return decoded

class SimpleSlot(BaseModel):
    id: str
    part: Literal['mcq', 'short']
    order: int
    maxScore: float = 0
    contentId: str
    contentLabel: str
    competencyCode: str
    outcomeId: str
    outcomeText: str
    level: Literal['know', 'understand', 'apply']

class TfStatementSlot(BaseModel):
    id: str
    statementOrder: Literal[1, 2, 3, 4]
    contentId: str
    contentLabel: str
    competencyCode: str
    outcomeId: str
    outcomeText: str
    level: Literal['know', 'understand', 'apply']

class TfSlot(BaseModel):
    id: str
    part: Literal['tf']
    order: int
    maxScore: float = 0
    statements: list[TfStatementSlot] = Field(min_length=4, max_length=4)
    scoring: dict[str, float] = Field(default_factory=dict)

class GenerateItemRequest(BaseModel):
    slot: dict[str, Any]
    lang: str = 'vi'

class ManualGenerateRequest(BaseModel):
    prompt: str = Field(min_length=20, max_length=16000)
    expectedCount: int = Field(ge=1, le=40)
    lang: str = 'vi'

class GeneratedQuestion(BaseModel):
    question: str
    type: str
    options: list[str]
    answer: str
    explanation: str

class GeneratedExamItem(BaseModel):
    slotId: str
    part: Literal['mcq', 'tf', 'short']
    order: int
    question: GeneratedQuestion

LEVEL_LABELS = {
    'know': {'vi': 'Biết', 'en': 'Know'},
    'understand': {'vi': 'Hiểu', 'en': 'Understand'},
    'apply': {'vi': 'Vận dụng', 'en': 'Apply'},
}

@app.get('/health')
def health():
    return {
        'ok': True,
        'service': 'biogenai-api',
        'environment': APP_ENV,
        'aiConfigured': bool(GEMINI_API_KEY),
        'authRequired': True,
        'firebaseProjectId': FIREBASE_PROJECT_ID,
        'model': GEMINI_MODEL,
    }

def _client():
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail='GEMINI_API_KEY is not configured on the BioGen backend.')
    if genai is None:
        raise HTTPException(status_code=500, detail='google-genai is unavailable.')
    return genai.Client(api_key=GEMINI_API_KEY)

def _mcq_prompt(slot: SimpleSlot, lang: str) -> str:
    if lang == 'en':
        return f'''You are an expert Biology teacher. Create ONE multiple-choice question.
Content: {slot.contentLabel}
Competency: {slot.competencyCode}
Learning outcome: {slot.outcomeText}
Cognitive level: {LEVEL_LABELS[slot.level]['en']}

Requirements:
- Exactly 4 options A-D.
- Exactly 1 correct answer.
- Match the learning outcome and requested cognitive level.
- Do not mention matrix, slot, competency code, or cognitive label.
- Scientifically accurate Biology.
- Return ONLY valid JSON with keys question,type,options,answer,explanation.'''
    return f'''Bạn là chuyên gia soạn đề Sinh học. Tạo ĐÚNG MỘT câu trắc nghiệm nhiều lựa chọn.
Nội dung: {slot.contentLabel}
Năng lực: {slot.competencyCode}
Yêu cầu cần đạt: {slot.outcomeText}
Mức độ: {LEVEL_LABELS[slot.level]['vi']}

Yêu cầu:
- Đúng 4 phương án A-D.
- Chỉ 1 phương án đúng.
- Bám đúng YCCĐ và mức độ.
- Không nhắc ma trận, slot, mã năng lực hay tên mức độ.
- Nội dung Sinh học chính xác.
- Chỉ trả về JSON hợp lệ với các khóa question,type,options,answer,explanation.'''

def _short_prompt(slot: SimpleSlot, lang: str) -> str:
    if lang == 'en':
        return f'''Create ONE numeric short-response Biology question.
Content: {slot.contentLabel}
Competency: {slot.competencyCode}
Learning outcome: {slot.outcomeText}
Cognitive level: {LEVEL_LABELS[slot.level]['en']}
- Final answer is one number only.
- Maximum 4 characters including minus sign or decimal separator.
- No choices.
- Return ONLY valid JSON with keys question,type,options,answer,explanation.'''
    return f'''Tạo ĐÚNG MỘT câu trả lời ngắn bằng số.
Nội dung: {slot.contentLabel}
Năng lực: {slot.competencyCode}
Yêu cầu cần đạt: {slot.outcomeText}
Mức độ: {LEVEL_LABELS[slot.level]['vi']}
- Đáp án cuối cùng là một số duy nhất.
- Chuỗi đáp án tối đa 4 ký tự, tính cả dấu âm hoặc dấu thập phân.
- Không có phương án lựa chọn.
- Chỉ trả về JSON hợp lệ với các khóa question,type,options,answer,explanation.'''

def _tf_prompt(slot: TfSlot, lang: str) -> str:
    specs = []
    for statement in slot.statements:
        letter = chr(96 + statement.statementOrder)
        level = LEVEL_LABELS[statement.level]['en' if lang == 'en' else 'vi']
        specs.append(f'{letter}) {level}: {statement.outcomeText}')
    spec_text = '\n'.join(specs)
    content = slot.statements[0].contentLabel if slot.statements else 'Biology'
    if lang == 'en':
        return f'''Create ONE True/False cluster with EXACTLY four statements.
Shared content: {content}
Follow these four specifications in order:
{spec_text}
- One coherent shared stem/context in question.
- Exactly four options a), b), c), d).
- Each statement matches its own outcome and level.
- Use a meaningful mix of true and false statements.
- Return ONLY valid JSON with keys question,type,options,answer,explanation.'''
    return f'''Tạo ĐÚNG MỘT câu Đúng/Sai gồm CHÍNH XÁC 4 ý.
Nội dung chung: {content}
Bốn ý lần lượt bám đúng đặc tả:
{spec_text}
- Một đoạn dẫn/ngữ cảnh chung trong question.
- Đúng bốn ý a), b), c), d).
- Mỗi ý đúng YCCĐ và mức độ riêng.
- Pha trộn hợp lí mệnh đề đúng và sai.
- Chỉ trả về JSON hợp lệ với các khóa question,type,options,answer,explanation.'''

def _extract_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    data = json.loads(cleaned)
    if not isinstance(data, dict):
        raise ValueError('AI response must be one JSON object.')
    return data

def _validate_and_normalize(data: dict[str, Any], part: str) -> GeneratedQuestion:
    question = str(data.get('question', '')).strip()
    answer = str(data.get('answer', '')).strip()
    explanation = str(data.get('explanation', '')).strip()
    options = [str(x).strip() for x in data.get('options', [])] if isinstance(data.get('options', []), list) else []
    if not question or not answer or not explanation:
        raise ValueError('Missing question, answer, or explanation.')
    if part == 'mcq':
        if len(options) != 4:
            raise ValueError('MCQ must contain exactly four options.')
        normalized = []
        for index, option in enumerate(options):
            letter = chr(65 + index)
            clean = re.sub(r'^\s*[A-D][\.)]\s*', '', option, flags=re.I).strip()
            normalized.append(f'{letter}. {clean}')
        options = normalized
        if not re.match(r'^[A-D]', answer, flags=re.I):
            raise ValueError('MCQ answer must begin with A/B/C/D.')
        qtype = 'Multiple choices'
    elif part == 'tf':
        if len(options) != 4:
            raise ValueError('True/False must contain exactly four statements.')
        normalized = []
        for index, option in enumerate(options):
            letter = chr(97 + index)
            clean = re.sub(r'^\s*[a-d][\.)]\s*', '', option, flags=re.I).strip()
            normalized.append(f'{letter}) {clean}')
        options = normalized
        lower = answer.lower()
        for letter in ('a', 'b', 'c', 'd'):
            if not re.search(rf'\b{letter}\s*[\)\.:\-]', lower):
                raise ValueError('True/False answer must include a, b, c, d.')
        qtype = 'True/ False'
    else:
        options = []
        clean_answer = re.sub(r'^\s*A\.\s*', '', answer, flags=re.I).strip().replace(',', '.')
        if not re.match(r'^-?\d+(?:\.\d+)?$', clean_answer):
            raise ValueError('Short response answer must be numeric.')
        if len(clean_answer.replace('.', ',')) > 4:
            raise ValueError('Short response answer must be at most four characters.')
        answer = clean_answer
        qtype = 'Short response'
    return GeneratedQuestion(question=question, type=qtype, options=options, answer=answer, explanation=explanation)

def _generate(slot, lang: str) -> GeneratedExamItem:
    client = _client()
    if isinstance(slot, TfSlot):
        prompt = _tf_prompt(slot, lang)
        part = 'tf'
    elif slot.part == 'mcq':
        prompt = _mcq_prompt(slot, lang)
        part = 'mcq'
    else:
        prompt = _short_prompt(slot, lang)
        part = 'short'
    last_error = None
    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt + ('\nIMPORTANT: Fix structural errors and follow the JSON schema exactly.' if attempt else ''),
                config={'response_mime_type': 'application/json'},
            )
            data = _extract_json(response.text or '')
            question = _validate_and_normalize(data, part)
            return GeneratedExamItem(slotId=slot.id, part=part, order=slot.order, question=question)
        except HTTPException:
            raise
        except Exception as exc:
            last_error = exc
    raise HTTPException(status_code=502, detail=f'AI generation failed after validation: {last_error}')

def _validate_manual_question(data: dict[str, Any]) -> dict[str, Any]:
    question = str(data.get('question', '')).strip()
    qtype = str(data.get('type', '')).strip()
    answer = str(data.get('answer', '')).strip()
    explanation = str(data.get('explanation', '')).strip()
    options = data.get('options', [])

    if not question or not answer or not explanation:
        raise ValueError('Manual question is missing required fields.')

    if qtype not in ('Multiple choices', 'True/ False', 'Short response', 'Free answer'):
        raise ValueError('Unsupported question type.')

    if not isinstance(options, list):
        raise ValueError('Question options must be an array.')

    options = [str(item).strip() for item in options]

    if qtype == 'Multiple choices' and len(options) != 4:
        raise ValueError('Multiple-choice question must contain exactly four options.')

    if qtype == 'True/ False' and len(options) != 4:
        raise ValueError('True/False question must contain exactly four statements.')

    if qtype == 'Short response':
        options = []
        clean_answer = re.sub(r'^\s*A\.\s*', '', answer, flags=re.I).strip()
        if not re.match(r'^-?\d+(?:[\.,]\d+)?    payload: GenerateItemRequest,
    user: dict[str, Any] = Depends(require_firebase_user),
):
    part = payload.slot.get('part')
    try:
        if part == 'tf':
            slot = TfSlot.model_validate(payload.slot)
        elif part in ('mcq', 'short'):
            slot = SimpleSlot.model_validate(payload.slot)
        else:
            raise ValueError('Unsupported slot part.')
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f'Invalid exam slot: {exc}') from exc
    return _generate(slot, payload.lang)
, clean_answer):
            raise ValueError('Short-response answer must be numeric.')
        answer = clean_answer

    return {
        'question': question,
        'type': qtype,
        'options': options,
        'answer': answer,
        'explanation': explanation,
    }

@app.post('/api/questions/generate-manual')
def generate_manual_questions(
    payload: ManualGenerateRequest,
    user: dict[str, Any] = Depends(require_firebase_user),
):
    client = _client()
    last_error = None

    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=payload.prompt + (
                    '\nIMPORTANT: Return the exact requested number of questions and valid JSON only.'
                    if attempt
                    else ''
                ),
                config={'response_mime_type': 'application/json'},
            )
            data = json.loads((response.text or '').strip())
            if not isinstance(data, list):
                raise ValueError('AI response must be a JSON array.')
            if len(data) != payload.expectedCount:
                raise ValueError(
                    f'Expected {payload.expectedCount} questions, received {len(data)}.'
                )
            return [_validate_manual_question(item) for item in data]
        except HTTPException:
            raise
        except Exception as exc:
            last_error = exc

    raise HTTPException(
        status_code=502,
        detail=f'Manual AI generation failed after validation: {last_error}',
    )

@app.post('/api/exam/generate-item', response_model=GeneratedExamItem)
def generate_item(
    payload: GenerateItemRequest,
    user: dict[str, Any] = Depends(require_firebase_user),
):
    part = payload.slot.get('part')
    try:
        if part == 'tf':
            slot = TfSlot.model_validate(payload.slot)
        elif part in ('mcq', 'short'):
            slot = SimpleSlot.model_validate(payload.slot)
        else:
            raise ValueError('Unsupported slot part.')
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f'Invalid exam slot: {exc}') from exc
    return _generate(slot, payload.lang)
