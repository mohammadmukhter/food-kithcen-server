const express = require("express");
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
var jwt = require('jsonwebtoken');


// all the middleware 
app.use(cors());
app.use(express.json());

const verifyUserToken = (req, res, next)=> {
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorized access'});
  }

  const token = authorization.split(' ')[1];
  
  jwt.verify(token, process.env.USER_ACCESS_TOKEN, (err, decoded)=>{
    if(err){
      return res.status(403).send({error: true, message: 'unauthorized access'});
    }
    req.decoded = decoded;
    next()
  });

}

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

    // jwt token generator api
    app.post("/jwt", (req,res)=>{
      const userPayLoad = req.body;
      const token = jwt.sign({
        data: userPayLoad
      }, process.env.USER_ACCESS_TOKEN, { expiresIn: '1hr' });
      res.send(token);
    });

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
    });

    // users get or show api
    app.get("/users", async(req, res)=> {
      
      const usersData = await userCollection.find().toArray();
      res.send(usersData);
    });

    // specific user make as a admin api
    app.patch("/users/admin/:id", async(req, res)=> {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};

      const updateAbleData = {
        $set: {
          'role': "admin"
        }
      }
      const updatedData = await userCollection.updateOne(query, updateAbleData);
      res.send(updatedData);
    });

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
    app.get("/carts", verifyUserToken,  async(req,res)=> {
      const email = req.query.email;
      const query = { email: email };

      if(!email){
        return res.send([]);
      }

      const decodedEmail = req.decoded.data.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ error: true, message: 'porviden access' })
      }
      // console.log('email:', email)
      // console.log(req.decoded.data.email)
      const result = await cartCollection.find(query).toArray();
      res.send(result);
 
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