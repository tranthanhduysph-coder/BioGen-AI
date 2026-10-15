import { QuestionType, type GeneratedQuestion } from '../../types';
import type { GeneratedExamItem } from '../../types/generatedExam';

export const formattingQuestions: GeneratedQuestion[] = [
  { type: QuestionType.MultipleChoice,
    question: '<p>Ở quần thể <i>cân bằng Hardy–Weinberg</i>, biết <b>p + q = 1</b>. Tính tần số kiểu gen dị hợp theo công thức \\(p^2 + 2pq + q^2 = 1\\).</p><p>Hô hấp sử dụng O<sub>2</sub>, tạo CO<sub>2</sub>; ion Ca<sup>2+</sup>, kí hiệu α, β, Δ, ×, ≤ và → phải được giữ nguyên.</p>',
    options: ['A. $p^2$', 'B. $2pq$', 'C. $q^2$', 'D. $\\frac{p}{q}$'], answer: 'B',
    explanation: '<p>Tần số dị hợp là <strong>2pq</strong>. Ví dụ \\(p=0{,}6\\), \\(q=0{,}4\\) thì \\(2pq=0{,}48\\).</p><p>Phân số và căn: $$f=\\frac{n_{Aa}}{N}=\\frac{\\sqrt{16}}{10}$$</p>' },
  { type: QuestionType.TrueFalse,
    question: '<p>Xét thành phần ADN và quá trình quang hợp:</p><table><thead><tr><th>Đại lượng</th><th>Biểu thức</th></tr></thead><tbody><tr><td>Số nucleotide</td><td>$N=2(A+G)$</td></tr><tr><td>Liên kết hydrogen</td><td>$H=2A+3G$</td></tr></tbody></table>',
    options: ['a) A liên kết với T bằng <b>2</b> liên kết hydrogen.', 'b) G liên kết với C bằng <b>2</b> liên kết hydrogen.', 'c) Quang hợp giải phóng O<sub>2</sub>.', 'd) $p^2+q^2=1$ với mọi giá trị p, q.'],
    answer: 'a) Đúng; b) Sai; c) Đúng; d) Sai',
    explanation: '<ol><li>A–T có 2 liên kết; G–C có 3 liên kết.</li><li>Phản ứng: $\\ce{6CO2 + 6H2O -> C6H12O6 + 6O2}$.</li></ol>' },
  { type: QuestionType.ShortResponse, question: '<p>Tính \\(x=\\frac{\\sqrt{25}}{2}\\). Trả lời bằng số thập phân.</p>', options: [], answer: '2,5', explanation: '<p>Ta có $\\sqrt{25}=5$, suy ra $x=2{,}5$.</p>' },
];

export const formattingItems: GeneratedExamItem[] = formattingQuestions.map((question, i) => ({ slotId: `format-${i}`, part: i === 0 ? 'mcq' : i === 1 ? 'tf' : 'short', order: 1, question }));
