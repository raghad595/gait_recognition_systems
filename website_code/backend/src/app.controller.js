import authRouter from './modules/auth/auth.controller.js'
import gaitRouter from './modules/gait/gait.routes.js'
import analysisRouter from './modules/analysis/analysis.routes.js'
import userRouter from './modules/user/user.controller.js'
import dashboardRouter from './modules/dashboard/dashboard.routes.js'
import reportsRouter from './modules/reports/reports.routes.js'
import settingsRouter from './modules/settings/settings.routes.js'
import predictRouter from './modules/predict/predict.routes.js'
import { connectDB } from './db/connection.js'
import { globalErrorHandler } from './utils/multer/errorHandling.utils.js'
import cors from 'cors'
import { startDeleteUnactivatedUsersJob } from './utils/cron/deleteUnactivateduser.utils.js'
import path from 'node:path'
import * as dotenv from "dotenv"
import { attachmentRoutingLogger } from './utils/loggers/logger.js'
import { corsOptions } from './utils/cors/cors.js'
import helmet from 'helmet'
import { limiter } from './utils/multer/express-rate-limit.js'


dotenv.config({path: path.resolve('.env')})


const bootstrap = async (app,express) =>{
    const port = Number(process.env.PORT || 5000)
    app.use(express.json())
    app.use(cors(corsOptions()))
    app.options('*', cors(corsOptions()))
    app.use(helmet())
    app.use(limiter)
    attachmentRoutingLogger(app , "/api/auth" , authRouter , "authLogs.log")
    attachmentRoutingLogger(app , "/api/gait" , gaitRouter , "gaitLogs.log")
    attachmentRoutingLogger(app , "/api/analysis" , analysisRouter , "analysisLogs.log")
    attachmentRoutingLogger(app , "/api/user" , userRouter , "userLogs.log")
    attachmentRoutingLogger(app , "/api/dashboard" , dashboardRouter , "dashboardLogs.log")
    attachmentRoutingLogger(app , "/api/reports" , reportsRouter , "reportsLogs.log")
    attachmentRoutingLogger(app , "/api/settings" , settingsRouter , "settingsLogs.log")
    attachmentRoutingLogger(app , "/api/predict" , predictRouter , "predictLogs.log")
    await connectDB()
    startDeleteUnactivatedUsersJob()

    app.get('/robots.txt', (req, res) => {
        res.type('text/plain');
        res.send("User-agent: *\nDisallow: /api");
    });

    app.get('/' , (req,res)=>{
        res.status(200).json({
            message:"Welcome to Gait Recognition Backend API"
        })
    })
    app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_PATH || 'uploads')))
    app.use('/api/auth',authRouter)
    app.use('/api/gait',gaitRouter)
    app.use('/api/analysis',analysisRouter)
    app.use('/api/user',userRouter)
    app.use('/api/dashboard', dashboardRouter)
    app.use('/api/reports', reportsRouter)
    app.use('/api/settings', settingsRouter)
    app.use('/api/predict', predictRouter)

    app.all('/*dummy' , (req,res,next)=>{
        return next(new Error("Invalid Route",{cause:404}))
    })

    app.use(globalErrorHandler)
    const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`))

    // Extend timeouts so long HF-Space prediction requests don't get
    // connection-reset mid-flight by Node's default 2-minute HTTP timeout.
    const FIVE_MINUTES = 5 * 60 * 1000;
    server.timeout = FIVE_MINUTES;            // socket inactivity
    server.headersTimeout = FIVE_MINUTES + 1000; // must be > timeout
    server.keepAliveTimeout = FIVE_MINUTES;

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use. Stop the running process or change PORT in new_3omda/.env.`)
            process.exit(1)
        }

        console.error('Server failed to start:', error.message)
        process.exit(1)
    })
}

export default bootstrap; 
