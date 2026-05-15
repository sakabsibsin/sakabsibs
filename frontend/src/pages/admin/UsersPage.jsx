import { Users } from 'lucide-react';
import { Breadcrumb } from '@/components/admin/Breadcrumb';

export const UsersPage = () => (
  <div className="space-y-6">
    <Breadcrumb items={[{ label: 'Dashboard', to: '/admin/dashboard' }, { label: 'Customers' }]} />

    <div>
      <h1 className="text-3xl font-serif tracking-wide mb-2">Customers</h1>
      <p className="text-muted-foreground text-sm">View and manage your customer base.</p>
    </div>

    <div className="bg-card border border-border">
      <div className="flex flex-col items-center justify-center py-24 px-8 text-center space-y-4">
        <div className="h-14 w-14 bg-muted flex items-center justify-center">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-serif text-xl tracking-wide mb-2">Customer Management</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Customer accounts and purchase history will be tracked here in a future update.
            Currently, customer interactions happen through WhatsApp and Instagram.
          </p>
        </div>
        <div className="mt-4 bg-muted/50 border border-border px-6 py-3 text-xs text-muted-foreground font-mono">
          Current channels: WhatsApp · Instagram @sakab.sibs
        </div>
      </div>
    </div>
  </div>
);
