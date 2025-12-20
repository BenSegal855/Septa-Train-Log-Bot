import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { InteractionContextType, MessageFlags } from 'discord.js';
import { DialogueManager } from '../lib/dialogueManager';
import { User } from '../types/database';

@ApplyOptions<Command.Options>({
	description: 'Enroll in new episode notifications'
})
export class UserCommand extends Command {

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setContexts([InteractionContextType.BotDM])
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const user: User = { id: interaction.user.id, channelId: interaction.channelId };
		await this.container.db.users.findOneAndUpdate(
			{ id: interaction.user.id },
			{ $set: user },
			{ upsert: true }
		);

		interaction.channel?.messages.fetch().then(messages => messages.forEach(message => {
			if (message.deletable) message.delete();
		}));

		const dm = await DialogueManager.create(user);
		this.container.dialogueManagers.set(user.id, dm);

		return interaction.reply({ content: 'You\'re enrolled!', flags: MessageFlags.Ephemeral });
	}

}
