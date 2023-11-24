import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";

@Injectable()
export class RoomsService {
  private rooms: Map<string, Set<Socket>> = new Map();

  createRoom(roomName: string) : void {
    this.rooms.set(roomName, new Set());
  }

  joinRoom(socket: Socket, roomName: string) : void{
    socket.join(roomName);
    this.rooms.get(roomName).add(socket);
  }

  leaveRoom(socket: Socket, roomName: string) : void {
    socket.leave(roomName);
    this.rooms.get(roomName).delete(socket);
  }

  disconnectClient(socket: Socket) {
    const connectedRooms = Object.keys(socket.rooms).filter((room) => room !== socket.id);

    connectedRooms.forEach((room) => {
      this.leaveRoom(socket, room);
    });
  }

  getRoomClients(roomName: string): Set<Socket> {
    return this.rooms.get(roomName);
  }
}
