
const fs = require('fs');
const path = require('path');
const service = require('../services/baileys.service');

// Mock Baileys
jest.mock('@whiskeysockets/baileys', () => {
    return {
        default: jest.fn(() => ({
            ev: {
                on: jest.fn(),
                emit: jest.fn(),
            },
            ws: {
                on: jest.fn(),
                close: jest.fn(),
            }
        })),
        useMultiFileAuthState: jest.fn(() => ({
            state: {},
            saveCreds: jest.fn(),
        })),
        fetchLatestBaileysVersion: jest.fn(() => ({ version: [2, 0, 0] })),
        DisconnectReason: {
            loggedOut: 401,
            badSession: 500,
            connectionReplaced: 440,
            timedOut: 408
        }
    };
});

// Mock fs to prevent actual file creation/deletion
jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    existsSync: jest.fn(() => false), // Mock that auth dir doesn't exist
    mkdirSync: jest.fn(),
    rmSync: jest.fn(),
    writeFileSync: jest.fn(),
}));

describe('Baileys Service Persistence', () => {
    const sessionId = 'test-persistence';

    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    test('should NOT delete session after multiple disconnects', async () => {
        // 1. Start a session
        await service.createSession(sessionId);

        const makeWASocket = require('@whiskeysockets/baileys').default;
        const mockSock = makeWASocket.mock.results[0].value;
        const connectionUpdateHandler = mockSock.ev.on.mock.calls.find(call => call[0] === 'connection.update')[1];

        expect(connectionUpdateHandler).toBeDefined();

        // 2. Simulate repeated disconnects (more than the old limit of 5)
        for (let i = 0; i < 10; i++) {
            await connectionUpdateHandler({
                connection: 'close',
                lastDisconnect: {
                    error: { output: { statusCode: 408 } }
                }
            });
            // Advance time to allow retry (mocking the delay)
            jest.advanceTimersByTime(60000);
            await Promise.resolve(); await Promise.resolve();
        }

        // 3. Verify deleteSession (fs.rmSync) logic was NEVER triggered
        expect(fs.rmSync).not.toHaveBeenCalled();
    });
});
