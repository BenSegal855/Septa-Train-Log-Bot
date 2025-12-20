import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Collection } from 'discord.js';
import { DialogueManager } from '../lib/dialogueManager';
import nodeCron from 'node-cron';

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
	}

}
