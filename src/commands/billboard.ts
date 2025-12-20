import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags } from 'discord.js';
import { EMOTES } from '../lib/constants';
import { SEPTA } from '../lib/septa';

@ApplyOptions<Command.Options>({
	description: 'A basic slash command'
})
export class UserCommand extends Command {

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply();
		// this.container.logger.debug(interaction.channel?.isSendable());
		// if (!interaction.channel?.isSendable()) return;
		const trainNo = '9567';
		const train = await SEPTA.getTrainByNumber(trainNo);
		this.container.logger.debug(train);
		if (!train) return;

		const carEmotes: string[] = [];
		const vehicleType = SEPTA.getVehicleType(train.cars[0]);

		if (vehicleType === 'Silverliner IV' || vehicleType === 'Silverliner V') {
			const emoteSet = vehicleType === 'Silverliner IV' ? EMOTES.SL4 : EMOTES.SL5;

			carEmotes.push(emoteSet.FRONT);

			train.cars.forEach((car, idx) => {
				car.split('').forEach(digit => {
					carEmotes.push(emoteSet.CARS[parseInt(digit)]);
				});
				carEmotes.push(idx === train.cars.length - 1 ? emoteSet.BACK : emoteSet.CONNECTOR);
			});
		} else {
			carEmotes.push(train.cars.join(', '));
		}

		const questionText = new TextDisplayBuilder().setContent(`Are you on train ${trainNo}?\n${carEmotes.join('')}`);
		const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId('yes')
				.setLabel('Yes')
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId('no')
				.setLabel('No')
				.setStyle(ButtonStyle.Danger)
		);

		const billboard = new ContainerBuilder()
			.addTextDisplayComponents(text => text.setContent('# Choo Choo 🚅'))
			.addSeparatorComponents(sep => sep)
			.addTextDisplayComponents(questionText)
			.addActionRowComponents(buttons);

		await interaction.editReply({ components: [billboard], flags: MessageFlags.IsComponentsV2 });
	}

}
