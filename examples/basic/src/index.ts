/**
 * Basic example of SecureStack framework
 */

import { SecureStack, router, ServiceType } from '@lemur-bookstores/core';
import { z } from 'zod';

// Create the main application
const app = new SecureStack({
  name: 'basic-example',
  port: 3000,
  type: ServiceType.Microservice,
});

// Define a simple user router
const userRouter = router()
  .query('getById', {
    input: z.string(),
    handler: async ({ input }) => {
      console.log(`Getting user with ID: ${input}`);
      return {
        id: input,
        name: 'John Doe',
        email: 'john@example.com',
      };
    },
  })
  .query('list', {
    handler: async () => {
      console.log('Listing all users');
      return [
        { id: '1', name: 'John Doe' },
        { id: '2', name: 'Jane Smith' },
      ];
    },
  })
  .mutation('create', {
    input: z.object({
      name: z.string(),
      email: z.string().email(),
    }),
    handler: async ({ input }: any) => {
      console.log('Creating user:', input);
      return {
        id: Math.random().toString(36).substring(7),
        ...input,
      };
    },
  });

// Register the router
app.router('user', userRouter);

// Start the server
app.start().then(() => {
  console.log('✨ Example server is running!');
  console.log('📝 Try calling the user.getById query');
});
