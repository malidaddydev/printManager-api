const {PrismaClient}=require('@prisma/client')
const prisma= new PrismaClient();
const bcrypt = require('bcryptjs');

exports.createCustomer=async (req, res) => {
  try {
    const {name,company,mobile,address,email}=req.body
    const customers=await prisma.customer.create({
      data:{
        name,email,mobile,company,address
      }

    })
    res.status(201).json(customers)
  } catch (error) {
    res.status(400).json({error:error.message})
  }
}


exports.getAllCustomers=async(req,res)=>{
  try {
    const allCustomers=await prisma.customer.findmany()
    res.status(201).json(allCustomers)
  } catch (error) {
    res.status(400).json({error:error.message})
  }
}

