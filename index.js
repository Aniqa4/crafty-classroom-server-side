const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');


//middleware
app.use(cors())
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h7pqa5u.mongodb.net/?retryWrites=true&w=majority`;

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
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        //collections
        const usersCollection = client.db('Crafty-classroom').collection('users');
        const classesCollection = client.db('Crafty-classroom').collection('classes');
        const StudentsCollection = client.db('Crafty-classroom').collection('studentsData');



        //all users
        app.get("/users", async (req, res) => {
            const cursor = usersCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        //all classes
        app.get("/allclasses", async (req, res) => {
            const cursor = classesCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        //all instructors
        app.get("/allinstructors", async (req, res) => {
            const query = { role: "instructor" };
            const options = {
                projection: { name: 1, email: 1, photoURL: 1 },
            };
            const cursor = usersCollection.find(query, options)
            const result = await cursor.toArray();
            res.send(result);
        })

        //all approved classes
        app.get("/approvedClasses", async (req, res) => {
            const query = { status: "approved" }
            const cursor = classesCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        //top 6 classes
        app.get("/popularClasses", async (req, res) => {
            const query = { status: "approved" };
            const options = {
                // sort returned documents in ascending order by title (A->Z)
                sort: { totalEnrolledStudents: -1 },
                // Include only the `title` and `imdb` fields in each returned document
                projection: { className: 1,classImage:1, totalEnrolledStudents: 1 },
              };
            const cursor = classesCollection.find(query,options).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        })

        //6 instructors
        app.get("/sixInstructors", async (req, res) => {
            const query = { role: "instructor" };
            const options = {
                // sort returned documents in ascending order by title (A->Z)
                sort: { name: 1 },
                // Include only the `title` and `imdb` fields in each returned document
                projection: { name: 1,email:1, photoURL: 1 },
              };
            const cursor = usersCollection.find(query,options).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        })


        //user role
        app.get("/privateRouteSetting", async (req, res) => {
            const query = { };
            const options = {
                projection: {role:1,email:1},
            };
            const cursor = usersCollection.find(query, options)
            const result = await cursor.toArray();
            res.send(result);
        })

        //add user
        app.post("/users", async (req, res)=>{
            const newUser=req.body;
            const result= await usersCollection.insertOne(newUser);
            res.send(result);
        })

        //add student data
        app.post("/studentsData", async (req, res)=>{
            const selectedClass=req.body;
            const result= await StudentsCollection.insertOne(selectedClass);
            res.send(result);
        })





        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('server is running...')
})

app.listen(port, () => {
    console.log(`server is running at ${port}`);
}) 
