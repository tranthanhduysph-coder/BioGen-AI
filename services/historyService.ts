import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import type { ExamResult } from '../types';
import type { User } from 'firebase/auth';

const COLLECTION_NAME = 'exam_results';
const LOCAL_STORAGE_KEY = 'biogen_exam_history';

export const saveExamResult = async (user: User, result: Omit<ExamResult, 'id' | 'userId'>) => {
  try {
    // LOGIC LƯU TRỮ:
    // 1. Nếu user là Demo/Anonymous hoặc không có DB -> Lưu LocalStorage
    const isDemo = !user || user.isAnonymous || !user.email || user.email.includes('demo') || !db;

    if (isDemo) {
       console.log("Saving history to LocalStorage...");
       const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
       const history: ExamResult[] = localData ? JSON.parse(localData) : [];
       
       const newRecord: ExamResult = {
           ...result,
           userId: 'demo-user',
           id: `local-${Date.now()}`
       };
       
       // Thêm vào đầu mảng
       history.unshift(newRecord);
       // Giới hạn 50 bài gần nhất
       if (history.length > 50) history.pop();
       
       localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
       return;
    }

    // 2. Nếu User thật và có DB -> Lưu Firestore
    if (db && user.uid) {
        await addDoc(collection(db, COLLECTION_NAME), {
            ...result,
            userId: user.uid,
            createdAt: new Date() // Helper for sorting
        });
    }
  } catch (error) {
    console.error("Error saving exam result:", error);
    // Fallback to local storage on error
    try {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        const history: ExamResult[] = localData ? JSON.parse(localData) : [];
        history.unshift({ ...result, userId: 'fallback', id: `err-${Date.now()}` });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
    } catch (e) { console.error("Critical save error", e); }
  }
};

export const getExamHistory = async (user: User): Promise<ExamResult[]> => {
  try {
     const isDemo = !user || user.isAnonymous || !user.email || user.email.includes('demo') || !db;

     // 1. Get Local Data (Always get this for Demo users)
     if (isDemo) {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        const data = localData ? JSON.parse(localData) : [];
        console.log("Loaded Local History:", data.length);
        return data;
     }

     // 2. Get Firestore Data (For Real Users)
     if (db && user.uid) {
         const q = query(
             collection(db, COLLECTION_NAME),
             where("userId", "==", user.uid),
             orderBy("createdAt", "desc"), // Sort by creation time
             limit(20)
         );

         const querySnapshot = await getDocs(q);
         const history: ExamResult[] = [];
         querySnapshot.forEach((doc) => {
             const d = doc.data();
             // Map Firestore data to ExamResult interface
             history.push({ 
                 id: doc.id, 
                 userId: d.userId,
                 timestamp: d.timestamp || d.createdAt?.toMillis() || Date.now(),
                 score: d.score,
                 totalQuestions: d.totalQuestions,
                 correctCount: d.correctCount,
                 chapterSummary: d.chapterSummary
             });
         });
         console.log("Loaded Firestore History:", history.length);
         return history;
     }
     return [];

  } catch (error) {
      console.error("Error fetching history:", error);
      // Fallback: try reading from local storage just in case
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      return localData ? JSON.parse(localData) : [];
  }
};
