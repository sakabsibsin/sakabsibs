import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import settingsRouter from "./settings";
import storageRouter from "./storage";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(settingsRouter);
router.use(storageRouter);

export default router;
