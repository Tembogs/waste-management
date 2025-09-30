import CollectorAssay from "../model/collectorAssay.js";
import {createWasteRequest, getAllWasteEntries, getWasteEntryById, getWasteStatus, updatewaste, deleteWasteEntry,acceptWasteRequestService, rejectWasteRequestService, getCollectorStat} from "../services/waste.services.js";

export const createNewWaste = async (req, res) => {
  try {
    const userId = req.user._id; // assuming your auth middleware sets req.user
    // const wasteData = { ...req.body };
    const wasteRequest = await createWasteRequest(req.body, userId);
    res.status(201).json(wasteRequest);
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

export const fetchWasteEntryById = async (req, res) => {
  try {
    const wasteEntry = await getWasteEntryById(req.params.id);
    if (!wasteEntry) {
      return res.status(404).json({ message: "Waste entry not found" });
    }
    res.status(200).json(wasteEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const viewWasteStatus = async (req, res) => {
  try {
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
    const collectorAssay = await CollectorAssay.findOne({ user: req.user.id });
    if (!collectorAssay) {
      return res.status(404).json({ message: "CollectorAssay not found for this user" });
    }

    const collectorDet = await getCollectorStat(collectorAssay._id);
    res.status(200).json(collectorDet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

