import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { MessageFlags, type StringSelectMenuInteraction } from 'discord.js';
import { DateTime } from 'luxon';
import { ObjectId } from 'mongodb';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.SelectMenu
})
export class MenuHandler extends InteractionHandler {

	public override async run(interaction: StringSelectMenuInteraction, rideId: InteractionHandler.ParseResult<this>) {
		const dm = this.container.dialogueManagers.get(interaction.user.id);
		if (!dm) {
			return interaction.reply({ content: 'You don\'t seem to be registered.', flags: MessageFlags.Ephemeral });
		}

		const [source, departedTime] = interaction.values[0].split('|');

		await this.container.db.rides.findOneAndUpdate({ _id: rideId }, { $set: {
			source,
			departed: DateTime.fromFormat(departedTime, 'h:mm a', { zone: 'America/New_York' }).toJSDate()
		} });

		await interaction.deferUpdate();
		return dm.confirmSource(source);
	}

	public override parse(interaction: StringSelectMenuInteraction) {
		if (!interaction.customId.startsWith('ADD_SOURCE')) return this.none();
		return this.some(new ObjectId(interaction.customId.split('|')[1]));
	}

}
