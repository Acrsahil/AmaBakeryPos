import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, User, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Login() {
    const navigate = useNavigate();
    const { roleId } = useParams<{ roleId: string }>();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const roleTitle = roleId === 'admin' ? 'Administration' : 'Management';

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Static credentials check
        const valid = (username === 'admin' && password === 'admin');

        if (valid) {
            toast.success("Login Successful", {
                description: `Welcome to ${roleTitle}`,
            });
            navigate('/admin/dashboard');
        } else {
            setError("Invalid credentials. Please try again.");
            toast.error("Login Failed", {
                description: "Invalid username or password",
            });
        }
    };

    return (
        <div className="min-h-screen gradient-cream flex flex-col items-center justify-center p-6 overflow-hidden">
            {/* Header / Branding */}
            <div className="text-center mb-6 animate-in fade-in zoom-in duration-700">
                <div className="inline-flex items-center justify-center h-16 w-16 md:h-20 md:w-20 rounded-3xl bg-white shadow-warm mb-4 p-1 overflow-hidden border-2 border-primary/10">
                    <img src="/logos/logo1white.jfif" alt="Ama Bakery Logo" className="h-full w-full object-cover" />
                </div>
                <h1 className="text-2xl md:text-4xl font-rockwell tracking-tight text-slate-800 mb-1">Ama Bakery</h1>
                <p className="text-primary/60 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mt-0.5 bg-primary/5 px-4 py-1 rounded-full inline-block border border-primary/10">Secure Admin Gateway</p>
            </div>

            {/* Login Card */}
            <div className="w-full max-w-sm animate-slide-up">
                <div className="card-elevated p-8 md:p-10 border-4 border-white flex flex-col shadow-2xl shadow-primary/5 rounded-[2.5rem]">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <h2 className="font-black text-slate-800 text-lg leading-none">Admin Sign-in</h2>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Authorized Access Only</p>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Username</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <Input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="pl-11 h-13 bg-slate-50 border-2 border-slate-100 rounded-2xl focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                        placeholder="Username"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-11 h-13 bg-slate-50 border-2 border-slate-100 rounded-2xl focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary transition-all font-bold text-slate-700 font-mono placeholder:text-slate-300"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-destructive/5 text-destructive text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl border border-destructive/10 animate-in slide-in-from-top-2 text-center">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-95 gradient-warm text-white"
                        >
                            Log In Securely
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 opacity-60 w-full text-slate-400">
                        <Lock className="h-3 w-3" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">Encrypted Terminal Session</span>
                    </div>
                </div>
            </div>

            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="mt-8 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-primary transition-all hover:bg-white/50 rounded-full px-8 py-4"
            >
                <ArrowLeft className="h-3 w-3 mr-2" />
                Back to Role Selection
            </Button>
        </div>
    );
}
