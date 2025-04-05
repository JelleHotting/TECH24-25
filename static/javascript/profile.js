document.addEventListener('DOMContentLoaded', function() {
  // Get all remove clan forms
  const removeForms = document.querySelectorAll('#removeClanForm');
  
  removeForms.forEach(form => {
    form.addEventListener('submit', async function(event) {
      // Prevent the default form submission
      event.preventDefault();
      
      // Get the clan tag from the data attribute
      const clanTag = this.getAttribute('data-clan-tag');
      const clanName = this.getAttribute('data-clan-name');
      
      try {
        // Send AJAX request to remove the clan
        const response = await fetch('/removeClan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clanTag: clanTag,
            source: 'profile'
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Find the closest li element and remove it
          const clanElement = this.closest('li');
          if (clanElement) {
            clanElement.remove();
            
            // Show notification
            showNotification(`${clanName} is verwijderd uit je favorieten`);
            
            // Check if there are any clans left
            const remainingClans = document.querySelectorAll('.clanList ul li');
            if (remainingClans.length === 0) {
              document.querySelector('.clanList ul').innerHTML = 
                '<li><p>Je hebt geen opgeslagen clans</p></li>';
            }
          }
        } else {
          showNotification('Er is een fout opgetreden bij het verwijderen van de clan');
        }
      } catch (error) {
        console.error('Error removing clan:', error);
        showNotification('Er is een fout opgetreden bij het verwijderen van de clan');
      }
    });
  });
  
  // Notification functions
  function showNotification(message) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    
    if (!notification || !notificationMessage) {
      console.error('Notification elements not found in the DOM');
      return;
    }
    
    notificationMessage.textContent = message;
    notification.style.display = 'block'; // Make sure this is working
    
  }
  
  // Close notification when close button is clicked
  document.getElementById('notification-close').addEventListener('click', function() {
    document.getElementById('notification').style.display = 'none';
  });
});

// Profielfoto's 
const plaatjesArray = ['/images/Tovenaar.png', '/images/Reus.png', '/images/Heks.png', '/images/Barbaar.png'];

let profielFoto = document.querySelector('.profielFoto');
let profielFotoHeader = document.querySelector('.fotoHeader');
let fotoDiv = document.querySelector('.popupFotosOntzichtbaar');
let opslaanKnop = document.querySelector('.knopList button');

profielFoto.addEventListener('click', function() {
  fotoDiv.classList.toggle('popupFotosOntzichtbaar');
  fotoDiv.classList.toggle('popupFotosZichtbaar');
});

opslaanKnop.addEventListener('click', function() {
  fotoDiv.classList.add('popupFotosOntzichtbaar');
  fotoDiv.classList.remove('popupFotosZichtbaar');
  
  // Sla de huidige profielfoto op in de database
  updateProfielfotoInDatabase();
});

// Functie om geselecteerde profielfoto op te slaan in database
function updateProfielfotoInDatabase() {
  // Haal de volledige src waarde op
  const currentSrc = profielFoto.src;
  
  // Haal alleen de bestandsnaam eruit (bijvoorbeeld '/images/Tovenaar.png')
  const profilePhotoPath = currentSrc.substring(currentSrc.indexOf('/images/'));
  
  fetch('/updateProfielfoto', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ profielfoto: profilePhotoPath }),
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showNotification('Profielfoto succesvol opgeslagen!');
    } else {
      showNotification(`Fout bij opslaan van profielfoto: ${data.message}`);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showNotification('Er is een fout opgetreden bij het opslaan van de profielfoto.');
  });
}

const fotoElements = fotoDiv.querySelectorAll('img');
fotoElements.forEach((fotoElement, index) => {
  fotoElement.addEventListener('click', function() {
    profielFoto.src = plaatjesArray[index];
    profielFotoHeader.src = plaatjesArray[index];
  });
});



