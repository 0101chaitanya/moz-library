"use strict";

var Genre = require("../models/genre");

var Book = require("../models/book");

var async = require("async");

var mongoose = require("mongoose");

var _require = require("express-validator"),
    body = _require.body,
    validationResult = _require.validationResult; // Display list of all Genre.


exports.genre_list = function (req, res, next) {
  Genre.find().exec(function (err, list_genre) {
    res.render("genre_list", {
      title: "Genre List",
      genre_list: list_genre
    });
  });
}; // Display detail page for a specific Genre.


exports.genre_detail = function (req, res, next) {
  var id = mongoose.Types.ObjectId(req.params.id);
  async.parallel({
    genre: function genre(callback) {
      Genre.findById(req.params.id).exec(callback);
    },
    genre_books: function genre_books(callback) {
      Book.find({
        genre: req.params.id
      }).exec(callback);
    }
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    if (results.genre == null) {
      // No results.
      var err = new Error("Genre not found");
      err.status = 404;
      return next(err);
    } // Successful, so render


    res.render("genre_detail", {
      title: "Genre Detail",
      genre: results.genre,
      genre_books: results.genre_books
    });
  });
}; // Display Genre create form on GET.


exports.genre_create_get = function (req, res, next) {
  res.render("genre_form", {
    title: "Create Genre"
  });
}; // Handle Genre create on POST.


exports.genre_create_post = [// validate and sanitize the name field
body("name", "Genre name required").trim().isLength({
  min: 1
}).escape(), //process request after validation and sanitization
function (req, res, next) {
  var errors = validationResult(req);
  var genre = new Genre({
    name: req.body.name
  });

  if (!errors.isEmpty()) {
    res.render("genre_form", {
      title: "Create Genre",
      genre: genre,
      errors: errors.array()
    });
    return;
  } else {
    Genre.findOne({
      name: req.body.name
    }).exec(function (err, found_genre) {
      if (err) {
        return next(err);
      }

      if (found_genre) {
        res.redirect(found_genre.url);
      } else {
        genre.save(function (err) {
          if (err) {
            return next(err);
          }

          res.redirect(genre.url);
        });
      }
    });
  }
}]; // Display Genre delete form on GET.

exports.genre_delete_get = function (req, res) {
  res.send("NOT IMPLEMENTED: Genre delete GET");
}; // Handle Genre delete on POST.


exports.genre_delete_post = function (req, res) {
  res.send("NOT IMPLEMENTED: Genre delete POST");
}; // Display Genre update form on GET.


exports.genre_update_get = function (req, res) {
  res.send("NOT IMPLEMENTED: Genre update GET");
}; // Handle Genre update on POST.


exports.genre_update_post = function (req, res) {
  res.send("NOT IMPLEMENTED: Genre update POST");
};