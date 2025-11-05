const express = require("express");
const app = express();
const cors = require("cors");

require("dotenv").config();

const port = process.env.PORT || 3000;
// console.log(process.env);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const admin = require("firebase-admin");

const serviceAccount = require("./smart-deals-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//middleware
app.use(cors());
app.use(express.json());

//simpleDbUser
//1FbBuO1KBDvpK6M6
// const uri =
//   "mongodb+srv://simpleProductDb:1FbBuO1KBDvpK6M6@flash0.nw85ito.mongodb.net/?appName=Flash0";

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@flash0.nw85ito.mongodb.net/?appName=Flash0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("smart server is running");
});

const verifyFireBaseToken = async (req, res, next) => {
  console.log("inside the middleware", req.headers);
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  //verify token

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    console.log("after decode token", decoded);
    req.token_email = decoded.email;
    next();
  } catch {
    return res.status(401).send({ message: "unauthorized access" });
  }
};

async function run() {
  try {
    await client.connect();

    const simpleProducts = client.db("productUsers");
    const productUsersCollection = simpleProducts.collection("simpleUsers");

    const bidsCollection = simpleProducts.collection("simpleBids");

    const usersCollection = simpleProducts.collection("users");

    app.get("/latest-products", async (req, res) => {
      const cursor = productUsersCollection
        .find()
        .sort({ created_at: -1 })
        .limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    //users post
    app.post("/users", async (req, res) => {
      const newUsers = req.body;

      const email = req.body.email;
      const query = { email: email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        res.send({
          message: "user already exist. do not need to insert again",
        });
      } else {
        const result = await usersCollection.insertOne(newUsers);
        res.send(result);
      }
    });

    //post---> add products
    app.post("/products", async (req, res) => {
      const newProducts = req.body;
      const result = await productUsersCollection.insertOne(newProducts);
      res.send(result);
    });

    //delete
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productUsersCollection.deleteOne(query);
      res.send(result);
    });

    //get all products +cursor
    app.get("/products", async (req, res) => {
      //have to see it again
      console.log(req.query);
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }
      const cursor = productUsersCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    //patch + update products
    app.patch("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedUser = req.body;
      const update = {
        $set: {
          name: updatedUser.name,
          price: updatedUser.price,
        },
      };
      const options = {};
      const result = await productUsersCollection.updateOne(
        query,
        update,
        options
      );
      res.send(result);
    });

    //specific products + get method
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const result = await productUsersCollection.findOne(query);
      res.send(result);
    });

    //bids related api
    app.get("/bids", verifyFireBaseToken, async (req, res) => {
      // can do like => if(query.email){
      // query.buyer_email = email
      // }
      // console.log("inside the api", req.headers);
      const email = req.query.email;
      const query = {};
      if (email) {
        query.buyer_email = email;
        if (email !== req.token_email) {
          return res.status(403).send({ message: "Forbidden access" });
        }
      }
      const cursor = bidsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    //bids post
    app.post("/bids", async (req, res) => {
      const newBid = req.body;
      const result = await bidsCollection.insertOne(newBid);
      res.send(result);
    });

    //bids delete
    app.delete("/bids/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bidsCollection.deleteOne(query);
      res.send(result);
    });

    //specific bids
    app.get("/bids/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bidsCollection.findOne(query);
      res.send(result);
    });

    app.get("/products/bids/:productId", async (req, res) => {
      const productId = req.params.productId;
      const query = { product: productId };
      const cursor = bidsCollection.find(query).sort({ bid_price: -1 });
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

app.listen(port, () => {
  console.log(`smart server is running on port: ${port}`);
});
