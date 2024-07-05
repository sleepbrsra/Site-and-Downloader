document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/videos')
    .then(response => response.json())
    .then(videos => {
      const videoGrid = document.getElementById('videoGrid');

      videos.forEach(video => {
        const videoElement = document.createElement('div');
        videoElement.className = 'video-container';
        videoElement.innerHTML = `
          <a href="video.html?path=${encodeURIComponent(video.path)}">
            <img src="${video.thumbnail}" alt="${video.name}" class="video-thumbnail">
          </a>
        `;
        videoGrid.appendChild(videoElement);
      });
    })
    .catch(error => console.error('Ошибка загрузки видео:', error));

  document.getElementById('downloadVideoBtn').addEventListener('click', () => {
    const videoUrl = document.getElementById('videoUrl').value;
    if (videoUrl) {
      fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: videoUrl })
      })
      .then(response => response.json())
      .then(data => {
        if (data.message) {
          window.location.href = '/download_video';
        } else {
          alert(data.error || 'Ошибка загрузки видео.');
        }
      })
      .catch(error => console.error('Ошибка скачивания видео:', error));
    } else {
      alert('Введите URL видео.');
    }
  });
});
