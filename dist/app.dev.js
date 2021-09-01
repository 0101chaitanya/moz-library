"use strict";

var createError = require("http-errors");

var express = require("express");

var path = require("path");

var cookieParser = require("cookie-parser");

var logger = require("morgan");

var mongoose = require("mongoose");

var indexRouter = require("./routes/index");

var usersRouter = require("./routes/users");

var catalogRouter = require("./routes/catalog"); //Import routes for "catalog" area of site


var expressLayouts = require("express-ejs-layouts");

var wiki = require("./routes/wiki");

var app = express();
var mongodb = "mongodb+srv://0101chaitanya:Webdev%400101@cluster0.ojoav.mongodb.net/chaitudb?authSource=admin&replicaSet=atlas-yx635f-shard-0&w=majority&readPreference=primary&retryWrites=true&ssl=true";
mongoose.connect(mongodb, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
var db = mongoose.connection;
db.on("error", console.error.bind(console, "Mongoose connection error:")); // view engine setup

app.use(expressLayouts);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express["static"](path.join(__dirname, "public")));
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/wiki", wiki);
app.use("/catalog", catalogRouter); // Add catalog routes to middleware chain.
// catch 404 and forward to error handler

app.use(function (req, res, next) {
  next(createError(404));
}); // error handler

app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {}; // render the error page

  res.status(err.status || 500);
  res.render("error");
});
module.exports = app;