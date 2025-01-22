const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@schr0smi1ey.iioky.mongodb.net/?retryWrites=true&w=majority&appName=Schr0Smi1ey`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const database = client.db("ArtifactHub");
const userCollection = database.collection("users");
const artifactCollection = database.collection("artifact");

async function run() {
  try {
    // Routes
    app.get("/", (req, res) => {
      res.send("Welcome to the Artifact Hub API");
    });
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // Users
    app.post("/Users", async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });
    app.get("/Users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Artifacts
    app.post("/Artifacts", async (req, res) => {
      const newArtifact = req.body;
      const result = await artifactCollection.insertOne(newArtifact);
      res.send(result);
    });
    app.get("/Artifacts", async (req, res) => {
      const cursor = artifactCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/Artifacts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const visa = await artifactCollection.findOne(query);
      res.send(visa);
    });
    app.put("/Artifacts/:id", async (req, res) => {
      const id = req.params.id;
      const artifact = req.body;
      console.log(artifact);
      const result = await artifactCollection.updateOne({ _id: new ObjectId(id) }, { $set: artifact });
      res.send(result);
    });
    app.delete("/Artifacts/:id", async (req, res) => {
      const id = req.params.id;
      const result = await artifactCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });
    app.patch("/Artifacts/:id", async (req, res) => {
      const { id } = req.params;
      const { likeCount } = req.body;
      const result = await artifactCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { likeCount } }
      );
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
// start the server
app.listen(port, () => {
  console.log("Artifact Hub API is running on port " + port);
});
