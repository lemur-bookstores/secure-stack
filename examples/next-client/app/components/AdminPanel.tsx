'use client';

import { Protect } from '@lemur-bookstores/secure-stack-client/react';

export function AdminPanel() {
  return (
    <Protect
      role="admin"
      fallback={
        <div className="p-6 border rounded-lg bg-muted/50 border-dashed">
          <p className="text-sm text-muted-foreground text-center">
            Admin panel hidden (requires 'admin' role)
          </p>
        </div>
      }
    >
      <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm border-red-200 dark:border-red-900">
        <h2 className="text-2xl font-semibold leading-none tracking-tight mb-4 text-red-600 dark:text-red-400">
          Admin Panel
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          This content is only visible to users with the <code>admin</code> role.
        </p>
        <div className="flex gap-2">
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-red-600 text-white hover:bg-red-700 h-9 px-4 py-2">
            Delete Database
          </button>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
            View Logs
          </button>
        </div>
      </div>
    </Protect>
  );
}
