/* express and path are prerequisite modules.
 * express is the "web app framework", whilst path refers to the system's path environment variable.*/
var express = require("express");
var path = require("path");
/* The body parser provides functionality to the form.*/
var bodyParser = require("body-parser");
/* A CSV module is added to the project. CSV is an abbreviation for comma-separated values.*/
var csv = require('ya-csv');

/* A server is created and stored within this variable.*/
var app = express();
/* The server is then configured to work within the directory this file is in. */
app.use(express.static(path.join(__dirname, "")));

/* The HTML files, however, must be loaded here. */
app.use(bodyParser.urlencoded({extended:true}));

/* jQuery AJAX GET and POST functions are then used to request and retrieve information. POST is different in that information is supplied by the client with the request for processing.
/* "The "/" is used to mean the main page of a web site, when no specific page is requested." */
app.get("/", function(request, response){
    response.sendFile(path.join(__dirname, "pages/index.html"));
});

/* When the button is clicked on the HTML page, this code is run.
 * It is a JQuery AJAX POST handler. */
app.post('/score', function(request, response){
    /* The name, email and score are obtained from the JS applet and the form on the HTML page. */
    var name = request.body.fullName;
    var email = request.body.email;
    var score = request.body.score;

    /* The data is added to a csv file.
     * a is an abbreviation for appending - I am just adding new data. */
    var database = csv.createCsvFileWriter("scores.csv", {"flags": "a"});
    var data = [name, email, score];

    database.writeRecord(data);
    database.writeStream.end();

    /* A message is returned to the user. */
    response.send("Thanks " + name + ", your score has been recorded!");
});

app.send("/score", function(request, response) {
    var reader = csv.createCsvFileReader("scores.csv");
    reader.setColumnNames(['name', 'email', 'score']);

    var scores = [];
    reader.addListener('data', function(data) {
        scores.push(data);
    });

    reader.addListener('end', function(){
        console.log("Sending scores", JSON.stringify(scores));
        response.send(JSON.stringify(scores));
    })
});

/* The server then listens on port 8080 for any new connections.*/
var server = app.listen((process.env.PORT || 8080), function() {
    /* For convenience, information about this is printed to the console.*/
    var host = server.address().address;
    var port = server.address().port;

    console.log("Bob's Flappy Bird listening at http://%s:%s", host, port);
});