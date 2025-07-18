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
exports.updateCustomer=async (req, res) => {
  try {
    const {id}=req.params.id
    const {name,company,mobile,address,email}=req.body
    const updatedCustomers=await prisma.customer.update({
      where:{id:Number(id)},
      data:{
        name,email,mobile,company,address
      }

    })
    res.status(201).json(updatedCustomers)
  } catch (error) {
    res.status(400).json({error:error.message})
  }
}


exports.getAllCustomers=async(req,res)=>{
  try {
    const allCustomers=await prisma.customer.findMany()
    res.status(201).json(allCustomers)
  } catch (error) {
    res.status(400).json({error:error.message})
  }
}


exports.Customer=async(req,res)=>{
  const custId=parseInt(req.params.id)
  
  try {
    const Customers=await prisma.customer.findUnique(
      {
        where:{id:custId}
      }
    )
    res.status(201).json(Customers)
  } catch (error) {
    res.status(400).json({error:error.message})
  }
}

