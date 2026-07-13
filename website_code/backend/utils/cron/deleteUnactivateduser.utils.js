import cron from 'node-cron';
import { UserModel } from '../../db/models/user.model.js';
import * as dbService from "../../db/dbService.js";

export const startDeleteUnactivatedUsersJob = () => {
    cron.schedule("0 2 * * *", async () => {
        try {
            const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

            const result = await dbService.deleteMany({
                model: UserModel,
                filter: {
                    confirmEmail: false,
                    createdAt: { $lt: twoDaysAgo },
                }
            });

            console.log(`Deleted ${result.deletedCount} unactivated users`);
        } catch (error) {
            console.error("Cron Job Error:", error);
        }
    });
};
