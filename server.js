
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
  .listen(8000)

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

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

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


// Route to handle login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Connect to the database
    await client.connect();
    const database = client.db(process.env.DB_NAME);
    const users = database.collection('users');

    // Find the user with the provided username
    const user = await users.findOne({ username: username });

    if (user && user.password === password) {
      // If user is found and password matches, send success response
      res.status(200).send('Login successful');
    } else {
      // If user is not found or password does not match, send error response
      res.status(401).send('Invalid username or password');
    }
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).send('Internal server error');
  } finally {
    // Ensure the client will close when you finish/error
    await client.close();
  }
});


