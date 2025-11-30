import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import type { ExamResult } from '../types';
import type { User } from 'firebase/auth';

const COLLECTION_NAME = 'exam_results';

export const saveExamResult = async (user: User, result: Omit<ExamResult, 'id' | 'userId'>) => {
  try {
    // 1. If user is anonymous/demo, save to LocalStorage
    // Note: checking isAnonymous is safer than checking email
    if (user.isAnonymous || !db) {
       const localData = localStorage.getItem('demo_exam_history');
       const history: ExamResult[] = localData ? JSON.parse(localData) : [];
       const newRecord: ExamResult = {
           ...result,
           userId: 'demo',
           id: `local-${Date.now()}`
       };
       history.unshift(newRecord); // Add to top
       // Keep only last 50 local records
       if (history.length > 50) history.pop();
       localStorage.setItem('demo_exam_history', JSON.stringify(history));
       return;
    }

    // 2. If real user and DB is connected, save to Firestore
    if (db) {
        await addDoc(collection(db, COLLECTION_NAME), {
            ...result,
            userId: user.uid,
            createdAt: new Date() // Helper for sorting in console
        });
    }
  } catch (error) {
    console.error("Error saving exam result:", error);
    // Fallback to local storage if firestore fails
    const localData = localStorage.getItem('demo_exam_history');
    const history: ExamResult[] = localData ? JSON.parse(localData) : [];
    history.unshift({ ...result, userId: user.uid, id: `fallback-${Date.now()}` });
    localStorage.setItem('demo_exam_history', JSON.stringify(history));
  }
};

export const getExamHistory = async (user: User): Promise<ExamResult[]> => {
  try {
     // 1. If anonymous/demo or DB unavailable
     if (user.isAnonymous || !db) {
        const localData = localStorage.getItem('demo_exam_history');
        return localData ? JSON.parse(localData) : [];
     }

     // 2. If real user
     const q = query(
         collection(db, COLLECTION_NAME),
         where("userId", "==", user.uid),
         orderBy("timestamp", "desc"),
         limit(20) // Get last 20 exams
     );

     const querySnapshot = await getDocs(q);
     const history: ExamResult[] = [];
     querySnapshot.forEach((doc) => {
         history.push({ id: doc.id, ...doc.data() } as ExamResult);
     });
     
     return history;

  } catch (error) {
      console.error("Error fetching history:", error);
      // Fallback: try reading from local storage as well
      const localData = localStorage.getItem('demo_exam_history');
      return localData ? JSON.parse(localData) : [];
  }
};
