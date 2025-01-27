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
    origin: [
      "http://localhost:5173",
      "https://artifacts-hub-schr0smi1ey.web.app",
      "https://artifacts-hub-schr0smi1ey.firebaseapp.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
const verifyToken = (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) return res.status(401).send("Unauthorized Access");

  jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(403).send("Forbidden Access");
    req.user = decoded;
    next();
  });
};

const verifyAdmin = (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) return res.status(401).send("Unauthorized Access");

  jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(403).send("Unauthorized Access");
    req.user = decoded;
    if (email.toLowerCase() !== process.env.ADMIN.toLowerCase()) {
      return res.status(403).send("Unauthorized Access");
    }
    next();
  });
};

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
const likedArtifactCollection = database.collection("LikedArtifact");

async function run() {
  try {
    app.get("/", (req, res) => {
      res.send("Welcome to the Artifact Hub API");
    });

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

    app.get("/check-auth", verifyToken, (req, res) => {
      if (req.user.email !== req.query.email) {
        return res.status(403).send("Unauthorized Access");
      }
      res.send({ success: true });
    });

    // Users
    app.post("/Users", async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });
    app.get("/Users", verifyAdmin, async (req, res) => {
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
      try {
        const page = parseInt(req.query.page) || 0;
        const size = parseInt(req.query.size) || 6;
        const search = req.query.search || "";

        let filter = {};
        if (search && search !== "featuredArtifacts") {
          filter = { artifactName: { $regex: search, $options: "i" } };
        }

        const cursor = artifactCollection.find(filter);
        const totalCount = await artifactCollection.estimatedDocumentCount();
        const result = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();

        res.send({
          artifacts: result,
          totalCount: totalCount,
        });
      } catch (error) {
        res.status(500).send({ message: "Server error", error: error.message });
      }
    });

    app.get("/MyArtifacts", verifyToken, async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 0;
        const size = parseInt(req.query.size) || 6;
        const search = req.query.search || "";
        console.log(page, size, search);
        const filter = search
          ? {
              artifactName: { $regex: search, $options: "i" },
              addedBy: req.query.addedBy,
            }
          : { addedBy: req.query.addedBy };

        const cursor = artifactCollection.find(filter);
        const result = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
        res.send({
          artifacts: result,
        });
      } catch (error) {
        res.status(500).send({ message: "Server error", error: error.message });
      }
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
    app.get("/MyLikedArtifactCount", verifyToken, async (req, res) => {
      const { user_email } = req.query;
      if (!user_email) {
        return res.status(400).send("Bad Request: 'user_email' is required");
      }
      if (req.user?.email !== user_email) {
        return res.status(403).send("Forbidden Access");
      }
      const count = await likedArtifactCollection.countDocuments({
        user_email,
      });
      res.send({ count });
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
    app.get("/check-like-status/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const { user_email } = req.query;
      if (req.user.email !== user_email) {
        return res.status(403).send("Forbidden Access");
      }
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
