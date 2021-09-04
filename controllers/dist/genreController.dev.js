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

exports.genre_delete_get = function (req, res, next) {
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
      res.redirect(".catalog/genres");
    }

    res.render("genre_delete", {
      title: "Delete Genre",
      genre: results.genre,
      genre_books: results.genre_books
    });
  });
}; // Handle Genre delete on POST.


exports.genre_delete_post = function (req, res, next) {
  async.parallel({
    genre: function genre(callback) {
      Genre.findById(req.body.id).exec(callback);
    },
    genre_books: function genre_books(callback) {
      Book.find({
        genre: req.body.id
      }).exec(callback);
    }
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    if (results.genre_books.length > 0) {
      res.render("genre_delete", {
        title: "Delete Genre",
        genre: results.genre,
        genre_books: results.genre_books
      });
      return;
    } else {
      Genre.findByIdAndRemove(req.body.id, function deleteGenre(err) {
        if (err) {
          return next(err);
        }

        res.redirect("/catalog/genres");
      });
    }
  });
}; // Display Genre update form on GET.


exports.genre_update_get = function (req, res, next) {
  Genre.findById(req.params.id, function (err, genre) {
    if (err) {
      return next(err);
    }

    if (genre == null) {
      // No results.
      var err = new Error("Genre not found");
      err.status = 404;
      return next(err);
    } // Success.


    res.render("genre_form", {
      title: "Update Genre",
      genre: genre
    });
  });
}; // Handle Genre update on POST.


exports.genre_update_post = [// Validate and sanitze the name field.
body("name", "Genre name must contain at least 3 characters").trim().isLength({
  min: 3
}).escape(), // Process request after validation and sanitization.
function (req, res, next) {
  // Extract the validation errors from a request .
  var errors = validationResult(req); // Create a genre object with escaped and trimmed data (and the old id!)

  var genre = new Genre({
    name: req.body.name,
    _id: req.params.id
  });

  if (!errors.isEmpty()) {
    // There are errors. Render the form again with sanitized values and error messages.
    res.render("genre_form", {
      title: "Update Genre",
      genre: genre,
      errors: errors.array()
    });
    return;
  } else {
    // Data from form is valid. Update the record.
    Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err, thegenre) {
      if (err) {
        return next(err);
      } // Successful - redirect to genre detail page.


      res.redirect(thegenre.url);
    });
  }
}];