'use client';

import { SessionGuard, RoleGate, PermissionGate } from '@lemur-bookstores/client/react';

/**
 * Demo component showcasing validation guards
 */
export function GuardsDemo() {
  return (
    <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
      <h2 className="text-xl font-bold mb-4">Validation Guards Demo</h2>

      <div className="space-y-6">
        {/* SessionGuard Demo */}
        <div className="border border-gray-600 rounded p-4 bg-gray-800">
          <h3 className="font-semibold mb-2 text-blue-400">SessionGuard</h3>
          <SessionGuard
            status="authenticated"
            fallback={
              <div className="text-yellow-400">👋 Please login to see authenticated content</div>
            }
            loading={<div className="text-gray-400">Loading session...</div>}
          >
            <div className="text-green-400">
              ✓ You are authenticated! This content is protected.
            </div>
          </SessionGuard>
        </div>

        {/* RoleGate Demo - Admin Only */}
        <div className="border border-gray-600 rounded p-4 bg-gray-800">
          <h3 className="font-semibold mb-2 text-purple-400">RoleGate (Admin Only)</h3>
          <RoleGate
            anyOf={['admin']}
            onDeny={<div className="text-red-400">🚫 Admin access required</div>}
            loading={<div className="text-gray-400">Checking permissions...</div>}
          >
            <div className="text-green-400">🔑 Admin panel access granted!</div>
          </RoleGate>
        </div>

        {/* RoleGate Demo - Editor or Admin */}
        <div className="border border-gray-600 rounded p-4 bg-gray-800">
          <h3 className="font-semibold mb-2 text-purple-400">RoleGate (Editor or Admin)</h3>
          <RoleGate
            anyOf={['admin', 'editor']}
            onDeny={<div className="text-red-400">🚫 Editor or Admin role required</div>}
          >
            <div className="text-green-400">📝 Content editing enabled!</div>
          </RoleGate>
        </div>

        {/* PermissionGate Demo */}
        <div className="border border-gray-600 rounded p-4 bg-gray-800">
          <h3 className="font-semibold mb-2 text-orange-400">PermissionGate</h3>
          <PermissionGate
            allOf={['billing.read']}
            onDeny={<div className="text-red-400">🚫 Billing read permission required</div>}
          >
            <div className="text-green-400">💰 Billing dashboard accessible!</div>
          </PermissionGate>
        </div>

        {/* Multiple Permissions */}
        <div className="border border-gray-600 rounded p-4 bg-gray-800">
          <h3 className="font-semibold mb-2 text-orange-400">PermissionGate (Multiple)</h3>
          <PermissionGate
            anyOf={['users.read', 'users.write', 'users.delete']}
            onDeny={<div className="text-red-400">🚫 User management permissions required</div>}
          >
            <div className="text-green-400">👥 User management panel accessible!</div>
          </PermissionGate>
        </div>
      </div>

      <div className="mt-6 p-3 bg-gray-800 rounded text-xs text-gray-400">
        <div className="font-semibold mb-1">Available Guards:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <code>SessionGuard</code> - Protect based on auth status
          </li>
          <li>
            <code>RoleGate</code> - Protect based on user roles (anyOf/allOf)
          </li>
          <li>
            <code>PermissionGate</code> - Protect based on permissions (anyOf/allOf)
          </li>
          <li>
            All support <code>fallback</code>, <code>loading</code>, and optional{' '}
            <code>Suspense</code>
          </li>
        </ul>
      </div>
    </div>
  );
}
