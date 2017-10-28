const express = require('express');
const hbs = require('express-handlebars');
const Handlebars = require('handlebars');
const bodyParser = require('body-parser');
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

app.get('/', function (req, res) {
    const sql = "SELECT title, release_date, image_url FROM games_master ORDER BY release_date DESC LIMIT 8;";
    conn.query(sql, function (err, games, fields) {
        if (err) throw err;
        res.render('index', {games: games});
    });

});

app.listen(process.env.PORT || 3000, function (err) {
    if (err) throw err;
    console.log("Magic happens on port 3000...");
});