const express = require('express');
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const url = require('url');

var app = express();

app.engine('hbs', hbs({extname: 'hbs', layoutsDir: __dirname + '/views'}));
app.set('view engine', 'hbs');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function (req, res) {
    res.render('index');
});

app.listen(process.env.PORT || 3000, function (err) {
    if (err) throw err;
    console.log("Magic happens on port 3000...");
    console.log(process.env.PORT);
});