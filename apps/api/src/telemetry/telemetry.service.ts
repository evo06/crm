import {
	flushTelemetry,
	onTelemetryProblem,
	shutdownTelemetry,
	syncVersion,
	telemetryDisabled,
} from "@crm/telemetry";
import {
	Injectable,
	Logger,
	type OnApplicationShutdown,
	type OnModuleInit,
} from "@nestjs/common";
import { RollupService } from "./rollup.service";

const ROLLUP_INTERVAL_MS = 60 * 60 * 1000;

@Injectable()
export class TelemetryService implements OnModuleInit, OnApplicationShutdown {
	private readonly logger = new Logger(TelemetryService.name);
	private timer: NodeJS.Timeout | null = null;

	constructor(private readonly rollup: RollupService) {}

	async onModuleInit(): Promise<void> {
		onTelemetryProblem((message) => this.logger.debug({ message }));

		if (telemetryDisabled()) {
			this.logger.log({
				message: "Anonymous usage telemetry is off for this install.",
			});
			return;
		}

		const install = await syncVersion();

		this.logger.log({
			message: "Anonymous usage telemetry is on. See docs/telemetry.md.",
			crmVersion: install?.version,
		});
		
		// The rollup fans out into dozens of concurrent queries (counts,
		// groupBys, raw SQL) across most of the schema — fine for a
		// long-lived server with a real connection pool, but on Vercel every
		// cold start would kick this off again, and those queries can end up
		// competing for the same handful of pooled Postgres connections as
		// the actual request being served (e.g. sign-in), stalling it for
		// minutes. Skip the automatic kickoff here; a Vercel Cron Job hitting
		// a dedicated endpoint is the right way to run this on a schedule
		// instead of firing it from request-handling code.
		if (process.env.VERCEL) {
			this.logger.log({
				message:
					"Running on Vercel — skipping the automatic telemetry rollup. Use a Vercel Cron Job against a dedicated endpoint instead.",
			});
			return;
		}


		void this.rollup.run().catch(() => {});

		this.timer = setInterval(() => {
			void this.rollup.run().catch(() => {});
		}, ROLLUP_INTERVAL_MS);

		this.timer.unref?.();
	}

	async onApplicationShutdown(): Promise<void> {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;

		await flushTelemetry();
		await shutdownTelemetry();
	}
}
