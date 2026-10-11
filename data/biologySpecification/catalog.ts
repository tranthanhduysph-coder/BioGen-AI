import document from './catalog.json';
import type { BiologySpecificationRecord } from './types';

export const BIOLOGY_SPECIFICATION_SOURCE = document.source;
export const BIOLOGY_SPECIFICATION_PAGES = document.sourcePages;
export const BIOLOGY_SPECIFICATION_TOPICS = document.topics;
export const BIOLOGY_SPECIFICATION_RECORDS = document.records as BiologySpecificationRecord[];
export const getSpecificationRecordsForGrade = (grade: 10 | 11 | 12) =>
  BIOLOGY_SPECIFICATION_RECORDS.filter(record => record.grade === grade);
export const isUsableSpecificationRecord = (record: BiologySpecificationRecord) =>
  !record.sourceDuplicate && !record.sourceEmpty && !record.sourceIncomplete;
export const getSpecificationRecordById = (id: string) =>
  BIOLOGY_SPECIFICATION_RECORDS.find(record => record.id === id);
export const getSpecificationSourceUrl = (page: number) =>
  `${BIOLOGY_SPECIFICATION_SOURCE.pdfUrl}#page=${page}`;
