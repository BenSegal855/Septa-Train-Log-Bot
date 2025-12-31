export type User = {
	id: string,
	channelId: string,
	lastDialogueId?: string,
	normalRides?: {
		trainNo: string,
		cron: string
	}[]
};

export type Ride = {
	user: string,
	line: string,
	trainNumber: string,
	carNumber: string,
	trainSet: {
		cars: string[],
		vehicle: VehicleType
	},
	source?: string,
	departed?: Date,
	destination?: string,
	arrived?: Date
};

export type VehicleType = 'Silverliner IV' | 'Silverliner V' | 'Bombardier' | 'Unknown';

export type RideInProgress = {
	user: string,
	trainNumber: string,
	destination: string,
	estimatedTime: Date,
	nextCheck: Date,
	isLastStop: boolean
};
