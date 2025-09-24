import{reportIllegalDump,getAllIllegalEntries,getIllegalEntryById,updateIllegalEntryById, getillegalStatus, deleteIllegalEntry} from "../services/illegalDumping.services.js";

export const reportNewILLegalDump = async(req,res) => {
  try{
    const illegalDump = await reportIllegalDump(req.body);
    res.status(201).json(illegalDump)
  
  }catch(error){
    res.status(400).json({message:error.message})
  }
};


export const fetchAllIllegalEntries =async (req,res) =>{
  try{
    const illegalEntries = await getAllIllegalEntries();
    res.status(200).json(illegalEntries)
  
  }catch(error){
    res.status(400).json({message:error.message})
  }
}

export const fetchAllIllegalEntryById = async (req,res) => {
  try{
    const illegalEntry = await getIllegalEntryById(req.params.id);
    if(!illegalEntry){
      return res.status(404).json({message:"Illegal entry not found"})
    }
  } catch(error){
    res.status(400).json({message:error.message})
  }
}

export const editIllegalEntryById = async (req,res) => {
  try{
    const updatedIllegalEntry = await updateIllegalEntryById(req.params.id);
    res.status(200).json(updatedIllegalEntry)
  }catch(error){
    res.status(400).json({message:error.message})
  } 
}

export const viewIllegalStatus = async (req,res) => {
  try{
    const userId = req.user.id;  
    const statusInfo = await getillegalStatus(userId);
    res.status(200).json(statusInfo)
  }catch(error){
    res.status(404).json({message:error.message})
  }
}

export const removeIllegalEntry = async (req,res) => {
  try{
    const deletedEntry = await deleteIllegalEntry(req.params.id); 
    if(!deletedEntry){
      return res.status(404).json({message:"Illegal entry not found"})
    }
    res.status(200).json(deletedEntry)
  }catch(error){
    res.status(400).json({message:error.message})
  }  
}