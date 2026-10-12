export type CompetencyGroup = 'NT' | 'TH' | 'VD';
export interface CompetencyDescriptor {
  code: string;
  group: CompetencyGroup;
  title: string;
  description: string;
  sourcePages: number[];
}

export const COMPETENCY_GROUP_LABELS: Record<CompetencyGroup, string> = {
  NT: 'Nhận thức sinh học', TH: 'Tìm hiểu thế giới sống', VD: 'Vận dụng kiến thức, kĩ năng đã học',
};
const groupLabelsEn: Record<CompetencyGroup, string> = {
  NT: 'Biological knowledge', TH: 'Inquiry into the living world', VD: 'Application of acquired knowledge and skills',
};
export const COMPETENCY_GROUP_DESCRIPTIONS: Record<CompetencyGroup, string> = {
  NT: 'Trình bày, phân tích được các kiến thức sinh học cốt lõi và các thành tựu công nghệ sinh học trong các lĩnh vực.',
  TH: 'Thực hiện được quy trình tìm hiểu thế giới sống.',
  VD: 'Vận dụng được kiến thức, kĩ năng đã học để giải thích, đánh giá hiện tượng thường gặp trong tự nhiên và trong đời sống; có thái độ và hành vi ứng xử thích hợp.',
};
const descriptionsEn: Record<string, string> = {
  NT1: 'Recognise, name, state and describe biological objects, concepts, laws and life processes.',
  NT2: 'Present the characteristics and roles of biological objects and life processes using spoken and written language, formulas, diagrams, charts and other forms of expression.',
  NT3: 'Classify living objects and phenomena according to different criteria.',
  NT4: 'Analyse the characteristics of an object, phenomenon or process following a logical sequence.',
  NT5: 'Compare and select biological objects, concepts, mechanisms and life processes according to specified criteria.',
  NT6: 'Explain relationships between objects and phenomena, including cause and effect and structure and function.',
  NT7: 'Identify and correct errors; offer critical judgements related to the topic under discussion.',
  NT8: 'Find keywords, use scientific terminology and connect information meaningfully and logically; prepare outlines when reading and presenting scientific texts, using different forms of expression.',
  TH1: 'Propose a problem related to the living world: ask relevant questions, analyse the context to identify a problem and express the proposed problem in your own words.',
  TH2: 'Make predictions and develop hypotheses: analyse the problem to make a prediction, and formulate and state a research hypothesis.',
  TH3: 'Plan the investigation: develop a logical research framework, select appropriate methods such as observation, experiments, surveys, interviews or literature reviews, and prepare a plan for the research activities.',
  TH4: 'Carry out the plan: collect and retain data from literature reviews, experiments and surveys; evaluate results by analysing and processing data with simple statistical measures; compare results with the hypothesis, explain, draw conclusions and adjust if needed; recommend applications of the findings or further research questions.',
  TH5: 'Write and present reports and discuss findings: use language, drawings, diagrams and tables to communicate the research process and results; write a research report; collaborate through active listening and respect for others’ views and evaluations, responding constructively and explaining, debating and defending the findings persuasively.',
  VD1: 'Explain practical situations: explain and evaluate phenomena in nature and everyday life and their effects on sustainable development; explain, evaluate and critically examine technological models at an appropriate level.',
  VD2: 'Demonstrate appropriate behaviour and attitudes: propose and implement solutions to protect personal, family and community health, protect nature and the environment, adapt to climate change and meet sustainable development goals.',
};

