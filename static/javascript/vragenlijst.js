document.addEventListener('DOMContentLoaded', function() {
    // Object om alle antwoorden op te slaan - verplaatst naar het begin van de scope
    let answers = {};
    
    // Voeg iconen toe aan de select opties zoals in je eerdere code
    const select = document.getElementById('townhall-level');
    const options = select?.options;

    // Progressbar initialiseren
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');
    
    // Vragen navigatie
    const questions = document.querySelectorAll('.question');
    const nextButtons = document.querySelectorAll('.next-button');
    const prevButtons = document.querySelectorAll('.prev-button');
    let currentQuestion = 0;
    const totalQuestions = questions.length;

    // Bijwerk de progressbar functie
    function updateProgressBar() {
        if (!progressBar) return;
        const percentage = ((currentQuestion + 1) / totalQuestions) * 100;
        progressBar.style.width = percentage + '%';
    }
    
    // Functie om antwoord op te slaan
    function saveAnswer(questionId, fieldName, value) {
        if (!answers[questionId]) {
            answers[questionId] = {};
        }
        answers[questionId][fieldName] = value;
        
        console.log(`Verstuur naar server: ${questionId, fieldName, value}`);
        
        // Stuur het antwoord naar de server om in de sessie op te slaan
        return fetch('/save-answer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                questionId: questionId,
                fieldName: fieldName,
                value: value
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Antwoord opgeslagen:', data);
            return data;
        })
        .catch(error => {
            console.error('Error bij opslaan van antwoord:', error);
            throw error;
        });
    }


    
    // Slider voor trofeeën
    const trophiesSlider = document.getElementById('trophies');
    const trophiesValue = document.getElementById('trophies-value');
    const trophiesInput = document.getElementById('trophies-input');
    
    // Functie om de waarde van de trofeeën bij te werken, zonder automatisch opslaan
    function updateTrophiesValue(value) {
        if (trophiesValue) trophiesValue.textContent = value;
        if (trophiesSlider) trophiesSlider.value = value;
        if (trophiesInput) trophiesInput.value = value;
    }
    
    // Initiële progressbar instellen
    updateProgressBar();
    
    if (trophiesSlider) {
        // Update waarde bij verandering
        trophiesSlider.addEventListener('input', function() {
            updateTrophiesValue(this.value);
        });
    }
    
    if (trophiesInput) {
        // Update bij verandering van het invoerveld
        trophiesInput.addEventListener('input', function() {
            // Zorg dat de waarde binnen de min/max grenzen blijft
            let value = parseInt(this.value);
            const min = trophiesSlider ? parseInt(trophiesSlider.min) : 0;
            const max = trophiesSlider ? parseInt(trophiesSlider.max) : 10000;
            
            // Als de waarde ongeldig is, gebruik de standaardwaarde
            if (isNaN(value)) {
                value = 2000;
            }
            
            // Beperk tot min en max waarden
            value = Math.max(min, Math.min(value, max));
            
            // Update alle gerelateerde elementen zonder op te slaan
            updateTrophiesValue(value);
        });
        
        // Corriger de waarde bij verlaten van het veld
        trophiesInput.addEventListener('blur', function() {
            if (this.value === '' || isNaN(parseInt(this.value))) {
                updateTrophiesValue(2000);
            }
        });
    }
    
    // Event listeners voor de select elementen en slider
    const townhallSelect = document.getElementById('townhall-level');
    const landSelect = document.getElementById('land');
    
    // Functie om alle antwoorden te verzamelen en op te slaan
    async function saveAllAnswers() {
        try {
            const answers = {};
            
            // Verzamel alle antwoorden
            if (townhallSelect && townhallSelect.value) {
                await saveAnswer('question-1', 'townhall-level', townhallSelect.value);
                answers['townhall'] = townhallSelect.value;
            }
            
            if (landSelect && landSelect.value) {
                await saveAnswer('question-2', 'land', landSelect.value);
                answers['land'] = landSelect.value;
            }
            
            let trophyValue = 2000;
            if (trophiesInput && trophiesInput.value) {
                trophyValue = trophiesInput.value;
            } else if (trophiesSlider && trophiesSlider.value) {
                trophyValue = trophiesSlider.value;
            }
            
            await saveAnswer('question-3', 'trophies', trophyValue);
            answers['trophies'] = trophyValue;
            
            return answers;
        } catch (error) {
            console.error("Fout bij opslaan van antwoorden:", error);
            throw error;
        }
    }
    
    // Navigatie naar volgende vraag - sla de antwoorden op bij het klikken op de knop
    nextButtons.forEach((button, index) => {
        button.addEventListener('click', async function() {
            // Huidige vraag ID
            const currentQuestionId = questions[currentQuestion].id;
            
            console.log(`Volgende knop geklikt voor ${currentQuestionId}`);
            
            // Sla antwoorden op alleen wanneer op de knop wordt geklikt
            if (currentQuestionId === 'question-1' && townhallSelect) {
                await saveAnswer(currentQuestionId, 'townhall-level', townhallSelect.value);
            } else if (currentQuestionId === 'question-2' && landSelect) {
                await saveAnswer(currentQuestionId, 'land', landSelect.value);
            } else if (currentQuestionId === 'question-3') {
                // BELANGRIJK: Deze aanpassing verwijdert de afhankelijkheid van trophiesSlider
                // We gaan direct naar het input veld of de slider
                let trophyValue = 2000; // Standaardwaarde
                
                if (trophiesInput && trophiesInput.value) {
                    trophyValue = trophiesInput.value;
                    console.log(`Trofeeën waarde uit input: ${trophyValue}`);
                } else if (trophiesSlider && trophiesSlider.value) {
                    trophyValue = trophiesSlider.value;
                    console.log(`Trofeeën waarde uit slider: ${trophyValue}`);
                }
                
                console.log(`Definitieve trofeeën waarde om op te slaan: ${trophyValue}`);
                await saveAnswer(currentQuestionId, 'trophies', trophyValue);
            }
            
            // De laatste knop gaat naar de zoekresultaten pagina met filters
            if (currentQuestion === totalQuestions - 1) {
                try {
                    // BELANGRIJK: Verzamel alle antwoorden voor zekerheid
                    await saveAllAnswers();
                    
                    // Redirect naar de gefilterde zoekresultaten
                    window.location.href = '/filtered-search';
                    return;
                } catch (error) {
                    console.error("Fout bij opslaan en redirecten:", error);
                    alert("Er is een fout opgetreden. Probeer het opnieuw.");
                }
            } else {
                // Anders, ga naar de volgende vraag
                if (currentQuestion < totalQuestions - 1) {
                    questions[currentQuestion].classList.remove('active');
                    questions[currentQuestion].classList.add('prev');
                    currentQuestion++;
                    questions[currentQuestion].classList.remove('prev');
                    questions[currentQuestion].classList.add('active');
                    updateProgressBar();
                }
            }
        });
    });

    // Navigatie naar vorige vraag
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (currentQuestion > 0) {
                questions[currentQuestion].classList.remove('active');
                currentQuestion--;
                questions[currentQuestion].classList.remove('prev');
                questions[currentQuestion].classList.add('active');
                updateProgressBar();
            }
        });
    });

    // Initialiseer aangepaste dropdown met zoekfunctie
    initCustomSelect();
});

