import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Rocket, GitBranch, Database, Sparkles, TrendingUp, FileSearch } from 'lucide-react';
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
  { text: 'Evidence scans with Groq + Tavily', icon: FileSearch },
  { text: 'Model-adjusted probabilities', icon: TrendingUp },
  { text: 'Watchlists & forecast history', icon: Sparkles },
  { text: 'Team-ready entitlements', icon: ShieldCheck },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-foreground">ProbPilot</p>
              <p className="text-xs text-muted-foreground">Forecasting copilot</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button size="sm" className="gap-2" asChild>
              <Link to="/app">
                Open app
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="space-y-20">
          {/* Hero Section */}
          <section className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge variant="secondary" className="text-xs">
                  Forecast faster, verify smarter
                </Badge>
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                  Evidence-aware forecasts with live market context.
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  ProbPilot lets you scan news, classify stances, and generate model probabilities
                  against live market odds. Built for analysts who want transparent signals.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild className="gap-2">
                  <Link to="/auth">
                    Get started
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/app">View app</Link>
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                {highlights.map(({ text, icon: Icon }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground leading-tight pt-1">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Demo Card */}
            <Card className="border-border shadow-lg">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Live probability model</p>
                  <Badge variant="outline" className="text-xs">
                    Auth gated
                  </Badge>
                </div>

                <div className="p-6 rounded-xl bg-muted/50 border border-border flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-xs uppercase text-muted-foreground mb-2 tracking-wide">Market</p>
                    <p className="text-3xl font-mono font-bold">42.6%</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-xs uppercase text-primary mb-2 tracking-wide">ProbPilot</p>
                    <p className="text-3xl font-mono font-bold text-primary">51.3%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl bg-muted/50 border border-border">
                    <p className="text-xs uppercase text-muted-foreground mb-1 tracking-wide">Evidence</p>
                    <p className="text-base font-semibold">AI + retrieval</p>
                  </div>
                  <div className="p-5 rounded-xl bg-muted/50 border border-border">
                    <p className="text-xs uppercase text-muted-foreground mb-1 tracking-wide">Security</p>
                    <p className="text-base font-semibold">RLS-protected</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Forecasts, evidence, and watchlists are stored per user via Row Level
                  Security. Sign in to sync your data across devices.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Tech Stack Section */}
          <section className="space-y-8">
            <h2 className="text-xl font-semibold">Tech stack</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {techStack.map(({ icon: Icon, label, desc }) => (
                <Card key={label} className="border-border">
                  <CardContent className="p-6 flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold">{label}</p>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <p className="text-sm text-muted-foreground text-center">
            ProbPilot · Forecasting copilot · v1.0.0
          </p>
        </div>
      </footer>
    </div>
  );
}
