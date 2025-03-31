// Add info from .env file to process.env
require('dotenv').config()

// Initialise Express webserver
const express = require('express')
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express()


app
  .use(express.urlencoded({ extended: true })) // Middleware to parse form data
  .use(express.static('static'))              // Serve static files
  .set('views', 'view')                       // Set views directory
  .set('view engine', 'ejs')                  // Set view engine to EJS
  .use(session({
    secret: 'your_secret_key',                // Replace with a secure secret
    resave: false,
    saveUninitialized: true
  }))
  .use(express.json());                       // Middleware to handle JSON requests
  
  app.use((req, res, next) => {
    res.locals.username = req.session.user || null; // Add username if logged in, otherwise null
    next();
  });
                        

// Use MongoDB
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const dotenv = require('dotenv');
// Construct URL used to connect to database from info in the .env file
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority`
// Create a MongoClient
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
})

// Try to open a database connection
client.connect()
  .then(() => {
    console.log('Database connection established')
  })
  .catch((err) => {
    console.log(`Database connection error - ${err}`)
    console.log(`For uri - ${uri}`)
  })

// Auth middleware
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }

  res.redirect('/login');

}

// Home route
app.get('/', isAuthenticated, (req, res) => {
  res.render('home', { username: req.session.user }
  );
});

app.get('/home', isAuthenticated, (req, res) => {
  res.render('home', { username: req.session.user });
});

// Registratie - Verwijderd dubbele code
app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  try {
    const collection = client.db(process.env.DB_NAME).collection('submissions')

    // Controleer of het e-mailadres of gebruikersnaam al bestaat
    const existingUser = await collection.findOne({ 
      $or: [
        { email: req.body.email },
        { username: req.body.username }
      ]
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === req.body.email.toLowerCase()) {
        return res.render('register', { error: 'Email bestaat al. Probeer een ander e-mailadres.' });
      } else if (existingUser.username.toLowerCase() === req.body.username.toLowerCase()) {
        return res.render('register', { error2: 'Gebruikersnaam bestaat al. Probeer een andere gebruikersnaam.' });
      }
    }   

    // Controleer of de wachtwoorden overeenkomen
    if (req.body.password !== req.body.password2) {
      return res.render('register', { error: 'Wachtwoorden komen niet overeen.' });
    }

    // Hash het wachtwoord
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    const result = await collection.insertOne({
      email: req.body.email,
      username: req.body.username,
      password: hashedPassword
    })
    res.render('login');
  } catch (err) {
    console.error('Error inserting document into MongoDB', err)
    res.status(500).send('Error inserting document into MongoDB')
  }
})

// Login routes
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res, next) => {
  try {
    const collection = client.db(process.env.DB_NAME).collection('submissions');
    const user = await collection.findOne({ email: req.body.email });
    

    if (!user) {
      return res.send('Gebruiker niet gevonden');
    }

    const Match = await bcrypt.compare(req.body.password, user.password);

    if (Match) {
      // regenerate the session, which is good practice to help
      // guard against forms of session fixation
      req.session.regenerate(function (err) {
        if (err) return next(err);

        // store user information in session, typically a user id
        req.session.user = user.username;

        // save the session before redirection to ensure page
        // load does not happen before session is saved
        req.session.save(function (err) {
          if (err) return next(err);
          res.redirect('/');
        });
      });
    } else {
      res.send('Invalid password');
    }
  } catch (err) {
    console.error('Error finding document in MongoDB', err);
    res.status(500).send('Error finding document in MongoDB');
  }
});

// // Profiel route
// app.get('/profile', isAuthenticated, async (req, res) => {
//   try {
//     const collection = client.db(process.env.DB_NAME).collection('submissions');
//     const user = await collection.findOne({ username: req.session.user });

//     if (!user) {
//       return res.status(404).send('User not found');
//     }

//     res.render('profile', { 
//       email: user.email
//     });
//   } catch (err) {
//     console.error('Error fetching user from MongoDB', err);
//     res.status(500).send('Error fetching user from MongoDB');
//   }
// });

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.redirect('/login');
  });
});

// Vragenlijst route
app.get('/vragenlijst', (req, res) => {
  res.render('vragenlijst');
});

// Search route om clans op te halen van Clash of Clans API
app.get('/search', isAuthenticated, async (req, res) => {
  const apiToken = process.env.COC_API_KEY;
  const query = req.query.clanName;

  // Check if search query is empty or too short
  if (!query || query.trim().length < 3) {
    return res.render('searchResults', { 
      clans: [],
      error: 'Voer minimaal 3 tekens in om te zoeken naar een clan.'
    });
  }

  try {
    const response = await fetch(`https://cocproxy.royaleapi.dev/v1/clans?name=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });

    if (!response.ok) {
      console.error(`Error: ${response.status} - ${response.statusText}`);
      return res.render('searchResults', {
        clans: [],
        error: `API fout: ${response.status} - ${response.statusText}`
      });
    }

    const data = await response.json();
    
    // Check if results are empty
    if (!data.items || data.items.length === 0) {
      return res.render('searchResults', {
        clans: [],
        error: `Geen clans gevonden voor "${query}". Probeer een andere zoekopdracht.`,
        searchTerm: query
      });
    }

    res.render('searchResults', { 
      clans: data.items,
      searchTerm: query
    });
  } catch (err) {
    console.error('Error fetching data from Clash of Clans API', err);
    res.render('searchResults', {
      clans: [],
      error: 'Er is een fout opgetreden bij het ophalen van clan gegevens. Probeer het later opnieuw.',
      searchTerm: query
    });
  }
});

