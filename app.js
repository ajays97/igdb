const express = require('express');
const hbs = require('express-handlebars');
const Handlebars = require('handlebars');
const bodyParser = require('body-parser');
const url = require('url');
const _ = require('lodash');
const moment = require('moment');
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
var options = require('./session');

var sessionStore = new MySQLStore(options);

app.use(session({
    secret: 'igdb2017',
    resave: false,
    store: sessionStore,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(function (req, res, next) {
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
});

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
    }, function(email, password, done) {
        const sql = "SELECT username, passwrd from users WHERE email = '" + email + "';";
        conn.query(sql, function (err, results, fields) {

            if (err) {done(err)}

            if (results.length === 0) {
                done(null, false);
            }

            if (results[0].passwrd === password)
                return done(null, {email: email, username: results[0].username});
            else
                return done(null, false);

        });

    }
));

Handlebars.registerHelper('getYear', function (dateString) {
    return new Handlebars.SafeString(dateString.getYear() + 1900);
});

Handlebars.registerHelper('getDate', function (dateString) {
    return new Handlebars.SafeString(dateString.toString().substring(4, 15));
});

Handlebars.registerHelper('getRoute', function (passedString) {
    return new Handlebars.SafeString(passedString.substring(passedString.indexOf('/', 8)+1).replace('/', '_'));
});

app.get('/', function (req, res) {
    // console.log(req.user);
    // console.log(req.isAuthenticated());
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
    res.render('login', {routeBack: req.query.routeBack});
});

app.get('/gameinfo/:gid', function (req, res) {
    const sql = "SELECT requirements.ram, requirements.processor, requirements.gpu, requirements.os, requirements.space, games_master.gid, games_master.title, games_master.description, games_master.rating, games_master.developers, games_master.release_date, trailers.video_url FROM games_master, trailers, requirements WHERE games_master.gid= "+req.params.gid+" AND trailers.gid= "+req.params.gid+" AND requirements.gid= "+req.params.gid+";";
    conn.query(sql, function (err, results) {
        const sql2 = "SELECT username, review, created_at FROM reviews WHERE gid = "+req.params.gid+";";
        conn.query(sql2, function (err, results2) {
            res.render('game-info', {gameinfo: results[0], reviews: results2});
        });
    });
});

app.get('/logout', function (req, res) {
    req.logout();
    req.session.destroy();
    res.redirect('back');
});

app.get('/search', function (req, res) {
    const sql = "SELECT * FROM games_master where MATCH(title) AGAINST('" + req.query.q + "');";
    conn.query(sql, function (err, results){
        if (err) throw err;
        res.render('search', {games: results, search: req.query.q});
    });
});

app.get('/genre/:genre', function (req, res) {
    const sql = "SELECT * FROM games_master where MATCH(genre) AGAINST('" + req.params.genre + "');";
    conn.query(sql, function (err, results){
        if (err) throw err;
        res.render('genre', {games: results, search: req.params.genre});
    });
});

app.get('/developers/:developers', function (req, res) {
    const sql = "SELECT * FROM games_master where MATCH(developers) AGAINST('" + req.params.developers+ "');";
    conn.query(sql, function (err, results){
        if (err) throw err;
        res.render('developers', {games: results, search: req.params.developers, dev: results[0].developers});
    });
});

app.post('/review', authenticationMiddleware(), function (req, res) {
    var review = {gid: req.body.gid, username: req.body.username, email: req.body.email, review: req.body.review, created_at: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')};
    const sql = "INSERT INTO reviews SET ?";
    conn.query(sql, review, function (err, results, fields) {
        res.redirect(req.header('referer'));
    });
});

app.post('/subscribe', function (req, res) {
    var email = req.body.email;
    const sql = "INSERT INTO subscribers SET ?";
    conn.query(sql, {sid: null, email: email}, function (err, results) {
        res.redirect('back');
    });
});

app.post('/login/:routeBack', passport.authenticate('local', {
    failureRedirect: '/login'
}), function (req, res) {
    res.redirect('/'+req.params.routeBack.replace('_', '/'));
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
        res.redirect(url.format({
            pathname: '/login',
            query: {
                "routeBack": req.header('referer')
            }
        }));
    }
}

app.listen(process.env.PORT || 80, function (err) {
    if (err) throw err;
    console.log("Magic happens on port 80...");
});
