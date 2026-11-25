const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Handle malformed JSON payloads gracefully
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next(err);
});

// In-memory data store (Initial Data from Set A)
let books = [
  {
    id: 101,
    title: 'Wings of Fire',
    author: 'A.P.J. Abdul Kalam',
    genre: 'Autobiography',
    publishedYear: 1999,
    available: true,
  },
  {
    id: 102,
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    genre: 'Fiction',
    publishedYear: 1988,
    available: true,
  },
  {
    id: 103,
    title: 'Harry Potter',
    author: 'J.K. Rowling',
    genre: 'Fantasy',
    publishedYear: 1997,
    available: false,
  },
];

let nextId = 104;

/**
 * Validate book payload for POST and PUT requests.
 * Returns an array of error messages (empty if valid).
 */
function validateBookPayload(body) {
  const errors = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return ['Request body must be a JSON object.'];
  }

  const { title, author, genre, publishedYear, available } = body;

  if (typeof title !== 'string' || title.trim().length === 0) {
    errors.push('title is required and must be a non-empty string.');
  }
  if (typeof author !== 'string' || author.trim().length === 0) {
    errors.push('author is required and must be a non-empty string.');
  }
  if (typeof genre !== 'string' || genre.trim().length === 0) {
    errors.push('genre is required and must be a non-empty string.');
  }
  if (
    typeof publishedYear !== 'number' ||
    !Number.isInteger(publishedYear) ||
    publishedYear < 0 ||
    publishedYear > new Date().getFullYear() + 1
  ) {
    errors.push('publishedYear is required and must be a valid integer year.');
  }
  if (typeof available !== 'boolean') {
    errors.push('available is required and must be a boolean.');
  }

  return errors;
}

/**
 * Parse and validate numeric route :id parameter.
 */
function parseBookId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

// 1. GET all records
app.get('/api/books', (req, res) => {
  res.status(200).json(books);
});

// 6. Filter records by author (declared BEFORE /api/books/:id)
app.get('/api/books/filter', (req, res) => {
  const { author } = req.query;

  if (typeof author !== 'string' || author.trim().length === 0) {
    return res.status(400).json({
      error: "Query parameter 'author' is required and must be a non-empty string.",
    });
  }

  const query = author.trim().toLowerCase();
  const matched = books.filter((book) =>
    book.author.toLowerCase().includes(query)
  );

  res.status(200).json(matched);
});

// 3. GET record by ID
app.get('/api/books/:id', (req, res) => {
  const id = parseBookId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Invalid book ID. Must be a positive integer.' });
  }

  const book = books.find((b) => b.id === id);
  if (!book) {
    return res.status(404).json({ error: `Book with ID ${id} not found.` });
  }

  res.status(200).json(book);
});

// 2. POST a new record
app.post('/api/books', (req, res) => {
  const errors = validateBookPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  const newBook = {
    id: nextId++,
    title: req.body.title.trim(),
    author: req.body.author.trim(),
    genre: req.body.genre.trim(),
    publishedYear: req.body.publishedYear,
    available: req.body.available,
  };

  books.push(newBook);
  res.status(201).json(newBook);
});

// 4. PUT / update a record
app.put('/api/books/:id', (req, res) => {
  const id = parseBookId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Invalid book ID. Must be a positive integer.' });
  }

  const index = books.findIndex((b) => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Book with ID ${id} not found.` });
  }

  const errors = validateBookPayload(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  const updatedBook = {
    id,
    title: req.body.title.trim(),
    author: req.body.author.trim(),
    genre: req.body.genre.trim(),
    publishedYear: req.body.publishedYear,
    available: req.body.available,
  };

  books[index] = updatedBook;
  res.status(200).json(updatedBook);
});

// 5. DELETE a record
app.delete('/api/books/:id', (req, res) => {
  const id = parseBookId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'Invalid book ID. Must be a positive integer.' });
  }

  const index = books.findIndex((b) => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Book with ID ${id} not found.` });
  }

  const [deletedBook] = books.splice(index, 1);
  res.status(200).json({
    message: 'Book deleted successfully.',
    deleted: deletedBook,
  });
});

// Fallback for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

app.listen(PORT, () => {
  console.log(`Library Book Management API server running at http://localhost:${PORT}`);
});