// CTGDPT 2018, section IV.2, pages 5–7. Text follows the complete source expressions (line wrapping and final punctuation normalised).
// Codes follow the convention already
// used by this app and the specification; the curriculum itself has no code column.
export const BIOLOGY_COMPETENCY_DESCRIPTORS: CompetencyDescriptor[] = [
  { code: 'NT1', group: 'NT', title: 'Nhận biết và nêu khái niệm', sourcePages: [5], description: 'Nhận biết, kể tên, phát biểu, nêu được các đối tượng, khái niệm, quy luật, quá trình sống.' },
  { code: 'NT2', group: 'NT', title: 'Trình bày đặc điểm và vai trò', sourcePages: [5], description: 'Trình bày được các đặc điểm, vai trò của các đối tượng và các quá trình sống bằng các hình thức biểu đạt như ngôn ngữ nói, viết, công thức, sơ đồ, biểu đồ,...' },
  { code: 'NT3', group: 'NT', title: 'Phân loại theo tiêu chí', sourcePages: [6], description: 'Phân loại được các đối tượng, hiện tượng sống theo các tiêu chí khác nhau.' },
  { code: 'NT4', group: 'NT', title: 'Phân tích đặc điểm và quá trình', sourcePages: [6], description: 'Phân tích được các đặc điểm của một đối tượng, sự vật, quá trình theo một logic nhất định.' },
  { code: 'NT5', group: 'NT', title: 'So sánh và lựa chọn', sourcePages: [6], description: 'So sánh, lựa chọn được các đối tượng, khái niệm, các cơ chế, quá trình sống dựa theo các tiêu chí nhất định.' },
  { code: 'NT6', group: 'NT', title: 'Giải thích mối quan hệ', sourcePages: [6], description: 'Giải thích được mối quan hệ giữa các sự vật và hiện tượng (nguyên nhân – kết quả, cấu tạo – chức năng,...).' },
  { code: 'NT7', group: 'NT', title: 'Phát hiện sai và phản biện', sourcePages: [6], description: 'Nhận ra và chỉnh sửa được những điểm sai; đưa ra được những nhận định có tính phê phán liên quan tới chủ đề trong thảo luận.' },
  { code: 'NT8', group: 'NT', title: 'Sử dụng ngôn ngữ khoa học', sourcePages: [6], description: 'Tìm được từ khoá, sử dụng được thuật ngữ khoa học, kết nối được thông tin theo logic có ý nghĩa, lập được dàn ý khi đọc và trình bày các văn bản khoa học; sử dụng được các hình thức ngôn ngữ biểu đạt khác nhau.' },
  { code: 'TH1', group: 'TH', title: 'Đề xuất vấn đề nghiên cứu', sourcePages: [6], description: 'Đề xuất vấn đề liên quan đến thế giới sống: đặt ra được các câu hỏi liên quan đến vấn đề; phân tích được bối cảnh để đề xuất vấn đề; dùng ngôn ngữ của mình biểu đạt được vấn đề đã đề xuất.' },
  { code: 'TH2', group: 'TH', title: 'Xây dựng giả thuyết', sourcePages: [6], description: 'Đưa ra phán đoán và xây dựng giả thuyết: phân tích được vấn đề để nêu được phán đoán; xây dựng và phát biểu được giả thuyết nghiên cứu.' },
  { code: 'TH3', group: 'TH', title: 'Lập kế hoạch nghiên cứu', sourcePages: [6], description: 'Lập kế hoạch thực hiện: xây dựng được khung logic nội dung nghiên cứu; lựa chọn được phương pháp thích hợp (quan sát, thực nghiệm, điều tra, phỏng vấn, hồi cứu tư liệu,...); lập được kế hoạch triển khai hoạt động nghiên cứu.' },
  { code: 'TH4', group: 'TH', title: 'Thực hiện và xử lí dữ liệu', sourcePages: [6, 7], description: 'Thực hiện kế hoạch: thu thập, lưu giữ được dữ liệu từ kết quả tổng quan, thực nghiệm, điều tra; đánh giá được kết quả dựa trên phân tích, xử lí các dữ liệu bằng các tham số thống kê đơn giản; so sánh được kết quả với giả thuyết, giải thích, rút ra kết luận và điều chỉnh (nếu cần); đề xuất được ý kiến khuyến nghị vận dụng kết quả nghiên cứu, hoặc vấn đề nghiên cứu tiếp.' },
  { code: 'TH5', group: 'TH', title: 'Báo cáo và thảo luận', sourcePages: [7], description: 'Viết, trình bày báo cáo và thảo luận: sử dụng được ngôn ngữ, hình vẽ, sơ đồ, biểu bảng để biểu đạt quá trình và kết quả nghiên cứu; viết được báo cáo nghiên cứu; hợp tác được với đối tác bằng thái độ lắng nghe tích cực và tôn trọng quan điểm, ý kiến đánh giá do người khác đưa ra để tiếp thu tích cực và giải trình, phản biện, bảo vệ kết quả nghiên cứu một cách thuyết phục.' },
  { code: 'VD1', group: 'VD', title: 'Giải thích và đánh giá thực tiễn', sourcePages: [7], description: 'Giải thích thực tiễn: giải thích, đánh giá được những hiện tượng thường gặp trong tự nhiên và trong đời sống, tác động của chúng đến phát triển bền vững; giải thích, đánh giá, phản biện được một số mô hình công nghệ ở mức độ phù hợp.' },
  { code: 'VD2', group: 'VD', title: 'Đề xuất và thực hiện giải pháp', sourcePages: [7], description: 'Có hành vi, thái độ thích hợp: đề xuất, thực hiện được một số giải pháp để bảo vệ sức khoẻ bản thân, gia đình và cộng đồng; bảo vệ thiên nhiên, môi trường, thích ứng với biến đổi khí hậu, đáp ứng yêu cầu phát triển bền vững.' },
];

