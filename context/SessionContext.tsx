
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MetricInput, BatchItem, QuestionData, IRTAnalysisResult } from '../types';
import { CURRICULUM_STRUCTURE } from '../constants';
import { useAuth } from './AuthContext';

interface GeneratorState {
  metrics: MetricInput;
  quantity: number;
  queue: BatchItem[];
  results: QuestionData[];
}

interface ExtractorState {
  questionText: string;
  optionsText: string;
  answerKey: string;
  customPrompt: string;
  results: Partial<QuestionData>[];
}

interface IRTState {
  resultsCsv: string;
  metadataCsv: string;
  analysis: IRTAnalysisResult | null;
  aiReport: string;
}

interface SessionContextType {
  generator: GeneratorState;
  setGenerator: React.Dispatch<React.SetStateAction<GeneratorState>>;
  extractor: ExtractorState;
  setExtractor: React.Dispatch<React.SetStateAction<ExtractorState>>;
  irt: IRTState;
  setIrt: React.Dispatch<React.SetStateAction<IRTState>>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const DEFAULT_GENERATOR: GeneratorState = {
  metrics: {
    chapter: Object.keys(CURRICULUM_STRUCTURE)[0],
    content: CURRICULUM_STRUCTURE[Object.keys(CURRICULUM_STRUCTURE)[0]][0],
    difficulty: 'Thông hiểu',
    competency: 'NT2',
    type: 'Multiple choices',
    setting: 'Lý thuyết',
    hasChart: false,
    hasImage: false,
    customPrompt: '',
    imageFile: null
  },
  quantity: 1,
  queue: [],
  results: []
};

const DEFAULT_EXTRACTOR: ExtractorState = {
  questionText: '',
  optionsText: '',
  answerKey: '',
  customPrompt: '',
  results: []
};

const DEFAULT_IRT: IRTState = {
  resultsCsv: `StudentID,Q1,Q2,Q3,Q4,Q5,Q6,Q7,Q8,Q9,Q10
S001,1,1,1,1,1,0,1,0,0,0
S002,1,1,1,1,0,0,0,0,0,0
S003,1,1,1,1,1,1,1,1,0,1
S004,0,1,0,0,0,0,0,0,0,0
S005,1,1,1,1,1,1,0,1,0,0
S006,1,1,0,1,0,0,0,0,0,0
S007,1,1,1,1,1,1,1,1,1,1
S008,1,0,0,0,0,0,0,0,0,0
S009,1,1,1,1,0,1,0,0,0,0
S010,1,1,1,0,1,0,0,0,0,0`,
  metadataCsv: `ItemID,Topic,DifficultyLevel,Competency
Q1,Cell Structure,Nhận biết,NT1
Q2,Cell Structure,Nhận biết,NT1
Q3,Metabolism,Thông hiểu,NT2
Q4,Metabolism,Thông hiểu,NT2
Q5,Genetics,Thông hiểu,NT2
Q6,Genetics,Vận dụng,VD1
Q7,Evolution,Vận dụng,VD1
Q8,Evolution,Vận dụng,VD2
Q9,Ecology,Vận dụng cao,TH2
Q10,Ecology,Vận dụng cao,TH4`,
  analysis: null,
  aiReport: ""
};

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.uid || 'guest';
  
  const [generator, setGenerator] = useState<GeneratorState>(DEFAULT_GENERATOR);
  const [extractor, setExtractor] = useState<ExtractorState>(DEFAULT_EXTRACTOR);
  const [irt, setIrt] = useState<IRTState>(DEFAULT_IRT);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount or user change
  useEffect(() => {
    const loadState = () => {
      try {
        const savedGen = localStorage.getItem(`biometric_gen_${userId}`);
        const savedExt = localStorage.getItem(`biometric_ext_${userId}`);
        const savedIrt = localStorage.getItem(`biometric_irt_${userId}`);

        if (savedGen) {
          const parsed = JSON.parse(savedGen);
          // Restore imageFile as null because File objects don't persist
          setGenerator({ ...DEFAULT_GENERATOR, ...parsed, metrics: { ...parsed.metrics, imageFile: null } });
        } else {
          setGenerator(DEFAULT_GENERATOR);
        }

        if (savedExt) setExtractor({ ...DEFAULT_EXTRACTOR, ...JSON.parse(savedExt) });
        else setExtractor(DEFAULT_EXTRACTOR);

        if (savedIrt) setIrt({ ...DEFAULT_IRT, ...JSON.parse(savedIrt) });
        else setIrt(DEFAULT_IRT);

      } catch (e) {
        console.error("Failed to load session", e);
      } finally {
        setLoaded(true);
      }
    };
    loadState();
  }, [userId]);

  // Save to localStorage on change
  useEffect(() => {
    if (!loaded) return;
    const { metrics, ...restGen } = generator;
    // Exclude imageFile from metrics when saving
    const genToSave = { ...restGen, metrics: { ...metrics, imageFile: null } };
    
    localStorage.setItem(`biometric_gen_${userId}`, JSON.stringify(genToSave));
  }, [generator, userId, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(`biometric_ext_${userId}`, JSON.stringify(extractor));
  }, [extractor, userId, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(`biometric_irt_${userId}`, JSON.stringify(irt));
  }, [irt, userId, loaded]);

  return (
    <SessionContext.Provider value={{ generator, setGenerator, extractor, setExtractor, irt, setIrt }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
