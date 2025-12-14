import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const { user, loading, signInWithEmail, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  useEffect(() => {
    if (user && !loading) {
      navigate(redirectPath, { replace: true });
    }
  }, [user, loading, redirectPath, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      await signInWithEmail(email);
      toast({
        title: 'Check your email',
        description: 'We sent you a magic link to sign in.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not send sign-in link.';
      console.error('Sign-in error', err);
      toast({
        title: 'Sign-in failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Account</h1>
          <p className="text-muted-foreground">
            Sign in with a magic link to sync forecasts, watchlists, and entitlements.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Supabase Auth</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary border border-border/60">
                  <CheckCircle2 className="w-5 h-5 text-positive" />
                  <div className="text-sm">
                    <p className="font-medium">{user.email}</p>
                    <p className="text-muted-foreground">Session is active.</p>
                  </div>
                </div>
                <Button variant="outline" className="gap-2" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                  Sign out
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Work email
                  </label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting || loading}>
                  {submitting ? 'Sending link...' : 'Send magic link'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
