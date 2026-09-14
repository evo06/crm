import {
	Injectable,
	Logger,
	type OnApplicationBootstrap,
	type OnApplicationShutdown,
} from "@nestjs/common";
import { AGENT_DISPATCH } from "./agent-dispatch.config";
import { AgentTriggerService } from "./agent-trigger.service";

@Injectable()
export class DispatchHeartbeatService
	implements OnApplicationBootstrap, OnApplicationShutdown
{
	private readonly logger = new Logger(DispatchHeartbeatService.name);
	private timer: ReturnType<typeof setInterval> | null = null;

	constructor(private readonly trigger: AgentTriggerService) {}

	onApplicationBootstrap(): void {
		// On Vercel, every request can bootstrap a brand-new instance of this
		// app (there is no long-lived process to keep a setInterval alive
		// between requests). Starting the heartbeat here means every cold
		// start fires a burst of outbound HTTP calls to the agent bridge —
		// and if that bridge is slow or unreachable, those calls (and their
		// retries) drag out of the request lifecycle and can stall an
		// unrelated response (e.g. sign-in) until the function times out.
		// The heartbeat’s job — periodically draining queued agent work — only
		// makes sense on a persistent server, so skip it entirely here; a
		// Vercel Cron Job hitting a dedicated endpoint is the right way to
		// replace this on serverless, not a setInterval per invocation.
		if (process.env.VERCEL) {
			this.logger.log({
				message:
					"Running on Vercel — skipping the in-process agent heartbeat. Use a Vercel Cron Job against a dedicated endpoint instead.",
			});
			return;
		}

		if (!this.trigger.canReachAgent()) {
			this.logger.log({
				message:
					
					"No agent bridge secret, so queued work waits for the agent's own schedule.",
			});
			return;
		}

		this.trigger.drainQueues();
		this.timer = setInterval(
			() => this.trigger.drainQueues(),
			AGENT_DISPATCH.heartbeat.everyMs,
		);
		this.timer.unref?.();
	}

	onApplicationShutdown(): void {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
	}
}
