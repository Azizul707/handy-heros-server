const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Handy heros app is running on port ${port}`);
});

require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_ACCESS_KEY}:${process.env.DB_PASS}@cluster0.hg5h0d4.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const servicesCollections = client.db("handyHerosDB").collection("services");

const bookingsCollections = client.db("handyHerosDB").collection("bookings");

async function run() {
  try {
    await client.connect();

    app.get("/services", async (req, res) => {
      let query = {};

      if (req.query?.email) {
        query = { email: req.query.email };
      } else if (req.query?.ServiceName) {
        query = { ServiceName: req.query.ServiceName };
      }
      const cursor = servicesCollections.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/services/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await servicesCollections.findOne(query);
      res.send(result);
    });

    app.put("/services/:id", async (req, res) => {
      const id = req.params.id;
      const updatedService = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const service = {
        $set: {
          ServiceProvider: updatedService.name,
          email: updatedService.email,
          ServiceImage: updatedService.ServiceImage,
          ServiceName: updatedService.ServiceName,
          ServiceLocation: updatedService.ServiceLocation,
          ServicePrice: updatedService.ServicePrice,
          ServiceDescription: updatedService.ServiceDescription,
          ServiceProvider: updatedService.ServiceProvider
        },
      };

      const result = await servicesCollections.updateOne( filter, service, options );
      console.log(result)
      res.send( result );
    });

    // delete

    app.delete("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await servicesCollections.deleteOne(query);
      res.send(result);
    });

    app.post("/services", async (req, res) => {
      const addServices = req.body;
      const result = await servicesCollections.insertOne(addServices);
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const bookings = req.body;
      const result = await bookingsCollections.insertOne(bookings);
      res.send(result);
    });

    app.get("/bookings", async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const cursor = bookingsCollections.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
