"""A complete exam prompt and independent validation of its returned slots."""
import json
from collections import defaultdict


def build_prompt(slots, lang):
    requirements, references = {}, {}
    def requirement(source):
        value = {key: source[key] for key in ('contentLabel', 'competencyCode', 'outcomeText', 'level')}
        signature = json.dumps(value, sort_keys=True, ensure_ascii=False)
        if signature not in references:
            ref = f'R{len(requirements) + 1}'
            references[signature] = ref
            requirements[ref] = value
        return references[signature]
    positions = []
    for slot in slots:
        position = {'slotId': slot['id'], 'part': slot['part'], 'order': slot['order']}
        if slot['part'] == 'tf':
            position['statements'] = [{'letter': chr(96 + s['statementOrder']),
                                       'requirement': requirement(s)} for s in slot['statements']]
        else:
            position['requirement'] = requirement(slot)
        positions.append(position)
    return f'''You are an expert Biology exam author. Generate ALL {len(slots)} question positions in ONE response.
Write all question text and explanations in {'English' if lang == 'en' else 'Vietnamese'}.
The requirements catalog below contains the exact learning outcomes and cognitive levels.
Each position references its requirement; references are shared to avoid repeating the same instructions.
For True/False, produce one shared context and exactly four statements a-d, each matching its own requirement.
Do not mention requirement IDs, competency codes or cognitive labels in question text.
Scientific accuracy and alignment with every specified learning outcome are mandatory.

Return ONLY a valid JSON array, one object for EVERY requested slotId, with no duplicates or invented IDs:
{{"slotId":"EXACT_ID","question":{{"question":"stem","type":"Multiple choices|True/ False|Short response","options":[],"answer":"answer","explanation":"explanation"}}}}
mcq: exactly four options A-D, one correct answer; answer starts with A/B/C/D.
tf: exactly four options a-d; answer is "a) Đúng; b) Sai; c) Đúng; d) Sai" (use the actual truth values).
short: options=[], answer is a single number of at most four characters including sign/decimal separator; no units or prose.
Use concise explanations. HTML sub/sup and typography are allowed in text fields.
Use JSON-escaped LaTeX delimiters for fractions, roots and equations; answers retain the plain formats above.

REQUIREMENTS:
{json.dumps(requirements, ensure_ascii=False, separators=(',', ':'))}
POSITIONS:
{json.dumps(positions, ensure_ascii=False, separators=(',', ':'))}'''


def normalize_response(slots, text, normalize_question, lang):
    if len(text.encode()) > 400000:
        raise ValueError('Exam response exceeds the size limit.')
    data = json.loads(text)
    if isinstance(data, dict):
        data = data.get('items')
    if not isinstance(data, list):
        raise ValueError('Exam response must contain a JSON array.')
    by_id = defaultdict(list)
    expected = {s['id'] for s in slots}
    for item in data:
        if isinstance(item, dict) and isinstance(item.get('slotId'), str) and item['slotId'] in expected:
            by_id[item['slotId']].append(item)
    items, failures = [], []
    for slot in slots:
        try:
            entries = by_id[slot['id']]
            if len(entries) != 1:
                raise ValueError('Missing or duplicate slot ID.')
            raw = entries[0]
            if raw.get('part', slot['part']) != slot['part'] or raw.get('order', slot['order']) != slot['order']:
                raise ValueError('Slot metadata mismatch.')
            if not isinstance(raw.get('question'), dict):
                raise ValueError('Question must be an object.')
            question = normalize_question(raw['question'], slot['part']).model_dump()
            item = {'slotId': slot['id'], 'part': slot['part'], 'order': slot['order'], 'question': question}
            if len(json.dumps(item, ensure_ascii=False).encode()) > 6000:
                raise ValueError('Question exceeds the size limit.')
            items.append(item)
        except (ValueError, TypeError, KeyError):
            failures.append({'slotId': slot['id'], 'part': slot['part'], 'order': slot['order'],
                'message': 'AI returned a missing, duplicate or invalid question. Retry this missing position.' if lang == 'en'
                else 'AI trả về câu thiếu, trùng mã hoặc sai định dạng. Có thể tạo lại riêng vị trí còn thiếu này.'})
    return {'items': items, 'failures': failures}
