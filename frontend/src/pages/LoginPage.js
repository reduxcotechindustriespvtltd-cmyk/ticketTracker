import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDemo } from "../context/DemoContext";
import { LogoIcon, ShieldIcon, ChartIcon, SyncIcon } from "../components/icons";

const FEATURES = [
  { icon: SyncIcon, title: "Amadeus GDS Sync", desc: "Automated TJQ/RTD discovery with TWD → RH → FQD pipeline" },
  { icon: ChartIcon, title: "Refund Analytics", desc: "Real-time KPIs on recoverable value across no-shows and cancellations" },
  { icon: ShieldIcon, title: "Secure Credentials", desc: "AES-256 encrypted GDS credentials with mandatory setup gate" },
];

export default function LoginPage() {
  const { signIn } = useAuth();
  const { enterDemo } = useDemo();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  function handleTryDemo() {
    enterDemo();
    navigate("/");
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-600 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3">
            <LogoIcon className="w-10 h-10" />
            <span className="text-2xl font-bold text-white tracking-tight">TicketTrack</span>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight">
              Recover unutilised<br />ticket value
            </h2>
            <p className="text-slate-400 mt-3 text-sm leading-relaxed max-w-md">
              Audit airline tickets against Amadeus GDS, categorise no-shows and cancellations,
              and calculate net refund amounts automatically.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-brand-300" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{title}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-slate-500 text-xs">
          After sign-in, Amadeus GDS credentials are required to access the platform.
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md space-y-4">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <LogoIcon className="w-9 h-9" />
            <span className="text-xl font-bold text-slate-900">TicketTrack</span>
          </div>

          {/* Demo CTA — prominent, above the card */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-900">No credentials yet?</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Explore the full dashboard with 14 realistic sample tickets — no login needed.
              </p>
            </div>
            <button
              onClick={handleTryDemo}
              className="flex-shrink-0 bg-amber-400 hover:bg-amber-500 text-amber-900 font-bold px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
            >
              🎭 Try Demo
            </button>
          </div>

          <div className="card p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
              <p className="text-sm text-slate-500 mt-1">Sign in to your operations dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@agency.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full btn-primary py-3 disabled:opacity-60">
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center">
                First time? Create an admin account via{" "}
                <code className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                  python -m backend.scripts.create_admin
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
