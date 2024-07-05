const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const videoFolder = path.join(__dirname, 'videos');
const thumbnailFolder = path.join(__dirname, 'thumbnails');

if (!fs.existsSync(videoFolder)) {
  fs.mkdirSync(videoFolder);
}

if (!fs.existsSync(thumbnailFolder)) {
  fs.mkdirSync(thumbnailFolder);
}

app.get('/api/videos', (req, res) => {
  fs.readdir(videoFolder, (err, files) => {
    if (err) {
      console.error('Ошибка чтения директории с видео:', err);
      res.status(500).json({ error: 'Ошибка чтения директории с видео' });
    } else {
      const videoList = files
        .filter(file => /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(file))
        .map(file => ({
          name: file,
          path: `/videos/${file}`,
          thumbnail: `/thumbnails/${path.basename(file, path.extname(file))}.jpg`
        }));
      res.json(videoList);
    }
  });
});

app.post('/api/download', (req, res) => {
  const videoUrl = req.body.url;
  if (!videoUrl || !/^https?:\/\/(www\.)?youtube\.com|youtu\.be/.test(videoUrl)) {
    return res.status(400).json({ error: 'Неверный URL видео. Пожалуйста, используйте ссылку на YouTube.' });
  }

  const command = `yt-dlp -o "${videoFolder}/%(title)s.%(ext)s" --write-thumbnail --convert-thumbnails jpg ${videoUrl}`;
  const downloadProcess = exec(command);

  res.json({ message: 'Загрузка инициирована' });

  downloadProcess.stdout.on('data', data => {
    console.log(`stdout: ${data}`);
    if (/yt-dlp.*\[(\d+\.\d+)%\]/.test(data)) {
      const progressMatch = data.match(/yt-dlp.*\[(\d+\.\d+)%\]/);
      if (progressMatch) {
        const progress = progressMatch[1];
        req.app.get('io').emit('progress', progress);
      }
    }
  });

  downloadProcess.stderr.on('data', data => {
    console.error(`stderr: ${data}`);
    if (/ERROR/.test(data)) {
      req.app.get('io').emit('error', 'Ошибка загрузки видео.');
    }
  });

  downloadProcess.on('close', code => {
    if (code === 0) {
      console.log('Видео успешно скачано.');
      moveThumbnails(videoFolder, thumbnailFolder);
      req.app.get('io').emit('complete', 'Видео успешно скачано.');
    } else {
      console.error(`Процесс завершился с кодом ${code}`);
      req.app.get('io').emit('error', 'Ошибка скачивания видео');
    }
  });
});

function moveThumbnails(videoFolder, thumbnailFolder) {
  fs.readdir(videoFolder, (err, files) => {
    if (err) {
      console.error('Ошибка чтения директории с видео:', err);
      return;
    }
    files.forEach(file => {
      if (file.endsWith('.jpg')) {
        const oldPath = path.join(videoFolder, file);
        const newPath = path.join(thumbnailFolder, file);
        fs.rename(oldPath, newPath, err => {
          if (err) console.error('Ошибка перемещения миниатюры:', err);
        });
      }
    });
  });
}

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/download_video', (req, res) => {
  res.sendFile(path.join(__dirname, 'download_video.html'));
});

const server = app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});

const io = require('socket.io')(server);
app.set('io', io);
