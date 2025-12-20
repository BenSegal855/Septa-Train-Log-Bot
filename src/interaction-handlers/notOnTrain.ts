import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { MessageFlags, type ButtonInteraction } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonHandler extends InteractionHandler {

	public async run(interaction: ButtonInteraction) {
		const dm = this.container.dialogueManagers.get(interaction.user.id);
		if (!dm) {
			return interaction.reply({ content: 'You don\'t seem to be registered.', flags: MessageFlags.Ephemeral });
		}

		await interaction.deferUpdate();
		return dm.dismissOnTrain();
	}

	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId !== 'NOT_ON_TRAIN') return this.none();

		return this.some();
	}

}
