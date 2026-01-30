import { useQuery, useMutation } from '@lemur-bookstores/secure-stack-client/react'
import { useState } from 'react'

function App() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  
  // Query example
  const { data: users, isLoading, error, refetch } = useQuery('user.listUsers')

  // Mutation example
  const createUser = useMutation('user.createUser', {
    onSuccess: () => {
      setName('')
      setEmail('')
      refetch() // Refresh list after creation
    }
  })

  if (isLoading) return <div className="loading">Loading users...</div>
  if (error) return <div className="error">Error: {error.message}</div>

  return (
    <div className="container">
      <h1>SecureStack React Client</h1>
      
      <div className="card">
        <h2>Create User</h2>
        <div className="form-group">
          <input 
            type="text" 
            placeholder="Name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button 
            onClick={() => createUser.mutate({ name, email })}
            disabled={createUser.isPending}
          >
            {createUser.isPending ? 'Creating...' : 'Create User'}
          </button>
        </div>
        {createUser.isError && (
          <p className="error-msg">Failed to create user: {createUser.error?.message}</p>
        )}
      </div>

      <div className="card">
        <h2>Users List</h2>
        <ul className="user-list">
          {Array.isArray(users) && users.map((user: any) => (
            <li key={user.id} className="user-item">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
              <span className="role">{user.role}</span>
            </li>
          ))}
          {Array.isArray(users) && users.length === 0 && (
            <p>No users found.</p>
          )}
        </ul>
      </div>
    </div>
  )
}

export default App
