import { spawn } from 'node:child_process';
const children=[spawn(process.execPath,['--experimental-sqlite','server/index.mjs'],{stdio:'inherit'}),spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort'],{stdio:'inherit'})];
let stopping=false;function stop(){if(stopping)return;stopping=true;children.forEach(c=>c.kill());}
for(const c of children)c.on('exit',code=>{stop();process.exitCode=code||0;});process.on('SIGINT',stop);process.on('SIGTERM',stop);