const byCode = new Map(BIOLOGY_COMPETENCY_DESCRIPTORS.map(item => [item.code, item]));
export interface CompetencyResolution {
  sourceCode: string | null;
  descriptors: CompetencyDescriptor[];
  groups: CompetencyGroup[];
  unresolvedTokens: string[];
  status: 'mapped' | 'partial' | 'missing';
}
export const resolveCompetencyCode = (sourceCode: string | null | undefined): CompetencyResolution => {
  const result: CompetencyResolution = { sourceCode: sourceCode || null, descriptors: [], groups: [], unresolvedTokens: [], status: 'missing' };
  if (!sourceCode?.trim()) return result;
  const add = (code: string) => {
    const descriptor = byCode.get(code);
    if (!descriptor) return false;
    if (!result.descriptors.some(item => item.code === code)) result.descriptors.push(descriptor);
    if (!result.groups.includes(descriptor.group)) result.groups.push(descriptor.group);
    return true;
  };
  for (const token of sourceCode.trim().toUpperCase().split('/')) {
    if (add(token)) continue;
    // NT2-NT4 is a pair of printed NT codes, not NT2, NT3, NT4.
    // Keep inquiry-step ranges (TH1-TH5 / TH2-5) as ranges.
    const ntPair = /^(NT\d+)-(NT\d+)$/.exec(token);
    if (ntPair && byCode.has(ntPair[1]) && byCode.has(ntPair[2]) && Number(ntPair[1].slice(2)) <= Number(ntPair[2].slice(2))) {
      add(ntPair[1]); add(ntPair[2]);
      continue;
    }
    const range = /^(NT|TH|VD)(\d+)-(NT|TH|VD)?(\d+)$/.exec(token);
    if (range && (!range[3] || range[3] === range[1])) {
      const from = Number(range[2]), to = Number(range[4]);
      if (from <= to && to - from <= 7 && Array.from({ length: to - from + 1 }, (_, i) => `${range[1]}${from + i}`).every(code => byCode.has(code))) {
        for (let i = from; i <= to; i++) add(`${range[1]}${i}`);
        continue;
      }
    }
    // Keep the source suffix unexplained; only its known base descriptor is linked.
    if (token === 'NT5-H') add('NT5');
    if (token === 'NT' || token === 'TH' || token === 'VD') {
      if (!result.groups.includes(token)) result.groups.push(token);
    }
    result.unresolvedTokens.push(token);
  }
  result.status = result.unresolvedTokens.length ? 'partial' : 'mapped';
  return result;
};

export const getCompetencyDescription = (code: string | null, isEnglish = false): string => {
  const resolved = resolveCompetencyCode(code);
  const texts = resolved.descriptors.map(item => isEnglish ? descriptionsEn[item.code] : item.description);
  for (const group of resolved.groups.filter(group => !resolved.descriptors.some(item => item.group === group))) {
    texts.unshift(isEnglish ? groupLabelsEn[group] : COMPETENCY_GROUP_DESCRIPTIONS[group]);
  }
  if (!texts.length) return isEnglish ? 'The source does not assign a competency to this outcome. No assignment is inferred.' : 'Nguồn chưa gán năng lực cho YCCĐ này. Không tự suy mã năng lực.';
  return texts.join('\n\n');
};

export const getCompetencyGroupLabel = (code: string | null, isEnglish = false): string => {
  const labels = isEnglish ? groupLabelsEn : COMPETENCY_GROUP_LABELS;
  return resolveCompetencyCode(code).groups.map(group => labels[group]).join(' / ')
    || (isEnglish ? 'Competency not specified in source' : 'Nguồn chưa ghi mã năng lực');
};

export const getManualCompetencyTranslations = (isEnglish = false): Record<string, string> =>
  Object.fromEntries(BIOLOGY_COMPETENCY_DESCRIPTORS.map(item => [item.code.toLowerCase(), `${item.code}: ${getCompetencyDescription(item.code, isEnglish)}`]));