function initCustomSelect() {
  const customSelect = document.querySelector('.custom-select');
  const selectSelected = document.querySelector('.select-selected');
  const searchInput = document.getElementById('landSearch');
  const selectItems = document.querySelector('.select-items');
  const allOptions = document.querySelectorAll('.all-options div');
  const hiddenInput = document.getElementById('land');
  
  if (!customSelect || !selectSelected || !searchInput || !selectItems) {
    return; // Stop als een van de elementen niet bestaat
  }
  
  // Klik op de geselecteerde optie toont/verbergt de items
  selectSelected.addEventListener('click', function(e) {
    e.stopPropagation();
    
    // Toggle zichtbaarheid van dropdown
    if (selectItems.style.display === 'block') {
      selectItems.style.display = 'none';
      this.classList.remove('select-arrow-active');
    } else {
      selectItems.style.display = 'block';
      this.classList.add('select-arrow-active');
      
      // Focus op zoekveld als de dropdown wordt geopend
      searchInput.focus();
    }
  });
  
  // Klik op een optie
  allOptions.forEach(item => {
    item.addEventListener('click', function() {
      const value = this.getAttribute('data-value');
      
      // Niet selecteren als het de placeholder is
      if (value === '') return;
      
      // Stel de geselecteerde tekst in
      selectSelected.textContent = this.textContent;
      selectSelected.classList.add('selected');
      
      // Verberg de dropdown
      selectItems.style.display = 'none';
      selectSelected.classList.remove('select-arrow-active');
      
      // Stel het verborgen input veld in
      hiddenInput.value = value;
      
      // Spaar het antwoord op (als deze functie bestaat)
      if (typeof saveAnswer === 'function') {
        saveAnswer('question-2', 'land', value);
      }
      
      // Reset zoekveld en toon alle opties weer
      searchInput.value = '';
      filterOptions('');
    });
  });
  
  // Zoekfunctionaliteit
  searchInput.addEventListener('input', function() {
    filterOptions(this.value);
  });
  
  // Filter opties op basis van zoekterm
  function filterOptions(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    let found = false;
    
    // Verwijder bestaande "geen resultaten" bericht
    const existingNoResults = selectItems.querySelector('.no-results');
    if (existingNoResults) {
      existingNoResults.remove();
    }
    
    allOptions.forEach(item => {
      const text = item.textContent.toLowerCase();
      
      if (text.indexOf(searchTerm) > -1) {
        item.style.display = '';
        found = true;
      } else {
        item.style.display = 'none';
      }
    });
    
    // Toon bericht als er geen resultaten zijn
    if (!found) {
      const noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.textContent = 'Geen landen gevonden';
      selectItems.appendChild(noResults);
    }
  }
  
  // Klik buiten de dropdown sluit deze
  document.addEventListener('click', function() {
    selectItems.style.display = 'none';
    selectSelected.classList.remove('select-arrow-active');
  });
  
  // Stop propagatie bij klikken in de dropdown
  selectItems.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  // Stop propagatie bij klikken in het zoekveld
  searchInput.addEventListener('click', function(e) {
    e.stopPropagation();
  });
}