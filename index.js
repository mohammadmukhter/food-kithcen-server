const express = require("express");
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res)=> {
    res.status(200).send('server initially started');
});




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uhsxkqi.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db("foodKitchen");

    const menuCollection = database.collection('menu');
    const reviewsCollection = database.collection('reviews');
    const cartCollection = database.collection('carts');
    const userCollection = database.collection('users');


    // user insert or post api
    app.post("/users", async(req, res)=> {
      const userData = req.body;
      const query = {email: userData.email};
      const matchedEmail = await userCollection.findOne(query);

      if(matchedEmail){
        return res.send("Data already exists");
      }
      const userInserted = await userCollection.insertOne(userData);
      res.send(userInserted);
    })

    // all menu get api
    app.get("/menu", async(req, res)=>{
        const menuData = await menuCollection.find().toArray();
        res.send(menuData);
    });

    // all reviews get api
    app.get("/reviews", async(req, res)=>{
        const reviewsData = await reviewsCollection.find().toArray();
        res.send(reviewsData);
    });


    // all cart data get api
    app.get("/carts", async(req,res)=> {
      const email = req.query.email;
      const query = { email: email };
      if(!email){
        res.send([]);
      }else{
        const result = await cartCollection.find(query).toArray();
        res.send(result);
      }  
    });

    // specific cart data delete api
    app.delete("/carts/:id", async(req,res)=> {
      const id = req.params.id;
      const query = { _id : new ObjectId(id)};

      const deleted = await cartCollection.deleteOne(query);
      res.send(deleted);

    })


    // one cart data insert api
    app.post("/carts", async(req, res)=> {
      const data = req.body;
      const result = await cartCollection.insertOne(data);
      res.send(result);

    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, ()=> {
    console.log('server connected');
})