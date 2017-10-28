const express = require('express');
const hbs = require('express-handlebars');
const Handlebars = require('handlebars');
const bodyParser = require('body-parser');
const _ = require('lodash');
var conn = require('./dbconnect');
const url = require('url');

var app = express();

app.engine('hbs', hbs({extname: 'hbs', layoutsDir: __dirname + '/views'}));
app.set('view engine', 'hbs');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

Handlebars.registerHelper('getYear', function (dateString) {
    return new Handlebars.SafeString(dateString.getYear() + 1900);
});

Handlebars.registerHelper('getDate', function (dateString) {
    return new Handlebars.SafeString(dateString.toString().substring(4, 15));
});

app.get('/', function (req, res) {
    const sql = "SELECT title, release_date, gid, rating, image_url FROM games_master ORDER BY release_date DESC LIMIT 8;";
    conn.query(sql, function (err, games, fields) {
        if (err) throw err;
        const sql2 = "SELECT title, release_date, gid, image_url FROM games_master ORDER BY rating DESC LIMIT 6;";
        conn.query(sql2, function (err, rated, fields) {
            res.render('index', {games: games, featured: games.slice(0,6), rated: rated});
        });
    });
});

app.get('/gameinfo/:gid', function (req, res) {
    const sql = "SELECT requirements.ram, requirements.processor, requirements.gpu, requirements.os, requirements.space, games_master.title, games_master.description, games_master.rating, games_master.developers, games_master.release_date, trailers.video_url FROM games_master, trailers, requirements WHERE games_master.gid= "+req.params.gid+" AND trailers.gid= "+req.params.gid+" AND requirements.gid= "+req.params.gid+";";
    conn.query(sql, function (err, results) {
        console.log(results[0]);
        res.render('game-info', results[0]);
    });
});

app.post('/subscribe', function (req, res) {
    var email = req.body.email;
    const sql = "INSERT INTO subscribers SET ?";
    conn.query(sql, {sid: null, email: email}, function (err, results) {
        res.redirect('back');
    });
});

app.listen(process.env.PORT || 80, function (err) {
    if (err) throw err;
    console.log("Magic happens on port 80...");
});