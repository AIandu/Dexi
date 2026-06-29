import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import contactsRouter from "./contacts";
import outreachRouter from "./outreach";
import chatRouter from "./chat";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/projects", projectsRouter);
router.use("/contacts", contactsRouter);
router.use("/outreach", outreachRouter);
router.use("/chat", chatRouter);
router.use("/dashboard", dashboardRouter);

export default router;
