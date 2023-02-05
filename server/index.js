
const { Socket } = require("dgram");
const express= require("express");
const http= require("http");
const mongoose  = require("mongoose");

const app =express();
const port =process.env.PORT || 3000 ;
var server =http.createServer(app);
const Room =require('./models/room');
var io = require("socket.io")(server);

app.use(express.json());// middleware

const DB ="mongodb+srv://prateek:7728335@cluster0.qz8nt8j.mongodb.net/?retryWrites=true&w=majority";

io.on('connection',(socket) =>{
    console.log("connected!");
    //function for create room
    socket.on("createRoom", async ({ nickname }) => {
        console.log(nickname);
        try{
            //room created
            let room = new Room();
            //player is stored in the room
            let player ={
                socketID: socket.id,
                nickname: nickname,
                playerType: 'X',
            };
            room.players.push(player);// pushing player in the list of players
            room.turn =player,

            // now to save the data in mongodb.

            room = await room.save();// with this data will get saved in mongodb,return rooms id and various other things
            console.log(room);
            const roomId =room._id.toString();// saving room id
            socket.join(roomId);
            // tell our client that  room has created and player is taken to the next screen

            //io ->send data to everyone
            //socket -> sending data to yourself
            io.to(roomId).emit('createRoomSuccess',room);
        }catch(e){
            console.log(e);
        }
        
    });

    //function for join room
    socket.on("joinRoom", async ({ nickname, roomId }) => {
        try {
          if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
            socket.emit("errorOccurred", "Please enter a valid room ID.");
            return;
          }
          let room = await Room.findById(roomId);
    
          if (room.isJoin) {
            let player = {
              nickname,
              socketID: socket.id,
              playerType: "O",
            };
            socket.join(roomId);
            room.players.push(player);
            room.isJoin = false;
            room = await room.save();
            io.to(roomId).emit("joinRoomSuccess", room);
            io.to(roomId).emit("updatePlayers", room.players);
            io.to(roomId).emit("updateRoom", room);
          } else {
            socket.emit(
              "errorOccurred",
              "The game is in progress, try again later."
            );
          }
        } catch (e) {
          console.log(e);
        }
    });

    socket.on("tap", async ({ index, roomId }) => {
        try {
          let room = await Room.findById(roomId);

          let choice = room.turn.playerType; // x or o
          if (room.turnIndex == 0) {
            room.turn = room.players[1];
            room.turnIndex = 1;
          } else {
            room.turn = room.players[0];
            room.turnIndex = 0;
          }
          room = await room.save();
          io.to(roomId).emit("tapped", {
            index,
            choice,
            room,
          });
        } catch (e) {
          console.log(e);
        }
      });

    socket.on("winner", async ({ winnerSocketId, roomId }) => {
        try {
          let room = await Room.findById(roomId);
          let player = room.players.find(
            (playerr) => playerr.socketID == winnerSocketId
          );
          player.points += 1;
          room = await room.save();

          if (player.points >= room.maxRounds) {
            io.to(roomId).emit("endGame", player);
          } else {
            io.to(roomId).emit("pointIncrease", player);
          }
        } catch (e) {
          console.log(e);
        }
      });
});
mongoose.connect(DB).then(() =>{
    console.log("Connection Successful");
}).catch((e) =>{
    console.log(e);
})
//Promiss is JS == Future in dart.
server.listen(port,'0.0.0.0',() =>{
    console.log('Server start and running on port' + port);
});