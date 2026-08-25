import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from './ws-jwt.guard';
import type { WsEventName, WsPayload, WsMemberPayload } from './types';

interface SocketWithUser extends Socket {
  data: {
    user: { id: string; email: string };
  };
}

interface JoinProjectData {
  projectId: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env['CLIENT_URL'] ?? 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private readonly userProjects = new Map<string, Set<string>>();

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: SocketWithUser): void {
    this.logger.log(`Client disconnected: ${client.id}`);

    const userId = client.data?.user?.id;
    if (!userId) return;

    const projects = this.userProjects.get(userId);
    if (!projects) return;

    for (const projectId of projects) {
      client.to(this.roomName(projectId)).emit('member.offline', {
        userId,
        projectId,
      } satisfies WsMemberPayload);
    }

    this.userProjects.delete(userId);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join-project')
  handleJoinProject(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() data: JoinProjectData,
  ): void {
    const { projectId } = data;
    const userId = client.data.user.id;
    const room = this.roomName(projectId);

    client.join(room);

    const projects = this.userProjects.get(userId) ?? new Set<string>();
    projects.add(projectId);
    this.userProjects.set(userId, projects);

    client.to(room).emit('member.online', {
      userId,
      projectId,
    } satisfies WsMemberPayload);

    this.logger.log(`User ${userId} joined project room ${room}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave-project')
  handleLeaveProject(
    @ConnectedSocket() client: SocketWithUser,
    @MessageBody() data: JoinProjectData,
  ): void {
    const { projectId } = data;
    const userId = client.data.user.id;
    const room = this.roomName(projectId);

    client.leave(room);

    const projects = this.userProjects.get(userId);
    if (projects) {
      projects.delete(projectId);
    }

    client.to(room).emit('member.offline', {
      userId,
      projectId,
    } satisfies WsMemberPayload);
  }

  emitToProject(
    projectId: string,
    event: WsEventName,
    payload: WsPayload,
  ): void {
    this.server.to(this.roomName(projectId)).emit(event, payload);
  }

  private roomName(projectId: string): string {
    return `project:${projectId}`;
  }
}
