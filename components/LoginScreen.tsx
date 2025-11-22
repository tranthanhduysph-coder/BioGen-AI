
import React, { useState } from 'react';
import { auth, googleProvider, isConfigured } from '../firebaseConfig';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';

interface LoginScreenProps {
  onDemoLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onDemoLogin }) => {
  // Default state: Registering = false (Login mode)
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const translateError = (code: string) => {
    setErrorHint(null);
    switch (code) {
        case 'auth/invalid-email': return "Email không đúng định dạng.";
        case 'auth/user-disabled': return "Tài khoản này đã bị vô hiệu hóa.";
        case 'auth/user-not-found': return "Không tìm thấy tài khoản. Vui lòng đăng ký trước.";
        case 'auth/wrong-password': return "Sai mật khẩu.";
        case 'auth/email-already-in-use': return "Email này đã được đăng ký rồi.";
        case 'auth/weak-password': return "Mật khẩu quá yếu (cần ít nhất 6 ký tự).";
        case 'auth/invalid-credential': return "Thông tin đăng nhập không hợp lệ.";
        case 'auth/operation-not-allowed': 
            setErrorHint("Vào Firebase Console -> Authentication -> Sign-in method -> Bật 'Email/Password'.");
            return "Phương thức đăng nhập này chưa được bật.";
        case 'auth/network-request-failed': return "Lỗi mạng. Vui lòng kiểm tra kết nối internet.";
        case 'auth/popup-closed-by-user': return "Bạn đã đóng cửa sổ đăng nhập.";
        case 'auth/unauthorized-domain':
            setErrorHint("Vào Firebase Console -> Authentication -> Settings -> Authorized Domains -> Thêm tên miền hiện tại vào.");
            return "Tên miền trang web chưa được cấp quyền chạy Google Login.";
        case 'auth/invalid-api-key': 
            setErrorHint("Kiểm tra lại file firebaseConfig.ts. API Key có thể bị sai hoặc đã bị xóa.");
            return "API Key không hợp lệ.";
        default: return `Lỗi hệ thống: ${code}`;
    }
  };

  const handleGoogleLogin = async () => {
    if (!isConfigured || !auth) {
        setError("Chưa cấu hình Firebase. Vui lòng dùng chế độ Demo.");
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google Login Error:", err);
      setError(translateError(err.code));
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isConfigured || !auth) {
          setError("Hệ thống chưa được cấu hình. Vui lòng dùng chế độ Demo.");
          return;
      }

      if (!email || !password) {
          setError("Vui lòng điền đầy đủ email và mật khẩu.");
          return;
      }

      if (isRegistering && !displayName) {
          setError("Vui lòng nhập tên hiển thị (Họ tên).");
          return;
      }

      setIsLoading(true);
      setError(null);

      try {
          if (isRegistering) {
              // Register Logic
              const userCredential = await createUserWithEmailAndPassword(auth, email, password);
              // Update Display Name immediately
              await updateProfile(userCredential.user, {
                  displayName: displayName
              });
              // App.tsx will detect auth change automatically
          } else {
              // Login Logic
              await signInWithEmailAndPassword(auth, email, password);
          }
      } catch (err: any) {
          console.error("Auth Error:", err);
          setError(translateError(err.code));
          setIsLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300 p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-fade-in">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white/10" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)', backgroundSize: '20px 20px'}}></div>
          <div className="bg-white/20 backdrop-blur-md w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 shadow-inner relative z-10">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5a3.5 3.5 0 0 0-3.5 3.5c0 2.25 1 4.31 2.5 5.5"/>
                <path d="M12 5a3.5 3.5 0 0 1 3.5 3.5c0 2.25-1 4.31-2.5 5.5"/>
                <path d="M12 14v2.5"/>
                <path d="M12 14c-1.5 1.19-2.5 3.25-2.5 5.5"/>
                <path d="M12 14c1.5 1.19 2.5 3.25 2.5 5.5"/>
                <path d="M15.5 12.5a2.5 2.5 0 0 1-5 0"/>
                <path d="M19.5 12.5c0 3.28-2.5 6.5-7.5 6.5s-7.5-3.22-7.5-6.5"/>
                <path d="M4.5 12.5c0-3.28 2.5-6.5 7.5-6.5s7.5 3.22 7.5 6.5"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1 relative z-10">BioGen AI</h1>
          <p className="text-blue-50 text-sm font-medium relative z-10">Đăng nhập để lưu trữ dữ liệu</p>
        </div>

        <div className="p-8">
          
          {/* Tabs: Login vs Register */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
              <button 
                onClick={() => { setIsRegistering(false); setError(null); setErrorHint(null); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isRegistering ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
              >
                  Đăng nhập
              </button>
              <button 
                onClick={() => { setIsRegistering(true); setError(null); setErrorHint(null); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isRegistering ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
              >
                  Đăng ký mới
              </button>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 flex flex-col gap-1 animate-fade-in">
               <div className="flex items-start gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                   <span className="font-bold">{error}</span>
               </div>
               {errorHint && (
                   <p className="text-xs ml-6 opacity-90 italic">{errorHint}</p>
               )}
            </div>
          )}
          
          {isConfigured ? (
             <form onSubmit={handleEmailAuth} className="space-y-4">
                 {isRegistering && (
                     <div className="animate-fade-in">
                        <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Họ và tên</label>
                        <input 
                            type="text" 
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-slate-800 dark:text-white"
                            placeholder="Nhập tên hiển thị"
                            autoComplete="name"
                        />
                     </div>
                 )}

                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Email</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-slate-800 dark:text-white"
                        placeholder="name@example.com"
                        autoComplete="email"
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Mật khẩu</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-slate-800 dark:text-white"
                        placeholder="Tối thiểu 6 ký tự"
                        autoComplete={isRegistering ? "new-password" : "current-password"}
                    />
                 </div>

                 <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm shadow-sky-500/30 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                 >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Đang xử lý...
                        </span>
                    ) : (isRegistering ? "Đăng ký tài khoản" : "Đăng nhập")}
                 </button>

                 <div className="relative flex py-3 items-center">
                    <div className="flex-grow border-t border-slate-100 dark:border-slate-700"></div>
                    <span className="flex-shrink-0 mx-4 text-xs text-slate-400 font-medium uppercase">Hoặc tiếp tục với</span>
                    <div className="flex-grow border-t border-slate-100 dark:border-slate-700"></div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-medium py-2.5 px-4 rounded-xl transition-all"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Google</span>
                </button>

             </form>
          ) : (
              <div className="space-y-4 text-center">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 text-sm rounded-xl border border-yellow-200 dark:border-yellow-800">
                      <p className="font-bold mb-1">Chưa kết nối Firebase</p>
                      <p className="text-xs opacity-90">Hệ thống chưa cấu hình API Key. Vui lòng kiểm tra file config hoặc sử dụng chế độ Demo.</p>
                  </div>
                  <button
                    onClick={onDemoLogin}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-slate-400/20"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span>Vào chế độ Demo</span>
                 </button>
              </div>
          )}

          {isConfigured && (
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button 
                    onClick={onDemoLogin}
                    className="w-full text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1"
                >
                    <span>Chỉ muốn trải nghiệm nhanh?</span>
                    <span className="underline decoration-dotted font-medium hover:text-sky-600">Dùng chế độ khách</span>
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
