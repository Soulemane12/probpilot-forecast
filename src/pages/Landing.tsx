import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Rocket, GitBranch, Database, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const techStack = [
  { icon: Sparkles, label: 'React + Vite', desc: 'Fast client bundle with modern tooling' },
  { icon: Database, label: 'Supabase', desc: 'Auth, database, row-level security' },
  { icon: GitBranch, label: 'TanStack Query', desc: 'Live market fetching & caching' },
  { icon: ShieldCheck, label: 'shadcn/ui', desc: 'Accessible UI primitives' },
  { icon: Zap, label: 'Express API', desc: 'Edge-compatible API routes' },
];

const highlights = [
  'Run structured evidence scans with Groq + Tavily',
  'Generate model-adjusted probabilities vs market prices',
  'Track watchlists and forecast history per account',
  'Team-ready entitlements with Supabase row-level security',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <header className="max-w-6xl mx-auto px-6 py-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary/80">ProbPilot</p>
            <p className="text-xs text-slate-400">Forecasting copilot</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button className="gap-2" asChild>
            <Link to="/app">
              Open app
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-20 space-y-16">
        <section className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <Badge variant="outline" className="border-primary/60 text-primary bg-primary/10">
              Forecast faster, verify smarter
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Evidence-aware forecasts with live market context.
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              ProbPilot lets you scan news, classify stances, and generate model probabilities
              against live market odds. Built for analysts who want transparent signals without
              leaving the terminal.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="gap-2">
                <Link to="/auth">
                  Get started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/app">View app</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-300">
              {highlights.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="bg-slate-900/60 border-primary/20 shadow-2xl shadow-primary/10">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-300">Live probability model</p>
                <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/30">
                  Supabase Auth gated
                </Badge>
              </div>
              <div className="p-5 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-slate-400 mb-1">Market (mid)</p>
                  <p className="text-3xl font-mono font-bold text-slate-100">42.6%</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500" />
                <div>
                  <p className="text-xs uppercase text-primary mb-1">ProbPilot model</p>
                  <p className="text-3xl font-mono font-bold text-primary">51.3%</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
                  <p className="text-xs uppercase text-slate-400">Evidence scans</p>
                  <p className="text-xl font-semibold text-slate-100">AI + retrieval</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
                  <p className="text-xs uppercase text-slate-400">Entitlements</p>
                  <p className="text-xl font-semibold text-slate-100">RLS-protected</p>
                </div>
              </div>
              <div className="text-sm text-slate-300">
                Forecasts, evidence, and watchlists are stored per user via Supabase Row Level
                Security. Sign in to sync your data across devices.
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Tech stack</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {techStack.map(({ icon: Icon, label, desc }) => (
              <Card key={label} className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-4 flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{label}</p>
                    <p className="text-sm text-slate-400">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
