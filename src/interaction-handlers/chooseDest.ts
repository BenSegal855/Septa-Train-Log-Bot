import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { StringSelectMenuInteraction } from 'discord.js';
import { ObjectId } from 'mongodb';

export class MenuHandler extends InteractionHandler {

	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.SelectMenu
		});
	}

	public override parse(interaction: StringSelectMenuInteraction) {
		if (!interaction.customId.startsWith('Dest')) return this.none();
		const [, id] = interaction.customId.split('|');

		return this.some(new ObjectId(id));
	}

	public async run(interaction: StringSelectMenuInteraction, rideId: InteractionHandler.ParseResult<this>) {
		await this.container.db.rides.findOneAndUpdate({ _id: rideId }, { $set: { destination: interaction.values[0] } });
		await interaction.update({ content: `Set destination to ${interaction.values[0]}`, components: [] });
	}

}
