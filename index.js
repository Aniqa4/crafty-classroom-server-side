const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const stripe = require("stripe")(process.env.Payment_Gateway_PK)
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


//middleware
app.use(cors())
app.use(express.json());


const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(403).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}

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
        //await client.connect();

        //jwt
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' });
            res.send({ token });
        })

        //collections
        const usersCollection = client.db('Crafty-classroom').collection('users');
        const classesCollection = client.db('Crafty-classroom').collection('classes');
        const studentsCollection = client.db('Crafty-classroom').collection('studentsData');



        //all users
        app.get("/users", async (req, res) => {
            console.log(req.headers);
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

        //single class
        app.get("/allclasses/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await classesCollection.findOne(query);
            res.send(result);

        })


        //all instructors for instructors route
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
                projection: { className: 1, classImage: 1, totalEnrolledStudents: 1 },
            };
            const cursor = classesCollection.find(query, options).limit(6);
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
                projection: { name: 1, email: 1, photoURL: 1 },
            };
            const cursor = usersCollection.find(query, options).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        })


        //all students data
        app.get("/studentsData", async (req, res) => {
            const cursor = studentsCollection.find();
            const result = await cursor.toArray();
            res.send(result);

        })

        //get students data - pending payment
        app.get("/selectedClasses", async (req, res) => {
            const query = { paymentStatus: "pending" };
            const cursor = studentsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);

        })

        //get single student data - pending payment
        app.get("/payment/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await studentsCollection.findOne(query);
            res.send(result);

        })

        //get students data - payment status -paid
        app.get("/enrolledClasses", async (req, res) => {
            const query = { paymentStatus: "paid" };
            const cursor = studentsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);

        })


        //add user
        app.post("/users", async (req, res) => {
            const newUser = req.body;
            const result = await usersCollection.insertOne(newUser);
            res.send(result);
        })

        //add students data to collection
        app.post("/studentsData", async (req, res) => {
            const selectedClass = req.body;
            const result = await studentsCollection.insertOne(selectedClass);
            res.send(result);
        })


        //create payment intent
        app.post("/create-payment-intent", async (req, res) => {
            const { items } = req.body;
            const amount = price * 100;

            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                automatic_payment_methods: [card]
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        //add new class
        app.post("/newClass", async (req, res) => {
            const newClass = req.body;
            const result = await classesCollection.insertOne(newClass);
            res.send(result);
        })


        //add new class
        app.put("/allclasses/:id", async (req, res) => {
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)};
            const options ={upsert :true}
            const updateClass =req.body;
            const updatedClass = {
                $set: {
                    className: updateClass.className,
                    classImage: updateClass.classImage,
                    price:updateClass.price,
                    availableSeats:updateClass.availableSeats

                }
            };
            const result = await classesCollection.updateOne(filter,updatedClass,options);
            res.send(result);
        })

        //delete selected classes
        app.delete('/selectedClasses/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await studentsCollection.deleteOne(query);
            res.send(result);
        })

        app.get('/selectedClasses/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await studentsCollection.findOne(query);
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
