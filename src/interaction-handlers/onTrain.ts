import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ModalBuilder, TextInputStyle, type ButtonInteraction } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonHandler extends InteractionHandler {

	public async run(interaction: ButtonInteraction) {
		const modal = new ModalBuilder()
			.setCustomId(`IN_CAR|${interaction.user.id}`)
			.setTitle('Enjoy the trip!')
			.addLabelComponents(label => label
				.setLabel('What car are you in?')
				.setTextInputComponent(input => input
					.setCustomId('car-number')
					.setStyle(TextInputStyle.Short)
					.setMinLength(3)
					.setMaxLength(4)
					.setRequired(true)
				)
			);
		await interaction.showModal(modal);
	}

	public override parse(interaction: ButtonInteraction) {
		if (!interaction.customId.startsWith('ON_TRAIN')) return this.none();
		return this.some();
	}

}
