const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_KEY);
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// MongoDB
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
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

// Create a MongoClient
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const BlogCollection = client.db('assignmentDB').collection('allBlogs');
        const BannerCollection = client.db('assignmentDB').collection('allBanner');

        // Ensure the directory exists
        const imagesDirectory = path.join(__dirname, "../public/images");
        if (!fs.existsSync(imagesDirectory)) {
            fs.mkdirSync(imagesDirectory, { recursive: true });
        }

        // Multer storage configuration
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, imagesDirectory);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
                const extension = path.extname(file.originalname);
                cb(null, file.fieldname + "-" + uniqueSuffix + extension);
            },
        });

        // Multer upload middleware
        const upload = multer({ storage });

        // File upload route
        app.post("/upload", upload.single("image"), (req, res) => {
            if (!req.file) {
                return res.status(400).send("No file uploaded.");
            }
            res.status(200).send("File uploaded successfully.");
        });

        // Add news
        app.post("/api/news", async (req, res) => {
            const { news } = req.body;

            if (!news || typeof news !== 'object') {
                return res.status(400).send({ error: "Invalid news data." });
            }

            try {
                const result = await BannerCollection.insertOne(news);
                res.status(201).send({ message: "News added successfully.", data: result });
            } catch (err) {
                console.error("Error adding news:", err);
                res.status(500).send({ error: "Failed to add news." });
            }
        });

        // Get all blogs
        app.get('/allBlogs', async (req, res) => {
            try {
                const result = await BlogCollection.find().toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send("Internal Server Error");
            }
        });

        // Get all banners
        app.get('/allBanner', async (req, res) => {
            try {
                const result = await BannerCollection.find().toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching banners:", error);
                res.status(500).send("Internal Server Error");
            }
        });

        // Add a banner
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

        // Get blogs by category
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

        // Search route
        app.get('/allSearch/:key', async (req, res) => {
            try {
                const searchKey = req.params.key.trim();
                console.log('Search key:', searchKey);

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

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Do not close the client to keep the server running
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
