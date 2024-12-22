const express = require('express');
const cors = require('cors');
const app = express()
const port =  process.env.PORT || 8080 
require('dotenv').config()
// mw 
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
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
   
    console.log(" You successfully connected to MongoDB!");
  } finally {
   
  }
}
run().catch(console.dir);







app.get('/' , (req,res)=>{
      res.send({status:true})
})


app.listen(port , console.log('surver is running on ' , port) )