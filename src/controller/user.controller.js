import {createUser, getAllUsers, getUserbyId, updateUser, deleteUser} from "../services/user.services.js";

export const createNewUser = async (req, res) =>{
  const {name, email, password, phoneNumber, role, location, profilePicture} = req.body;
  const users = await createUser(name, email, password, phoneNumber,role, location, profilePicture)
  if (!users) {
    return res.status(400).json({message: "incomplete details"})
  }
  return res.status(201).json(users)
}


export const fetchAllUsers = async (req,res) =>{
  const {id} = req.params;
  const users = await getAllUsers(id);
  return res.status(200).json(users)
}


export const fetchUserById = async (req,res) =>{
  const {id} = req.params;
  const users = await getUserbyId(id);
 if(!users){
  return res.status(404).json({message: "profile not found"})
 }
 return res.status(200).json(users)
}


export const editUser = async(req, res) => {
  const {id} = req.params;
  const updateInfo = req.body;
  const users = await updateUser(id, updateInfo);
  if(!users){
    return res.status(404).json({message: "nonexistent user"});
  }
  return res.status(200).json(users)
}


export const removeUser = async(req, res) => {
  const {id} = req.params;
  const users = await deleteUser(id);
  if (!users){
    return res.status(404).json({message: "user not found"})
  }
  return res.status(200).json({message: "user deleted successfully"}) 
}