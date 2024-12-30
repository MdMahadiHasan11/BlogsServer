const express = require('express');
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_KEY);

// auto
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();
const port = process.env.PORT || 5000;
// // middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://blogsassigmentmarfa.vercel.app',
        'https://blogs-server-gamma.vercel.app'
    ],
    credentials: true
}));
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vdildbx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        // Connect the client to the server (optional starting in v4.7)
        // await client.connect();

        const BlogCollection = client.db('assignmentDB').collection('allBlogs');
        const BannerCollection = client.db('assignmentDB').collection('allBanner');

        // All Blogs Route
        app.get('/allBlogs', async (req, res) => {
            try {
                const result = await BlogCollection.find().toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send("Internal Server Error");
            }
        });

        // All Banners Route
        app.get('/allBanner', async (req, res) => {
            try {
                const result = await BannerCollection.find().toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching banners:", error);
                res.status(500).send("Internal Server Error");
            }
        });

        // Add a Banner Route
        app.post('/allBanner', async (req, res) => {
            try {
                const bannerData = req.body;
                const result = await BannerCollection.insertOne(bannerData);
                res.status(201).send(result);
            } catch (error) {
                console.error("Error adding banner:", error);
                res.status(500).send("Internal Server Error");
            }
        });

        // Category Load
        app.get('/blogs/:category', async (req, res) => {
            try {
                const category = req.params.category;
                const query = { category: category };
                const result = await BlogCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send("Internal Server Error");
            }
        });

        // Search Route
        app.get('/allSearch/:key', async (req, res) => {
            try {
                const searchKey = req.params.key.trim(); // Trim any unnecessary whitespace
                console.log('Search key:', searchKey); // Debug: Check what key is being searched for

                if (!searchKey) {
                    return res.status(400).json({ message: 'Search key is required and cannot be empty.' });
                }

                const result = await BlogCollection.find({
                    "$or": [
                        { category: { $regex: searchKey, $options: 'i' } },
                        { title: { $regex: searchKey, $options: 'i' } },
                        { author: { $regex: searchKey, $options: 'i' } },
                        { content: { $regex: searchKey, $options: 'i' } }
                    ]
                }).toArray();

                if (result.length === 0) {
                    return res.status(404).json({ message: 'No results found matching the search key.' });
                }

                res.status(200).json({ data: result });
            } catch (err) {
                console.error('Error during search:', err);
                res.status(500).json({ message: 'Server error occurred while processing your search.' });
            }
        });

        // Ping to confirm connection
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}

run().catch(console.dir);

// Root Route
app.get('/', (req, res) => {
    res.send('Project-AssignmentTest is running');
});

// Start Server
app.listen(port, () => {
    console.log(`Project-AssignmentTest is running on port ${port}`);
});
