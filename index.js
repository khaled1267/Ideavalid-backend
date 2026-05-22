const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { jwtVerify, createRemoteJWKSet } = require("jose-cjs");
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);

const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload);
    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};

async function run() {
  try {
    const database = client.db("ideavalid");
    const commentsCollection = database.collection("comments");
    const ideasCollection = database.collection("ideavalidcollection");
    const usersCollection = database.collection("users");

    app.get("/fetured", async (req, res) => {
      try {
        const result = await ideasCollection.find().limit(6).toArray();
        res.status(200).json(result);
      } catch (error) {
        console.error("Error fetching data:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    app.get("/add-ideavalid", async (req, res) => {
      try {
        const result = await ideasCollection.find().toArray();
        res.status(200).json(result);
      } catch (error) {
        console.error("Error fetching data:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    app.post("/add-ideavalid", async (req, res) => {
      try {
        const result = await ideasCollection.insertOne(req.body);

        res.status(201).json({ success: true, ...result });
      } catch (error) {
        console.error("Error saving data:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    app.get("/add-ideavalid/:id", async (req, res) => {
      const { id } = req.params;

      const result = await ideasCollection.findOne({
        _id: new ObjectId(id),
      });

      res.json(result);
    });

       app.get('/my-ideavalid/:userid', async (req, res) => {
    
  try {
    const { userid } = req.params; 


    const result = await ideasCollection.findOne({ _id: new ObjectId(userid)  })

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

  
    app.patch("/my-ideavalid/:validid", async (req, res) => {
      try {
        const { validid } = req.params;
        const updatedData = req.body;
        const result = await ideasCollection.updateOne(
          { _id: new ObjectId(validid) },
          { $set: updatedData },
        );
        res.status(200).json(result);
      } catch (error) {
        console.error("Error updating data:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    app.delete("/my-ideavalid/:validid", async (req, res) => {
      try {
        const { validid } = req.params;
        const result = await ideasCollection.deleteOne({
          _id: new ObjectId(validid),
        });
        res.status(200).json(result);
      } catch (error) {
        console.error("Error deleting data:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    app.post("/my-ideavalid", async (req, res) => {
      try {
        const ideaData = req.body;
        console.log("Received Data:", ideaData);
        const result = await ideasCollection.insertOne(ideaData);
        res.status(201).json(result);
      } catch (error) {
        console.error("Error saving data:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    app.get("/my-ideavalid/:userid", async (req, res) => {
  try {
    const { userid } = req.params;

    const result = await ideasCollection
      .find({
        userId: userid,
      })
      .toArray();

    console.log(result);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching data:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

    app.post("/comments", async (req, res) => {
      try {
        const { ideaId, userName, userImage, text, userid, email } = req.body;

        const commentText = text || req.body["text "] || "";

        const newComment = {
          ideaId: ideaId,
          userName: userName || "Anonymous",
          userImage: userImage || "",
          text: commentText.trim(),
          userid: userid || "user_67a0d378b7",
          email: email || "khaled@example.com",
          createdAt: new Date(),
        };

        const result = await commentsCollection.insertOne(newComment);
        res.status(201).json(result);
      } catch (error) {
        console.error("Error creating comment:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    app.get("/comments/:ideaId", async (req, res) => {
      try {
        const { ideaId } = req.params;
        const query = { ideaId: ideaId };
        const comments = await commentsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();

        res.status(200).json(comments);
      } catch (error) {
        console.error("Error fetching comments:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    app.delete("/comments/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const query = { _id: new ObjectId(id) };

        const result = await commentsCollection.deleteOne(query);

        if (result.deletedCount === 1) {
          res
            .status(200)
            .json({ success: true, message: "Comment deleted successfully" });
        } else {
          res
            .status(404)
            .json({ success: false, message: "Comment not found" });
        }
      } catch (error) {
        console.error("Error deleting comment:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    app.put("/comments/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { text } = req.body;

        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            text: text.trim(),
            isEdited: true,
            updatedAt: new Date(),
          },
        };

        const result = await commentsCollection.updateOne(query, updateDoc);

        if (result.modifiedCount > 0 || result.matchedCount > 0) {
          res
            .status(200)
            .json({ success: true, message: "Comment updated successfully" });
        } else {
          res
            .status(404)
            .json({ success: false, message: "Comment not found" });
        }
      } catch (error) {
        console.error("Error updating comment:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    app.get("/user-comments/:email", async (req, res) => {
      try {
        const { email } = req.params;

        const query = { email: email };

        const myComments = await commentsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();

        res.status(200).json(myComments);
      } catch (error) {
        console.error("Error fetching user comments:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    app.get("/users/:email", async (req, res) => {
      try {
        const { email } = req.params;

        const user = await usersCollection.findOne({ email: email });

        if (user) {
          res.status(200).json(user);
        } else {
          res
            .status(404)
            .json({ success: false, message: "User profile not found" });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    app.put("/users/:email", async (req, res) => {
      try {
        const { email } = req.params;
        const { name, image } = req.body;

        const updateDoc = {
          $set: {
            name: name,
            image: image,
            updatedAt: new Date(),
          },
        };

        const query = { email: email };
        const usersCollection = database.collection("users");
        const result = await usersCollection.updateOne(query, updateDoc);

        if (result.modifiedCount > 0 || result.matchedCount > 0) {
          res
            .status(200)
            .json({ success: true, message: "Profile updated successfully!" });
        } else {
          res.status(404).json({ success: false, message: "User not found" });
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    app.post("/users", async (req, res) => {
      try {
        const userData = req.body;

        if (!userData.email) {
          return res
            .status(400)
            .json({ success: false, message: "Email is required" });
        }

        const existingUser = await usersCollection.findOne({
          email: userData.email,
        });
        if (existingUser) {
          return res.status(200).json({
            success: true,
            message: "User already exists",
            user: existingUser,
          });
        }

        const newUser = {
          name: userData.name || "Anonymous",
          email: userData.email,
          image: userData.image || "",
          role: userData.role || "user",
          createdAt: new Date(),
        };

        const result = await usersCollection.insertOne(newUser);
        res.status(201).json({ success: true, insertedId: result.insertedId });
      } catch (error) {
        console.error("Error creating user:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    app.get("/search-ideas", async (req, res) => {
      try {
        const { query } = req.query;

        if (!query) {
          return res
            .status(400)
            .json({ success: false, message: "Query parameter is required" });
        }

        const searchQuery = {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
            { tags: { $regex: query, $options: "i" } },
          ],
        };

        const results = await ideasCollection.find(searchQuery).toArray();
        res.status(200).json(results);
      } catch (error) {
        console.error("Error searching ideas:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    app.get("/ideas", async (req, res) => {
      try {
        const { search, category } = req.query;

        let query = {};

        if (search) {
          query.title = {
            $regex: search,
            $options: "i",
          };
        }

        if (category && category !== "All") {
          query.category = category;
        }

        const result = await ideasCollection.find(query).toArray();

        res.status(200).json(result);
      } catch (error) {
        console.error("Search & Filter Error:", error);

        res.status(500).json({
          success: false,
          message: "Internal Server Error",
        });
      }
    });

    console.log(
      "Pinged your deployment. You successfully connected to be MongoDB!",
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello ideavalid! IdeaVault Server to be MongoDB is Live.");
});

app.listen(5000, () => {
  console.log("Listening the  port  5000");
});
