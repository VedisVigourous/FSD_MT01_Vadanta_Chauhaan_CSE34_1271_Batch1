# Library Book Management API (Set A)

A RESTful API built with **Node.js** and **Express.js** using an in-memory JavaScript array, paired with a minimalist black-and-white web UI.

## Setup & Run Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   node server.js
   ```

3. Open in browser or test with Postman / Thunder Client:
   - Web UI: `http://localhost:3000`
   - API Base URL: `http://localhost:3000/api/books`

## API Endpoints

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/books` | Get all book records | `200` |
| `GET` | `/api/books/filter?author=value` | Case-insensitive filter by author | `200`, `400` |
| `GET` | `/api/books/:id` | Get a single book by numeric ID | `200`, `400`, `404` |
| `POST` | `/api/books` | Add a new book record | `201`, `400` |
| `PUT` | `/api/books/:id` | Update an existing book by ID | `200`, `400`, `404` |
| `DELETE` | `/api/books/:id` | Delete a book by ID | `200`, `400`, `404` |

## Sample Request Body (`POST` / `PUT`)

```json
{
  "title": "The Discovery of India",
  "author": "Jawaharlal Nehru",
  "genre": "History",
  "publishedYear": 1946,
  "available": true
}
```
