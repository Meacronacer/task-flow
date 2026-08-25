import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventsGateway } from './events.gateway';
import { WsJwtGuard } from './ws-jwt.guard';

// Минимальный mock Socket
const makeSocket = (userId = 'user-1') => ({
  id: 'socket-1',
  data: { user: { id: userId, email: 'test@test.com' } },
  handshake: { auth: { token: 'valid' }, query: {} },
  join: jest.fn(),
  leave: jest.fn(),
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
});

describe('EventsGateway', () => {
  let gateway: EventsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsGateway,
        {
          provide: WsJwtGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
        { provide: JwtService, useValue: { verify: jest.fn() } },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('secret') },
        },
      ],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);

    // Мокаем WebSocketServer
    (gateway as unknown as { server: unknown }).server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
  });

  describe('handleConnection', () => {
    it('should log connection without throwing', () => {
      const socket = makeSocket();
      expect(() =>
        gateway.handleConnection(
          socket as unknown as import('socket.io').Socket,
        ),
      ).not.toThrow();
    });
  });

  describe('handleJoinProject', () => {
    it('should join socket to project room', () => {
      const socket = makeSocket();

      gateway.handleJoinProject(socket as never, { projectId: 'proj-1' });

      expect(socket.join).toHaveBeenCalledWith('project:proj-1');
    });

    it('should emit member.online to room', () => {
      const socket = makeSocket();

      gateway.handleJoinProject(socket as never, { projectId: 'proj-1' });

      expect(socket.to).toHaveBeenCalledWith('project:proj-1');
      expect(socket.emit).toHaveBeenCalledWith(
        'member.online',
        expect.objectContaining({ userId: 'user-1', projectId: 'proj-1' }),
      );
    });
  });

  describe('handleLeaveProject', () => {
    it('should leave room and emit member.offline', () => {
      const socket = makeSocket();

      // Сначала join
      gateway.handleJoinProject(socket as never, { projectId: 'proj-1' });
      socket.emit.mockClear();
      socket.to.mockClear();

      gateway.handleLeaveProject(socket as never, { projectId: 'proj-1' });

      expect(socket.leave).toHaveBeenCalledWith('project:proj-1');
      expect(socket.emit).toHaveBeenCalledWith(
        'member.offline',
        expect.objectContaining({ userId: 'user-1', projectId: 'proj-1' }),
      );
    });
  });

  describe('handleDisconnect', () => {
    it('should emit member.offline to all joined projects on disconnect', () => {
      const socket = makeSocket();

      gateway.handleJoinProject(socket as never, { projectId: 'proj-1' });
      gateway.handleJoinProject(socket as never, { projectId: 'proj-2' });
      socket.emit.mockClear();

      gateway.handleDisconnect(socket as never);

      expect(socket.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('emitToProject', () => {
    it('should emit event to project room via server', () => {
      const serverMock = (
        gateway as unknown as { server: { to: jest.Mock; emit: jest.Mock } }
      ).server;

      gateway.emitToProject('proj-1', 'task.moved', {
        taskId: 'task-1',
        fromColumnId: 'col-1',
        toColumnId: 'col-2',
        position: 0,
        movedBy: 'user-1',
      });

      expect(serverMock.to).toHaveBeenCalledWith('project:proj-1');
      expect(serverMock.emit).toHaveBeenCalledWith(
        'task.moved',
        expect.objectContaining({ taskId: 'task-1' }),
      );
    });
  });
});
