const express = require('express');
const hbs = require('express-handlebars');
const Handlebars = require('handlebars');
const bodyParser = require('body-parser');
const _ = require('lodash');
var conn = require('./dbconnect');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

var app = express();

app.engine('hbs', hbs({extname: 'hbs', layoutsDir: __dirname + '/views'}));
app.set('view engine', 'hbs');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
var options = {
    host: "igdb.ctk3p7qef1xl.us-east-1.rds.amazonaws.com",
    user: "ajays",
    password: "ajays1997",
    database: "igdb_sessions"
};

var sessionStore = new MySQLStore(options);

app.use(session({
    secret: 'igdb2017',
    resave: false,
    store: sessionStore,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
    }, function(email, password, done) {
        const sql = "SELECT username, passwrd from users WHERE email = '" + email + "';";
        console.log(sql);
        conn.query(sql, function (err, results, fields) {
            console.log(results);

            if (err) {done(err)}

            if (results.length === 0) {
                done(null, false);
            }
            return done(null, 'aaasda');

        });

    }
));

Handlebars.registerHelper('getYear', function (dateString) {
    return new Handlebars.SafeString(dateString.getYear() + 1900);
});

Handlebars.registerHelper('getDate', function (dateString) {
    return new Handlebars.SafeString(dateString.toString().substring(4, 15));
});

app.get('/', function (req, res) {
    console.log(req.user);
    console.log(req.isAuthenticated());
    const sql = "SELECT title, release_date, gid, rating, image_url FROM games_master ORDER BY release_date DESC LIMIT 8;";
    conn.query(sql, function (err, games, fields) {
        if (err) throw err;
        const sql2 = "SELECT title, release_date, gid, image_url FROM games_master ORDER BY rating DESC LIMIT 6;";
        conn.query(sql2, function (err, rated, fields) {
            res.render('index', {games: games, featured: games.slice(0,6), rated: rated});
        });
    });
});

app.get('/login', function (req, res) {
    res.render('login');
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

app.get('/review', authenticationMiddleware(), function (req, res) {
    res.send('<h1>Congratulations!</h1>');
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/review',
    failureRedirect: '/login'
}), function (req, res) {
    console.log(req.user);
});

app.post('/signup', function (req, res) {
    const email = req.body.email;
    const sql = "INSERT INTO users SET ?";
    conn.query(sql, {firstname: req.body.firstname, lastname: req.body.lastname, username: req.body.username, email: req.body.email, passwrd: req.body.password}, function (err, results) {
        if (err) throw err;
        req.login(email, function (err) {
            res.redirect('/');
        });
    });
});

passport.serializeUser(function(email, done) {
    done(null, email);
});

passport.deserializeUser(function(email, done) {
    done(null, email);
});

function authenticationMiddleware () {
    return function (req, res, next) {
        console.log('req.session.passport.user: ' + JSON.stringify(req.session.passport));

        if (req.isAuthenticated()) return next();
        res.redirect('/login');
    }
}

app.listen(process.env.PORT || 80, function (err) {
    if (err) throw err;
    console.log("Magic happens on port 80...");
});