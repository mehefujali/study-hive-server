const express = require('express');
const cors = require('cors');
const app = express()
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 8080
require('dotenv').config()
const cookieParser = require('cookie-parser');
// mw 
app.use(cors({
      origin: ['http://localhost:5173', 'http://study-hive-k.firebaseapp.com' , 'https://study-hive-k.web.app'],
      credentials: true
}))
app.use(express.json())
app.use(cookieParser())
const varifyToken = (req, res, next) => {

      const token = req?.cookies?.token
      console.log('this is token ' ,token)
      if (!token) {
            return res.status(401).send({ message: 'unauthorized access' })
      }
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                  return res.status(401).send({ message: 'unauthorized access' })
            }
            req.user = decoded
            next()

      })


}





const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.negmw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
      serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
      }
});

async function run() {
      try {
            const assignmentsCollection = client.db('study-hive').collection('assignments')
            const submitedassignmentsCollection = client.db('study-hive').collection('submited-assignments')



            app.post('/jwt', async (req, res) => {
                  const user = req.body
                  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' })

                  res
                        .cookie('token', token, {
                              httpOnly: true,
                              secure: process.env.NODE_ENV === "production",
                              sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
                        })
                        .send({ success: true })

            })
            app.post('/logout', (req, res) => {
                  res.clearCookie('token', {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
                  })
                        .send({ success: true })
            })






            app.post('/assignments', async (req, res) => {
                  const assignment = req.body
                  const result = await assignmentsCollection.insertOne(assignment)
                  res.send(result)

            })
            app.get('/assignments', async (req, res) => {
                  const assignment = await assignmentsCollection.find().toArray()
                  res.send(assignment)
            })

            app.get('/filter-assignments', async (req, res) => {
                  const filter = req.query.filter
                  const { search } = req.query

                  let option = {}

                  if (filter) {
                        if (filter === "All") {
                              option = {}
                        }
                        else {
                              option = { difficulty: filter }
                        }

                  }


                  if (search) {
                        if (search.toLowerCase() === "all") {
                              option = {}
                        }
                        else {
                              option = { title: { $regex: search, $options: "i" } }
                        }
                  }
                  const assignment = await assignmentsCollection.find(option).toArray()
                  res.send(assignment)
            })
            app.get('/assignment-details/:id', varifyToken , async (req, res) => {
                  const assignment = await assignmentsCollection.findOne({ _id: new ObjectId(req.params.id) })
                 
                  res.send(assignment)
            })
            app.post('/submit-assignment', varifyToken, async (req, res) => {
                  const result = await submitedassignmentsCollection.insertOne(req.body)
                  res.send(result)
            })
            app.get('/my-submited-assignment', varifyToken, async (req, res) => {
                  const email = req.query.email
                  if (req.user.email !== req.query.email) {
                        return res.status(403).send({ message: 'forbidden' })
                  }
                  let result = []
                  if (email) {
                        result = await submitedassignmentsCollection.find({ email: email }).toArray()
                        for (let assignment of result) {
                              const assignments = await assignmentsCollection.findOne({ _id: new ObjectId(assignment.assignmentId) })
                              assignment.title = assignments.title


                              assignment.marks = assignments.marks

                        }

                  }
                  res.send(result)

            })
            app.delete('/assignments/:id', varifyToken, async (req, res) => {
                  const id = req.params.id
                  const assignmentVeryfy = await assignmentsCollection.findOne({ _id: new ObjectId(id) })
                  if (assignmentVeryfy.creatorEmail !== req.user.email) {
                        return res.status(403).send({ message: 'forbidden' })
                  }
                  const result = await assignmentsCollection.deleteOne({ _id: new ObjectId(id) })
                  await submitedassignmentsCollection.deleteMany({ assignmentId: id })
                  res.send(result)
            })

            app.get('/pending-assignments',varifyToken , async (req, res) => {
                  let assignments;
                  assignments = await submitedassignmentsCollection.find({ status: "pending" }).toArray()
                  for (let assignment of assignments) {
                        const assignmentc = await assignmentsCollection.findOne({ _id: new ObjectId(assignment.assignmentId) })
                        assignment.title = assignmentc?.title
                        assignment.marks = assignmentc?.marks


                  }
                  res.send(assignments)
            })
            app.put('/submit-assignment/:id', async (req, res) => {

                  const id = req.params.id
                  const update = req.body
                  const query = { _id: new ObjectId(id) }
                  const assignment = await submitedassignmentsCollection.findOne(query)

                  if (assignment.email === update.email) {
                        res.send({ message: 'this is your assignment' })
                        return
                  }
                  const options = { upsert: true };
                  const updatedDoc = {
                        $set: {
                              status: "complited",
                              obtainedMarks: req.body.marks,
                              feedback: req.body.feedback

                        }
                  }
                  const result = await submitedassignmentsCollection.updateOne(query, updatedDoc, options)
                  res.send(result);
            })
            app.put('/update-assignment/:id', varifyToken, async (req, res) => {
                  const newData = req.body
                  const id = req.params.id
                  const assignmentVeryfy = await assignmentsCollection.findOne({ _id: new ObjectId(id) })
                  if (assignmentVeryfy.creatorEmail !== req.user.email) {
                        return res.status(403).send({ message: 'forbidden' })
                  }
                
                  const filter = { _id: new ObjectId(id) }
                  const options = { upsert: true }
                  const updatedDoc = {
                        $set: { ...newData }

                  }
                  const result = await assignmentsCollection.updateOne(filter, updatedDoc, options)
                  res.send(result)
            })








            console.log(" You successfully connected to MongoDB!");
      } finally {

      }
}
run().catch(console.dir);







app.get('/', (req, res) => {
      res.send({ status: true })
})


app.listen(port, console.log('surver is running on ', port))