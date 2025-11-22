
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import saveAs from "file-saver";
import { GeneratedQuestion, QuestionType } from "../types";

// Helper to create table borders
const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
};

// Helper to create a table cell
const createCell = (text: string, bold = false, width?: number) => {
    return new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold, size: 22 })], alignment: AlignmentType.CENTER })],
        width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
        verticalAlign: AlignmentType.CENTER,
        margins: { top: 100, bottom: 100, left: 100, right: 100 }
    });
};

// 1. MATRIX TABLE GENERATION
const createMatrixTable = (questions: GeneratedQuestion[]) => {
    const rows = [];
    
    // Header Row
    rows.push(new TableRow({
        children: [
            createCell("STT", true, 10),
            createCell("Chương/Chủ đề", true, 30),
            createCell("Dạng câu hỏi", true, 25),
            createCell("Mức độ", true, 15),
            createCell("Năng lực", true, 20),
        ]
    }));

    // Data Rows
    questions.forEach((q, index) => {
        rows.push(new TableRow({
            children: [
                createCell(`${index + 1}`),
                createCell(q.criteria?.chapter || "N/A"),
                createCell(q.type),
                createCell(q.criteria?.difficulty || "N/A"),
                createCell(q.criteria?.competency?.split(':')[0] || "N/A"), // Keep it short
            ]
        }));
    });

    return new Table({
        rows: rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: tableBorders,
    });
};

// 2. ANSWER GRID GENERATION (Sample Format for 2025)
const createAnswerGrid = () => {
    // Simplified representation of the complex answer sheet for readability in DOCX
    return new Paragraph({
         children: [
             new TextRun({ text: "PHIẾU TRẢ LỜI (MÔ PHỎNG)", bold: true, size: 28 }),
             new TextRun({ text: "\n\nPHẦN I (Tô đậm 1 ô): [ A ] [ B ] [ C ] [ D ]", break: 1 }),
             new TextRun({ text: "\nPHẦN II (Đúng/Sai): a[Đ/S] b[Đ/S] c[Đ/S] d[Đ/S]", break: 1 }),
             new TextRun({ text: "\nPHẦN III (Điền số): [ . . . . ]", break: 1 }),
         ],
         alignment: AlignmentType.LEFT,
         spacing: { before: 400 }
    });
};


export const exportToDocx = async (questions: GeneratedQuestion[]) => {
    const children: (Paragraph | Table)[] = [];

    // --- HEADER ---
    children.push(
        new Paragraph({
            text: "BỘ GIÁO DỤC VÀ ĐÀO TẠO",
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "\nĐỀ THAM KHẢO - KỲ THI TỐT NGHIỆP THPT TỪ NĂM 2025", bold: true, size: 28 })]
        }),
        new Paragraph({
            text: "MÔN: SINH HỌC",
            bold: true,
            size: 26,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
        })
    );

    // --- MATRIX TABLE ---
    children.push(new Paragraph({ text: "MA TRẬN ĐỀ THI", heading: HeadingLevel.HEADING_1, spacing: { after: 100 } }));
    children.push(createMatrixTable(questions));
    children.push(new Paragraph({ text: "", spacing: { after: 300 } })); // Spacer

    // --- CLASSIFY QUESTIONS ---
    const part1 = questions.filter(q => q.type === QuestionType.MultipleChoice);
    const part2 = questions.filter(q => q.type === QuestionType.TrueFalse);
    const part3 = questions.filter(q => q.type === QuestionType.ShortResponse);

    // --- PART I ---
    if (part1.length > 0) {
        children.push(new Paragraph({ 
            children: [
                new TextRun({ text: "PHẦN I. ", bold: true }),
                new TextRun({ text: "Câu trắc nghiệm nhiều phương án lựa chọn. ", bold: true }),
                new TextRun({ text: "Thí sinh trả lời từ câu 1 đến câu " + part1.length + ". Mỗi câu hỏi thí sinh chỉ chọn một phương án." })
            ],
            spacing: { before: 200, after: 100 }
        }));

        part1.forEach((q, index) => {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: `Câu ${index + 1}: `, bold: true }),
                        new TextRun({ text: q.question })
                    ],
                    spacing: { before: 120 }
                })
            );
            q.options.forEach(opt => {
                children.push(new Paragraph({ text: opt, indent: { left: 360 } }));
            });
        });
    }

    // --- PART II ---
    if (part2.length > 0) {
        children.push(new Paragraph({ 
            children: [
                new TextRun({ text: "PHẦN II. ", bold: true }),
                new TextRun({ text: "Câu trắc nghiệm đúng sai. ", bold: true }),
                new TextRun({ text: "Thí sinh trả lời từ câu 1 đến câu " + part2.length + ". Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai." })
            ],
            spacing: { before: 300, after: 100 }
        }));

        part2.forEach((q, index) => {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: `Câu ${index + 1}: `, bold: true }),
                        new TextRun({ text: q.question })
                    ],
                    spacing: { before: 120 }
                })
            );
            q.options.forEach(opt => {
                children.push(new Paragraph({ text: opt, indent: { left: 360 } }));
            });
        });
    }

    // --- PART III ---
    if (part3.length > 0) {
        children.push(new Paragraph({ 
            children: [
                new TextRun({ text: "PHẦN III. ", bold: true }),
                new TextRun({ text: "Câu trắc nghiệm trả lời ngắn. ", bold: true }),
                new TextRun({ text: "Thí sinh trả lời từ câu 1 đến câu " + part3.length + "." })
            ],
            spacing: { before: 300, after: 100 }
        }));

        part3.forEach((q, index) => {
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: `Câu ${index + 1}: `, bold: true }),
                        new TextRun({ text: q.question })
                    ],
                    spacing: { before: 120 }
                })
            );
            children.push(new Paragraph({ text: "Đáp án: .....................", indent: { left: 360 } }));
        });
    }

    // --- PAGE BREAK FOR ANSWER KEY ---
    children.push(new Paragraph({ text: "", pageBreakBefore: true }));
    children.push(new Paragraph({ text: "HƯỚNG DẪN CHẤM CHI TIẾT", heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }));

    // Helper to render answers for a section
    const renderAnswerSection = (title: string, qs: GeneratedQuestion[], startIndex: number = 1) => {
        if (qs.length === 0) return;
        children.push(new Paragraph({ text: title, heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
        qs.forEach((q, i) => {
            children.push(new Paragraph({
                children: [
                    new TextRun({ text: `Câu ${startIndex + i}: `, bold: true }),
                    new TextRun({ text: q.answer, color: "008000", bold: true }), // Green color
                    new TextRun({ text: `\nGiải thích: ${q.explanation}`, italics: true, size: 20 })
                ],
                spacing: { after: 100 }
            }));
        });
    };

    renderAnswerSection("PHẦN I", part1);
    renderAnswerSection("PHẦN II", part2);
    renderAnswerSection("PHẦN III", part3);

    // --- ANSWER GRID VISUALIZATION ---
    children.push(new Paragraph({ text: "", spacing: { before: 400 } }));
    children.push(createAnswerGrid());

    // Create Document
    const doc = new Document({
        sections: [{
            properties: {},
            children: children,
        }],
    });

    // Generate and Save
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "De_Minh_Hoa_2025_BioGen.docx");
};
