var mysql = require('mysql');

var conn = mysql.createConnection({
    host: "igdb.ctk3p7qef1xl.us-east-1.rds.amazonaws.com",
    user: "ajays",
    password: "ajays1997",
    database: "igdb",
    multipleStatements: true
});

conn.connect(function (err) {
    console.log('The Cloud RDS is amazing...');
});

module.exports = conn;