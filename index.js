// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

var main = require('./main-game');

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/web_mockup/mockup.html'));
  });

io.on('connection', (socket) => {
    console.log('io connection');

    socket.on('disconnect', () => {
        console.log('io on disconnect');

        if (main.playerList.hasOwnProperty(socket.userName)){
            console.log('remove user: ' + socket.userName);
            
            socket.broadcast.emit('playerDisconnect', socket.userName);
            delete main.playerList[socket.userName];
        }
    });

    socket.on('login', (data)=> {
        let userName = data.userName;
        userName += '(' + socket.id + ')';

        let player = new main.Player(userName, socket.id);
        main.playerList[userName] = player;
        socket.userName = userName;

        console.log('Login: userName: ' + userName + ', main: ' + main.playerList[userName].name);
        

        socket.emit('loginDone', {
            name: userName,
            playerList: main.getOtherPlayers()
        });

        // sending to all clients except sender
        socket.broadcast.emit('playerJoin', {
            name: userName,
            opponentName: ''
        });
    });

    
    socket.on('invitePlayer', (data)=> {
        let inviterName = socket.userName;
        let invitedName = data.invitedName;
        console.log('inviter:' + inviterName + ', invited:' + invitedName);

        if (main.playerList.hasOwnProperty (inviterName)){
            if (main.playerList[inviterName].opponentName){
                // emit opponent changed
                let previousInvitedName = main.playerList[inviterName].opponentName;
                let previousInvitedPlayer = main.playerList[previousInvitedName];
                io.sockets.sockets[previousInvitedPlayer.id].emit('inviteCancel', inviterName);
            }

            main.playerList[inviterName].opponentName = invitedName;

            let invitedPlayer = main.playerList[invitedName];

            if (invitedPlayer === undefined || invitedName === null){
                console.log('/!\ Invite invalid player');
                return;
            }

            socket.emit('inviteSent', invitedName);
            io.sockets.sockets[invitedPlayer.id].emit('inviteReceived', inviterName);

            if (invitedPlayer.opponentName == inviterName){
                console.log('match found');
                socket.emit('matchFound', {
                    opponentName: invitedName,
                    moveFirst: false
                });
                io.sockets.sockets[invitedPlayer.id].emit('matchFound', {
                    opponentName: inviterName,
                    moveFirst: true
                });
            }
        }
    });

    socket.on('turnMove', (data)=> {
        let thisPlayer = main.playerList[socket.userName];
        let opponentPlayer = main.playerList[thisPlayer.opponentName];

        console.log('turnMove ' + opponentPlayer.name);
        console.log(data);

        io.sockets.sockets[opponentPlayer.id].emit('opponentMove', data);
    });

    socket.on('matchWin', (data)=> {
        let thisPlayer = main.playerList[socket.userName];
        let opponentPlayer = main.playerList[thisPlayer.opponentName];

        thisPlayer.opponentName = '';
        opponentPlayer.opponentName = '';

        socket.emit('matchEnd', 'win');
        io.sockets.sockets[opponentPlayer.id].emit('matchEnd', 'lose');
    });
});

