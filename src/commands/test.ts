import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { SEPTA } from '../lib/septa';
import { inspect } from 'util';

@ApplyOptions<Command.Options>({
	description: 'get a train by car number'
})
export class UserCommand extends Command {

	public override registerApplicationCommands(registry: Command.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption(option =>
					option.setName('car-number')
						.setDescription('Car number')
						.setRequired(true)
				)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const carNumber = interaction.options.getString('car-number', true);
		await interaction.reply(`Car number: ${carNumber}`);
		const train = await SEPTA.findTrainByCar(carNumber);
		this.container.logger.info(inspect(train, { depth: null }));
	}

}
