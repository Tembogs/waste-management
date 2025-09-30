
import {createRecycleRequest, getAllRecycleEntries, getRecycleEntryById, getRecycleStatus, updateRecycle, deleteReycleEntry, acceptRecycleRequestService, rejectRecycleRequestService} from "../services/recycling.service.js";

export const createNewRecycle = async (req, res) => {
  try {
    const recycleRequest = await createRecycleRequest(req.body);
    res.status(201).json(recycleRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const fetchAllRecycleEntries = async (req, res) => {
  try {
    const recycleEntries = await getAllRecycleEntries();
    res.status(200).json(recycleEntries);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const fetchRecycleEntryById = async (req, res) => {
  try {
    const Recyclentry = await getRecycleEntryById(req.params.id);
    if (!Recyclentry) {
      return res.status(404).json({ message: "Waste entry not found" });
    }
    res.status(200).json(Recyclentry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const viewRecycleStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const statusInfo = await getRecycleStatus(userId);
    res.status(200).json(statusInfo);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const editRecycle= async (req, res) => {
  try {
    const updatedWaste = await updateRecycle(req.params.id, req.body);
    res.status(200).json(updatedWaste);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const removeRecycleEntry = async (req, res) => {
  try {
    const deletedEntry = await deleteReycleEntry(req.params.id);
    if (!deletedEntry) {
      return res.status(404).json({ message: "Recycle entry not found" });
    }
    res.status(200).json({ message: "Recycle entry deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Collector Section

export const acceptRecycleRequest = async (req, res) => {
  const {recycleId, collectorAssayId}= req.body
  try{
    const acceptedRecycle = await acceptRecycleRequestService(recycleId, collectorAssayId);
    res.status(200).json(acceptedRecycle);
  }catch(error){
    res.status(400).json({message:error.message})
  }
}

export const rejectRecycleRequest = async (req, res) => {
  const {recycleId, collectorAssayId, rejectionReason} = req.body
  try{
    const rejectedRecycle = await rejectRecycleRequestService(recycleId, collectorAssayId, rejectionReason);
    res.status(200).json(rejectedRecycle);
  }catch(error){
    res.status(400).json({message: error.message})
  }
}