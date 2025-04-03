// Basis configuratie ⚙️
require('dotenv').config(); // Laad omgevingsvariabelen uit .env bestand

// Importeer benodigde packages 📦
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const nodemailer = require("nodemailer");
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');

// Initialiseer Express app 🚀
const app = express();

// Middleware setup 🛠️
app
  .use(express.urlencoded({ extended: true }))    // Parse form data
  .use(express.static('static'))                 // Serveer statische bestanden
  .set('views', 'view')                          // Views directory
  .set('view engine', 'ejs')                     // View engine
  .use(session({                                 // Session configuratie
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
  }))
  .use(express.json());                          // Parse JSON requests

// route naar het wachtwoord wijzigen formulier
// bron: https://nodemailer.com/transports/
app.get('/wachtwoord-wijzigen', (req, res) => {
  res.render('wachtwoord-wijzigen', { error: null, username: req.session.user });
});

// MongoDB connectie setup 🗄️
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Maak database connectie 🔗
client.connect()
  .then(() => console.log('Database verbinding succesvol 🎉'))
  .catch(err => console.error(`Database verbindingsfout - ${err}`));

// Email transporter configuratie 📧
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper functies 🛠️
async function isEmailInDatabase(email) {
  const collection = client.db(process.env.DB_NAME).collection('submissions');
  const result = await collection.findOne({ email });
  return result !== null;
}

function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

// Functie om top 10 clans op te halen
async function getTopClans(apiToken) {
  const response = await fetch('https://cocproxy.royaleapi.dev/v1/locations/global/rankings/clans?limit=10', {
    headers: {
      'Authorization': `Bearer ${apiToken}`
    }
  });

  const data = await response.json();
  return data.items || [];
}

// Home route
// app.get('/', isAuthenticated, (req, res) => {
//   res.render('home', { username: req.session.user }
//   );
// });

app.get('/', isAuthenticated, async (req, res) => {
  const apiToken = process.env.COC_API_KEY;

  try {
    const topClans = await getTopClans(apiToken);

    res.render('home', {
      username: req.session.user,
      topClans: topClans
    });
  } catch (err) {
    console.error('Fout bij ophalen van top clans:', err);
    res.render('home', {
      username: req.session.user,
      topClans: [],
      error: 'Kon top clans niet ophalen.'
    });
  }
});
// Authenticatie routes 🔐
// ======================

// Registratie routes 📝
app.get('/register', (req, res) => {
  res.render('register', { error: null, username: req.session.user });
});

app.post('/register', async (req, res) => {
  try {
    const collection = client.db(process.env.DB_NAME).collection('submissions');

    // Controleer of gebruiker al bestaat
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

    // Wachtwoord validatie
    if (req.body.password !== req.body.password2) {
      return res.render('register', { error: 'Wachtwoorden komen niet overeen.' });
    }

    // Wachtwoord hashen
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Gebruiker opslaan
    await collection.insertOne({
      email: req.body.email,
      username: req.body.username,
      password: hashedPassword
    });
    
    res.render('login', { username: req.session.user });
  } catch (err) {
    console.error('Registratie fout:', err);
    res.status(500).send('Registratie mislukt');
  }
});

// Login routes 🔑
app.get('/login', (req, res) => {
  res.render('login', { username: req.session.user });
});

app.post('/login', async (req, res, next) => {
  try {
    const collection = client.db(process.env.DB_NAME).collection('submissions');
    const user = await collection.findOne({ email: req.body.email });
    
    if (!user) return res.send('Gebruiker niet gevonden');

    const wachtwoordMatch = await bcrypt.compare(req.body.password, user.password);

    if (wachtwoordMatch) {
      req.session.regenerate(err => {
        if (err) return next(err);
        req.session.user = user.username;
        req.session.save(err => {
          if (err) return next(err);
          res.redirect('/');
        });
      });
    } else {
      res.send('Ongeldig wachtwoord');
    }
  } catch (err) {
    console.error('Login fout:', err);
    res.status(500).send('Login mislukt');
  }
});

