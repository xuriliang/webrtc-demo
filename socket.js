var socket_io = require('socket.io');

var io = null

var socket = Object.create({})

socket.init = function(server){
    io = socket_io(server)
    io.on('connection', function(socket){
        console.log(socket.id)
        console.log('a user connected');

        socket.on('disconnect', function(){
            console.log('user disconnected');
        });
        socket.on('candidate', function(msg){
            console.log('reveive iceCandidate msg')
            socket.broadcast.emit('candidate',msg);
        });
        socket.on('sdp', function(msg){
            console.log('reveive sdp msg')
            socket.broadcast.emit('sdp',msg);
        });
    });
}


module.exports = socket;