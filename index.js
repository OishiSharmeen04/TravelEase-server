const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());


const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    
    const database = client.db("travelEaseDB");
    const vehiclesCollection = database.collection("vehicles");
    const bookingsCollection = database.collection("bookings");


    app.get('/vehicles', async (req, res) => {
      try {
        const cursor = vehiclesCollection.find();
        const vehicles = await cursor.toArray();
        res.send(vehicles);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });


    app.get('/vehicles/latest', async (req, res) => {
      try {
        const cursor = vehiclesCollection.find().sort({ createdAt: -1 }).limit(6);
        const vehicles = await cursor.toArray();
        res.send(vehicles);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('TravelEase Server is Running!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});