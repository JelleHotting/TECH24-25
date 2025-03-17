// Add info from .env file to process.env
require('dotenv').config()

// Initialise Express webserver
const express = require('express')
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express()

app
  .use(express.urlencoded({extended: true})) // middleware to parse form data from incoming HTTP request and add form fields to req.body
  .use(express.static('static'))             // Allow server to serve static content such as images, stylesheets, fonts or frontend js from the directory named static
  .set('views', 'view')                      // And tell it the views can be found in the directory named view
  .use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
  }))                                        // Add session middleware
  .set('view engine', 'ejs');                      

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

  function isAuthenticated(req, res, next) {
    if (req.session.username) {
      return next();
    }
  
    res.redirect('/login');
  }


app.get('/', isAuthenticated, (req, res) => {
  res.render('home', { username: req.session.username });
})



// Registratie
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

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const collection = client.db(process.env.DB_NAME).collection('submissions');
    const user = await collection.findOne({ username: req.session.username });

    if (!user) {
      return res.status(404).send('User not found');
    }

    res.render('profile', { 
      username: req.session.username,
      email: user.email
    });
  } catch (err) {
    console.error('Error fetching user from MongoDB', err);
    res.status(500).send('Error fetching user from MongoDB');
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const collection = client.db(process.env.DB_NAME).collection('submissions')
    const user = await collection.findOne({ email: req.body.email })
    console.log(req.body.email)

    if (!user) {
      return res.send('Gebruiker niet gevonden')
    }

    const Match = await bcrypt.compare(req.body.password, user.password);

    // Controleer of het wachtwoord overeenkomt
    if (Match) {
      req.session.username = user.username; // Save username in session
      res.render('home', { username: user.username }) // Pass username to the homepage
    } else {
      res.send('Invalid password')
    }
  } catch (err) {
    console.error('Error finding document in MongoDB', err)
    res.status(500).send('Error finding document in MongoDB')
  }
})

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.redirect('/login');
  });
});

// Search route to fetch clans from Clash of Clans API
app.get('/search' , isAuthenticated, async (req, res) => {
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
    res.render('searchResults', { clans: data.items, username: req.session.username });
  } catch (err) {
    console.error('Error fetching data from Clash of Clans API', err);
    res.status(500).send('Error fetching data from Clash of Clans API');
  }
});




// Registratie
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

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/home', (req, res) => {
  res.render('home');
});

app.get('/vragenlijst', (req, res) => {
  res.render('vragenlijst', { username: req.session.username });
});


// Route via the cocproxy om data van de Clash of Clans API op te halen
app.get('/clan/:clanTag', /*isAuthenticated,*/ async (req, res) => {
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

    res.render('clan', { clanName, clanTag, clanLevel, clanImg, clanDivisie, trophies, requiredTrophies, requiredTownHallLevel, memberCount, description, language, location, type, membersString });

  } catch (err) {
    console.error('Error fetching data from Clash of Clans API', err);
    res.status(500).send('Error fetching data from Clash of Clans API');
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