// Logout route 🚪
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send('Uitloggen mislukt');
    res.redirect('/login');
  });
});

// Wachtwoord reset routes 🔄
// =========================

app.get('/wachtwoord-wijzigen', (req, res) => {
  res.render('wachtwoord-wijzigen', { error: null, username: req.session.user });
});

app.post('/wachtwoord-reset', async (req, res) => {
  const email = req.body.email;

  try {
    if (!await isEmailInDatabase(email)) {
      return res.status(400).send("E-mail niet gevonden");
    }

    // Stuur reset email
    await transporter.sendMail({
      from: '"Clash Connect" <neej9816@gmail.com>',
      to: email,
      subject: "Wachtwoord wijzigen",
      html: `<p>Klik op de link om uw wachtwoord te wijzigen:</p>
             <a href="http://localhost:8000/auth/reset-wachtwoord/${email}">Wachtwoord Reset</a>`
    });

    res.send("E-mail verzonden! Controleer je inbox.");
  } catch (error) {
    console.error("Email verzend fout:", error);
    res.status(500).send("E-mail verzenden mislukt");
  }
});

// Reset wachtwoord pagina
app.get('/auth/reset-wachtwoord/:email', (req, res) => {
  res.render('wachtwoord-reset', { email: req.params.email, error: null, username: req.session.user });
});

// Wachtwoord update
app.post('/auth/reset-wachtwoord/:email', async (req, res) => {
  const { email } = req.params;
  const { nieuwwachtwoord: wachtwoord, bevestigwachtwoord: wachtwoord2 } = req.body;

  try {
    if (wachtwoord !== wachtwoord2) {
      return res.render('wachtwoord-reset', { email, error: 'Wachtwoorden komen niet overeen.', username: req.session.user });
    }

    const hashedPassword = await bcrypt.hash(wachtwoord, 10);
    const collection = client.db(process.env.DB_NAME).collection('submissions');
    
    await collection.updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );

    res.send('Wachtwoord succesvol gewijzigd!');
  } catch (error) {
    console.error("Wachtwoord update fout:", error);
    res.status(500).send("Wachtwoord wijzigen mislukt");
  }
});

// Clan functionaliteiten 🏟️
// ========================

// Home routes 🏠
app.get('/', isAuthenticated, (req, res) => {
  res.render('home', { username: req.session.user });
});

// app.get('/home', isAuthenticated, (req, res) => {
//   res.render('home', { username: req.session.user });
// });

app.get('/home', (req, res) => {
  res.redirect('/');
});

// Clan zoekfunctionaliteit 🔍
app.get('/search', isAuthenticated, async (req, res) => {
  const { clanName: query } = req.query;

  if (!query || query.trim().length < 3) {
    return res.render('searchResults', { 
      clans: [],
      error: 'Voer minimaal 3 tekens in'
    });
  }

  try {
    const response = await fetch(`https://cocproxy.royaleapi.dev/v1/clans?name=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.COC_API_KEY}`
      }
    });

    if (!response.ok) throw new Error(`API fout: ${response.status}`);
    
    const data = await response.json();
    
    res.render('searchResults', { 
      clans: data.items || [],
      searchTerm: query
      ,
      username: req.session.user
    });
  } catch (err) {
    console.error('Clan zoekfout:', err);
    res.render('searchResults', {
      clans: [],
      error: 'Clan zoeken mislukt',
      searchTerm: query
      ,
      username: req.session.user
    });
  }
});

