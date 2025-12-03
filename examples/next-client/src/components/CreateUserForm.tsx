'use client';

import { useState } from 'react';
import { useMutation, useInvalidateQuery } from '@lemur-bookstores/client/react';

export function CreateUserForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const invalidate = useInvalidateQuery();

  const createUser = useMutation('user.createUser', {
    onSuccess: () => {
      setName('');
      setEmail('');
      // Invalidate the users list to trigger refetch
      invalidate(['user.listUsers', undefined]);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate({ name, email });
  };

  return (
    <div className="card">
      <h2>Create User</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={createUser.isPending}>
            {createUser.isPending ? 'Creating...' : 'Create User'}
          </button>
        </div>
        {createUser.isError && (
          <p className="error-msg">Failed to create user: {createUser.error?.message}</p>
        )}
      </form>
    </div>
  );
}
