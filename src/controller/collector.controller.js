import * as collectorServices from "../services/collector.js";

export const createCollector = async (req, res) => {
    const { collector } = req.params;
    const { assayDate, status, totalCollected, acceptedRequests, rejectedRequests, collectionStats } = req.body;
    const Collector = await collectorServices.createCollector(collector,assayDate, status, totalCollected, acceptedRequests, rejectedRequests, collectionStats);

    if(!Collector){
        return res.status(400).json({message: `all fields not completed`})
    }
    res.status(201).json(Collector);
};

