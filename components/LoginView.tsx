import React from 'react';
import { motion } from 'motion/react';
import { supabase } from '../supabase';
import { LogIn, Sparkles, ShieldCheck, Zap } from 'lucide-react';

const LoginView: React.FC = () => {
  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/'
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error("Login failed:", error);
      alert("登入遇到問題：" + (error as Error)?.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      {/* Background Decorations */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          rotate: [0, -120, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl"
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10"
      >
        <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl transform -rotate-6">
          <Sparkles size={48} className="text-indigo-600" />
        </div>
        
        <h1 className="text-5xl font-black mb-4 tracking-tighter">FOCUS AI</h1>
        <p className="text-lg text-white/80 font-medium mb-12 max-w-[280px] mx-auto leading-relaxed">
          專注每一刻，成就更好的自己。<br/>開啟你的 AI 學習旅程。
        </p>

        <div className="space-y-4 mb-12">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20">
            <ShieldCheck size={20} className="text-green-300" />
            <span className="text-sm font-bold">安全加密資料儲存</span>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20">
            <Zap size={20} className="text-yellow-300" />
            <span className="text-sm font-bold">即時同步多端紀錄</span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogin}
          className="w-full bg-white text-indigo-600 py-5 rounded-[2rem] font-black text-lg shadow-2xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
        >
          <LogIn size={24} />
          使用 Google 帳號登入
        </motion.button>
        
        <p className="mt-8 text-xs text-white/50 font-medium">
          登入即代表您同意我們的服務條款與隱私權政策
        </p>
      </motion.div>
    </div>
  );
};

export default LoginView;
