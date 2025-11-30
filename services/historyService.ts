import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs, limit } from 'firebase/firestore';
import type { ExamResult } from '../types';
import type { User } from 'firebase/auth';

const COLLECTION_NAME = 'exam_results';
const LOCAL_STORAGE_KEY = 'biogen_exam_history';

export const saveExamResult = async (user: User, result: Omit<ExamResult, 'id' | 'userId'>) => {
  try {
    // 1. Nếu user là Demo/Anonymous hoặc không có DB -> Lưu LocalStorage
    const isDemo = !user || user.isAnonymous || !user.email || user.email.includes('demo') || !db;

    if (isDemo) {
       const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
       const history: ExamResult[] = localData ? JSON.parse(localData) : [];
       
       const newRecord: ExamResult = {
           ...result,
           userId: 'demo-user',
           id: `local-${Date.now()}`
       };
       
       history.unshift(newRecord);
       if (history.length > 50) history.pop();
       
       localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
       return;
    }

    // 2. Nếu User thật -> Lưu Firestore
    if (db && user.uid) {
        await addDoc(collection(db, COLLECTION_NAME), {
            ...result,
            userId: user.uid,
            createdAt: new Date() // Dùng để sort
        });
    }
  } catch (error) {
    console.error("Error saving exam result:", error);
  }
};

export const getExamHistory = async (user: User): Promise<ExamResult[]> => {
  try {
     const isDemo = !user || user.isAnonymous || !user.email || user.email.includes('demo') || !db;

     if (isDemo) {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        return localData ? JSON.parse(localData) : [];
     }

     if (!db) return [];
     
     // FIX LỖI: Bỏ 'orderBy' để tránh lỗi "The query requires an index"
     // Chúng ta sẽ sort ở client sau khi lấy dữ liệu về.
     const q = query(
         collection(db, COLLECTION_NAME),
         where("userId", "==", user.uid),
         limit(50) // Lấy 50 bài gần nhất (chưa sort)
     );

     const querySnapshot = await getDocs(q);
     const history: ExamResult[] = [];
     
     querySnapshot.forEach((doc) => {
         const d = doc.data();
         // Đảm bảo timestamp tồn tại
         const ts = d.timestamp || (d.createdAt?.toMillis ? d.createdAt.toMillis() : Date.now());
         
         history.push({ 
             id: doc.id, 
             userId: d.userId,
             timestamp: ts,
             score: d.score || 0,
             totalQuestions: d.totalQuestions || 0,
             correctCount: d.correctCount || 0,
             chapterSummary: d.chapterSummary || "Bài tập"
         });
     });
     
     // Client-side Sorting: Mới nhất lên đầu
     return history.sort((a, b) => b.timestamp - a.timestamp);

  } catch (error) {
      console.error("Error fetching history:", error);
      // Fallback nếu lỗi mạng vẫn hiển thị local data cũ (nếu có)
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      return localData ? JSON.parse(localData) : [];
  }
};
