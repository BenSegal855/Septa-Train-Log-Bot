import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { MessageFlags, type ButtonInteraction } from 'discord.js';
import { SEPTA } from '../lib/septa';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonHandler extends InteractionHandler {

	public async run(interaction: ButtonInteraction, carNumber: string) {
		const dm = this.container.dialogueManagers.get(interaction.user.id);
		if (!dm) {
			return interaction.reply({ content: 'You don\'t seem to be registered.', flags: MessageFlags.Ephemeral });
		}

		const train = await SEPTA.findTrainByCar(carNumber);
		if (!train) {
			return interaction.reply({ content: 'I couldn\'t find a train with that car number', flags: MessageFlags.Ephemeral });
		}

		const { insertedId: rideId } = await this.container.db.rides.insertOne({
			user: interaction.user.id,
			carNumber,
			trainNumber: train.trainNo,
			line: train.line,
			trainSet: {
				cars: train.cars,
				vehicle: SEPTA.getVehicleType(carNumber)
			}
		});

		await interaction.deferUpdate();
		await dm.addDestinationSelect(train.schedule, rideId);
		return;
	}

	public override parse(interaction: ButtonInteraction) {
		if (!interaction.customId.startsWith('IN_CAR')) return this.none();
		return this.some(interaction.customId.split('|')[1]);
	}

}
