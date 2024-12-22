const express = require('express');
const cors = require('cors');
const app = express()
const port =  process.env.PORT || 8080 

// mw 
app.use(cors())
app.use(express.json())








app.get('/' , (req,res)=>{
      res.send({status:true})
})


app.listen(port , console.log('surver is running on ' , port) )