// Route om details van een specifieke clan op te halen
app.get('/clan/:clanTag', async (req, res) => {
  const apiToken = process.env.COC_API_KEY;
  const clanTag = req.params.clanTag;

  // Controleer of de clan al in favorieten staat
  let isFavorite = false;
  try {
    const collection = client.db(process.env.DB_NAME).collection('submissions');
    const user = await collection.findOne({ username: req.session.user });

    if (user && user.favoriteClans && user.favoriteClans.includes(clanTag)) {
      isFavorite = true;
    }
  } catch (err) {
    console.error('Error fetching favorite clans from MongoDB', err);
    return res.status(500).send('Error fetching favorite clans from MongoDB');
  }

  // Haal claninformatie op
  try {
    const response = await fetch(`https://cocproxy.royaleapi.dev/v1/clans/%23${clanTag}`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Maak een string van de ledennamen
    const membersString = data.memberList.map(member => member.name).join(', ');

    // Render de pagina en geef isFavorite door
    res.render('clan', {
      clanTag,
      isFavorite,
      clanName: data.name,
      clanLevel: data.clanLevel,
      clanImg: data.badgeUrls.small,
      clanDivisie: data.warLeague ? data.warLeague.name : 'N/A',
      trophies: data.clanPoints,
      requiredTrophies: data.requiredTrophies,
      requiredTownHallLevel: data.requiredTownhallLevel,
      memberCount: data.members,
      description: data.description,
      language: data.chatLanguage ? data.chatLanguage.name : 'N/A',
      location: data.location ? data.location.name : 'N/A',
      type: data.type,
      membersString
    });
  } catch (error) {
    console.error('Error fetching clan data:', error);
    res.status(500).send('Er is een fout opgetreden.');
  }
});

// Route om een clan op te slaan in je profiel
app.post('/saveClan', async (req, res) => {
  const { clanTag } = req.body;
  const username = req.session.user;

  try {
    const collection = client.db(process.env.DB_NAME).collection('submissions');
    const user = await collection.findOne({ username });

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Voeg de clanTag toe aan de lijst van favoriete clans als deze nog niet bestaat
    const favoriteClans = user.favoriteClans || [];
    if (!favoriteClans.includes(clanTag)) {
      favoriteClans.push(clanTag);
      await collection.updateOne(
        { username },
        { $set: { favoriteClans } }
      );
    }

    res.redirect(`/clan/${clanTag}`);
  } catch (err) {
    console.error('Error saving favorite clan to MongoDB', err);
    res.status(500).send('Error saving favorite clan to MongoDB');
  }
});

app.post('/removeClan', async (req, res) => {
  const { clanTag } = req.body;
  const username = req.session.user;

  try {
    const collection = client.db(process.env.DB_NAME).collection('submissions');
    const user = await collection.findOne({ username });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Gebruiker niet gevonden' });
    }

    // Verwijder de clanTag uit de lijst van favoriete clans
    const favoriteClans = user.favoriteClans || [];
    const updatedClans = favoriteClans.filter(tag => tag !== clanTag);

    await collection.updateOne(
      { username },
      { $set: { favoriteClans: updatedClans } }
    );

    // Return success response instead of redirecting
    res.json({ 
      success: true, 
      message: 'Clan is verwijderd uit je favorieten' 
    });
  } catch (err) {
    console.error('Error removing favorite clan from MongoDB', err);
    res.status(500).json({ 
      success: false, 
      message: 'Er is een fout opgetreden bij het verwijderen van de clan' 
    });
  }
});


