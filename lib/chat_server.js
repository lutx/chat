var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function (server) {
    io = socketio.listen(server); //Uruchomienie serwera Socket.IO i umożliwienie mu współpracy z istniejącym serwerem HTTP.
    io.set('log level', 1);
    io.sockets.on('connection', function (socket) { //Zdefiniowanie sposobu obsługi połączenia użytkownika.
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
        //Przypisanie użytkownikowi nazwy gościa podczas nawiązywania połączenia.
        joinRoom(socket, 'Lobby'); //Umieszczenie użytkownika w pokoju Lobby, gdy próbuje on nawiązać połączenie.
        handleMessageBroadcasting(socket, nickNames); //Obsługa wiadomości użytkownika,
        //prób zmiany nazwy użytkownika, a także tworzenia lub zmiany pokoju czatu.
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);
        socket.on('rooms', function () { //Wyświetlenie użytkownika wraz z listą pokoi, w których prowadzi czat.
            socket.emit('rooms', io.sockets.manager.rooms);
        });
        handleClientDisconnection(socket, nickNames, namesUsed); //Zdefiniowanie logiki wykonywanej podczas rozłączania użytkownika.
    });
//};

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
    var name = 'Gość' + guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult', {
        success: true,
        name: name
    });
    namesUsed.push(name);
    return guestNumber + 1;
}

function joinRoom(socket, room) {
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult', { room: room });
    socket.broadcast.to(room).emit('message', {

        text: nickNames[socket.id] + ' dołączył do pokoju ' + room + '.'
    });
    var usersInRoom = io.sockets.clients(room);
    if (usersInRoom.length > 1) {
        var usersInRoomSummary = 'Lista użytkowników w pokoju ' + room + ': ';
        for (var index in usersInRoom) {
            var userSocketId = usersInRoom[index].id;
            if (userSocketId != socket.id) {
                if (index > 0) {
                    usersInRoomSummary += ', ';
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
        }
        usersInRoomSummary += '.';
        socket.emit('message', { text: usersInRoomSummary });
    }
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
    socket.on('nameAttempt', function (name) {
        if (name.indexOf('Gość') == 0) {
            socket.emit('nameResult', {
                success: false,
                message: 'Nazwa użytkownika nie może rozpoczynać się od słowa "Gość".'
            });
        } else {
            if (namesUsed.indexOf(name) == -1) {
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex];
                socket.emit('nameResult', {
                    success: true,
                    name: name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                    text: previousName + ' zmienił nazwę na ' + name + '.'
                });
            } else {
                socket.emit('nameResult', {
                    success: false,
                    message: 'Ta nazwa jest używana przez innego użytkownika.'
                });
            }
        }
    });
}

function handleMessageBroadcasting(socket) {
    socket.on('message', function (message) {
        socket.broadcast.to(message.room).emit('message', {
            text: nickNames[socket.id] + ': ' + message.text
        });
    });
}

function handleRoomJoining(socket) {
    socket.on('join', function (room) {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    });
}

function handleClientDisconnection(socket) {
    socket.on('disconnect', function () {
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}
};