// Clan detailpagina 📋
app.get('/clan/:clanTag', async (req, res) => {
  const { clanTag } = req.params;

  try {
    // Controleer favoriet status
    let isFavorite = false;
    const user = await client.db(process.env.DB_NAME).collection('submissions')
      .findOne({ username: req.session.user });
    
    if (user?.favoriteClans?.includes(clanTag)) {
      isFavorite = true;
    }

    // Haal clan data op
    const response = await fetch(`https://cocproxy.royaleapi.dev/v1/clans/%23${clanTag}`, {
      headers: {
        'Authorization': `Bearer ${process.env.COC_API_KEY}`
      }
    });

    if (!response.ok) throw new Error(`Clan data ophalen mislukt: ${response.status}`);
    
    const data = await response.json();
    const membersString = data.memberList.map(member => member.name).join(', ');

    res.render('clan', {
      clanTag,
      isFavorite,
      clanName: data.name,
      clanLevel: data.clanLevel,
      clanImg: data.badgeUrls.small,
      clanDivisie: data.warLeague?.name || 'N/A',
      trophies: data.clanPoints,
      requiredTrophies: data.requiredTrophies,
      requiredTownHallLevel: data.requiredTownhallLevel,
      memberCount: data.members,
      description: data.description,
      language: data.chatLanguage?.name || 'N/A',
      location: data.location?.name || 'N/A',
      type: data.type,
      membersString,
      username: req.session.user,
    });
  } catch (error) {
    console.error('Clan detail fout:', error);
    res.status(500).send('Clan details ophalen mislukt');
  }
});

// Favoriete clans ⭐
app.post('/saveClan', async (req, res) => {
  const { clanTag } = req.body;
  const { user: username } = req.session;

  try {
    await client.db(process.env.DB_NAME).collection('submissions').updateOne(
      { username },
      { $addToSet: { favoriteClans: clanTag } }
    );
    res.redirect(`/clan/${clanTag}`);
  } catch (err) {
    console.error('Favoriet opslaan fout:', err);
    res.status(500).send('Favoriet opslaan mislukt');
  }
});

app.post('/removeClan', async (req, res) => {
  const { clanTag } = req.body;
  const { user: username } = req.session;

  try {
    await client.db(process.env.DB_NAME).collection('submissions').updateOne(
      { username },
      { $pull: { favoriteClans: clanTag } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Favoriet verwijderen fout:', err);
    res.status(500).json({ success: false });
  }
});

// Profiel pagina 👤
app.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await client.db(process.env.DB_NAME).collection('submissions')
      .findOne({ username: req.session.user });
    
    const favoriteClans = user?.favoriteClans || [];

    if (favoriteClans.length === 0) {
      return res.render('profile', { 
        clansData: [],
        favoriteClans: [],
        email: user.email, 
        error: 'Geen opgeslagen clans'
      });
    }

    // Haal clan details op
    const clanPromises = favoriteClans.map(async clanTag => {
      const response = await fetch(`https://cocproxy.royaleapi.dev/v1/clans/%23${clanTag}`, {
        headers: {
          'Authorization': `Bearer ${process.env.COC_API_KEY}`
        }
      });
      if (!response.ok) return null;
      
      const data = await response.json();
      return {
        clanTag,
        clanName: data.name,
        clanLevel: data.clanLevel,
        clanImg: data.badgeUrls.small,
        clanDivisie: data.warLeague?.name || 'N/A',
        trophies: data.clanPoints,
        requiredTrophies: data.requiredTrophies,
        requiredTownHallLevel: data.requiredTownhallLevel,
        memberCount: data.members,
        description: data.description,
        language: data.chatLanguage?.name || 'N/A',
        location: data.location?.name || 'N/A',
        type: data.type,
        membersString: data.memberList.map(member => member.name).join(', ')
      };
    });

    const clansData = (await Promise.all(clanPromises)).filter(Boolean);
    
    res.render('profile', { 
      clansData,
      favoriteClans,
      email: user.email,
      username: req.session.user,
      error: clansData.length === 0 ? 'Clans ophalen mislukt' : ''
    });
  } catch (err) {
    console.error('Profiel fout:', err);
    res.status(500).send('Profiel ophalen mislukt');
  }
});

// Vragenlijst functionaliteiten 📝
// ===============================

app.get('/vragenlijst', (req, res) => {
  res.render('vragenlijst', { username: req.session.user });
});

// Sla antwoorden op in sessie
app.post('/save-answer', (req, res) => {
  const { questionId, fieldName, value } = req.body;
  
  if (!req.session.answers) req.session.answers = {};
  if (!req.session.answers[questionId]) req.session.answers[questionId] = {};
  
  req.session.answers[questionId][fieldName] = value;
  res.json({ success: true });
});

