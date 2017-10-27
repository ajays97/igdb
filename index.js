const express = require('express');
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const conn = require('./dbconnect');
const url = require('url');

var app = express();

app.engine('hbs', hbs({extname: 'hbs', layoutsDir: __dirname + '/views'}));
app.set('view engine', 'hbs');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function (req, res) {
    const sql = "SELECT * FROM games_master;";
    conn.query(sql, function (err, games) {
        console.log(games[1].developers);
        console.log(games[1].image_url);
        res.render('index', {games: games});
    });

});

app.listen(process.env.PORT || 3000, function (err) {
    if (err) throw err;
    console.log("Magic happens on port 3000...");
});