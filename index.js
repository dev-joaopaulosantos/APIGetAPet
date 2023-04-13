const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()

//Import Routes
const UserRoutes = require('./routes/UserRoutes')
const PetRoutes = require('./routes/PetRoutes')

// Config JSON response
app.use(express.json())

// Solve CORS
app.use(cors({ credentials: true, origin: 'http://localhost:5173' }))

// Public folder for images
app.use(express.static('public'))

// Routes
app.use('/users', UserRoutes)
app.use('/pets', PetRoutes)

app.listen(5000)