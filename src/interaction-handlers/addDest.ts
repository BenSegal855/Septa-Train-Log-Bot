import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { MessageFlags, type StringSelectMenuInteraction } from 'discord.js';
import { ObjectId } from 'mongodb';
import { SEPTA } from '../lib/septa';
import { DateTime } from 'luxon';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.SelectMenu
})
export class MenuHandler extends InteractionHandler {

	public override async run(interaction: StringSelectMenuInteraction, rideId: InteractionHandler.ParseResult<this>) {
		const dm = this.container.dialogueManagers.get(interaction.user.id);
		if (!dm) {
			return interaction.reply({ content: 'You don\'t seem to be registered.', flags: MessageFlags.Ephemeral });
		}

		const [destination, estimatedTimeString] = interaction.values[0].split('|');

		const { trainNumber } = (await this.container.db.rides.findOneAndUpdate({ _id: rideId }, { $set: {
			destination
		} }))!;

		await interaction.deferUpdate();
		const schedule = await SEPTA.getScheduleByTrainNumber(trainNumber);

		const estimatedTime = DateTime.fromFormat(estimatedTimeString, 'h:mm a', { zone: 'America/New_York' });
		const nextCheck = estimatedTime.minus({ minutes: 5 });
		const isLastStop = schedule[schedule.length - 1].station === destination;

		await this.container.db.ridesInProgress.insertOne({
			user: interaction.user.id,
			trainNumber,
			destination,
			estimatedTime: estimatedTime.toJSDate(),
			nextCheck: nextCheck.toJSDate(),
			isLastStop
		});

		return dm.confirmDestinationAndAddSource(destination, schedule, rideId);
	}

	public override parse(interaction: StringSelectMenuInteraction) {
		if (!interaction.customId.startsWith('ADD_DEST')) return this.none();
		return this.some(new ObjectId(interaction.customId.split('|')[1]));
	}

}
