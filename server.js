'use strict';

const app = require('./app');
const http = require('http');

const server = http.createServer(app);

server.listen(3001);

server.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.log(err);
  process.exit(1);
});

server.on('listening', () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  // eslint-disable-next-line no-console
  console.log(`Listening on: ${bind}`);
});
