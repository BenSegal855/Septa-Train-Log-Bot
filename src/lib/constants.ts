import { join } from 'path';

export const rootDir = join(__dirname, '..', '..');
export const srcDir = join(rootDir, 'src');

export const EMOTES = {
	SL4: {
		FRONT: '<:Silverliner_IV_front:1446554519122088127>',
		BACK: '<:Silverliner_IV_back:1446554516727005305>',
		CONNECTOR: '<:Silverliner_IV_connector:1446554518018981929>',
		CARS: [
			'<:Silverliner_IV_0:1446554506178334730>',
			'<:Silverliner_IV_1:1446554507231363204>',
			'<:Silverliner_IV_2:1446554508409962517>',
			'<:Silverliner_IV_3:1446554509903134770>',
			'<:Silverliner_IV_4:1446554510976618496>',
			'<:Silverliner_IV_5:1446554512100692029>',
			'<:Silverliner_IV_6:1446554513141137530>',
			'<:Silverliner_IV_7:1446554513958768681>',
			'<:Silverliner_IV_8:1446554514873254058>',
			'<:Silverliner_IV_9:1446554515938738246>'
		]
	},
	SL5: {
		FRONT: '<:Silverliner_V_front:1446574597456527466>',
		BACK: '<:Silverliner_V_back:1446574586736148490>',
		CONNECTOR: '<:Silverliner_V_connector:1446574587449049231>',
		CARS: [
			'<:Silverliner_V_0:1446574570214785249>',
			'<:Silverliner_V_1:1446574571481206865>',
			'<:Silverliner_V_2:1446574572248895488>',
			'<:Silverliner_V_3:1446574573091815585>',
			'<:Silverliner_V_4:1446574574870204486>',
			'<:Silverliner_V_5:1446574581480689816>',
			'<:Silverliner_V_6:1446574582185070624>',
			'<:Silverliner_V_7:1446574583183310899>',
			'<:Silverliner_V_8:1446574584076964010>',
			'<:Silverliner_V_9:1446574585020682281>'
		]
	}
} as const;
