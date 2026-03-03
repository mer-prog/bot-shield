'use client';

import { BotDashboard } from '@/components/bot-shield/dashboard/BotDashboard';
import { AppHeader } from '@/components/AppHeader';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-grid-pattern">
      <AppHeader
        maxWidth="max-w-7xl"
        navItems={[
          { href: '/', labelKey: 'nav.store' },
          { href: '/dashboard', labelKey: 'nav.dashboard', active: true },
        ]}
      />

      {/* ─── Dashboard Content ─── */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <BotDashboard />
      </main>
    </div>
  );
}
