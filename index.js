const express = require("express");
const app = express();
const cors = require( "cors" );
const jwt = require( 'jsonwebtoken' );
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'https://handy-heroes-b5e4a.web.app',
    'https://handy-heroes-b5e4a.firebaseapp.com'
  ],
  credentials: true,
} ) );

app.use( express.json() );
app.use(cookieParser());


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

// verify token
const logger = ( req, res, next ) => {
  console.log('logged info', req.method, req.url );
  next();
}

const verifyToken = ( req, res, next ) => {
  const token = req?.cookies?.token;
  if ( !token ) {
    res.status(401).send({message:'unAuthorized access'})
  } else {
    jwt.verify( token, process.env.ACCESS_TOKEN_SECRET, ( err, decoded ) => {
      if ( err ) {
        return res.status(401).send({message:"unauthorized access"})
      }
      req.user = decoded;
      next();
    })
  }
}

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

    app.get("/bookings",logger,verifyToken, async (req, res) => {
      let query = {};
      if ( query.req.email !== req.query.email ) {
        return res.send({message:"forbidden access"})
      }
      console.log(req.cookies);
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const cursor = bookingsCollections.find(query);
      const result = await cursor.toArray();
      res.send(result);
    } );
    
    // jwt
    app.post( '/jwt', async ( req, res ) => {
      const user = req.body;
      console.log( 'user token', user );
      const token = jwt.sign( user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' } )
      res.cookie( 'token', token, {
        httpOnly: true,
        secure: true,
        sameSite:'none'
      })
      res.send( { success:true } );
    } )
    
    app.post( '/logout', async ( req, res ) => {
      const user = req.body;
      console.log('loggin out', user);
      res.clearCookie('token',{maxAge:0}).send({success:true})
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
