import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import contactsRouter from "./contacts";
import importRouter from "./import";
import campaignsRouter from "./campaigns";
import emailsRouter from "./emails";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(contactsRouter);
router.use(importRouter);
router.use(campaignsRouter);
router.use(emailsRouter);
router.use(dashboardRouter);

export default router;
