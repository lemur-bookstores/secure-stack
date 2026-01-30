# Full-Stack Application Example

This guide demonstrates building a complete full-stack application with SecureStack, including authentication, real-time features, and a React frontend.

## What We'll Build

A real-time task management application with:
- User authentication (JWT)
- Task CRUD operations
- Real-time task updates
- Team collaboration
- Role-based access control

## Project Structure

```
task-manager/
├── server/
│   ├── src/
│   │   ├── routers/
│   │   │   ├── auth.ts
│   │   │   ├── task.ts
│   │   │   └── team.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── context.ts
│   │   └── index.ts
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   │   └── client.ts
│   │   └── App.tsx
│   └── package.json
└── shared/
    └── types.ts
```

## Backend Implementation

### Database Schema

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(USER)
  teams     TeamMember[]
  tasks     Task[]
  createdAt DateTime @default(now())
}

enum Role {
  USER
  ADMIN
}

model Team {
  id        String       @id @default(uuid())
  name      String
  members   TeamMember[]
  tasks     Task[]
  createdAt DateTime     @default(now())
}

model TeamMember {
  id     String @id @default(uuid())
  userId String
  user   User   @relation(fields: [userId], references: [id])
  teamId String
  team   Team   @relation(fields: [teamId], references: [id])
  role   TeamRole @default(MEMBER)
  
  @@unique([userId, teamId])
}

enum TeamRole {
  OWNER
  ADMIN
  MEMBER
}

model Task {
  id          String     @id @default(uuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  priority    Priority   @default(MEDIUM)
  assigneeId  String?
  assignee    User?      @relation(fields: [assigneeId], references: [id])
  teamId      String
  team        Team       @relation(fields: [teamId], references: [id])
  dueDate     DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}
```

### Authentication Router

```typescript
// server/src/routers/auth.ts
import { router } from '@lemur-bookstores/secure-stack-core';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SecureStackError } from '@lemur-bookstores/secure-stack-core';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authRouter = router()
  .mutation('register', {
    input: z.object({
      email: z.string().email(),
      name: z.string().min(2),
      password: z.string().min(8),
    }),
    handler: async ({ input, ctx }) => {
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      
      if (existing) {
        throw new SecureStackError({
          code: 'CONFLICT',
          message: 'Email already registered',
        });
      }
      
      const hashedPassword = await bcrypt.hash(input.password, 10);
      
      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          name: input.name,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
      
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return { user, token };
    },
  })
  
  .mutation('login', {
    input: z.object({
      email: z.string().email(),
      password: z.string(),
    }),
    handler: async ({ input, ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });
      
      if (!user) {
        throw new SecureStackError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }
      
      const valid = await bcrypt.compare(input.password, user.password);
      
      if (!valid) {
        throw new SecureStackError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }
      
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      };
    },
  })
  
  .query('me', {
    middleware: requireAuth,
    handler: async ({ ctx }) => {
      return ctx.user;
    },
  });
```

### Task Router with Real-time

```typescript
// server/src/routers/task.ts
import { router, middleware } from '@lemur-bookstores/secure-stack-core';
import { z } from 'zod';
import { EventEmitter } from 'events';

const taskEvents = new EventEmitter();

export const taskRouter = router()
  .query('list', {
    middleware: requireAuth,
    input: z.object({
      teamId: z.string(),
      status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    }),
    handler: async ({ input, ctx }) => {
      // Check team membership
      const member = await ctx.db.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: ctx.user.id,
            teamId: input.teamId,
          },
        },
      });
      
      if (!member) {
        throw new SecureStackError({
          code: 'FORBIDDEN',
          message: 'Not a team member',
        });
      }
      
      const tasks = await ctx.db.task.findMany({
        where: {
          teamId: input.teamId,
          ...(input.status && { status: input.status }),
        },
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      });
      
      return tasks;
    },
  })
  
  .mutation('create', {
    middleware: requireAuth,
    input: z.object({
      teamId: z.string(),
      title: z.string().min(1),
      description: z.string().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
      assigneeId: z.string().optional(),
      dueDate: z.string().datetime().optional(),
    }),
    handler: async ({ input, ctx }) => {
      const member = await ctx.db.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: ctx.user.id,
            teamId: input.teamId,
          },
        },
      });
      
      if (!member) {
        throw new SecureStackError({
          code: 'FORBIDDEN',
          message: 'Not a team member',
        });
      }
      
      const task = await ctx.db.task.create({
        data: {
          title: input.title,
          description: input.description,
          priority: input.priority,
          teamId: input.teamId,
          assigneeId: input.assigneeId,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        },
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      
      // Emit event for real-time updates
      taskEvents.emit(`team:${input.teamId}`, {
        type: 'task_created',
        task,
      });
      
      return task;
    },
  })
  
  .mutation('update', {
    middleware: requireAuth,
    input: z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
      assigneeId: z.string().optional(),
    }),
    handler: async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      
      const existing = await ctx.db.task.findUnique({
        where: { id },
        include: { team: true },
      });
      
      if (!existing) {
        throw new SecureStackError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }
      
      const member = await ctx.db.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: ctx.user.id,
            teamId: existing.teamId,
          },
        },
      });
      
      if (!member) {
        throw new SecureStackError({
          code: 'FORBIDDEN',
          message: 'Not a team member',
        });
      }
      
      const task = await ctx.db.task.update({
        where: { id },
        data: updateData,
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      
      taskEvents.emit(`team:${existing.teamId}`, {
        type: 'task_updated',
        task,
      });
      
      return task;
    },
  })
  
  .subscription('onTaskUpdate', {
    middleware: requireAuth,
    input: z.object({
      teamId: z.string(),
    }),
    handler: async function* ({ input, ctx }) {
      // Verify team membership
      const member = await ctx.db.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: ctx.user.id,
            teamId: input.teamId,
          },
        },
      });
      
      if (!member) {
        throw new SecureStackError({
          code: 'FORBIDDEN',
          message: 'Not a team member',
        });
      }
      
      yield { type: 'connected' };
      
      const channel = `team:${input.teamId}`;
      
      while (true) {
        const event = await new Promise((resolve) => {
          taskEvents.once(channel, resolve);
        });
        
        yield event;
      }
    },
  });
