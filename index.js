const express = require('express')
const app = express()
const cors = require('cors')
const dotenv = require('dotenv')
dotenv.config()
const port = process.env.PORT || 5000

// Middleware
app.use(express.json())
app.use(cors())

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.MONGODB_URI

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
    
    
    const database = client.db("ideavalid");
    const commentsCollection = database.collection("comments");
    // 💡 কালেকশনের নাম পরিষ্কার করে 'ideasCollection' দেওয়া হলো যেন কনফ্লিক্ট না হয়
    const ideasCollection = database.collection("ideavalidcollection");
    const usersCollection = database.collection("users");
    

    app.get('/fetured', async (req, res) => {
      try {
        const result = await ideasCollection.find().limit(6).toArray();
        res.status(200).json(result);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
      }
    })


  app.get('/add-ideavalid', async (req, res) => {
    try {
      const result = await ideasCollection.find().toArray();
      res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  })  

    // 🚀 আইডিয়া অ্যাড করার POST API
    app.post('/add-ideavalid', async (req, res) => {
      try {
        const ideaData = req.body; // ফ্রন্টএন্ড থেকে আসা ডাটা অবজেক্ট
        

        // ডাটাবেজ কালেকশনে ডাটা ইনসার্ট করা হচ্ছে
        const result = await ideasCollection.insertOne(ideaData);

        
        // ফ্রন্টএন্ডে রেজাল্ট পাঠানো হচ্ছে
        res.status(201).json({ success: true, ...result });
      } catch (error) {
        console.error("Error saving data:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
      }
    });
    
    app.get('/add-ideavalid/:id', async (req, res) => {
       const { id } = req.params;

      const result = await ideasCollection.findOne({
        _id: new ObjectId(id),
      });

      res.json(result);
    });

   app.get('/my-ideavalid/:userid', async (req, res) => {
  try {
    const { userid } = req.params; 

    // console.log("Searching ideas for user ID:", userid);

    // 💡 Database e field er nam 'userId' (I boro hater), tai ekhon amra shebhabei khujbo
    const result = await ideasCollection.findOne({ _id: new ObjectId(userid)  })

    // console.log("Database result length:", result.length);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

app.patch('/my-ideavalid/:validid', async (req, res) => {
  try {
    const { validid } = req.params;
    const updatedData = req.body;
    const result = await ideasCollection.updateOne({ _id: new ObjectId(validid) }, { $set: updatedData });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating data:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

    app.delete('/my-ideavalid/:validid', async (req, res) => {
      try {
        const { validid } = req.params;
        const result = await ideasCollection.deleteOne({ _id: new ObjectId(validid) });
        res.status(200).json(result);
      } catch (error) {
        console.error("Error deleting data:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
      }
    });

    app.post('/my-ideavalid', async (req, res) => {
      try {
        const ideaData = req.body;
        console.log("Received Data:", ideaData);
        const result = await ideasCollection.insertOne(ideaData);
        res.status(201).json(result);
      } catch (error) {
        console.error("Error saving data:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
      }
    });

    // ১. নতুন কমেন্ট সেভ করার API
app.post('/comments', async (req, res) => {
  try {
    // 💡 ফ্রন্টএন্ড থেকে আসা ডেটা রিসিভ করা হচ্ছে
    const { ideaId, userName, userImage, text, userid, email } = req.body;
    
    // 💡 সেফগার্ড: কোনো কারণে ফ্রন্টএন্ডে স্পেস চলে আসলে বা কি (Key) উল্টাপাল্টা হলে ব্যাকএন্ড তা হ্যান্ডেল করবে
    const commentText = text || req.body["text "] || "";

    const newComment = {
      ideaId: ideaId,
      userName: userName || "Anonymous",
      userImage: userImage || "",
      text: commentText.trim(), // 👈 .trim() করার কারণে ডানে-বামে কোনো অতিরিক্ত স্পেস ডাটাবেজে যাবে না
      userid: userid || "user_67a0d378b7", // 👈 ফ্রন্টএন্ড থেকে না আসলে ব্যাকআপ হিসেবে এই ডাইনামিক টেস্ট আইডি বসবে
      email: email || "khaled@example.com", // 👈 ব্যাকআপ টেস্ট ইমেইল
      createdAt: new Date() 
    };

    const result = await commentsCollection.insertOne(newComment);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// ২. নির্দিষ্ট একটি আইডিয়ার সব কমেন্ট নিয়ে আসার API (এটি একদম ঠিক আছে)
app.get('/comments/:ideaId', async (req, res) => {
  try {
    const { ideaId } = req.params;
    const query = { ideaId: ideaId };
    const comments = await commentsCollection.find(query).sort({ createdAt: -1 }).toArray();
    
    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// ─── ১. কমেন্ট ডিলিট করার API (DELETE) ───
app.delete('/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = { _id: new ObjectId(id) };
    
    const result = await commentsCollection.deleteOne(query);
    
    if (result.deletedCount === 1) {
      res.status(200).json({ success: true, message: "Comment deleted successfully" });
    } else {
      res.status(404).json({ success: false, message: "Comment not found" });
    }
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});



app.put('/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body; // ফ্রন্টএন্ড থেকে আসা নতুন টেক্সট

    const query = { _id: new ObjectId(id) };
    const updateDoc = {
      $set: {
        text: text.trim(),
        isEdited: true, // কমেন্টটি যে এডিট করা হয়েছে তা ট্র্যাক রাখার জন্য
        updatedAt: new Date()
      }
    };

    const result = await commentsCollection.updateOne(query, updateDoc);
    
    if (result.modifiedCount > 0 || result.matchedCount > 0) {
      res.status(200).json({ success: true, message: "Comment updated successfully" });
    } else {
      res.status(404).json({ success: false, message: "Comment not found" });
    }
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// ─── লগইন করা ইউজারের নিজস্ব কমেন্টগুলো নিয়ে আসার API ───
app.get('/user-comments/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // ডাটাবেজে এই ইমেইলের সাথে মিল থাকা সব কমেন্ট খোঁজা হচ্ছে
    const query = { email: email };
    
    // কমেন্টগুলো নতুন থেকে পুরানো (Latest first) এভাবে সর্ট করা হবে
    const myComments = await commentsCollection.find(query).sort({ createdAt: -1 }).toArray();
    
    res.status(200).json(myComments);
  } catch (error) {
    console.error("Error fetching user comments:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// ─── ১. মঙ্গোডিবি কানেকশনের ভেতর কালেকশন ডিক্লেয়ারেশন ───
// (এটি আপনার run() ফাংশনের শুরুতে ideasCollection এর নিচে বসিয়ে দিন)




// ─── ২. ইউজারের নিজস্ব প্রোফাইল ডেটা রিড করার API (GET) ───
// ফ্রন্টএন্ডে প্রোফাইল পেজ ওপেন হলে ইউজারের বর্তমান ডাটা দেখানোর জন্য এটি লাগবে
app.get('/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // ইমেইল দিয়ে ইউজার খোঁজা হচ্ছে
    const user = await usersCollection.findOne({ email: email });
    
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ success: false, message: "User profile not found" });
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});



// ─── ৩. প্রোফাইল ইনফরমেশন আপডেট করার API (PUT) ───
// ইউজার যখন ফর্ম সাবমিট করে প্রোফাইল এডিট করবে, তখন এটি কল হবে
// ─── প্রোফাইল ইনফরমেশন আপডেট করার ফিক্সড API (ইমেইল ভিত্তিক) ───
app.put('/users/:email', async (req, res) => {
  try {
    const { email } = req.params; // 👈 এখন এটি আইডি নয়, ইমেইল রিসিভ করবে
    const { name, image } = req.body; 

    // যে তথ্যগুলো আপডেট করতে হবে
    const updateDoc = {
      $set: {
        name: name,
        image: image,
        updatedAt: new Date()
      },
    };

    const query = { email: email }; // 👈 ডাটাবেজে ইমেইল ম্যাচ করে খোঁজা হচ্ছে
    
    // আপনার ডাটাবেজের ইউজার কালেকশন
    const usersCollection = database.collection("users"); 
    const result = await usersCollection.updateOne(query, updateDoc);

    if (result.modifiedCount > 0 || result.matchedCount > 0) {
      res.status(200).json({ success: true, message: "Profile updated successfully!" });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// ─── ৪. নতুন ইউজার প্রথমবার ডাটাবেজে সেভ করার API (POST) ───
// Better-Auth বা প্রথমবার সাইন-আপ করার সময় যদি ইউজারের ডেটা মঙ্গোডিবি-তে পুশ করতে চান
app.post('/users', async (req, res) => {
  try {
    const userData = req.body;
    
    if (!userData.email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // চেক করা হচ্ছে এই ইমেইলে অলরেডি কোনো ইউজার আছে কিনা
    const existingUser = await usersCollection.findOne({ email: userData.email });
    if (existingUser) {
      return res.status(200).json({ success: true, message: "User already exists", user: existingUser });
    }

    const newUser = {
      name: userData.name || "Anonymous",
      email: userData.email,
      image: userData.image || "",
      role: userData.role || "user", // ডিফল্ট রোল
      createdAt: new Date()
    };

    const result = await usersCollection.insertOne(newUser);
    res.status(201).json({ success: true, insertedId: result.insertedId });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// ─── আইডিয়া সার্চ করার API ───
app.get('/search-ideas', async (req, res) => {
  try {
    const { query } = req.query; // ফ্রন্টএন্ড থেকে আসা সার্চ কি-ওয়ার্ড (যেমন: /search-ideas?query=tech)

    if (!query) {
      return res.status(400).json({ success: false, message: "Query parameter is required" });
    }

    // $regex দিয়ে ডাটাবেজে আংশিক মিল (Partial Match) খোঁজা হচ্ছে
    // 'i' অপশনটির মানে হলো Case-Insensitive (ছোট হাতের বা বড় হাতের অক্ষরের পার্থক্য করবে না)
    const searchQuery = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } } // যদি আপনার আইডিয়াতে ট্যাগ থাকে
      ]
    };

    const results = await ideasCollection.find(searchQuery).toArray();
    res.status(200).json(results);
  } catch (error) {
    console.error("Error searching ideas:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});


app.get('/ideas', async (req, res) => {
  try {
    // Query params
    const { search, category } = req.query;

    // Dynamic query object
    let query = {};

    // Search by title
    if (search) {
      query.title = {
        $regex: search,
        $options: 'i',
      };
    }

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Fetch data from database
    const result = await ideasCollection.find(query).toArray();

    // Send response
    res.status(200).json(result);

  } catch (error) {
    console.error('Search & Filter Error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
});
      


    


    
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close(); // কানেকশন ওপেন রাখার জন্য এটি কমেন্ট করাই থাকবে
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World! IdeaVault Server is Live.')
})

app.listen(5000, () => {
  console.log("Listening on port 5000") 
})