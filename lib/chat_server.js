var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function(server) {
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
    socket.on('rooms', function() { //Wyświetlenie użytkownika wraz z listą pokoi, w których prowadzi czat.
    socket.emit('rooms', io.sockets.manager.rooms);
    });
    handleClientDisconnection(socket, nickNames, namesUsed); //Zdefiniowanie logiki wykonywanej podczas rozłączania użytkownika.
    });
    };