import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ButtonLink } from '@/components/ui';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-medium tracking-tight text-forest-deep">
            Your garden,
            <br />
            properly planned.
          </h1>
          <p className="text-lg text-ink-soft leading-relaxed max-w-xl mx-auto">
            The Garden Gnome handles frost dates, pollination groups, companion
            planting, and chill hours — so you can focus on what to grow.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <ButtonLink href="/auth/signup" size="lg">
            Start planning
          </ButtonLink>
          <ButtonLink
            href="/auth/login"
            variant="secondary"
            size="lg"
          >
            Sign in
          </ButtonLink>
        </div>

        <p className="text-sm text-ink-muted pt-8">
          A homestead planner for whole properties — orchards, kitchen gardens,
          cut flower beds, and field crops.
        </p>
      </div>
    </main>
  );
}
