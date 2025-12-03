'use client';

import { useQuery } from '@lemur-bookstores/client/react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function UserList() {
  const { data: users, isLoading, error } = useQuery<void, User[]>('user.listUsers');

  if (isLoading) return <div className="loading">Loading users...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <div className="card">
      <h2>
        Users List
        <span className="ssr-badge">SSR</span>
      </h2>
      <ul className="user-list">
        {Array.isArray(users) &&
          users.map((user) => (
            <li key={user.id} className="user-item">
              <div>
                <strong>{user.name}</strong>
                <br />
                <span>{user.email}</span>
              </div>
              <span className="role">{user.role}</span>
            </li>
          ))}
        {Array.isArray(users) && users.length === 0 && <p>No users found.</p>}
      </ul>
    </div>
  );
}
