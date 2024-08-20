import { s } from '@sapphire/shapeshift';
import axios from 'axios';

export class SEPTA {

	private static axios = axios.create({ baseURL: 'https://www3.septa.org/api' });

	private static async getCurrentTrainView(): Promise<Train[]> {
		return this.axios.get('/TrainView/index.php').then(res =>
			s.object({
				lat: s.string(),
				lon: s.string(),
				trainno: s.string(),
				service: s.string(),
				dest: s.string(),
				currentstop: s.string(),
				nextstop: s.string(),
				line: s.string(),
				consist: s.string(),
				heading: s.string(),
				late: s.number(),
				SOURCE: s.string(),
				TRACK: s.string(),
				TRACK_CHANGE: s.string()
			}).transform(train => ({
				lat: train.lat,
				lon: train.lon,
				trainNo: train.trainno,
				service: train.service,
				dest: train.dest,
				currentStop: train.currentstop,
				nextStop: train.nextstop,
				line: train.line,
				cars: train.consist.split(','),
				heading: train.heading,
				late: train.late,
				source: train.SOURCE,
				track: train.TRACK,
				trackChange: train.TRACK_CHANGE
			})).array()
				.parse(res.data)
		);
	}

	public static async findTrainByCar(number: string): Promise<TrainWithSchedule|undefined> {
		const trains = await this.getCurrentTrainView();
		const desiredTrain = trains.find(train => train.cars.includes(number));

		if (!desiredTrain) {
			return;
		}

		const schedule = await this.getScheduleByTrainNumber(desiredTrain.trainNo);
		return { ...desiredTrain, schedule };
	}

	public static async getScheduleByTrainNumber(number: string): Promise<Schedule|undefined> {
		return this.axios.get(`/RRSchedules/index.php?req1=${number}`).then(res =>
			s.object({
				station: s.string(),
				// eslint-disable-next-line camelcase
				sched_tm: s.string(),
				// eslint-disable-next-line camelcase
				est_tm: s.string(),
				// eslint-disable-next-line camelcase
				act_tm: s.string()
			}).transform(schedule => ({
				station: schedule.station,
				scheduledTime: schedule.sched_tm,
				estimatedTime: schedule.est_tm,
				actualTime: schedule.act_tm
			})).array()
				.parse(res.data)
		);
	}

};

export type Train = {
	lat: string,
	lon: string,
	trainNo: string,
	service: string,
	dest: string,
	currentStop: string,
	nextStop: string,
	line: string,
	cars: string[],
	heading: string,
	late: number,
	source: string,
	track: string,
	trackChange: string
};

export type Schedule = {
	station: string,
	scheduledTime: string,
	estimatedTime: string,
	actualTime: string
}[];

export type TrainWithSchedule = Train & { schedule?: Schedule };
