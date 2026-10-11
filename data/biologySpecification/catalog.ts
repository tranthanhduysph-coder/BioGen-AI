import document from './catalog.json';
import curriculum from './curriculum.json';
import type { BiologySpecificationRecord } from './types';

export const BIOLOGY_SPECIFICATION_SOURCE = document.source;
export const BIOLOGY_SPECIFICATION_PAGES = document.sourcePages;
export const BIOLOGY_SPECIFICATION_SOURCES = { specification: document.source, curriculum: curriculum.source };
export const BIOLOGY_SPECIFICATION_TOPICS = [
  ...document.topics.map(topic => {
    const update = curriculum.topicUpdates.find(item => item.grade === topic.grade && item.contentId === topic.contentId);
    return update ? { ...topic, ...update, sourceLabelInferred: false, sourceIncomplete: false } : topic;
  }), ...curriculum.topics,
];
export const BIOLOGY_SPECIFICATION_RECORDS: BiologySpecificationRecord[] = [
  ...(document.records as BiologySpecificationRecord[]).map(record => ({ ...record, sourceId: 'specification' as const, scope: 'core' as const })),
  ...curriculum.records as BiologySpecificationRecord[],
];
export const getSpecificationContentLabel = (record: BiologySpecificationRecord) =>
  BIOLOGY_SPECIFICATION_TOPICS.find(topic => topic.grade === record.grade && topic.contentId === record.contentId)?.contentLabel || record.contentLabel;
export const getSpecificationRecordsForGrade = (grade: 10 | 11 | 12) =>
  BIOLOGY_SPECIFICATION_RECORDS.filter(record => record.grade === grade);
export const isUsableSpecificationRecord = (record: BiologySpecificationRecord) =>
  !record.sourceDuplicate && !record.sourceEmpty && !record.sourceIncomplete;
export const getSpecificationRecordById = (id: string) =>
  BIOLOGY_SPECIFICATION_RECORDS.find(record => record.id === id);
export const getSpecificationSourceUrl = (page: number, sourceId: 'specification' | 'curriculum' = 'specification') =>
  `${BIOLOGY_SPECIFICATION_SOURCES[sourceId].pdfUrl}#page=${page}`;
export const getSpecificationSourceLabel = (sourceId?: 'specification' | 'curriculum') =>
  sourceId === 'curriculum' ? 'CTGDPT 2018' : 'Bản đặc tả';
