const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Данные для аутентификации
const adminUser = {
  username: 'admin',
  password: 'admin'
};

// Аутентификация
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === adminUser.username && password === adminUser.password) {
    res.status(200).send('Login successful!');
  } else {
    res.status(401).send('Invalid credentials');
  }
});

// Получение списка файлов в папке videos
app.get('/videos', (req, res) => {
  const directoryPath = path.join(__dirname, 'videos');

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.log('Unable to scan directory: ' + err);
      res.status(500).send('Error reading videos');
    } else {
      res.status(200).json(files);
    }
  });
});

// Предоставление доступа к изображениям (thumbnails)
app.use('/thumbnails', express.static(path.join(__dirname, 'thumbnails')));

// Предоставление доступа к видеофайлам
app.get('/videos/:videoName', (req, res) => {
  const videoName = req.params.videoName;
  const videoPath = path.join(__dirname, 'videos', videoName);

  // Проверяем существование файла
  if (fs.existsSync(videoPath)) {
    // Отправляем видеофайл клиенту
    res.sendFile(videoPath);
  } else {
    res.status(404).send('Video not found');
  }
});

// Обработчик корневого маршрута
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Обработчик для отдельной страницы с видео
app.get('/watch/:videoName', (req, res) => {
  const videoName = req.params.videoName;
  const videoPath = path.join(__dirname, 'videos', videoName);

  // Проверяем существование файла
  if (fs.existsSync(videoPath)) {
    // Отправляем страницу с видео
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${videoName}</title>
      </head>
      <body>
        <h1>${videoName}</h1>
        <video controls>
          <source src="/videos/${encodeURIComponent(videoName)}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </body>
      </html>
    `);
  } else {
    res.status(404).send('Video not found');
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
