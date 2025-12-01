import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs, limit, deleteDoc } from 'firebase/firestore';
import type { ExamResult } from '../types';
import type { User } from 'firebase/auth';

const COLLECTION_NAME = 'exam_results';
const LOCAL_STORAGE_KEY = 'biogen_exam_history';

export const saveExamResult = async (user: User, result: Omit<ExamResult, 'id' | 'userId'>) => {
  try {
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

    if (db && user.uid) {
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
     
     const q = query(
         collection(db, COLLECTION_NAME),
         where("userId", "==", user.uid),
         limit(50)
     );

     const querySnapshot = await getDocs(q);
     const history: ExamResult[] = [];
     querySnapshot.forEach((doc) => {
         const d = doc.data();
         history.push({ 
             id: doc.id, 
             ...d,
             timestamp: d.timestamp || (d.createdAt?.toMillis ? d.createdAt.toMillis() : Date.now())
         } as ExamResult);
     });
     
     return history.sort((a, b) => b.timestamp - a.timestamp);

  } catch (error) {
      console.error("Error fetching history:", error);
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      return localData ? JSON.parse(localData) : [];
  }
};

// NEW: Clear History Function
export const clearExamHistory = async (user: User) => {
    try {
        const isStaticMode = !db || !user || user.isAnonymous || user.email?.includes('demo');

        if (isStaticMode) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            return;
        }

        if (db && user.uid) {
            const q = query(collection(db, COLLECTION_NAME), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);
            // Delete each doc
            const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);
        }
    } catch (error) {
        console.error("Error clearing history:", error);
        throw error;
    }
};
