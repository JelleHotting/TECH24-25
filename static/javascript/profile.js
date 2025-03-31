document.addEventListener('DOMContentLoaded', function() {
    // Find all remove clan forms
    const removeForms = document.querySelectorAll('#removeClanForm');
    
    removeForms.forEach(form => {
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const clanTag = this.querySelector('input[name="clanTag"]').value;
        const clanName = this.dataset.clanName;
        
        // Send AJAX request to server
        fetch('/removeClan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clanTag }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Show success popup
            showNotification(`"${clanName}" is verwijderd uit je favorieten!`);
            
            // Remove the clan card from the UI
            const clanCard = this.closest('.clanCard');
            if (clanCard) {
              clanCard.style.opacity = '0';
              setTimeout(() => {
                clanCard.remove();
                
                // Check if there are no more clan cards
                const remainingCards = document.querySelectorAll('.clanCard');
                if (remainingCards.length === 0) {
                  const section = document.querySelector('.opgeslagen');
                  const message = document.createElement('p');
                  message.textContent = 'Je hebt nog geen opgeslagen clans';
                  section.appendChild(message);
                }
              }, 300);
            }
          } else {
            // Show error popup
            showNotification(`Fout: ${data.message}`);
          }
        })
        .catch(error => {
          console.error('Error:', error);
          showNotification('Er is een fout opgetreden.');
        });
      });
    });
    
    // Notification handling
    function showNotification(message) {
      const notification = document.getElementById('notification');
      const messageElement = document.getElementById('notification-message');
      const closeButton = document.getElementById('notification-close');
      
      messageElement.textContent = message;
      notification.style.display = 'flex';
      
      closeButton.addEventListener('click', function() {
        notification.style.display = 'none';
      });
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        notification.style.display = 'none';
      }, 5000);
    }
  });