import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from './Logger';
import { EnhancedEventEmitter } from './EnhancedEventEmitter';
import { workerBin, Worker, WorkerSettings } from './Worker';
import * as utils from './utils';
import { supportedRtpCapabilities } from './supportedRtpCapabilities';
import { RtpCapabilities } from './RtpParameters';
import * as types from './types';

/**
 * Expose all types.
 */
export { types };

/**
 * Expose mediasoup version.
 */
export const { version } = JSON.parse(fs.readFileSync(
	path.join(__dirname, '..', '..', 'package.json'), { encoding: 'utf-8' }
));

/**
 * Expose parseScalabilityMode() function.
 */
export { parse as parseScalabilityMode } from './scalabilityModes';

export type ObserverEvents =
{
	newworker: [Worker];
};

const observer = new EnhancedEventEmitter<ObserverEvents>();

/**
 * Observer.
 */
export { observer };

/**
 * Full path of the mediasoup-worker binary.
 */
export { workerBin };

const logger = new Logger();

/**
 * Create a Worker.
 */
export async function createWorker<WorkerAppData extends types.AppData = types.AppData>(
	{
		logLevel = 'error',
		logTags,
		rtcMinPort = 10000,
		rtcMaxPort = 59999,
		dtlsCertificateFile,
		dtlsPrivateKeyFile,
		libwebrtcFieldTrials,
		appData
	}: WorkerSettings<WorkerAppData> = {}
): Promise<Worker<WorkerAppData>>
{
	logger.debug('createWorker()');

	if (appData && typeof appData !== 'object')
	{
		throw new TypeError('if given, appData must be an object');
	}

	const worker = new Worker<WorkerAppData>(
		{
			logLevel,
			logTags,
			rtcMinPort,
			rtcMaxPort,
			dtlsCertificateFile,
			dtlsPrivateKeyFile,
			libwebrtcFieldTrials,
			appData
		});

	return new Promise((resolve, reject) =>
	{
		worker.on('@success', () =>
		{
			// Emit observer event.
			observer.safeEmit('newworker', worker);

			resolve(worker);
		});

		worker.on('@failure', reject);
	});
}

/**
 * Get a cloned copy of the mediasoup supported RTP capabilities.
 */
export function getSupportedRtpCapabilities(): RtpCapabilities
{
	return utils.clone(supportedRtpCapabilities) as RtpCapabilities;
}
