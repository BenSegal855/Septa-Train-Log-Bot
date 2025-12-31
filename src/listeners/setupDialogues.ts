import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Collection } from 'discord.js';
import { DialogueManager } from '../lib/dialogueManager';
import nodeCron from 'node-cron';
import { DateTime } from 'luxon';
import { SEPTA } from '../lib/septa';

@ApplyOptions<Listener.Options>({
	once: true,
	event: Events.ClientReady
})
export class UserEvent extends Listener {

	public override async run() {
		const users = await this.container.db.users.find().toArray();
		this.container.dialogueManagers = new Collection();

		for (const user of users) {
			const dm = await DialogueManager.create(user);
			this.container.dialogueManagers.set(user.id, dm);

			for (const scheduledRide of user.normalRides ?? []) {
				nodeCron.schedule(scheduledRide.cron, () => dm.sendOnTrainNotification(scheduledRide.trainNo));
			}
		};

		nodeCron.schedule('5 * * * * *', async ({ date }) => {
			const now = DateTime.fromJSDate(date);
			const ridesInProgress = await this.container.db.ridesInProgress.find({
				nextCheck: { $lte: now.toJSDate() }
			}).toArray();

			ridesInProgress.forEach(async ride => {
				this.container.logger.debug(`Checking if ${ride.trainNumber} has been to ${ride.destination}`);

				const schedule = await SEPTA.getScheduleByTrainNumber(ride.trainNumber).catch(() => []);
				const stop = schedule.find(stop => stop.station === ride.destination);

				if (!stop) {
					await this.container.db.ridesInProgress.findOneAndDelete(ride);
					this.container.logger.debug(`Could not find station ${ride.destination} for train ${ride.trainNumber}`);
					return;
				}

				let arrived: Date | null = null;

				if (stop.actualTime !== 'na') {
					arrived = DateTime.fromFormat(stop.actualTime, 'h:mm a', { zone: 'America/New_York' }).toJSDate();
				}

				if (ride.isLastStop) {
					const estimatedTime = DateTime.fromFormat(stop.estimatedTime, 'h:mm a', { zone: 'America/New_York' });
					if (estimatedTime.diff(now).as('seconds') < 0) {	// If estimated time is in the past
						arrived = estimatedTime.toJSDate();
					}
				}

				if (arrived) {
					await this.container.db.rides.findOneAndUpdate({
						user: ride.user,
						trainNumber: ride.trainNumber,
						arrived: { $exists: false }
					}, { $set: { arrived } });

					await this.container.db.ridesInProgress.findOneAndDelete(ride);
					return;
				}

				const nextCheck = now.plus({ minutes: 2 }).toJSDate();
				this.container.db.ridesInProgress.findOneAndUpdate(ride, { $set: {
					nextCheck,
					estimatedTime: DateTime.fromFormat(stop.estimatedTime, 'h:mm a', { zone: 'America/New_York' }).toJSDate()
				} });
			});
		});
	}

}
