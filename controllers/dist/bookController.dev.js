"use strict";

var Book = require("../models/book");

var Author = require("../models/author");

var Genre = require("../models/genre");

var BookInstance = require("../models/bookinstance");

var async = require("async");

var _require = require("express-validator"),
    body = _require.body,
    validationResult = _require.validationResult;

var ejsLint = require("ejs-lint");

var mongoose = require("mongoose");

exports.index = function (req, res) {
  async.parallel({
    book_count: function book_count(callback) {
      Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
    },
    book_instance_count: function book_instance_count(callback) {
      BookInstance.countDocuments({}, callback);
    },
    book_instance_available_count: function book_instance_available_count(callback) {
      BookInstance.countDocuments({
        status: "Available"
      }, callback);
    },
    author_count: function author_count(callback) {
      Author.countDocuments({}, callback);
    },
    genre_count: function genre_count(callback) {
      Genre.countDocuments({}, callback);
    }
  }, function (err, results) {
    res.render("index", {
      title: "Local Library Home",
      error: err,
      data: results
    });
  });
}; // Display list of all books.


exports.book_list = function (req, res, next) {
  //, "title author"
  Book.find({}).populate("author").exec(function (err, list_books) {
    if (err) {
      return next(err);
    } //Successful, so render


    res.render("book_list", {
      title: "Book List",
      book_list: list_books
    });
  });
}; // Display detail page for a specific book.


exports.book_detail = function (req, res, next) {
  var id = mongoose.Types.ObjectId(req.params.id);
  async.parallel({
    book: function book(callback) {
      Book.findById(req.params.id).populate("author").populate("genre").exec(callback);
    },
    book_instance: function book_instance(callback) {
      BookInstance.find({
        book: req.params.id
      }).exec(callback);
    }
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    if (results.book == null) {
      // No results.
      var err = new Error("Book not found");
      err.status = 404;
      return next(err);
    } // Successful, so render.


    res.render("book_detail", {
      title: results.book.title,
      book: results.book,
      book_instances: results.book_instance
    });
  });
}; // Display book create form on GET.


exports.book_create_get = function (req, res, next) {
  // Get all authors and genres, which we can use for adding to our book.
  async.parallel({
    authors: function authors(callback) {
      Author.find(callback);
    },
    genres: function genres(callback) {
      Genre.find(callback);
    }
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    res.render("book_form", {
      title: "Create Book",
      authors: results.authors,
      genres: results.genres,
      book: undefined,
      errors: undefined
    });
  });
}; // Handle book create on POST.


exports.book_create_post = [// Convert the genre to an array.
function (req, res, next) {
  if (!(req.body.genre instanceof Array)) {
    if (typeof req.body.genre === "undefined") req.body.genre = [];else req.body.genre = new Array(req.body.genre);
  }

  next();
}, // Validate and sanitise fields.
body("title", "Title must not be empty.").trim().isLength({
  min: 1
}).escape(), body("author", "Author must not be empty.").trim().isLength({
  min: 1
}).escape(), body("summary", "Summary must not be empty.").trim().isLength({
  min: 1
}).escape(), body("isbn", "ISBN must not be empty").trim().isLength({
  min: 1
}).escape(), body("genre.*").escape(), // Process request after validation and sanitization.
function (req, res, next) {
  // Extract the validation errors from a request.
  var errors = validationResult(req); // Create a Book object with escaped and trimmed data.

  var book = new Book({
    title: req.body.title,
    author: req.body.author,
    summary: req.body.summary,
    isbn: req.body.isbn,
    genre: req.body.genre
  });

  if (!errors.isEmpty()) {
    // There are errors. Render form again with sanitized values/error messages.
    // Get all authors and genres for form.
    async.parallel({
      authors: function authors(callback) {
        Author.find(callback);
      },
      genres: function genres(callback) {
        Genre.find(callback);
      }
    }, function (err, results) {
      if (err) {
        return next(err);
      } // Mark our selected genres as checked.


      for (var i = 0; i < results.genres.length; i++) {
        if (book.genre.indexOf(results.genres[i]._id) > -1) {
          results.genres[i].checked = "true";
        }
      }

      res.render("book_form", {
        title: "Create Book",
        authors: results.authors,
        genres: results.genres,
        book: book,
        errors: errors.array()
      });
    });
    return;
  } else {
    // Data from form is valid. Save book.
    book.save(function (err) {
      if (err) {
        return next(err);
      } //successful - redirect to new book record.


      res.redirect(book.url);
    });
  }
}]; // Display book delete form on GET.

