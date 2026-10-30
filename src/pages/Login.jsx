import { API_BASE_URL } from "../lib/api";
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, FileCheck2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/authContext.jsx";
import logo from "../assets/logo.png";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      if (response.data.success) {
        login(response.data.user);
        localStorage.setItem("token", response.data.token);
        if (response.data.user.role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/seller-dashboard");
        }
      }
    } catch (requestError) {
      if (requestError.response && !requestError.response.data.success) {
        setError(requestError.response.data.error);
      } else {
        setError("Server error");
      }
    }
  };

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-background lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden overflow-hidden bg-sidebar px-12 py-10 text-sidebar-foreground lg:flex lg:flex-col">
        <div className="absolute -left-32 top-28 size-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-40 right-0 size-[30rem] rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white p-1.5 shadow-lg">
            <img src={logo} alt="Fileredge" className="size-full object-contain" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">Fileredge</p>
            <p className="text-xs text-sidebar-foreground/55">Digital invoicing portal</p>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-xl">
          <Badge className="mb-5 border-white/10 bg-white/10 text-white" variant="outline">
            <ShieldCheck className="size-3.5" /> FBR-ready operations
          </Badge>
          <h1 className="text-4xl font-semibold leading-tight tracking-[-0.035em] xl:text-5xl">
            Digital invoicing that keeps your business moving.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-sidebar-foreground/65">
            Manage sellers, buyers, items, invoices, and FBR submissions from one secure workspace.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              [FileCheck2, "Compliant invoicing", "Create structured sales tax invoices."],
              [CheckCircle2, "Clear workflow", "Track drafts and published invoices."],
            ].map(([Icon, title, description]) => (
              <div key={title} className="rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                {React.createElement(Icon, { className: "mb-3 size-5 text-blue-300" })}
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs leading-5 text-sidebar-foreground/55">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-sidebar-foreground/40">Secure access for authorized teams only.</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar p-1.5">
              <img src={logo} alt="Fileredge" className="size-full object-contain" />
            </div>
            <div>
              <p className="font-semibold">Fileredge</p>
              <p className="text-xs text-muted-foreground">Digital invoicing portal</p>
            </div>
          </div>

          <Card className="gap-0 py-0 shadow-xl shadow-slate-900/5">
            <CardHeader className="px-6 pb-5 pt-7 sm:px-8 sm:pt-8">
              <CardTitle className="text-2xl font-semibold tracking-tight">Welcome back</CardTitle>
              <CardDescription>Sign in with your authorized account to continue.</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-7 sm:px-8 sm:pb-8">
              {error && (
                <Alert variant="destructive" className="mb-5">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      placeholder="name@company.com"
                      autoComplete="email"
                      className="h-11 pl-9"
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="h-11 pl-9"
                      onChange={(event) => setPassword(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="h-11 w-full justify-between px-4">
                  Sign in securely
                  <ArrowRight />
                </Button>
              </form>

              <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
                Need access? Contact your organization administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
};

export default Login;
