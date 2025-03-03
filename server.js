
// Add info from .env file to process.env
require('dotenv').config() 

// Initialise Express webserver
const express = require('express')
const app = express()

app
  .use(express.urlencoded({extended: true})) // middleware to parse form data from incoming HTTP request and add form fields to req.body
  .use(express.static('static'))             // Allow server to serve static content such as images, stylesheets, fonts or frontend js from the directory named static
  .set('view engine', 'ejs')                 // Set EJS to be our templating engine
  .set('views', 'view')                      // And tell it the views can be found in the directory named view

// Use MongoDB
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const path = require('path');
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

// A sample route, replace this with your own routes
app.get('/', (req, res) => {
  res.send('Hello World!')
})




// Registratie
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  try {
    const collection = client.db(process.env.DB_NAME).collection('submissions')
    const result = await collection.insertOne({
      email: req.body.email,
      password: req.body.password
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

// Login
app.post('/login', async (req, res) => {
  try {
    const collection = client.db(process.env.DB_NAME).collection('submissions')
    const user = await collection.findOne({ email: req.body.email })

    if (!user) {
      return res.send('Gebruiker niet gevonden')
    }

    // Controleer of het wachtwoord overeenkomt
    if (user.password === req.body.password) {
      res.send('Login successful')
    } else {
      res.send('Invalid password')
    }
  } catch (err) {
    console.error('Error finding document in MongoDB', err)
    res.status(500).send('Error finding document in MongoDB')
  }
})




// Listen op port 8000
app.listen(8000);

// Middleware to handle not found errors - error 404
app.use((req, res) => {
  // log error to console
  console.error('404 error at URL: ' + req.url)
  // send back a HTTP response with status code 404
  res.status(404).send('404 error at URL: ' + req.url)
})

// Middleware to handle server errors - error 500
app.use((err, req, res) => {
  // log error to console
  console.error(err.stack)
  // send back a HTTP response with status code 500
  res.status(500).send('500: server error')
})