exports.book_delete_get = function (req, res, next) {
  async.parallel({
    book: function book(callback) {
      Book.findById(req.params.id).populate("author").populate("genre").exec(callback);
    },
    book_bookinstances: function book_bookinstances(callback) {
      BookInstance.find({
        book: req.params.id
      }).exec(callback);
    }
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    if (results.book == null) {
      res.redirect("/catalog/books");
    }

    res.render("book_delete", {
      title: "Delete Book",
      book: results.book,
      book_instances: results.book_bookinstances
    });
  });
}; // Handle book delete on POST.


exports.book_delete_post = function (req, res) {
  async.parallel({
    book: function book(callback) {
      Book.findById(req.body.id).populate("author").populate("genre").exec(callback);
    },
    book_bookinstances: function book_bookinstances(callback) {
      BookInstance.find({
        book: req.body.id
      }).exec(callback);
    }
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    if (results.book_bookinstances.length > 0) {
      res.render("book_delete", {
        title: "Delete Book",
        book: results.book,
        book_instances: results.book_bookinstances
      });
    } else {
      Book.findByIdAndDelete(req.body.id, function deleteBook(err) {
        if (err) {
          return next(err);
        }

        res.redirect("/catalog/books");
      });
    }
  });
}; // Display book update form on GET.


exports.book_update_get = function (req, res, next) {
  async.parallel({
    book: function book(callback) {
      Book.findById(req.params.id).populate("author").populate("genre").exec(callback);
    },
    authors: function authors(callback) {
      Author.find(callback);
    },
    genres: function genres(callback) {
      Genre.find(callback);
    }
  }, function (err, results) {
    if (err) {
      return next(err);
    }

    if (results.book == null) {
      var err = new Error("Book not found");
      err.status = 404;
      return next(err);
    }

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = results.genres[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var genre = _step.value;
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = results.book.genre[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var bookGenre = _step2.value;

            if (genre._id.toString() === bookGenre._id.toString()) {
              genre.checked = "true";
            }
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
              _iterator2["return"]();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    res.render("book_form", {
      title: "Update Book",
      authors: results.authors,
      genres: results.genres,
      book: results.book,
      errors: undefined
    });
  });
}; // Handle book update on POST.


exports.book_update_post = [function (req, res, next) {
  if (!(req.body.genre instanceof Array)) {
    if (typeof req.body.genre === "undefined") {
      req, body.genre = [];
    } else {
      req.body.genre = new Array(req.body.genre);
    }
  }

  next();
}, // Validate and sanitise fields.
body("title", "Title must not be empty.").trim().isLength({
  min: 1
}).escape(), body("author", "Author must not be empty.").trim().isLength({
  min: 1
}).escape(), body("summary", "Summary must not be empty.").trim().isLength({
  min: 1
}).escape(), body("isbn", "ISBN must not be empty").trim().isLength({
  min: 1
}).escape(), body("genre.*").escape(), function (req, res, next) {
  // Extract the validation errors from a request.
  var errors = validationResult(req); // Create a Book object with escaped/trimmed data and old id.

  var book = new Book({
    title: req.body.title,
    author: req.body.author,
    summary: req.body.summary,
    isbn: req.body.isbn,
    genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
    _id: req.params.id //This is required, or a new ID will be assigned!

  });

  if (!errors.isEmpty()) {
    // There are errors. Render form again with sanitized values/error messages.
    // Get all authors and genres for form.
    async.parallel({
      authors: function authors(callback) {
        Author.find(callback);
      },
      genres: function genres(callback) {
        Genre.find(callback);
      }
    }, function (err, results) {
      if (err) {
        return next(err);
      } // Mark our selected genres as checked.


      for (var i = 0; i < results.genres.length; i++) {
        if (book.genre.indexOf(results.genres[i]._id) > -1) {
          results.genres[i].checked = "true";
        }
      }

      res.render("book_form", {
        title: "Update Book",
        authors: results.authors,
        genres: results.genres,
        book: book,
        errors: errors.array()
      });
    });
    return;
  } else {
    // Data from form is valid. Update the record.
    Book.findByIdAndUpdate(req.params.id, book, {}, function (err, thebook) {
      if (err) {
        return next(err);
      } // Successful - redirect to book detail page.


      res.redirect(thebook.url);
    });
  }
}];