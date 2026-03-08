import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/authContext.jsx";
import { useNavigate } from "react-router-dom";


const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const {login} = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) =>{
        e.preventDefault();
        try {
        const response = await axios.post(
        "https://portal-backend-dun.vercel.app/api/auth/login",
        { email, password }
        );
        if(response.data.success){
            login(response.data.user)
            localStorage.setItem("token" , response.data.token);
            if(response.data.user.role === "admin"){
              navigate('/admin-dashboard')
            }else{
              navigate('/seller-dashboard')
            }
        }

        } catch (error) {
            if(error.response && !error.response.data.success){
               setError(error.response.data.error)
            }else{
                setError("server error")
            }
        }
    };

        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6">
                <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

                    {/* Left artwork / info */}
                    <div className="hidden md:flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-600 to-purple-600 text-white p-8">
                        <div className="text-4xl font-extrabold">Fileredge</div>
                        <p className="text-sm opacity-90 max-w-xs text-center">Smart invoicing and employee management — secure, fast, and simple.</p>
                        <div className="w-48 h-48 bg-white/10 rounded-2xl flex items-center justify-center">LOGO</div>
                    </div>

                    {/* Right: form */}
                    <div className="p-8 md:p-12">
                        <div className="mb-6 text-center">
                            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
                            <p className="text-sm text-slate-500">Sign in to continue to the admin panel</p>
                        </div>

                        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-lg transition"
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:shadow-lg transition"
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="inline-flex items-center gap-2 text-slate-700">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
                                    <span>Remember me</span>
                                </label>
                                <a href="#" className="text-blue-600 hover:underline">Forgot password?</a>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition transform active:scale-95"
                            >
                                Sign in
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm text-slate-500">
                            Don't have an account? <a href="#" className="text-blue-600">Contact admin</a>
                        </div>
                    </div>
                </div>
            </div>
        );
};

export default Login;
