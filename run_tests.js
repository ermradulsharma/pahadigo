import { spawn } from 'child_process';
import fs from 'fs';

const child = spawn('npx', ['jest', 'tests/api', '--verbose', '--no-cache', '--forceExit'], {
    env: { ...process.env, NODE_OPTIONS: '--experimental-vm-modules' },
    shell: true
});

let output = '';
child.stdout.on('data', (data) => {
    output += data.toString();
});

child.stderr.on('data', (data) => {
    output += data.toString();
});

child.on('close', (code) => {
    fs.writeFileSync('output_clean.txt', output);
    console.log('Finished with code', code);
});
