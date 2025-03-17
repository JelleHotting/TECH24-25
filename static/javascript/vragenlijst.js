document.addEventListener('DOMContentLoaded', function() {
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');
  
    function updateProgressBar(percentage) {
      progressBar.style.width = percentage + '%';
    }
  
    updateProgressBar(50);
  });