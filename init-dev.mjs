import { spawn } from 'child_process';

const nextProcess = spawn('pnpm', ['nextDev'], { stdio: 'inherit', shell: false });

nextProcess.on('error', (err) => {
  console.error('Error:', err);
});

import("./cron/index.js");
