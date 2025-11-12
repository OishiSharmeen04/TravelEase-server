const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
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

    // Get all vehicles
    app.get('/vehicles', async (req, res) => {
      try {
        const cursor = vehiclesCollection.find();
        const vehicles = await cursor.toArray();
        res.send(vehicles);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // Get latest 6 vehicles
    app.get('/vehicles/latest', async (req, res) => {
      try {
        const cursor = vehiclesCollection.find().sort({ createdAt: -1 }).limit(6);
        const vehicles = await cursor.toArray();
        res.send(vehicles);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // Get single vehicle by ID
    app.get('/vehicles/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const vehicle = await vehiclesCollection.findOne(query);
        res.send(vehicle);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // Get vehicles by user email
    app.get('/my-vehicles/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const query = { userEmail: email };
        const cursor = vehiclesCollection.find(query);
        const vehicles = await cursor.toArray();
        res.send(vehicles);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // Add new vehicle
    app.post('/vehicles', async (req, res) => {
      try {
        const vehicle = req.body;
        vehicle.createdAt = new Date().toISOString();
        const result = await vehiclesCollection.insertOne(vehicle);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // Update vehicle
    app.put('/vehicles/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: false };
        const updatedVehicle = req.body;
        const vehicle = {
          $set: {
            vehicleName: updatedVehicle.vehicleName,
            owner: updatedVehicle.owner,
            category: updatedVehicle.category,
            pricePerDay: updatedVehicle.pricePerDay,
            location: updatedVehicle.location,
            availability: updatedVehicle.availability,
            description: updatedVehicle.description,
            coverImage: updatedVehicle.coverImage
          }
        };
        const result = await vehiclesCollection.updateOne(filter, vehicle, options);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // Delete vehicle
    app.delete('/vehicles/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await vehiclesCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // Create booking
    app.post('/bookings', async (req, res) => {
      try {
        const booking = req.body;
        booking.createdAt = new Date().toISOString();
        const result = await bookingsCollection.insertOne(booking);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // Get user bookings
    app.get('/my-bookings/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const query = { userEmail: email };
        const cursor = bookingsCollection.find(query);
        const bookings = await cursor.toArray();
        res.send(bookings);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('TravelEase Server is Running!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});