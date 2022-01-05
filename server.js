/*var express = require("express");
var app = express(); // express.createServer();
var path = require('path');
var public = path.join(__dirname, 'public');
const jason = require('./public/messages.json');
app.use('/', express.static(public));*/

var express = require("express");
var path = require('path');
var app = express();
var socket = require('socket.io');


//mongo config
const mongoDB = require('mongodb')
const MongoClient = mongoDB.MongoClient
const connectUrl = 'mongodb://localhost:27017'
const dataBaseName = 'dynamicLoading'
var public = path.join(__dirname, 'public');
const file = require('./public/messages.json');
const { json } = require("body-parser");
const { readFileSync } = require("fs");
//creating messages by screen
var messages1 = [];
var messages2 = [];
var messages3 = [];

async function sortMess(client) {
    const db = client.db(dataBaseName)
    db.collection('messages').find({ "id": /[1]/ }).toArray(function (err, result) {
        if (err) throw err;
        messages1.push(result)
    });
    db.collection('messages').find({ "id": /[2]/ }).toArray(function (err, result) {
        if (err) throw err;
        messages2.push(result);
    });
    db.collection('messages').find({ "id": /[3]/ }).toArray(function (err, result) {
        if (err) throw err;
        messages3.push(result);
    });
}

//upload messges to mongoDB
MongoClient.connect(
    connectUrl,
    { useNewUrlParser: true },
    (error, client) => {
        if (error) {
            return console.log("Can't connect to DB!")
        }
        const db = client.db(dataBaseName)

        console.log('Start delete')
        db.collection('messages').deleteMany({});
        console.log('Done delete')

        db.collection('messages').insertMany(file, (error) => {
            if (error) {
                return console.log(error)
            }
        })
        console.log('Done insert all json')
        sortMess(client);
        console.log('Done sortting messeges!')
    },
)

var screenNumber;
const port = 4041;
app.use('/', express.static(public));

var server = app.listen(port, () => console.log('the server is runnng'));
var io = socket(server);


app.get('/favicon.ico', function (req, res) {
    res.status(204)
    res.end()
})

//save the screen number
app.get('/screen=:id', function (request, response) {

    screenNumber = (request.params.id);
    console.log(request.params.id);
    if (screenNumber != 0) {
        if (screenNumber % 3 == 0) {
            screenNumber = 3;
        }
        else {
            screenNumber = screenNumber % 3
        };
    }


    response.sendFile(__dirname + "/main.html");
});

//return the client the JSON of messages 
io.on('connection', function (socket) {
    console.log('client connect');
    console.log(messages1);
    socket.emit('src', screenNumber);
    socket.emit('mes1', messages1);
    socket.emit('mes2', messages2);
    socket.emit('mes3', messages3);


});



//http://localhost:4041/screen=2