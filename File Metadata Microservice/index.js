'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');

// require and use "multer"...
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();

const PORT = process.env.PORT || 3000

app.use(cors());
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/fileanalyse', upload.single('upfile'), (req, res) => {
  try {
    res.json({
      "name": req.file.originalname,
      "type": req.file.mimetype,
      "size": req.file.size
    });
  } catch (err) {
    res.send(400);
  }
});

app.get('/hello', function (req, res) {
  res.json({ greetings: "Hello, API" });
});

app.listen(PORT, function () {
  console.log(`Node.js listening ${PORT}`);
});