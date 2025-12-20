import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { MessageFlags, type ModalSubmitInteraction } from 'discord.js';
import { SEPTA } from '../lib/septa';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.ModalSubmit
})
export class ModalHandler extends InteractionHandler {

	public async run(interaction: ModalSubmitInteraction, dm: InteractionHandler.ParseResult<this>) {
		if (!dm) {
			return interaction.reply({ content: 'You don\'t seem to be registered.', flags: MessageFlags.Ephemeral });
		}

		const carNumber = interaction.fields.getTextInputValue('car-number');
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

	public override parse(interaction: ModalSubmitInteraction) {
		if (!interaction.customId.startsWith('IN_CAR')) return this.none();
		const dm = this.container.dialogueManagers.get(interaction.user.id);
		return this.some(dm);
	}

}
