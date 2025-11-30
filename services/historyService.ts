import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import type { ExamResult } from '../types';
import type { User } from 'firebase/auth';

const COLLECTION_NAME = 'exam_results';
const LOCAL_STORAGE_KEY = 'biogen_exam_history';

export const saveExamResult = async (user: User, result: Omit<ExamResult, 'id' | 'userId'>) => {
  try {
    // Ưu tiên lưu LocalStorage nếu:
    // 1. Không có DB (Static mode)
    // 2. User chưa đăng nhập (Anonymous)
    // 3. User là Demo user
    const useLocalStorage = !db || user.isAnonymous || !user.email || user.email.includes('demo');

    if (useLocalStorage) {
       console.log("Saving history to LocalStorage...");
       const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
       const history: ExamResult[] = localData ? JSON.parse(localData) : [];
       
       const newRecord: ExamResult = {
           ...result,
           userId: 'local-user',
           id: `local-${Date.now()}`
       };
       
       // Thêm vào đầu mảng
       history.unshift(newRecord);
       // Giữ lại 50 bài gần nhất
       if (history.length > 50) history.pop();
       
       localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
       return;
    }

    // Nếu có DB và User thật
    if (db && user.uid) {
        await addDoc(collection(db, COLLECTION_NAME), {
            ...result,
            userId: user.uid,
            createdAt: new Date()
        });
    }
  } catch (error) {
    console.error("Error saving exam result:", error);
  }
};

export const getExamHistory = async (user: User): Promise<ExamResult[]> => {
  try {
     const useLocalStorage = !db || user.isAnonymous || !user.email || user.email.includes('demo');

     if (useLocalStorage) {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
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
      // Fallback to local if DB fail
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      return localData ? JSON.parse(localData) : [];
  }
};
