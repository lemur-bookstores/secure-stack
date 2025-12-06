'use client';

import { useQuery, useMutation } from '@lemur-bookstores/client/react';
import { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

export function UserList() {
  const { data: users, isLoading, error } = useQuery<User[]>('user.list');

  if (isLoading) {
    return (
      <div className="border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Users</h2>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-red-500">Error</h2>
        <p className="text-red-400">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Users</h2>
      {users && users.length > 0 ? (
        <ul className="space-y-2">
          {users.map((user) => (
            <li key={user.id} className="border-b border-gray-800 pb-2">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-gray-400">{user.email}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">No users found</p>
      )}
    </div>
  );
}

export function CreateUserForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const createUser = useMutation<User, { name: string; email: string }>('user.create', {
    onSuccess: () => {
      setName('');
      setEmail('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email) {
      createUser.mutate({ name, email });
    }
  };

  return (
    <div className="border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Create User</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={createUser.isPending}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-md font-medium transition-colors"
        >
          {createUser.isPending ? 'Creating...' : 'Create User'}
        </button>
        {createUser.error && <p className="text-red-400 text-sm">{createUser.error.message}</p>}
        {createUser.isSuccess && (
          <p className="text-green-400 text-sm">User created successfully!</p>
        )}
      </form>
    </div>
  );
}
