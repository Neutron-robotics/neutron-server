import net from 'net';
import * as network from '../src/utils/network';

jest.mock('net');

describe('parseRange', () => {
  test('should parse range string correctly', () => {
    expect(network.parseRange('10000-10100')).toEqual([10000, 10100]);
    expect(network.parseRange('2000-3000')).toEqual([2000, 3000]);
    expect(network.parseRange('4000-4005')).toEqual([4000, 4005]);
  });

  test('should handle invalid range strings', () => {
    const t1 = network.parseRange('invalid');
    const t2 = network.parseRange('1234-');
    const t3 = network.parseRange('-5678');

    expect(t1).toEqual(null);
    expect(t2).toEqual(null);
    expect(t3).toEqual(null);
  });
});

describe('isPortAvailable', () => {
  test('should resolve true if port is available', async () => {
    (net.createServer as jest.Mock).mockImplementation(() => {
      const server = {
        listen: jest.fn().mockImplementation((port: number, cb: Function = () => {}) => {
          process.nextTick(cb);
        }),
        once: jest.fn(),
        close: jest.fn().mockImplementation((cb: Function = () => {}) => {
          process.nextTick(cb);
        })
      };
      (server.once as jest.Mock).mockImplementation((event: string, cb: Function) => {
        if (event === 'listening') {
          process.nextTick(cb);
        }
      });
      return server;
    });

    const available = await network.isPortAvailable(30000);

    await expect(available).toBe(true);
  });

  test('should resolve false if port is in use', async () => {
    (net.createServer as jest.Mock).mockImplementation(() => {
      const server = {
        listen: jest.fn(),
        once: jest.fn()
      };
      (server.once as jest.Mock).mockImplementation((event: string, cb: Function = () => {}) => {
        if (event === 'error') {
          process.nextTick(() => cb({ name: 'EADDRINUSE' }));
        }
      });
      return server;
    });

    await expect(network.isPortAvailable(3000)).resolves.toBe(false);
  });
});
