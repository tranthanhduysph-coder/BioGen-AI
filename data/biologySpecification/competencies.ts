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

// CTGDPT 2018, section IV.2, pages 5–7. Codes follow the convention already
// used by this app and the specification; the curriculum itself has no code column.
export const BIOLOGY_COMPETENCY_DESCRIPTORS: CompetencyDescriptor[] = [
  { code: 'NT1', group: 'NT', title: 'Nhận biết và nêu khái niệm', sourcePages: [5], description: 'Nhận biết, kể tên, phát biểu và nêu các đối tượng, khái niệm, quy luật, quá trình sống.' },
  { code: 'NT2', group: 'NT', title: 'Trình bày đặc điểm và vai trò', sourcePages: [5], description: 'Trình bày đặc điểm, vai trò của đối tượng và quá trình sống bằng lời nói, văn bản, công thức, sơ đồ hoặc biểu đồ.' },
  { code: 'NT3', group: 'NT', title: 'Phân loại theo tiêu chí', sourcePages: [6], description: 'Phân loại các đối tượng và hiện tượng sống theo những tiêu chí khác nhau.' },
  { code: 'NT4', group: 'NT', title: 'Phân tích đặc điểm và quá trình', sourcePages: [6], description: 'Phân tích đặc điểm của đối tượng, sự vật hoặc quá trình theo một trình tự logic.' },
  { code: 'NT5', group: 'NT', title: 'So sánh và lựa chọn', sourcePages: [6], description: 'So sánh và lựa chọn đối tượng, khái niệm, cơ chế hoặc quá trình sống dựa trên tiêu chí xác định.' },
  { code: 'NT6', group: 'NT', title: 'Giải thích mối quan hệ', sourcePages: [6], description: 'Giải thích quan hệ giữa sự vật và hiện tượng, như quan hệ nguyên nhân – kết quả hoặc cấu tạo – chức năng.' },
  { code: 'NT7', group: 'NT', title: 'Phát hiện sai và phản biện', sourcePages: [6], description: 'Nhận ra, chỉnh sửa điểm sai và đưa ra nhận định có tính phê phán trong thảo luận về chủ đề sinh học.' },
  { code: 'NT8', group: 'NT', title: 'Sử dụng ngôn ngữ khoa học', sourcePages: [6], description: 'Tìm từ khoá, dùng thuật ngữ khoa học, kết nối thông tin có ý nghĩa; lập dàn ý, đọc và trình bày văn bản bằng các hình thức biểu đạt phù hợp.' },
  { code: 'TH1', group: 'TH', title: 'Đề xuất vấn đề nghiên cứu', sourcePages: [6], description: 'Đặt câu hỏi, phân tích bối cảnh và diễn đạt vấn đề nghiên cứu liên quan đến thế giới sống.' },
  { code: 'TH2', group: 'TH', title: 'Xây dựng giả thuyết', sourcePages: [6], description: 'Phân tích vấn đề để đưa ra phán đoán; xây dựng và phát biểu giả thuyết nghiên cứu.' },
  { code: 'TH3', group: 'TH', title: 'Lập kế hoạch nghiên cứu', sourcePages: [6], description: 'Xây dựng nội dung nghiên cứu, chọn phương pháp thích hợp và lập kế hoạch triển khai hoạt động.' },
  { code: 'TH4', group: 'TH', title: 'Thực hiện và xử lí dữ liệu', sourcePages: [6, 7], description: 'Thu thập, lưu giữ và xử lí dữ liệu; đánh giá kết quả, đối chiếu giả thuyết, giải thích và rút ra kết luận; đề xuất vận dụng hoặc hướng nghiên cứu tiếp.' },
  { code: 'TH5', group: 'TH', title: 'Báo cáo và thảo luận', sourcePages: [7], description: 'Trình bày quá trình và kết quả nghiên cứu bằng báo cáo, hình vẽ, sơ đồ, biểu bảng; lắng nghe, giải trình, phản biện và bảo vệ kết quả.' },
  { code: 'VD1', group: 'VD', title: 'Giải thích và đánh giá thực tiễn', sourcePages: [7], description: 'Giải thích, đánh giá hiện tượng trong tự nhiên và đời sống, tác động đến phát triển bền vững; đánh giá, phản biện mô hình công nghệ phù hợp.' },
  { code: 'VD2', group: 'VD', title: 'Đề xuất và thực hiện giải pháp', sourcePages: [7], description: 'Đề xuất, thực hiện giải pháp bảo vệ sức khoẻ bản thân, gia đình và cộng đồng; bảo vệ thiên nhiên, môi trường và thích ứng với biến đổi khí hậu.' },
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
