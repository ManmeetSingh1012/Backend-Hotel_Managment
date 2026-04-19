import { HotelConfigration } from '../models/index.js';

export const addgstRate = async(req, res) => {


    try{

        const {gstRate} = req.body;

        if(!gstRate || typeof gstRate !== 'number' || gstRate < 0){
            return res.status(400).json({
                success: false,
                error: "Invalid GST value",
                message: "Please provide a valid GST value (non-negative number)",
              });
        }
    
        const response = await HotelConfigration.create({gstRate: gstRate})
    
    
        res.status(201).json({
          success: true,
          message: "Gst added successfully",
          data: response,
        });
    }catch(error){
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
            message: error.message,
          });
 
    }


}


export const updategstRate = async (req, res) => {
  try {
    const { gstRate } = req.body;

    // Validate GST
    if (gstRate === undefined || typeof gstRate !== "number" || gstRate < 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid GST value",
        message: "Please provide a valid GST (non-negative number)",
      });
    }

    // Get the only GST config row
    const config = await HotelConfigration.findOne(); // No where clause needed

    if (!config) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "GST configuration row does not exist",
      });
    }

    // Update GST
    config.gstRate = gstRate;

    // Save
    await config.save();

    return res.status(200).json({
      success: true,
      message: "GST updated successfully",
      data: config,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message,
    });
  }
};



export const getGstRate = async (req, res) => {
    try {


        const response = await HotelConfigration.findAll();

        res.status(200).json({
          success: true,
          message: "Gst fetched successfully",
          data: response,
        });

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
          
    
