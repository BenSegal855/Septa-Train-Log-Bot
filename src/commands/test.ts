import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EMOTES } from '../lib/constants';

@ApplyOptions<Command.Options>({
	description: 'get a train by car number'
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
		// const carNumber = interaction.options.getString('car-number', true);
		// await interaction.reply(`Car number: ${carNumber}`);
		// const train = await SEPTA.findTrainByCar(carNumber);
		// this.container.logger.info(inspect(train, { depth: null }));
		const { SL4, SL5 } = EMOTES;
		const trainEmotes = [
			SL4.FRONT,
			...SL4.CARS,
			SL4.BACK
		];

		await interaction.reply(trainEmotes.join(''));
		if (interaction.channel?.isSendable()) {
			interaction.channel.send([SL5.FRONT, ...SL5.CARS, SL5.BACK].join(''));
		}
	}

}
