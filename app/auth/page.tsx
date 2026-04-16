"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Redirect if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });
        if (signUpError) throw signUpError;
        
        // Profiles are usually handled via Supabase triggers, but let's ensure it's there
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            name: name,
            email: email,
          });
        }
        
        alert("Verification email sent! Please check your inbox.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif text-gray-900 mb-3">
            {isLogin ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-gray-500 text-sm tracking-widest uppercase">
            {isLogin ? "Login to your account" : "Join the Lakrasa family"}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-soft p-8 md:p-10">
          <form onSubmit={handleAuth} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black/5 transition-all outline-none text-gray-900 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-700/20 transition-all outline-none text-gray-900 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                  Password
                </label>
                {isLogin && (
                  <button type="button" className="text-xs text-gray-400 hover:text-green-700 transition-colors">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-700/20 transition-all outline-none text-gray-900 text-sm"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 text-white py-4 rounded-xl text-sm font-semibold tracking-widest uppercase hover:bg-green-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/10"
            >
              {loading ? "Processing..." : isLogin ? "Login" : "Sign up"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-100"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-400 tracking-widest">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={signInWithGoogle}
              className="flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium text-gray-700"
            >
              <svg className="w-5 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.36-2.08 4.44-1.48 1.48-3.32 2.24-5.76 2.24-4.8 0-8.76-3.88-8.76-8.8s3.96-8.8 8.76-8.8c2.68 0 4.6 1.04 6.04 2.4l2.32-2.32C18.44 1.28 15.68 0 12.48 0 5.84 0 0 5.36 0 12s5.84 12 12.48 12c3.56 0 6.24-1.12 8.4-3.32 2.16-2.12 2.88-5.16 2.88-8.4 0-.56-.04-1.12-.12-1.36h-11.16z"/>
              </svg>
              Google
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 font-semibold text-black hover:underline"
          >
            {isLogin ? "Create account" : "Log in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
