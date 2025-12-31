import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	ContainerBuilder,
	ContainerComponentBuilder,
	DMChannel,
	Message,
	MessageFlags,
	SectionBuilder,
	SeparatorBuilder,
	StringSelectMenuBuilder,
	TextDisplayBuilder
} from 'discord.js';
import { User } from '../types/database';
import { container } from '@sapphire/framework';
import { Schedule, SEPTA } from './septa';
import { ObjectId } from 'mongodb';
import { EMOTES } from './constants';

export class DialogueManager {

	private lastTimeout?: NodeJS.Timeout;
	private message: Message;
	private user: User;
	private channel: DMChannel;

	private constructor(message: Message, user: User, channel: DMChannel) {
		this.message = message;
		this.user = user;
		this.channel = channel;
	}

	public static async create(user: User): Promise<DialogueManager> {
		const channel = await container.client.channels.fetch(user.channelId);
		if (!channel || !channel.isDMBased() || !channel.isSendable()) {
			throw new Error('User did not have a sendable DM channelId');
		}

		let message: Message;
		if (user.lastDialogueId) {
			message = await channel.messages.fetch(user.lastDialogueId)
				.then(msg => msg.fetch(true))
				.catch(async () => {
					const allMessages = await channel.messages.fetch();
					await Promise.all(allMessages.map(async (msg) => {
						if (msg.deletable) {
							return await msg.delete();
						}
						return 0;
					}));

					return channel.send({
						components: [new TextDisplayBuilder().setContent(
							'Something went wrong & I couldn\'t find your dashboard.\n A new one will be sent shortly'
						)],
						flags: MessageFlags.IsComponentsV2
					});
				});
		} else {
			message = await channel.send({
				components: [new TextDisplayBuilder().setContent('Welcome to logging, please wait...')],
				flags: MessageFlags.IsComponentsV2
			});
		}
		message.edit({ components: [this.getIdle(user)], flags: MessageFlags.IsComponentsV2 });

		await container.db.users.findOneAndUpdate({ id: user.id }, {
			$set: { lastDialogueId: message.id }
		});


		return new DialogueManager(message, user, await channel.fetch());
	}