// Route om een opgeslagen clan op te halen uit de database
app.get('/profile', isAuthenticated, async (req, res) => {
  try {
    // Verbind met de collectie in MongoDB
    const collection = client.db(process.env.DB_NAME).collection('submissions');
    const user = await collection.findOne({ username: req.session.user});
    
    // Zorg ervoor dat favoriteClans bestaat
    const favoriteClans = (user && user.favoriteClans) ? user.favoriteClans : [];
    
    if (!favoriteClans || favoriteClans.length === 0) {
      return res.render('profile', { 
        clansData: [],
        favoriteClans: [],
        email: user.email, 
        error: 'Je hebt nog geen opgeslagen clans'
      });
    }
    
    const apiToken = process.env.COC_API_KEY;
    
    // Maak een array van promises voor alle API verzoeken
    const clanPromises = favoriteClans.map(async (clanTag) => {
      const response = await fetch(`https://cocproxy.royaleapi.dev/v1/clans/%23${clanTag}`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      });

      if (!response.ok) {
        console.error(`Error fetching clan ${clanTag}: ${response.status}`);
        return null;
      }

      const data = await response.json();

      // Prepare members as a string
      const membersString = data.memberList.map(member => member.name).join(', ');

      return {
        clanTag,
        clanName: data.name,
        clanLevel: data.clanLevel,
        clanImg: data.badgeUrls.small,
        clanDivisie: data.warLeague ? data.warLeague.name : 'N/A',
        trophies: data.clanPoints,
        requiredTrophies: data.requiredTrophies,
        requiredTownHallLevel: data.requiredTownhallLevel,
        memberCount: data.members,
        description: data.description,
        language: data.chatLanguage ? data.chatLanguage.name : 'N/A',
        location: data.location ? data.location.name : 'N/A',
        type: data.type,
        membersString
      };
    });
    
    
    // Wacht tot alle clan data is opgehaald
    const clansDataWithNulls = await Promise.all(clanPromises);
    
    // Filter eventuele null waarden (mislukte verzoeken) uit
    const clansData = clansDataWithNulls.filter(clan => clan !== null);
    
    // Render de pagina met alle clan data
    res.render('profile', { 
      clansData,
      favoriteClans,
      email: user.email, 
      error: clansData.length === 0 ? 'Er is een probleem opgetreden bij het ophalen van je clans' : ''
    });
    
  } catch (err) {
    console.error('Error fetching favorite clans from MongoDB', err);
    res.status(500).send('Error fetching favorite clans from MongoDB');
  }
});

// Route om antwoorden op te slaan in de sessie
app.post('/save-answer', (req, res) => {
  // Controleer of er een verzoek body is
  if (!req.body || !req.body.questionId || !req.body.fieldName || req.body.value === undefined) {
    return res.status(400).json({ 
      success: false, 
      message: 'Vereiste velden ontbreken: questionId, fieldName of value'
    });
  }

  const { questionId, fieldName, value } = req.body;
  
  // Initialiseer answers object in de sessie als het nog niet bestaat
  if (!req.session.answers) {
    req.session.answers = {};
  }
  
  // Initialiseer object voor deze vraag als het nog niet bestaat
  if (!req.session.answers[questionId]) {
    req.session.answers[questionId] = {};
  }
  
  // Sla het antwoord op in de sessie
  req.session.answers[questionId][fieldName] = value;
  
  // Log voor debugging
  console.log(`Antwoord opgeslagen in sessie:`, req.session.answers);
  
  // Stuur bevestiging terug
  res.json({ success: true, message: 'Antwoord opgeslagen' });
});

