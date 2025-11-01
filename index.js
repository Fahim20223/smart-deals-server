const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//middleware
app.use(cors());
app.use(express.json());

//simpleDbUser
//1FbBuO1KBDvpK6M6
const uri =
  "mongodb+srv://simpleProductDb:1FbBuO1KBDvpK6M6@flash0.nw85ito.mongodb.net/?appName=Flash0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const simpleProducts = client.db("productUsers");
    const productUsersCollection = simpleProducts.collection("simpleUsers");

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
      const cursor = productUsersCollection.find();
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
      const query = { _id: new ObjectId(id) };
      const result = await productUsersCollection.findOne(query);
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

app.get("/", (req, res) => {
  res.send("smart server is running");
});

app.listen(port, () => {
  console.log(`smart server is running on port: ${port}`);
});
