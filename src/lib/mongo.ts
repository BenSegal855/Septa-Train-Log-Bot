import { Collection, MongoClient } from 'mongodb';
import { container, ILogger } from '@sapphire/framework';
import type {
	Ride,
	RideInProgress,
	User
} from '../types/database';

export interface DBCollections {
	rides: Collection<Ride>;
	users: Collection<User>;
	ridesInProgress: Collection<RideInProgress>;
}

export async function startMongo(logger: ILogger) {
	if (!process.env.MONGO_CONNECTION) {
		throw new Error('No database connection string provided.');
	}
	const mongo = new MongoClient(process.env.MONGO_CONNECTION);

	await mongo.connect();

	const database = mongo.db(process.env.NODE_ENV);

	const db: DBCollections = {
		rides: database.collection('rides'),
		users: database.collection('users'),
		ridesInProgress: database.collection('ridesInProgress')
	};

	container.mongo = mongo;
	container.db = db;

	logger.info('Connected to MongoDB');
}
