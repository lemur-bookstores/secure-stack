#!/usr/bin/env node

import('../dist/cli.js').then((module) => {
  module.run();
}).catch((error) => {
  console.error('Failed to start CLI:', error);
  process.exit(1);
});