```

## Frontend Implementation

### Client Setup

```typescript
// client/src/lib/client.ts
import { createClient } from '@lemur-bookstores/secure-stack-client';

export const client = createClient({
  url: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});
```

### Authentication Context

```typescript
// client/src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useMutation, useQuery } from '@lemur-bookstores/secure-stack-client/react';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  
  const { data: user, isLoading } = useQuery('auth.me', {
    input: {},
    enabled: !!token,
  });
  
  const loginMutation = useMutation('auth.login');
  
  const login = async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ email, password });
    localStorage.setItem('token', result.token);
    setToken(result.token);
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Task Board Component

```typescript
// client/src/components/TaskBoard.tsx
import { useQuery, useMutation, useSubscription } from '@lemur-bookstores/secure-stack-client/react';
import { useState } from 'react';

export function TaskBoard({ teamId }: { teamId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const { data, isLoading } = useQuery('task.list', {
    input: { teamId },
    onSuccess: (data) => setTasks(data),
  });
  
  // Real-time updates
  useSubscription('task.onTaskUpdate', {
    input: { teamId },
    onData: (event) => {
      if (event.type === 'task_created') {
        setTasks(prev => [...prev, event.task]);
      } else if (event.type === 'task_updated') {
        setTasks(prev =>
          prev.map(t => t.id === event.task.id ? event.task : t)
        );
      }
    },
  });
  
  const updateTask = useMutation('task.update');
  
  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await updateTask.mutateAsync({ id: taskId, status });
  };
  
  if (isLoading) return <div>Loading...</div>;
  
  const columns = {
    TODO: tasks.filter(t => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
    DONE: tasks.filter(t => t.status === 'DONE'),
  };
  
  return (
    <div className="task-board">
      {Object.entries(columns).map(([status, tasks]) => (
        <div key={status} className="column">
          <h2>{status.replace('_', ' ')}</h2>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
```

### Create Task Form

```typescript
// client/src/components/CreateTaskForm.tsx
import { useMutation, useInvalidateQuery } from '@lemur-bookstores/secure-stack-client/react';
import { useState } from 'react';

export function CreateTaskForm({ teamId }: { teamId: string }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const invalidate = useInvalidateQuery();
  
  const createTask = useMutation('task.create', {
    onSuccess: () => {
      setTitle('');
      setDescription('');
      invalidate('task.list');
    },
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTask.mutateAsync({
      teamId,
      title,
      description,
      priority: 'MEDIUM',
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />
      <button type="submit" disabled={createTask.isLoading}>
        {createTask.isLoading ? 'Creating...' : 'Create Task'}
      </button>
    </form>
  );
}
```

## Running the Application

### Start Backend

```bash
cd server
npm install
npx prisma migrate dev
npm run dev
```

### Start Frontend

```bash
cd client
npm install
npm run dev
```

## Key Features Demonstrated

1. **Authentication**: JWT-based auth with protected routes
2. **Real-time Updates**: WebSocket subscriptions for live task updates
3. **Type Safety**: End-to-end type inference
4. **Optimistic Updates**: Instant UI feedback
5. **Cache Management**: Automatic cache invalidation
6. **Error Handling**: Consistent error handling across stack
7. **RBAC**: Team-based access control

## Next Steps

- [Add File Uploads](../advanced/file-uploads.md)
- [Implement Search](../advanced/search.md)
- [Deploy to Production](../advanced/deployment.md)
- [Add Testing](../advanced/testing.md)
