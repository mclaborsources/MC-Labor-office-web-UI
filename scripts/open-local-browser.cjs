const http = require('node:http');
const { spawn } = require('node:child_process');

const url = 'http://127.0.0.1:3000';
const deadline = Date.now() + 120_000;

function retry() {
  if (Date.now() < deadline) setTimeout(check, 1000);
}

function check() {
  const request = http.get(url, (response) => {
    response.resume();
    if (response.statusCode >= 500) return retry();
    const browser = spawn('cmd.exe', ['/d', '/c', 'start', '', url], {
      windowsHide: true,
      stdio: 'ignore',
    });
    browser.on('error', () => console.error(`Open ${url} in your browser.`));
  });
  request.setTimeout(5000, () => request.destroy());
  request.on('error', retry);
}

check();
