const express = require('express'),
    path = require("path"),
    exphbs = require("express-handlebars"),
    session = require('express-session'),
    MongoStore = require("connect-mongo")(session),
    flash = require("connect-flash"),
    initializePassport = require("./utils/passport_config"),
    passport = require("passport"),
    mongoose = require("mongoose"),
    favicon = require('serve-favicon');






const handlebars =exphbs.create({
    extname:"hbs",
    defaultLayout:"main",
    layoutsDir:path.join(__dirname,"views","layouts"),
    partialsDir:path.join(__dirname,"views","partials")
});


module.exports = function (app){
    if (process.env.NODE_ENV === "development"){
        app.use(require("morgan")("tiny"));
    }
    app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
    app.use(express.static("public"))
    app.use(express.json());
    app.use(express.urlencoded({extended:false}));
    app.engine("hbs", handlebars.engine);
    app.set("view engine", "hbs");

    app.use(flash());

    app.use(session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
        cookie: { sameSite: 'strict' },
        store: new MongoStore({
            mongooseConnection: mongoose.connection
        })
    }));

    initializePassport(passport);
    app.use(passport.initialize());
    app.use(passport.session());



}
