// import { Injectable, OnModuleInit } from "@nestjs/common";
// import { Socket, io } from "socket.io-client";


// @Injectable()
// export class SocketClient implements OnModuleInit{
//   public socketClient: Socket;

//   constructor(){
//     this.socketClient = io('http://localhost:3000/socket');
//   }
//   onModuleInit() {
//     this.registerConsumerEvents()
//   }

//   private registerConsumerEvents() {
//     this.socketClient.emit('newMessage', { msg: 'Hello World'});
//     this.socketClient.on('connect', () => {
//       console.log('Connected to gateway')
//     });
//     this.socketClient.on('onMessage', (payload:any) => {
//       console.log('socketClient Class')
//       console.log(payload)
//     });
//   }
// }