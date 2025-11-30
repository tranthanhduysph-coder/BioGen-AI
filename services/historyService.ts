import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import type { ExamResult } from '../types';
import type { User } from 'firebase/auth';

const COLLECTION_NAME = 'exam_results';
const LOCAL_STORAGE_KEY = 'biogen_exam_history';

export const saveExamResult = async (user: User, result: Omit<ExamResult, 'id' | 'userId'>) => {
  try {
    // Fallback to LocalStorage if DB is not configured or User is Anonymous/Demo
    const isStaticMode = !db || !user || user.isAnonymous || user.email?.includes('demo');

    if (isStaticMode) {
       console.log("Saving to LocalStorage (Static/Demo Mode)...");
       const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
       const history: ExamResult[] = localData ? JSON.parse(localData) : [];
       
       const newRecord: ExamResult = {
           ...result,
           userId: 'local-user',
           id: `local-${Date.now()}`
       };
       
       history.unshift(newRecord);
       if (history.length > 50) history.pop();
       
       localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
       return;
    }

    // Save to Firestore
    if (db && user.uid) {
        // We might want to strip heavy data if needed, but for <50 questions it's usually fine
        // Firestore document limit is 1MB. 50 questions json is approx 20-50KB.
        await addDoc(collection(db, COLLECTION_NAME), {
            ...result,
            userId: user.uid,
            createdAt: new Date()
        });
    }
  } catch (error) {
    console.error("Error saving result:", error);
  }
};

export const getExamHistory = async (user: User): Promise<ExamResult[]> => {
  try {
     const isStaticMode = !db || !user || user.isAnonymous || user.email?.includes('demo');

     if (isStaticMode) {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        return localData ? JSON.parse(localData) : [];
     }

     if (!db) return [];
     
     // Note: We removed orderBy previously to avoid index issues, but client-side sort handles it.
     const q = query(
         collection(db, COLLECTION_NAME),
         where("userId", "==", user.uid),
         limit(20)
     );

     const querySnapshot = await getDocs(q);
     const history: ExamResult[] = [];
     querySnapshot.forEach((doc) => {
         const d = doc.data();
         history.push({ 
             id: doc.id, 
             ...d,
             timestamp: d.timestamp || (d.createdAt?.toMillis ? d.createdAt.toMillis() : Date.now()),
             // Ensure optional fields are loaded if present
             questionsData: d.questionsData,
             userAnswers: d.userAnswers
         } as ExamResult);
     });
     
     // Client-side Sorting: Newest first
     return history.sort((a, b) => b.timestamp - a.timestamp);

  } catch (error) {
      console.error("Error fetching history:", error);
      // Fallback
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      return localData ? JSON.parse(localData) : [];
  }
};
