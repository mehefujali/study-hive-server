const express = require('express');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 8080
require('dotenv').config()
// mw 
app.use(cors())
app.use(express.json())


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

            app.post('/assignments', async (req, res) => {
                  const assignment = req.body
                  const result = await assignmentsCollection.insertOne(assignment)
                  res.send(result)

            })
            app.get('/assignments', async (req, res) => {
                  const assignment = await assignmentsCollection.find().toArray()
                  res.send(assignment)
            })
            app.get('/assignment-details/:id', async (req, res) => {
                  const assignment = await assignmentsCollection.findOne({ _id: new ObjectId(req.params.id) })
                  res.send(assignment)
            })
            app.post('/submit-assignment', async (req, res) => {
                  const result = await submitedassignmentsCollection.insertOne(req.body)
                  res.send(result)
            })
            app.get('/my-submited-assignment', async (req, res) => {
                  const email = req.query.email
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
            app.delete('/assignments/:id' , async(req,res)=> {
                  const id = req.params.id 
                  const result = await assignmentsCollection.deleteOne({_id : new ObjectId(id)})
                  res.send(result)
            })

            app.get('/pending-assignments', async (req, res) => {
                  let assignments;
                  assignments = await submitedassignmentsCollection.find({ status: "pending" }).toArray()
                  for (let assignment of assignments) {
                        const assignments = await assignmentsCollection.findOne({ _id: new ObjectId(assignment.assignmentId) })
                        assignment.title = assignments.title


                        assignment.marks = assignments.marks
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
                              obtainedMarks: req.body.marks ,
                              feedback : req.body.feedback

                        }
                  }
                  const result = await submitedassignmentsCollection.updateOne(query, updatedDoc, options)
                  res.send(result);
            })
          app.put ('/assignment/:id' , async(req,res) => {
              const newData = req.body 
              const id = req.params.id 
              const filter = {_id : new ObjectId(id)}
              const options = { upsert: true }
              const result = assignmentsCollection.updateOne(filter , newData , options)
              res.send(result)
          } )









            console.log(" You successfully connected to MongoDB!");
      } finally {

      }
}
run().catch(console.dir);







app.get('/', (req, res) => {
      res.send({ status: true })
})


app.listen(port, console.log('surver is running on ', port))