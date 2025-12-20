import { MongoClient } from 'mongodb';
import { DBCollections } from './mongo';
import { Collection } from 'discord.js';
import { DialogueManager } from './dialogueManager';

declare module '@sapphire/pieces' {
	interface Container {
		db: DBCollections,
		mongo: MongoClient,
		dialogueManagers: Collection<string, DialogueManager>
	}
}

export default undefined;
