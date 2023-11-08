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
} );


const servicesCollections = client.db( 'handyHerosDB' ).collection( 'services' );

const bookingsCollections = client.db( 'handyHerosDB' ).collection( 'bookings' );

async function run() {
  try {
      await client.connect();

    app.get( '/services', async ( req, res ) => {
        
      const cursor = servicesCollections.find();
      const result = await cursor.toArray();
      res.send( result );
    } );

    app.get( '/services/details/:id', async ( req, res ) => {
      
      const id = req.params.id;
      const query = { _id: new ObjectId( id ) };
      const result = await servicesCollections.findOne( query );
      res.send( result );
    } )
    
    // app.get( '/services', async ( req, res ) => {
      
    //   let query = {};
    //   if(req.query.serviceName)
    //   const result = await servicesCollections.find( query ).toArray();

    // })

    app.post( '/bookings', async ( req, res ) => {
      
      const bookings = req.body;
      const result = await bookingsCollections.insertOne( bookings );
      res.send( result );
    } )
    
    app.get( '/bookings', async ( req, res ) => {
      const cursor = bookingsCollections.find();
      const result = await cursor.toArray();
      res.send( result );
    })




    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);
