const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@schr0smi1ey.iioky.mongodb.net/?retryWrites=true&w=majority&appName=Schr0Smi1ey`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  console.log("Access Token", accessToken);
  if (!accessToken) return res.status(401).send("Unauthorized Access");

  jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    console.log(err);
    if (err) return res.status(403).send("Unauthorized Access");
    req.user = decoded;
    next();
  });
};

const database = client.db("ArtifactHub");
const userCollection = database.collection("users");
const artifactCollection = database.collection("artifact");
const likedArtifactCollection = database.collection("LikedArtifact");
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

    // Auth Related API
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });

      res
        .cookie("accessToken", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ sucess: true });
    });

    app.post("/logout", (req, res) => {
      res
        .clearCookie("accessToken", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });
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
    app.get("/my-artifacts", verifyToken, async (req, res) => {
      const { addedBy } = req.query;
      console.log(addedBy);
      if (req.user.email !== addedBy) {
        console.log(req.user.email);
        return res.status(403).send("Forbidden Access");
      }
      const cursor = artifactCollection.find({ addedBy });
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/Artifacts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const artifact = await artifactCollection.findOne(query);
      res.send(artifact);
    });

    app.put("/Artifacts/:id", async (req, res) => {
      const id = req.params.id;
      const artifact = req.body;
      console.log(artifact);
      const result = await artifactCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: artifact }
      );
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

    // Like Button Functionality
    app.patch("/toggle-like/:id", async (req, res) => {
      const { id } = req.params;
      const { user_email } = req.body;
      const query = { artifact_id: id, user_email };
      const existingLike = await likedArtifactCollection.findOne(query);
      if (existingLike) {
        await likedArtifactCollection.deleteOne(query);
        await artifactCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          {
            $inc: { likeCount: -1 },
          }
        );
        res.status(200).json({ message: "Artifact disliked successfully." });
      } else {
        await likedArtifactCollection.insertOne(query);
        await artifactCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $inc: { likeCount: 1 } }
        );
        res.status(200).json({ message: "Artifact liked successfully." });
      }
    });
    app.get("/liked-artifacts", verifyToken, async (req, res) => {
      const { user_email } = req.query;
      if (req.user.email !== user_email) {
        return res.status(403).send("Forbidden Access");
      }
      const cursor = likedArtifactCollection.find({ user_email });
      const LikedArtifacts = await cursor.toArray();

      const artifactIds = LikedArtifacts.map((item) => item.artifact_id);
      const result = await artifactCollection
        .find({ _id: { $in: artifactIds.map((id) => new ObjectId(id)) } })
        .toArray();
      res.status(200).send(result);
    });
    app.get("/check-like-status/:id", async (req, res) => {
      const { id } = req.params;
      const { user_email } = req.query;
      const query = { artifact_id: id, user_email };
      const existingLike = await likedArtifactCollection.findOne(query);
      if (existingLike) {
        res.status(200).json({ isLiked: true });
      } else {
        res.status(200).json({ isLiked: false });
      }
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
