import express from 'express';
import { addgstRate, updategstRate, getGstRate } from '../controllers/hotelConfigrationController.js';


const router = express.Router();


router.post("/add_gst_value",addgstRate)
router.put("/update_gst_value", updategstRate)
router.get("/get_gst_value",getGstRate)



export default router;