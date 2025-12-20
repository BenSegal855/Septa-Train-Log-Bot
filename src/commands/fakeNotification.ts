import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { InteractionContextType, MessageFlags } from 'discord.js';

@ApplyOptions<Command.Options>({
	description: 'Send a fake on train notification',
	enabled: process.env.NODE_ENV !== 'production'
})
export class UserCommand extends Command {

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.setContexts([InteractionContextType.BotDM])
				.addIntegerOption(input => input
					.setMinValue(100)
					.setMaxValue(9999)
					.setName('trainnumber')
					.setDescription('The number of the train to send a notif for')
					.setRequired(true)
				)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const dm = this.container.dialogueManagers.get(interaction.user.id);
		if (!dm) {
			return interaction.reply({ content: 'You don\'t seem to be enrolled', flags: MessageFlags.Ephemeral });
		}

		const trainNo = interaction.options.getInteger('trainnumber', true);
		await interaction.reply({ content: 'You\'ll get a notification in 10 seconds', flags: MessageFlags.Ephemeral });

		setTimeout(() => {
			dm.sendOnTrainNotification(trainNo.toString());
		}, 10 * 1000);
		return;
	}

}
