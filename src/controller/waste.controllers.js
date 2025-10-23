import CollectorAssay from "../model/collectorAssay.js";
import {createWasteRequest, getAllWasteEntries, getWasteEntryById, getWasteStatus, updatewaste, deleteWasteEntry,acceptWasteRequestService, rejectWasteRequestService, getCollectorStat, collectWasteRequest, routecollectorService, deleteAllUser} from "../services/waste.services.js";


export const createNewWaste = async (req, res) => {
  try {
    const userId = req.user._id; // securely extracted from auth middleware
    const wasteData = { ...req.body, userId }; // inject userId into the payload

    const wasteRequest = await createWasteRequest(wasteData);
    res.status(201).json({success: true, message: "request successfully created", data: wasteRequest

    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const fetchAllWasteEntries = async (req, res) => {
  try {
    const wasteEntries = await getAllWasteEntries();
    res.status(200).json(wasteEntries);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



export const fetchWasteEntryByIdUserId = async (req, res) => {
  try {
    const userId = req.params.id; // the user’s ID
    const wasteEntry = await getWasteEntryById(userId);

    if (!wasteEntry.length) {
      return res.status(404).json({ message: "No waste entries found for this user" });
    }

    res.status(200).json(wasteEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const viewWasteStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: Missing user ID" });
    }

    const userId = req.user.id;

    console.log(userId)

    const statusInfo = await getWasteStatus(userId);
    res.status(200).json(statusInfo);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const editWaste = async (req, res) => {
  try {
    const updatedWaste = await updatewaste(req.params.id, req.body);
    res.status(200).json(updatedWaste);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const removeWasteEntry = async (req, res) => {
  try {
    const deletedEntry = await deleteWasteEntry(req.params.id);
    if (!deletedEntry) {
      return res.status(404).json({ message: "Waste entry not found" });
    }
    res.status(200).json({ message: "Waste entry deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteAll = async (req, res) => {
  try{
    const users = await deleteAllUser(req.params.id)
    if (!users) {
      return res.status(404).json({message: "not found"})
    }
    res.status(200).json({message: "successful"})
  }catch(error){
    res.status(400).json({message: error.message})
  }
}




// Collector Section

export const acceptWasteRequest = async (req, res) => {
  const { wasteId, collectorAssayId } = req.body;

  try {
    const result = await acceptWasteRequestService(wasteId, collectorAssayId);
    res.status(200).json({ message: "Waste request accepted", data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const rejectWasteRequest = async (req, res) => {
  const { wasteId, collectorAssayId, rejectionReason } = req.body;

  try {
    const result = await rejectWasteRequestService(wasteId, collectorAssayId, rejectionReason);
    res.status(200).json({ message: "Waste request rejected", data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const collectorView = async (req, res) => {
  try {
    const collectorDet = await getCollectorStat(req.params.id);
     if (!collectorDet) {
      return res.status(404).json({ message: "CollectorAssay not found for this user" });
    }
    res.status(200).json(collectorDet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export const routeWasteRequest = async (req, res) => {
  const { wasteId, collectorAssayId } = req.body;
  try{
   const route = await routecollectorService(wasteId, collectorAssayId);
    res.status(200).json({ message: "Waste request en routed", data: route })
  }catch(error){
    res. status(400).json({error: error.message})
  }
}

export const collectWasteRquest = async (req, res) => {
  const {wasteId, collectorAssayId}= req.body;
  try{
   const collect = await collectWasteRequest(wasteId, collectorAssayId)
   res.status(200).json({mesaage: "Waste request collected", data: collect})
  }catch(error){
  res.status(400).json({error: error.message})
  }
}
