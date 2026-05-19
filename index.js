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
    await client.connect();
    
    const database = client.db("ideavalid");
    // 💡 কালেকশনের নাম পরিষ্কার করে 'ideasCollection' দেওয়া হলো যেন কনফ্লিক্ট না হয়
    const ideasCollection = database.collection("ideavalidcollection");
   

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

    // 🚀 আইডিয়া অ্যাড করার POST API
    app.post('/add-ideavalid', async (req, res) => {
      try {
        const ideaData = req.body; // ফ্রন্টএন্ড থেকে আসা ডাটা অবজেক্ট
        

        // ডাটাবেজ কালেকশনে ডাটা ইনসার্ট করা হচ্ছে
        const result = await ideasCollection.insertOne(ideaData);
        
        // ফ্রন্টএন্ডে রেজাল্ট পাঠানো হচ্ছে
        res.status(201).json(result);
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
    const { userid } = req.params; // 💡 Browser er URL/Params theke choto hater 'userid' i ashbe

    console.log("Searching ideas for user ID:", userid);

    // 💡 Database e field er nam 'userId' (I boro hater), tai ekhon amra shebhabei khujbo
    const result = await userCollection.find({ userId: userid }).toArray();

    console.log("Database result length:", result.length);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching data:", error);
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