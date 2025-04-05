// Function to handle removing a clan from favorites on the profile page
function setupClanRemovalHandlers() {
  // Get all remove buttons on the page
  const removeButtons = document.querySelectorAll('.remove-favorite-button');
  
  // Add click event listener to each button
  removeButtons.forEach(button => {
    button.addEventListener('click', async function(event) {
      event.preventDefault();
      
      // Get the clan tag from the data attribute
      const clanTag = this.getAttribute('data-clan-tag');
      
      try {
        // Send AJAX request to remove the clan
        const response = await fetch('/removeClan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clanTag: clanTag,
            source: 'profile'  // This tells the server the request came from the profile page
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          // If successful, remove the clan element from the page
          const clanElement = this.closest('.clan-item');
          if (clanElement) {
            clanElement.remove();
            
            // Check if there are any clans left
            const remainingClans = document.querySelectorAll('.clan-item');
            if (remainingClans.length === 0) {
              // Display a message if no clans are left
              const clansContainer = document.querySelector('.favorite-clans-container');
              if (clansContainer) {
                clansContainer.innerHTML = '<p>Je hebt geen opgeslagen favoriete clans.</p>';
              }
            }
          }
        } else {
          console.error('Failed to remove clan');
        }
      } catch (error) {
        console.error('Error removing clan:', error);
      }
    });
  });
}

// Run the setup when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  setupClanRemovalHandlers();
  
  // Any other profile page initialization code can go here
});