document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
  
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
  
    socket.on('progress', (progress) => {
      progressBar.style.width = `${progress}%`;
      progressText.textContent = `Прогресс: ${progress}%`;
  
      if (progress >= 100) {
        progressText.textContent = 'Загрузка завершена!';
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    });
  
    socket.on('complete', (message) => {
      progressText.textContent = message;
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    });
  
    socket.on('error', (message) => {
      progressText.textContent = message;
      progressBar.style.backgroundColor = 'red';
    });
  });
  