// src/firebase.ts

// HƯỚNG DẪN CÀI ĐẶT:
// 1. Chạy lệnh: npm install firebase
// 2. Thêm các biến môi trường VITE_FIREBASE_... vào file .env và Render Dashboard
//    (apiKey, authDomain, projectId, v.v.)

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Lấy biến môi trường từ Vite. Các biến này phải bắt đầu bằng VITE_
cconst firebaseConfig = {
  apiKey: "AIzaSyBmXj8niUi1QfbWg0g0Uvr_N4EkiepVaVE",
  authDomain: "biogen-ai.firebaseapp.com",
  projectId: "biogen-ai",
  storageBucket: "biogen-ai.firebasestorage.app",
  messagingSenderId: "661545702014",
  appId: "1:661545702014:web:985bb029a949a6640a3e2f",
  measurementId: "G-3W542HE1RT"
};

// Khởi tạo Firebase App
const app = initializeApp(firebaseConfig);

// Khởi tạo Firebase Auth và export để sử dụng
export const auth = getAuth(app);