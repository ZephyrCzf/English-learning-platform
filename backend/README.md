# English Learning Platform Backend

This is the Express.js backend for the English Learning Platform.

## Prerequisites

- Node.js (v14 or higher)
- MySQL 5.7.2
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
DB_HOST=localhost
DB_NAME=english_learning
DB_USER=your_username
DB_PASSWORD=your_password
PORT=3000
```

3. Create the database:
```sql
CREATE DATABASE english_learning;
```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Create a new learning session
- POST `/api/sessions`
- Request body:
```json
{
  "age": 25,
  "englishLevel": "INTERMEDIATE",
  "interests": ["technology", "science"],
  "difficultWords": ["complex", "advanced"]
}
```

### Get articles for a session
- GET `/api/sessions/:sessionId/articles`

### Get quiz questions for a session
- GET `/api/sessions/:sessionId/quiz` 