import{reportIllegalDump,getAllIllegalEntries,getIllegalEntryById,updateIllegalEntryById, getillegalStatus, deleteIllegalEntry, acceptDumpRequestService, rejectDumpRequestService, resolveDumpRequestService} from "../services/illegalDumping.services.js";

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
    res.status(200).json(illegalEntry);

  } catch(error){
    res.status(400).json({message:error.message})
  }
}

export const editIllegalEntryById = async (req,res) => {
  try{
    const updatedIllegalEntry = await updateIllegalEntryById(req.params.id, req.body);
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

// cOllector Section

export const acceptIllegalDumpRequest = async (req, res) => {
  const { dumpId, collectorAssayId } = req.body;
  try {
    const acceptedDump = await acceptDumpRequestService(dumpId, collectorAssayId);
    res.status(200).json(acceptedDump);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const rejectIllegalDumpRequest = async (req, res) => {
  const { dumpId, collectorAssayId, rejectionReason } = req.body;
  try {
    const rejectedDump = await rejectDumpRequestService(dumpId, collectorAssayId, rejectionReason);
    res.status(200).json(rejectedDump);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export const resolveDumpingRequest = async (req, res) => {
  const {dumbId, collectorAssayId} = req.body
  try{
     const resolveDump = await resolveDumpRequestService(dumbId, collectorAssayId)
     res.status(200).json(resolveDump)
  }catch(error){
   res.status(400).json({message:error.message})
  }
}