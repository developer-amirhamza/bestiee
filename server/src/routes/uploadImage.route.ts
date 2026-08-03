import express from "express";
import { auth } from "../middlewares/auth";
import { upload } from "../middlewares/multer";
import { uploadImage } from "../controllers/uploadImage-controller";




const router = express.Router();

router.post("/upload", auth, upload.single("image"), uploadImage);

export default router;