// Route voor gefilterde zoekresultaten gebaseerd op vragenlijst antwoorden
app.get('/filtered-search', async (req, res) => {
  try {
    // Controleer of er antwoorden zijn ingevuld
    if (!req.session.answers || Object.keys(req.session.answers).length === 0) {
      return res.render('searchResults', {
        clans: [],
        error: 'Je hebt nog geen voorkeuren ingevuld. Ga naar de vragenlijst om jouw ideale clan te vinden.',
        searchTerm: 'Gefilterd zoeken'
      });
    }
    
    // Toon de sessie-antwoorden voor debugging
    console.log("Sessie antwoorden:", req.session.answers);
    
    // Haal antwoorden uit sessie
    const answers = req.session.answers || {};
    
    // Standaardwaarden instellen als bepaalde antwoorden ontbreken
    const townHallLevel = answers['question-1'] && answers['question-1']['townhall-level'] 
      ? parseInt(answers['question-1']['townhall-level']) 
      : 11; // Standaard level 11
      
    const countryCode = answers['question-2'] && answers['question-2']['land'] 
      ? answers['question-2']['land']
      : null; // Geen landfilter als niet opgegeven
      
    const trophies = answers['question-3'] && answers['question-3']['trophies'] 
      ? parseInt(answers['question-3']['trophies']) 
      : 2000; // Standaard 2000 trofeeën
    
    console.log(`Filter criteria - TH: ${townHallLevel}, Landcode: ${countryCode}, Trofeeën: ${trophies}`);
    
    let clans = [];
    
    try {
      const apiToken = process.env.COC_API_KEY;
      
      if (!apiToken) {
        console.log("Geen API token gevonden");
        return res.render('searchResults', {
          clans: [],
          error: 'Er is een fout opgetreden bij het ophalen van clan gegevens. API token ontbreekt.',
          searchTerm: 'Gefilterd zoeken'
        });
      }
      
      // Bouw query parameters op basis van de antwoorden
      let queryParams = new URLSearchParams();
      
      // Voeg locationId toe als die opgegeven is
      if (countryCode) {
        queryParams.append('locationId', countryCode);
      }
      
      // Voeg minimaal aantal trofeeën toe (ongeveer 1000 minder dan gewenst)
      const minTrophies = Math.max(0, trophies - 1000);
      queryParams.append('minClanPoints', minTrophies.toString());
      
      // We willen geen minTownHallLevel parameter gebruiken omdat we zelf willen filteren
      // op basis van de requiredTownhallLevel van elke clan
      
      // Beperk aantal resultaten
      queryParams.append('limit', '50');
      
      let apiUrl = `https://cocproxy.royaleapi.dev/v1/clans?${queryParams.toString()}`;
      
      console.log(`API aanroepen met filters: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      });

      if (!response.ok) {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        
        let gebruikersFoutmelding = 'Er is een probleem met de Clash of Clans API. Probeer het later nog eens.';
        
        // Speciale foutmeldingen voor bepaalde HTTP-statuscodes
        if (response.status === 400) {
          gebruikersFoutmelding = 'De zoekopdracht bevat ongeldige parameters. Probeer andere filteropties.';
        } else if (response.status === 403) {
          gebruikersFoutmelding = 'Geen toegang tot de Clash of Clans API. Neem contact op met de beheerder.';
        } else if (response.status === 429) {
          gebruikersFoutmelding = 'Te veel zoekopdrachten. Wacht even en probeer het opnieuw.';
        } else if (response.status === 503) {
          gebruikersFoutmelding = 'De Clash of Clans API is momenteel niet beschikbaar. Probeer het later nog eens.';
        }
        
        return res.render('searchResults', {
          clans: [],
          error: gebruikersFoutmelding,
          searchTerm: 'Gefilterd zoeken'
        });
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        clans = data.items;
        console.log(`${data.items.length} clans opgehaald van API met voorfiltering`);
      } else {
        console.log("Geen clans gevonden met voorfiltering");
        return res.render('searchResults', {
          clans: [],
          error: 'Geen clans gevonden die aan je zoekcriteria voldoen. Probeer andere filters.',
          searchTerm: 'Gefilterd zoeken'
        });
      }
    } catch (apiError) {
      console.log("Fout bij API aanroep:", apiError.message);
      return res.render('searchResults', {
        clans: [],
        error: `Er is een fout opgetreden bij het ophalen van clan gegevens: ${apiError.message}`,
        searchTerm: 'Gefilterd zoeken'
      });
    }
    
    // Nauwkeuriger filteren aan de server kant
    const filteredClans = clans.filter(clan => {
      // Town Hall niveau filter: 
      // Als een clan requiredTownhallLevel=11 heeft, kan een speler met TH10 er niet bij
      // maar een speler met TH11 of hoger wel
      const requiredTH = clan.requiredTownhallLevel || 0;
      const thMatch = townHallLevel >= requiredTH;
      
      // Trofeeën filter:
      // Als een clan requiredTrophies=3000 heeft, kan een speler met 2000 trofeeën er niet bij
      // maar een speler met 3000 of meer trofeeën wel
      const requiredTrophies = clan.requiredTrophies || 0;
      const trophyMatch = trophies >= requiredTrophies;
      
      // Locatie filter: alleen filteren op locatie als die is opgegeven
      let locationMatch = true;
      if (countryCode && clan.location && clan.location.id) {
        locationMatch = clan.location.id.toString() === countryCode.toString();
      }

      // Log voor debugging
      if (Math.random() < 0.1) { // Log ongeveer 10% van de clans voor debugging
        console.log(`Clan: ${clan.name}, Required TH: ${requiredTH}, Player TH: ${townHallLevel}, TH Match: ${thMatch}`);
        console.log(`Required Trophies: ${requiredTrophies}, Player Trophies: ${trophies}, Trophy Match: ${trophyMatch}`);
        console.log(`Location Match: ${locationMatch}`);
      }
      
      // Clan moet aan alle criteria voldoen
      return thMatch && trophyMatch && locationMatch;
    });
    
    console.log(`${filteredClans.length} clans na extra filteren`);
    
    // Sorteer clans op basis van meerdere factoren (beste match eerst)
    filteredClans.sort((a, b) => {
      // Bereken hoe goed de clan past bij de speler
      const scoreA = calculateMatchScore(a, townHallLevel, trophies, countryCode);
      const scoreB = calculateMatchScore(b, townHallLevel, trophies, countryCode);
      
      // Hogere score betekent betere match
      return scoreB - scoreA;
    });

    // Helper functie om te berekenen hoe goed een clan bij de speler past
    function calculateMatchScore(clan, playerTH, playerTrophies, countryCode) {
      let score = 0;
      
      // Bonus voor Town Hall level match
      const thDiff = playerTH - (clan.requiredTownhallLevel || 0);
      if (thDiff >= 0 && thDiff <= 2) {
        score += 30; // Perfecte TH match (0-2 niveaus hoger)
      } else if (thDiff > 2) {
        score += 15; // Speler is veel te hoog level voor de clan
      }
      
      // Bonus voor trofeeën match
      const trophyDiff = playerTrophies - (clan.requiredTrophies || 0);
      if (trophyDiff >= 0 && trophyDiff <= 500) {
        score += 30; // Perfecte trofeeën match (0-500 meer)
      } else if (trophyDiff > 500) {
        score += 15; // Speler heeft veel meer trofeeën dan nodig
      }
      
      // Bonus voor locatie match
      if (countryCode && clan.location && clan.location.id) {
        if (clan.location.id.toString() === countryCode.toString()) {
          score += 40; // Perfecte locatie match
        }
      } else if (!countryCode) {
        score += 20; // Als geen locatie is opgegeven, geef deelse match
      }
      
      // Bonus voor actieve clans
      score += Math.min(20, clan.members || 0); // Tot 20 punten voor een volle clan
      
      // Bonus voor hogere clan levels
      score += Math.min(20, (clan.clanLevel || 0) * 2); // Tot 20 punten voor level 10 clan
      
      return score;
    }
    
    // Als er na het filteren geen clans overblijven
    if (filteredClans.length === 0) {
      return res.render('searchResults', {
        clans: [],
        error: 'Geen clans gevonden die aan je zoekcriteria voldoen. Probeer andere filters of minder strenge criteria.',
        searchTerm: 'Gefilterd zoeken'
      });
    }
    
    res.render('searchResults', { 
      clans: filteredClans,
      searchTerm: 'Gefilterd zoeken op basis van jouw voorkeuren'
    });
  } catch (err) {
    console.error('Algemene fout bij gefilterd zoeken:', err);
    res.render('searchResults', {
      clans: [],
      error: 'Er is een onverwachte fout opgetreden bij het zoeken naar clans. Probeer het later nog eens.',
      searchTerm: 'Gefilterd zoeken'
    });
  }
});



// Hulproute om locatie-informatie op te halen
app.get('/api/locations', async (req, res) => {
  const apiToken = process.env.COC_API_KEY;
  
  try {
    const response = await fetch('https://cocproxy.royaleapi.dev/v1/locations', {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data.items);
  } catch (err) {
    console.error('Error fetching locations', err);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Eenmalige debug route om de API te testen
app.get('/test-api', async (req, res) => {
  try {
    const apiToken = process.env.COC_API_KEY;
    console.log("API Token beschikbaar:", !!apiToken);
    
    if (!apiToken) {
      return res.send("Geen API token beschikbaar in process.env.COC_API_KEY");
    }
    
    // Test een eenvoudige API aanroep
    const response = await fetch('https://cocproxy.royaleapi.dev/v1/clans?limit=5', {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });
    
    console.log("API response status:", response.status);
    
    if (!response.ok) {
      return res.send(`API Error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('API test error:', err);
    res.send(`API test error: ${err.message}`);
  }
});

// Start de server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`✅ Server draait op poort ${PORT}, open http://localhost:${PORT} in je browser`));

// Middleware to handle not found errors - error 404
app.use((req, res) => {
  // log error to console
  console.error('404 error at URL: ' + req.url)
  // send back a HTTP response with status code 404
  res.status(404).render('404', { url: req.url });
})

// Middleware to handle server errors - error 500
app.use((err, req, res) => {
  // log error to console
  console.error(err.stack)
  // send back a HTTP response with status code 500
  res.status(500).send('500: server error')
})