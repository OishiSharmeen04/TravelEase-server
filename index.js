const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Firebase Admin - Environment Variables থেকে লোড করুন
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain: "googleapis.com"
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(cors());
app.use(express.json());

// Middleware to verify Firebase token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).send({ error: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).send({ error: 'Invalid token' });
  }
};

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


    
    // All vehicles
    app.get('/vehicles', async (req, res) => {
      try {
        const cursor = vehiclesCollection.find();
        const vehicles = await cursor.toArray();
        res.send(vehicles);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // Latest 6 vehicles
    app.get('/vehicles/latest', async (req, res) => {
      try {
        const cursor = vehiclesCollection.find().sort({ createdAt: -1 }).limit(6);
        const vehicles = await cursor.toArray();
        res.send(vehicles);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // Single vehicle
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


    
    // Get user's vehicles
    app.get('/my-vehicles/:email', verifyToken, async (req, res) => {
      try {
        const email = req.params.email;
        
        
        if (req.user.email !== email) {
          return res.status(403).send({ error: 'Unauthorized access' });
        }
        
        const query = { userEmail: email };
        const cursor = vehiclesCollection.find(query);
        const vehicles = await cursor.toArray();
        res.send(vehicles);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // Add vehicle
    app.post('/vehicles', verifyToken, async (req, res) => {
      try {
        const vehicle = req.body;
        
      
        if (req.user.email !== vehicle.userEmail) {
          return res.status(403).send({ error: 'Unauthorized access' });
        }
        
        vehicle.createdAt = new Date().toISOString();
        const result = await vehiclesCollection.insertOne(vehicle);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // Update vehicle
    app.put('/vehicles/:id', verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        
        // Check if vehicle belongs to the user
        const existingVehicle = await vehiclesCollection.findOne(filter);
        if (!existingVehicle) {
          return res.status(404).send({ error: 'Vehicle not found' });
        }
        
        if (existingVehicle.userEmail !== req.user.email) {
          return res.status(403).send({ error: 'Unauthorized access' });
        }
        
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
    app.delete('/vehicles/:id', verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        
        // Check if vehicle belongs to the user
        const existingVehicle = await vehiclesCollection.findOne(query);
        if (!existingVehicle) {
          return res.status(404).send({ error: 'Vehicle not found' });
        }
        
        if (existingVehicle.userEmail !== req.user.email) {
          return res.status(403).send({ error: 'Unauthorized access' });
        }
        
        const result = await vehiclesCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // Create booking
    app.post('/bookings', verifyToken, async (req, res) => {
      try {
        const booking = req.body;
        
      
        if (req.user.email !== booking.userEmail) {
          return res.status(403).send({ error: 'Unauthorized access' });
        }
        
        booking.createdAt = new Date().toISOString();
        const result = await bookingsCollection.insertOne(booking);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    // Get user's bookings
    app.get('/my-bookings/:email', verifyToken, async (req, res) => {
      try {
        const email = req.params.email;
        
  
        if (req.user.email !== email) {
          return res.status(403).send({ error: 'Unauthorized access' });
        }
        
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