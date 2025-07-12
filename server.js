const express = require('express');
const Datastore = require('nedb');
const Filter = require('bad-words');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // for frontend

// Profanity filter
const filter = new Filter();

// NeDB Databases
const usersDB = new Datastore({ filename: 'db/users.db', autoload: true });
const questionsDB = new Datastore({ filename: 'db/questions.db', autoload: true });
const answersDB = new Datastore({ filename: 'db/answers.db', autoload: true });

/* ----------- ROUTES ----------- */

// Register
app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body;
  usersDB.findOne({ username }, (err, user) => {
    if (user) return res.status(400).json({ error: 'User already exists' });

    usersDB.insert({ username, email, password }, (err, newUser) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(200).json({ message: 'Registered successfully' });
    });
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  usersDB.findOne({ username, password }, (err, user) => {
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ message: 'Login successful' });
  });
});

// Post a question
app.post('/api/question', (req, res) => {
  const { text, level, poll, username } = req.body;

  if (filter.isProfane(text)) return res.status(400).json({ error: 'Inappropriate content in question' });

  const question = {
    text,
    level,
    poll,
    username,
    createdAt: new Date()
  };

  questionsDB.insert(question, (err, newQuestion) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json(newQuestion);
  });
});

// Submit an answer
app.post('/api/answer', (req, res) => {
  const { questionId, answerText, username } = req.body;

  if (filter.isProfane(answerText)) return res.status(400).json({ error: 'Inappropriate content in answer' });

  const answer = {
    questionId,
    answerText,
    username,
    createdAt: new Date()
  };

  answersDB.insert(answer, (err, newAnswer) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json(newAnswer);
  });
});

// Get all questions
app.get('/api/questions', (req, res) => {
  questionsDB.find({}).sort({ createdAt: -1 }).exec((err, docs) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(docs);
  });
});

// Get answers for a question
app.get('/api/answers/:questionId', (req, res) => {
  answersDB.find({ questionId: req.params.questionId }, (err, docs) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(docs);
  });
});

/* ----------- Start Server ----------- */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
