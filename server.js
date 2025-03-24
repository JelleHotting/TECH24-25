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

  try {
    const response = await fetch(`https://cocproxy.royaleapi.dev/v1/clans?name=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    });

    if (!response.ok) {
      console.error(`Error: ${response.status} - ${response.statusText}`);
      return res.status(response.status).send(response.statusText);
    }

    const data = await response.json();
    res.render('searchResults', { clans: data.items });
  } catch (err) {
    console.error('Error fetching data from Clash of Clans API', err);
    res.status(500).send('Error fetching data from Clash of Clans API');
  }
});

// Route om details van een specifieke clan op te halen
app.get('/clan/:clanTag', async (req, res) => {
  const apiToken = process.env.COC_API_KEY;
  const clanTag = req.params.clanTag;

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
      
    // Extraction logic is kept the same
    const clanName = data.name;
    const clanLevel = data.clanLevel;
    const clanImg = data.badgeUrls.small;
    const clanDivisie = data.warLeague ? data.warLeague.name : 'N/A';
    const trophies = data.clanPoints;
    const requiredTrophies = data.requiredTrophies;
    const requiredTownHallLevel = data.requiredTownhallLevel;
    const memberCount = data.members;
    const description = data.description;
    const language = data.chatLanguage ? data.chatLanguage.name : 'N/A';
    const location = data.location ? data.location.name : 'N/A';
    const type = data.type;

    const members = data.memberList.map(member => member.name);
    const membersString = members.join(', ');

    res.render('clan', { 
      clanName, clanTag, clanLevel, clanImg, clanDivisie, trophies, 
      requiredTrophies, requiredTownHallLevel, memberCount, description, 
      language, location, type, membersString
    });
  } catch (err) {
    console.error('Error fetching data from Clash of Clans API', err);
    res.status(500).send('Error fetching data from Clash of Clans API');
  }
});

// Route om een clan op te slaan in je profiel
app.post('/saveClan', isAuthenticated, async (req, res) => {
  try {
    const collection = client.db(process.env.DB_NAME).collection('submissions');
    await collection.updateOne(
      { username: req.session.username }, 
      { $push: { favoriteClans: req.body.clanTag } }, 
      { upsert: true }
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('Error inserting document into MongoDB', err);
    res.sendStatus(500);
  }
});

// Route om een opgeslagen clan op te halen uit de database
app.get('/profile', isAuthenticated, async (req, res) => {
  try {
    // Verbind met de collectie in MongoDB
    const collection = client.db(process.env.DB_NAME).collection('submissions');
    const user = await collection.findOne({ username: req.session.user});
    console.log(req.session.user)

    // Zorg ervoor dat favoriteClans bestaat
    const favoriteClans = (user && user.favoriteClans) ? user.favoriteClans : [];
    console.log('Favorite clans:', favoriteClans);
    let error = "";
    if (favoriteClans) {
      if (favoriteClans.length === 0) {
         error = 'Je hebt nog geen opgeslagen clans';
      }
    } else {
       error = 'Je hebt nog geen opgeslagen clans';
    }

    // Verstuur de favoriteClans naar de EJS-view
    console.log(favoriteClans)
    res.render('profile', { favoriteClans, email: user.email, error });
  } catch (err) {
    console.error('Error fetching favorite clans from MongoDB', err);
    res.sendStatus(500);
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
    
    // Demonstratie clans voor het geval de API faalt
    const demoClans = [
      {
        name: "Dutch Warriors",
        tag: "#2Y8RLGR9P",
        badgeUrls: { small: "https://api-assets.clashofclans.com/badges/70/0Qpj9K1t0boy2eUkqCmuIvGOlt9p4RWhVNOt0bIOSGM.png" },
        clanLevel: 10,
        clanPoints: trophies - 100, // Dicht bij de gewenste trofeeën
        requiredTownhallLevel: townHallLevel - 1,
        requiredTrophies: 2000,
        members: 43,
        location: { name: countryCode || "Netherlands" },
        type: "inviteOnly"
      },
      {
        name: "Global Champions",
        tag: "#8PRVR2LP",
        badgeUrls: { small: "https://api-assets.clashofclans.com/badges/70/RLDQCHkm2N5IvqO7NqDlItBB0mP0TGLdXhVPb6x4lYM.png" },
        clanLevel: 15,
        clanPoints: trophies + 100, // Dicht bij de gewenste trofeeën
        requiredTownhallLevel: townHallLevel - 2,
        requiredTrophies: 2500,
        members: 48,
        location: { name: "International" },
        type: "open"
      }
    ];
    
    let clans = [];
    
    try {
      const apiToken = process.env.COC_API_KEY;
      
      if (!apiToken) {
        console.log("Geen API token gevonden, gebruik demo clans");
        throw new Error("Geen API token gevonden");
      }
      
      // Bouw query parameters op basis van de antwoorden
      let queryParams = new URLSearchParams();
      
      // const minTrophiesForQuery = Math.max(0, trophies - 1000);
      // queryParams.append('requiredTrophies', minTrophiesForQuery.toString());
      
      // if (townHallLevel > 1) {
      //   queryParams.append('minRequiredTownhallLevel', Math.max(1, townHallLevel - 3).toString());
      // }
      
      if (countryCode) {
        queryParams.append('locationId', countryCode);
      }
      
      // queryParams.append('limit', '50');
      
      let apiUrl = `https://cocproxy.royaleapi.dev/v1/clans?${queryParams.toString()}`;
      
      console.log(`API aanroepen met filters: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      });

      if (!response.ok) {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        clans = data.items;
        console.log(`${data.items.length} clans opgehaald van API met voorfiltering`);
      } else {
        console.log("Geen clans gevonden met voorfiltering, gebruik demo clans");
        clans = demoClans;
      }
    } catch (apiError) {
      console.log("Fout bij API aanroep, gebruik demo clans:", apiError.message);
      clans = demoClans;
    }
    
    const filteredClans = clans.filter(clan => {
      const requiredTH = clan.requiredTownhallLevel || 0;
      const thMatch = requiredTH <= townHallLevel;
    
      const trophyRange = 1000;
      const minTrophies = Math.max(0, trophies - trophyRange);
      const maxTrophies = trophies + trophyRange;
      const trophyMatch = (clan.clanPoints >= minTrophies && clan.clanPoints <= maxTrophies);
    
      let locationMatch = true;
      if (countryCode && typeof countryCode === 'string' && clan.location && clan.location.id !== undefined) {
        locationMatch = clan.location.id === countryCode.toUpperCase();
      }
    
      return locationMatch;
    });
    
    console.log(`${filteredClans.length} clans na extra filteren`);
    
    filteredClans.sort((a, b) => {
      const diffA = Math.abs(a.clanPoints - trophies);
      const diffB = Math.abs(b.clanPoints - trophies);
      return diffA - diffB;
    });
    
    res.render('searchResults', { 
      clans,
    });
  } catch (err) {
    console.error('Algemene fout bij gefilterd zoeken:', err);
    res.render('searchResults', {
      clans: []
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