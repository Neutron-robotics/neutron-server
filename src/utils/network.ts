import { createServer } from 'net';

function parseRange(rangeStr: string) {
  const [startStr, endStr] = rangeStr.split('-');
  const start = Number(startStr);
  const end = Number(endStr);

  if (Number.isNaN(start) || Number.isNaN(end) || startStr.trim() === '' || endStr.trim() === '') {
    return null;
  }
  return [start, end];
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = createServer();

    server.once('error', err => {
      if (err.name === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

async function findFreeTcpPortWithinRange(start: number, end: number, jump: number = 2) {
  const availablePorts = [];

  for (let port = start; port <= end; port += jump) {
    const isAvailable = await isPortAvailable(port);
    if (isAvailable) {
      const nextPort = port + 1;
      if (nextPort <= end) {
        const isNextAvailable = await isPortAvailable(nextPort);
        if (isNextAvailable) {
          availablePorts.push(port);
        }
      }
    }
  }

  if (availablePorts.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * availablePorts.length);
  return availablePorts[randomIndex];
}

export {
  findFreeTcpPortWithinRange,
  parseRange, isPortAvailable
};
