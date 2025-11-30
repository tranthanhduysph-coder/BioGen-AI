import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import type { ExamResult } from '../types';
import type { User } from 'firebase/auth';

const COLLECTION_NAME = 'exam_results';

export const saveExamResult = async (user: User, result: Omit<ExamResult, 'id' | 'userId'>) => {
  try {
    // LOGIC LƯU TRỮ:
    // 1. Nếu là user "Demo" (isAnonymous hoặc email giả) hoặc KHÔNG CÓ kết nối DB -> Lưu LocalStorage
    const isDemo = user.isAnonymous || !user.email || !db;

    if (isDemo) {
       console.log("Saving to LocalStorage (Demo Mode)...");
       const localData = localStorage.getItem('demo_exam_history');
       const history: ExamResult[] = localData ? JSON.parse(localData) : [];
       
       const newRecord: ExamResult = {
           ...result,
           userId: 'demo-user',
           id: `local-${Date.now()}`
       };
       
       // Add to top
       history.unshift(newRecord); 
       // Limit local history to 20 items
       if (history.length > 20) history.pop();
       
       localStorage.setItem('demo_exam_history', JSON.stringify(history));
       return;
    }

    // 2. Nếu là User thật và có DB -> Lưu Firestore
    if (db && user.uid) {
        console.log("Saving to Firestore...");
        await addDoc(collection(db, COLLECTION_NAME), {
            ...result,
            userId: user.uid,
            createdAt: new Date()
        });
    }
  } catch (error) {
    console.error("Error saving exam result:", error);
    // Silent fail or fallback could be implemented here
  }
};

export const getExamHistory = async (user: User): Promise<ExamResult[]> => {
  try {
     const isDemo = user.isAnonymous || !user.email || !db;

     if (isDemo) {
        const localData = localStorage.getItem('demo_exam_history');
        return localData ? JSON.parse(localData) : [];
     }

     if (!db) return [];
     
     const q = query(
         collection(db, COLLECTION_NAME),
         where("userId", "==", user.uid),
         orderBy("timestamp", "desc"),
         limit(20)
     );

     const querySnapshot = await getDocs(q);
     const history: ExamResult[] = [];
     querySnapshot.forEach((doc) => {
         history.push({ id: doc.id, ...doc.data() } as ExamResult);
     });
     
     return history;

  } catch (error) {
      console.error("Error fetching history:", error);
      return [];
  }
};