	public async addDestinationSelect(schedule: Schedule, rideId: ObjectId) {
		const availableStops = schedule
			.filter(stop => stop.actualTime === 'na')
			.map(({ station, estimatedTime }) => ({ label: station, value: `${station}|${estimatedTime}` }));

		const stopSelects: ActionRowBuilder<StringSelectMenuBuilder>[] = [];
		for (let i = 0; i < availableStops.length; i += 25) {
			stopSelects.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(new StringSelectMenuBuilder()
				.setCustomId(`ADD_DEST|${rideId.toHexString()}|${i / 25}`)
				.setPlaceholder(i === 0 ? 'Choose your stop' : 'More stops in here!')
				.addOptions(availableStops.slice(i, i + 25))));
		}
		this.updateDialogue(await this.addToDialogue(
			new TextDisplayBuilder().setContent('Where are you getting off?'),
			...stopSelects
		));
	}

	public async confirmDestinationAndAddSource(destination: string, schedule: Schedule, rideId: ObjectId) {
		const availableStops = schedule
			.filter(stop => stop.actualTime !== 'na')
			.map(({ station, actualTime }) => ({ label: station, value: `${station}|${actualTime}` }));

		const stopSelects: ActionRowBuilder<StringSelectMenuBuilder>[] = [];
		for (let i = 0; i < availableStops.length; i += 25) {
			stopSelects.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(new StringSelectMenuBuilder()
				.setCustomId(`ADD_SOURCE|${rideId.toHexString()}|${i / 25}`)
				.setPlaceholder(i === 0 ? 'Choose your stop' : 'More stops in here!')
				.addOptions(availableStops.slice(i, i + 25))));
		}

		const containerComponent = await this.addToDialogue(
			new TextDisplayBuilder().setContent(`I've set your destination as ${destination}.`),
			new SeparatorBuilder(),
			new TextDisplayBuilder().setContent('Where did you get on?'),
			...stopSelects
		);

		this.updateDialogue(containerComponent);
	}

	public async confirmSource(source: string) {
		const containerComponent = await this.addToDialogue(new SectionBuilder()
			.addTextDisplayComponents(text => text.setContent(`I've set your source as ${source}.`))
			.setButtonAccessory(button => button
				.setCustomId(`ON_TRAIN|${Date.now()}`)
				.setLabel('I\'m on anther train!')
				.setStyle(ButtonStyle.Secondary)
			)
		);

		containerComponent.spliceComponents(0, 1, new TextDisplayBuilder()
			.setContent('# Enjoy your ride!'));

		this.updateDialogue(containerComponent);
	}

	public async sendOnTrainNotification(trainNo: string) {
		const train = await SEPTA.getTrainByNumber(trainNo);
		if (!train) return;

		const carButtonRows: ActionRowBuilder<ButtonBuilder>[] = [];
		for (let i = 0; i < train.cars.length; i += 5) {
			carButtonRows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(
				train.cars.slice(i, i + 5).map(car => new ButtonBuilder()
					.setLabel(car)
					.setCustomId(`IN_CAR|${car}`)
					.setStyle(ButtonStyle.Primary)
				)
			));
		}

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

		const containerComponent = new ContainerBuilder()
			.addTextDisplayComponents(text => text.setContent(`# Are you on train #${trainNo}?`))
			.addTextDisplayComponents(text => text.setContent('Let me know what car you\'re in'))
			.addTextDisplayComponents(text => text.setContent(`## ${carEmotes.join('')}`))
			.addActionRowComponents(...carButtonRows, row => row.addComponents(new ButtonBuilder()
				.setLabel('I\'m not onboard')
				.setCustomId('NOT_ON_TRAIN')
				.setStyle(ButtonStyle.Danger)
			));

		if (process.env.NODE_ENV === 'development') {
			containerComponent.setAccentColor([0x1F, 0x4F, 0xA3]);
		} else if (process.env.NODE_ENV === 'test') {
			containerComponent.setAccentColor([0xF1, 0x47, 0x28]);
		}

		this.updateDialogue(containerComponent, true, 15 * 60 * 1000);
	}

	public async dismissOnTrain() {
		const containerComponent = await this.addToDialogue(new TextDisplayBuilder().setContent('Okay, enjoy life!'));
		this.updateDialogue(containerComponent, false, 60 * 1000);
	}

	/**
	 * Gets the current dialogue, disables all inputs, & appends new components to the end
	 * @param components the components to add
	 * @returns the updated ContainerComponentBuilder
	 */
	private async addToDialogue(...components: ContainerComponentBuilder[]) {
		const containerComponent = await this.getDisabledInputs();

		containerComponent.addSeparatorComponents(sep => sep)
			.spliceComponents(containerComponent.components.length, 0, ...components);
		return containerComponent;
	}

	/**
	 * Updates the dialogue message
	 * @param containerComponent The new container to send
	 * @param sendNew weather to send a new message or update the existing one
	 * @param reset How long to wait before resetting to idle state **(set to 0 to disable reset)**
	 */
	private async updateDialogue(containerComponent: ContainerBuilder, sendNew = false, reset = 5 * 60 * 1000) {
		if (this.lastTimeout) {
			clearTimeout(this.lastTimeout);
		}

		if (sendNew) {
			await this.message.delete();
			this.message = await this.channel.send({ components: [containerComponent], flags: MessageFlags.IsComponentsV2 });
			await container.db.users.findOneAndUpdate({ id: this.user.id }, {
				$set: { lastDialogueId: this.message.id }
			});
		} else {
			await this.message.edit({ components: [containerComponent], flags: MessageFlags.IsComponentsV2 });
		}

		if (reset > 0) {
			this.lastTimeout = setTimeout(() => {
				this.message.edit({ components: [DialogueManager.getIdle(this.user)], flags: MessageFlags.IsComponentsV2 });
			}, reset);
		}
	}

	private async getDisabledInputs(): Promise<ContainerBuilder> {
		const { components } = this.message;

		const containerComponent = components.find((component) => component.type === ComponentType.Container);
		if (!containerComponent || containerComponent.type !== ComponentType.Container) {
			return new ContainerBuilder();
		}

		const containerJson = containerComponent.toJSON();
		containerJson.components.forEach(containerChild => {
			if (containerChild.type === ComponentType.ActionRow) {
				containerChild.components.forEach(rowChild => {
					rowChild.disabled = true;
				});
			}

			if (containerChild.type === ComponentType.Section && containerChild.accessory.type === ComponentType.Button) {
				containerChild.accessory.disabled = true;
			}
		});
		return new ContainerBuilder(containerJson);
	}

	private static getIdle(user: User) {
		const containerComponent = new ContainerBuilder()
			.addTextDisplayComponents(text => text.setContent('# Regional Rail Logging'))
			.addSectionComponents(section => section
				.addTextDisplayComponents(text => text.setContent('Let me know if you\'re on a train'))
				.setButtonAccessory(button => button
					.setLabel('I\'m on a train')
					.setCustomId(`ON_TRAIN|${user.id}`)
					.setStyle(ButtonStyle.Primary)
				)
			);

		if (process.env.NODE_ENV === 'development') {
			containerComponent.setAccentColor([0x1F, 0x4F, 0xA3]);
		} else if (process.env.NODE_ENV === 'test') {
			containerComponent.setAccentColor([0xF1, 0x47, 0x28]);
		}

		return containerComponent;
	}

}
