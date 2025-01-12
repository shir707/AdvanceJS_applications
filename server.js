
var bodyParser = require('body-parser');
var express = require("express");
var path = require('path');
var app = express();
var socket = require('socket.io');
var session = require("express-session");

//app config
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

app.use(session({
    key: "admin",
    secret: "admin"
}));


//mongo config
const mongoDB = require('mongodb')
const MongoClient = mongoDB.MongoClient
const connectUrl = 'mongodb://localhost:27017'
const dataBaseName = 'dynamicLoading'
var public = path.join(__dirname, 'public');
const file = require('./public/messages.json');
const { Console } = require("console");

//creating messages by screen
var messages1 = [];
var messages2 = [];
var messages3 = [];

async function sortMess(db) {

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
    console.log('Done sortting messeges!')
}
async function uploadMess(db) {
    db.collection('messages').insertMany(file, (error) => {
        if (error) {
            return console.log(error)
        }
        console.log('Done insert all json')
    })
    sortMess(db);
}
//upload messges to mongoDB
MongoClient.connect(
    connectUrl,
    { useNewUrlParser: true },
    (error, client) => {
        if (error) {
            return console.log("Can't connect to DB!")
        }
        //save database reference
        const db = client.db(dataBaseName)

        console.log('Start delete')
        db.collection('messages').deleteMany({});
        console.log('Done delete')
        db.collection('admin').deleteMany({});
        db.collection('admin').insertOne({
            email: "admin@gmail.com",
            password: "admin1"
        })
        uploadMess(db);
    },
)

var screenNumber;
const port = 4042;
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
    if (screenNumber != 0) {
        if (screenNumber % 3 == 0) {
            screenNumber = 3;
        }
        else {
            screenNumber = screenNumber % 3
        };
        response.sendFile(__dirname + "/main.html");
    }
    //try to log to admin page
    else {

        if (request.session.admin) {
            response.sendFile(__dirname + "/admin.html");
        }
        else {
            response.sendFile(__dirname + "/login.html");
        }
    }

});
//admin screen
app.post("/screen=0", function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var htmlData = 'Hello: ' + email + "  " + password;
    console.log(htmlData)
    MongoClient.connect(
        connectUrl,
        { useNewUrlParser: true },
        (error, client) => {
            if (error) {
                return console.log("Can't connect to DB!")
            }
            //save database reference
            const db = client.db(dataBaseName)
            db.collection('admin').findOne({ "email": email, "password": password }, function (error, admin) {
                if (error) throw error;
                if (admin != "") {
                    req.session.admin = admin;

                }
                console.log(admin);
                res.send(admin);

            });
        },
    )

})
app.get('/screen=0/admin', function (req, res) {
    if (req.session.admin) {
        res.sendFile(__dirname + "/admin.html");
    }
    else {
        res.sendFile(__dirname + "/login.html");
    }
    res.sendFile(__dirname + "/admin.html");

})



//return the client the JSON of messages 
io.on('connection', function (socket) {
    MongoClient.connect(
        connectUrl,
        { useNewUrlParser: true },
        (error, client) => {
            if (error) {
                return console.log("Can't connect to DB!")
            }
            //conectted
            const db = client.db(dataBaseName)
            db.collection('logFile').insertOne({
                socketId: socket.id,
                date: new Date().toLocaleString(),
                screen: screenNumber,
            });
            db.collection('connect').insertOne({
                socketId: socket.id,
                date: new Date().toLocaleString(),
                screen: screenNumber,
            });
        },
    )

    console.log('client connect');
    socket.emit('src', screenNumber);
    socket.emit('mes1', messages1);
    socket.emit('mes2', messages2);
    socket.emit('mes3', messages3);
    socket.on('disconnect', function () {

        MongoClient.connect(
            connectUrl,
            { useNewUrlParser: true },
            (error, client) => {
                if (error) {
                    return console.log("Can't connect to DB!")
                }
                //conectted
                const db = client.db(dataBaseName)

                db.collection('connect').deleteOne({
                    socketId: socket.id
                });
            },
        )
    });
});





//http://localhost:4042/screen=2
//http://localhost:4042/screen=0