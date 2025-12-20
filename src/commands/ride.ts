import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { SEPTA } from '../lib/septa';
import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';

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
						.setDescription('What car are you currently in?')
						.setRequired(true)
				)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const carNumber = interaction.options.getString('car-number', true);
		const train = await SEPTA.findTrainByCar(carNumber);
		if (!train) {
			return interaction.reply({
				ephemeral: true,
				content: 'Train not found'
			});
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

		const availableStops = train.schedule
			.filter(stop => stop.actualTime === 'na')
			.map(({ station }) => ({ label: station, value: station }));

		const stopSelect = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(new StringSelectMenuBuilder()
			.setCustomId(`Dest|${rideId.toHexString()}`)
			.addOptions(availableStops));

		return interaction.reply({
			ephemeral: true,
			content: `Found train ${train.trainNo} ${train.service} to ${train.dest}. Select a destination from the menu below to set your destination.`,
			components: [stopSelect]
		});
	}

}