// Gefilterde zoekopdracht
app.get('/filtered-search', async (req, res) => {
  try {
    if (!req.session.answers) {
      return res.render('searchResults', {
        clans: [],
        error: 'Vul eerst de vragenlijst in',
        searchTerm: 'Gefilterd zoeken',
        username: req.session.user
      });
    }
    
    const { answers } = req.session;
    const townHallLevel = parseInt(answers['question-1']?.['townhall-level'] || 11);
    const countryCode = answers['question-2']?.['land'];
    const trophies = parseInt(answers['question-3']?.['trophies'] || 2000);

    // Haal clans op van API
    const response = await fetch(`https://cocproxy.royaleapi.dev/v1/clans?limit=50`, {
      headers: {
        'Authorization': `Bearer ${process.env.COC_API_KEY}`
      }
    });

    if (!response.ok) throw new Error('API fout');
    
    const data = await response.json();
    let clans = data.items || [];

    // Filter clans
    const filteredClans = clans.filter(clan => {
      const requiredTH = clan.requiredTownhallLevel || 0;
      const requiredTrophies = clan.requiredTrophies || 0;
      
      const thMatch = townHallLevel >= requiredTH;
      const trophyMatch = trophies >= requiredTrophies;
      const locationMatch = !countryCode || (clan.location?.id?.toString() === countryCode.toString());
      
      return thMatch && trophyMatch && locationMatch;
    });

    // Sorteer clans op relevantie
    filteredClans.sort((a, b) => {
      const scoreA = calculateMatchScore(a, townHallLevel, trophies, countryCode);
      const scoreB = calculateMatchScore(b, townHallLevel, trophies, countryCode);
      return scoreB - scoreA;
    });

    res.render('searchResults', { 
      clans: filteredClans,
      searchTerm: 'Gefilterd zoeken',
      username: req.session.user
    });
  } catch (err) {
    console.error('Gefilterd zoeken fout:', err);
    res.render('searchResults', {
      clans: [],
      error: 'Zoeken mislukt',
      searchTerm: 'Gefilterd zoeken',
      username: req.session.user
    });
  }
});

// Helper functie voor match score
function calculateMatchScore(clan, playerTH, playerTrophies, countryCode) {
  let score = 0;
  
  // Town Hall match
  const thDiff = playerTH - (clan.requiredTownhallLevel || 0);
  if (thDiff >= 0 && thDiff <= 2) score += 30;
  else if (thDiff > 2) score += 15;
  
  // Trophies match
  const trophyDiff = playerTrophies - (clan.requiredTrophies || 0);
  if (trophyDiff >= 0 && trophyDiff <= 500) score += 30;
  else if (trophyDiff > 500) score += 15;
  
  // Location match
  if (countryCode && clan.location?.id?.toString() === countryCode.toString()) {
    score += 40;
  } else if (!countryCode) {
    score += 20;
  }
  
  // Clan activiteit
  score += Math.min(20, clan.members || 0);
  score += Math.min(20, (clan.clanLevel || 0) * 2);
  
  return score;
}

// Overige API routes 🌐
// ====================

app.get('/api/locations', async (req, res) => {
  try {
    const response = await fetch('https://cocproxy.royaleapi.dev/v1/locations', {
      headers: {
        'Authorization': `Bearer ${process.env.COC_API_KEY}`
      }
    });
    
    if (!response.ok) throw new Error('Locaties ophalen mislukt');
    
    const data = await response.json();
    res.json(data.items);
  } catch (err) {
    console.error('Locaties fout:', err);
    res.status(500).json({ error: 'Locaties ophalen mislukt' });
  }
});

// Foutafhandeling ❌
// =================

// 404 - Pagina niet gevonden
app.use((req, res) => {
  console.error('404 voor URL: ' + req.url);
  res.status(404).render('404', { url: req.url, username: req.session.user });
});

// 500 - Serverfout
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Serverfout');
});

// Start de server 🚀
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server draait op poort ${PORT} 🚀`));