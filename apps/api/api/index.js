var __legacyDecorateClassTS = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1;i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __legacyDecorateParamTS = (index, decorator) => (target, key) => decorator(target, key, index);
var __legacyMetadataTS = (k, v) => {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
    return Reflect.metadata(k, v);
};

// api/index.ts
import"reflect-metadata";

// src/create-app.ts
import { API_KEY_HEADER as API_KEY_HEADER2, apiUrl, SESSION_COOKIE_NAME as SESSION_COOKIE_NAME3 } from "@crm/auth";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  ExpressAdapter
} from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppRouterHost } from "nestjs-trpc";
import {
  createOpenApiExpressMiddleware,
  generateOpenApiDocument
} from "trpc-to-openapi";

// src/app.module.ts
import { auth as auth5 } from "@crm/auth";
import { Module as Module34 } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule as BetterAuthModule } from "@thallesp/nestjs-better-auth";

// src/activities/activities.module.ts
import { Module as Module2 } from "@nestjs/common";

// src/trpc/trpc.module.ts
import { Module } from "@nestjs/common";
import { TRPCModule } from "nestjs-trpc";

// src/logging/context-logger.ts
import { inspect } from "node:util";
import {
  ConsoleLogger,
  Injectable
} from "@nestjs/common";

// src/logging/request-context.ts
import { AsyncLocalStorage } from "node:async_hooks";
var storage = new AsyncLocalStorage;
function runInRequestContext(context, fn) {
  return storage.run(context, fn);
}
function getRequestContext() {
  return storage.getStore();
}
function setRequestUserId(userId) {
  const context = storage.getStore();
  if (context) {
    context.userId = userId;
  }
}

// src/logging/context-logger.ts
var PRODUCTION_LEVELS = ["fatal", "error", "warn", "log"];
var DEVELOPMENT_LEVELS = [
  "fatal",
  "error",
  "warn",
  "log",
  "debug",
  "verbose"
];
function consoleLoggerOptions() {
  const isProduction = false;
  return {
    json: isProduction,
    colors: !isProduction,
    timestamp: !isProduction,
    logLevels: isProduction ? PRODUCTION_LEVELS : DEVELOPMENT_LEVELS
  };
}

class ContextLogger extends ConsoleLogger {
  constructor() {
    super(consoleLoggerOptions());
  }
  getJsonLogObject(message, options) {
    const base = super.getJsonLogObject(message, options);
    const request = getRequestContext();
    const record = isStructuredMessage(message) ? { ...withoutMessage(message), ...base, message: message.message } : base;
    if (!request) {
      return record;
    }
    const correlated = {
      ...record,
      requestId: request.requestId
    };
    if (!request.userId) {
      return correlated;
    }
    return { ...correlated, userId: request.userId };
  }
  stringifyMessage(message, logLevel) {
    if (!isStructuredMessage(message)) {
      return super.stringifyMessage(message, logLevel);
    }
    const fields = withoutMessage(message);
    const text = this.colorize(message.message, logLevel);
    return Object.keys(fields).length === 0 ? text : `${text} ${inspect(fields, this.inspectOptions)}`;
  }
  formatContext(context) {
    const request = getRequestContext();
    if (!context || !request) {
      return super.formatContext(context);
    }
    return super.formatContext(`${context} ${shortId(request.requestId)}`);
  }
}
ContextLogger = __legacyDecorateClassTS([
  Injectable(),
  __legacyMetadataTS("design:paramtypes", [])
], ContextLogger);
function shortId(requestId) {
  return requestId.slice(0, 8);
}
function isStructuredMessage(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return (prototype === Object.prototype || prototype === null) && typeof value.message === "string";
}
function withoutMessage(value) {
  const { message: _message, ...fields } = value;
  return fields;
}

// src/trpc/error-formatter.ts
import { z as z2 } from "zod";
var issueShape = z2.object({
  message: z2.string().catch(""),
  path: z2.array(z2.unknown()).catch([])
}).catch({ message: "", path: [] });
var pathSegment = z2.string().nullable().catch(null);
var failedParse = z2.object({ issues: z2.array(issueShape).min(1) }).nullable().catch(null);
function issuesIn(cause) {
  return failedParse.parse(cause)?.issues ?? null;
}
function sentence(issue) {
  const message = issue.message.trim();
  if (message === "")
    return null;
  if (/[.!?]$/.test(message))
    return message;
  const field = issue.path.flatMap((part) => {
    const segment = pathSegment.parse(part);
    return segment === null ? [] : [segment];
  }).at(-1);
  return field ? `${field}: ${message}` : message;
}
function readableInputError(message, cause) {
  const issues = issuesIn(cause);
  if (!issues)
    return null;
  const sentences = [...new Set(issues.map(sentence).filter(Boolean))];
  return sentences.length > 0 ? sentences.join(" ") : message;
}
var formatTrpcError = ({ shape, error }) => {
  const readable = readableInputError(shape.message, error.cause);
  return readable ? { ...shape, message: readable } : shape;
};

// src/trpc/middlewares/auth.middleware.ts
import { Injectable as Injectable2 } from "@nestjs/common";
import { TRPCError } from "@trpc/server";
class AuthMiddleware {
  async use(opts) {
    const ctx = opts.ctx;
    const user = ctx.session?.user;
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    setRequestUserId(user.id);
    const nextCtx = { ...ctx, user };
    return opts.next({ ctx: nextCtx });
  }
}
AuthMiddleware = __legacyDecorateClassTS([
  Injectable2()
], AuthMiddleware);

// src/trpc/middlewares/domain-error.middleware.ts
import { HttpException, Injectable as Injectable3 } from "@nestjs/common";
import { TRPCError as TRPCError2 } from "@trpc/server";
function statusToTrpcCode(status) {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 429:
      return "TOO_MANY_REQUESTS";
    default:
      return "INTERNAL_SERVER_ERROR";
  }
}

class DomainErrorMiddleware {
  async use(opts) {
    const result = await opts.next();
    if (result.ok) {
      return result;
    }
    const failure = result;
    const cause = failure.error?.cause;
    if (cause instanceof HttpException) {
      throw new TRPCError2({
        code: statusToTrpcCode(cause.getStatus()),
        message: cause.message
      });
    }
    return result;
  }
}
DomainErrorMiddleware = __legacyDecorateClassTS([
  Injectable3()
], DomainErrorMiddleware);

// src/trpc/middlewares/logging.middleware.ts
import { Injectable as Injectable4, Logger } from "@nestjs/common";
class LoggingMiddleware {
  logger = new Logger("tRPC");
  async use(opts) {
    const startedAt = Date.now();
    const result = await opts.next();
    const durationMs = Date.now() - startedAt;
    this.logger.log({
      message: `${opts.type} ${opts.path} ${result.ok ? "ok" : "err"} ${durationMs}ms`,
      type: opts.type,
      path: opts.path,
      outcome: result.ok ? "ok" : "err",
      durationMs
    });
    return result;
  }
}
LoggingMiddleware = __legacyDecorateClassTS([
  Injectable4()
], LoggingMiddleware);

// src/trpc/middlewares/session-only.middleware.ts
import { API_KEY_HEADER } from "@crm/auth";
import { Injectable as Injectable5 } from "@nestjs/common";
import { TRPCError as TRPCError3 } from "@trpc/server";
class SessionOnlyMiddleware {
  async use(opts) {
    const ctx = opts.ctx;
    if (ctx.req?.headers[API_KEY_HEADER]) {
      throw new TRPCError3({ code: "UNAUTHORIZED" });
    }
    return opts.next();
  }
}
SessionOnlyMiddleware = __legacyDecorateClassTS([
  Injectable5()
], SessionOnlyMiddleware);

// src/trpc/trpc.context.ts
import { auth } from "@crm/auth";
import { Injectable as Injectable6 } from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
async function createBaseTrpcContext(req) {
  const session = req ? await auth.api.getSession({ headers: fromNodeHeaders(req.headers) }).catch(() => null) : null;
  return { req, session };
}

class TrpcContext {
  async create(opts) {
    const req = "req" in opts ? opts.req : undefined;
    return createBaseTrpcContext(req);
  }
}
TrpcContext = __legacyDecorateClassTS([
  Injectable6()
], TrpcContext);

// src/trpc/trpc-error.handler.ts
import { apiError } from "@crm/telemetry";
import { Injectable as Injectable7, Logger as Logger2 } from "@nestjs/common";
class TrpcErrorHandler {
  logger = new Logger2("tRPC");
  onError(opts) {
    const { error, type, path } = opts;
    const message = `${type} ${path ?? "<unknown>"} ${error.code}`;
    if (error.code === "INTERNAL_SERVER_ERROR") {
      this.logger.error({ message, type, path, code: error.code }, error.stack ?? String(error.cause ?? error));
      apiError({
        error: error.cause ?? error,
        route: path ? `/trpc/${path}` : null,
        status: 500
      });
      return;
    }
    this.logger.warn({ message, type, path, code: error.code });
  }
}
TrpcErrorHandler = __legacyDecorateClassTS([
  Injectable7()
], TrpcErrorHandler);

// src/trpc/trpc.module.ts
class TrpcModule {
}
TrpcModule = __legacyDecorateClassTS([
  Module({
    imports: [
      TRPCModule.forRoot({
        basePath: "/api/trpc",
        context: TrpcContext,
        logger: new ContextLogger,
        errorFormatter: formatTrpcError,
        onError: TrpcErrorHandler,
        globalMiddlewares: [LoggingMiddleware, DomainErrorMiddleware]
      })
    ],
    providers: [
      TrpcContext,
      TrpcErrorHandler,
      LoggingMiddleware,
      DomainErrorMiddleware,
      AuthMiddleware,
      SessionOnlyMiddleware
    ],
    exports: [AuthMiddleware, SessionOnlyMiddleware]
  })
], TrpcModule);

// src/activities/activities.router.ts
import { Inject as Inject2 } from "@nestjs/common";
import {
  Ctx,
  Input,
  Mutation,
  Query,
  Router,
  UseMiddlewares
} from "nestjs-trpc";

// src/trpc/openapi.ts
var REST_BRIDGE_PATH = "/rest";
function restMeta(method, path, tags, options = {}) {
  return {
    openapi: {
      method,
      path,
      tags,
      protect: options.protect ?? true
    }
  };
}

// src/activities/activities.contracts.ts
import { ActivityType } from "@crm/db";
import { activityMeta } from "@crm/validation/activity-meta";
import { z as z3 } from "zod";
var COMPOSABLE_TYPES = [
  ActivityType.NOTE,
  ActivityType.CALL,
  ActivityType.EMAIL,
  ActivityType.MEETING,
  ActivityType.TASK
];
var composableEnum = z3.enum(COMPOSABLE_TYPES);
var ALL_ACTIVITY_TYPES = [
  ActivityType.NOTE,
  ActivityType.CALL,
  ActivityType.EMAIL,
  ActivityType.MEETING,
  ActivityType.TASK,
  ActivityType.STAGE_CHANGE,
  ActivityType.ENRICHMENT
];
var activityTypeOutput = z3.enum(ALL_ACTIVITY_TYPES);
var TIMELINE_FILTERS = [
  "all",
  "history",
  "notes",
  "upcoming",
  "done",
  "email",
  "meetings"
];
var timelineInput = z3.object({
  companyId: z3.string().optional(),
  contactId: z3.string().optional(),
  dealId: z3.string().optional(),
  filter: z3.enum(TIMELINE_FILTERS).default("all"),
  cursor: z3.string().optional(),
  limit: z3.number().int().min(1).max(100).default(30)
});
var timelineCountsInput = z3.object({
  companyId: z3.string().optional(),
  contactId: z3.string().optional(),
  dealId: z3.string().optional()
});
var activityCreateInput = z3.object({
  type: composableEnum,
  subject: z3.string().trim().optional(),
  body: z3.string().trim().optional(),
  occurredAt: z3.string().optional(),
  dueAt: z3.string().nullable().optional(),
  companyId: z3.string().optional(),
  contactId: z3.string().optional(),
  dealId: z3.string().optional()
}).refine((input) => input.companyId || input.contactId || input.dealId, {
  message: "An activity has to be about a company, a contact or a deal."
}).refine((input) => input.type !== ActivityType.TASK || Boolean(input.subject), {
  message: "A task needs a subject — it is the thing to do.",
  path: ["subject"]
});
var completeInput = z3.object({
  id: z3.string(),
  completed: z3.boolean().default(true)
});
var myTasksInput = z3.object({
  window: z3.enum(["overdue", "upcoming", "all"]).default("all"),
  limit: z3.number().int().min(1).max(100).default(25)
});
var activityAuthorOutput = z3.object({
  id: z3.string(),
  name: z3.string(),
  email: z3.string(),
  image: z3.string().nullable()
});
var activityCompanyRefOutput = z3.object({
  id: z3.string(),
  name: z3.string()
}).nullable();
var activityContactRefOutput = z3.object({
  id: z3.string(),
  firstName: z3.string(),
  lastName: z3.string().nullable()
}).nullable();
var activityDealRefOutput = z3.object({
  id: z3.string(),
  name: z3.string()
}).nullable();
var activityEmailThreadOutput = z3.object({
  id: z3.string(),
  messageCount: z3.number(),
  lastMessageAt: z3.string()
}).nullable();
var activityCalendarEventOutput = z3.object({
  id: z3.string(),
  startsAt: z3.string(),
  endsAt: z3.string(),
  isAllDay: z3.boolean(),
  location: z3.string().nullable(),
  conferenceUrl: z3.string().nullable(),
  attendeeCount: z3.number()
}).nullable();
var activityEntryOutput = z3.object({
  id: z3.string(),
  type: activityTypeOutput,
  subject: z3.string().nullable(),
  body: z3.string().nullable(),
  occurredAt: z3.string().nullable(),
  dueAt: z3.string().nullable(),
  completedAt: z3.string().nullable(),
  meta: activityMeta,
  createdAt: z3.string(),
  createdBy: activityAuthorOutput,
  company: activityCompanyRefOutput,
  contact: activityContactRefOutput,
  deal: activityDealRefOutput,
  emailThread: activityEmailThreadOutput,
  calendarEvent: activityCalendarEventOutput
});
var timelineOutput = z3.object({
  entries: z3.array(activityEntryOutput),
  nextCursor: z3.string().nullable()
});
var timelineCountsOutput = z3.object({
  all: z3.number(),
  notes: z3.number(),
  upcoming: z3.number(),
  done: z3.number(),
  email: z3.number(),
  meetings: z3.number()
});
var myTasksOutput = z3.array(activityEntryOutput);
var activityCreateOutput = activityEntryOutput;
var completeOutput = activityEntryOutput;

// src/activities/activities.service.ts
import { ActivityType as ActivityType2 } from "@crm/db";
import { activityMeta as activityMeta2 } from "@crm/validation/activity-meta";
import {
  BadRequestException,
  Injectable as Injectable9,
  Logger as Logger4,
  NotFoundException
} from "@nestjs/common";

// src/crm/activity-stamp.service.ts
import { Prisma as PrismaNamespace } from "@crm/db";
import { Injectable as Injectable8, Logger as Logger3 } from "@nestjs/common";

// src/database/database.constants.ts
import { Inject } from "@nestjs/common";
var DATABASE = Symbol("DATABASE");
var InjectDatabase = () => Inject(DATABASE);

// src/crm/activity-stamp.service.ts
function present(ids) {
  return ids.filter((id) => id !== null);
}

class ActivityStampService {
  db;
  logger = new Logger3(ActivityStampService.name);
  constructor(db) {
    this.db = db;
  }
  async touch(target, at) {
    const stale = {
      OR: [{ lastActivityAt: null }, { lastActivityAt: { lt: at } }]
    };
    await Promise.all([
      target.companyId ? this.db.company.updateMany({
        where: { id: target.companyId, ...stale },
        data: { lastActivityAt: at }
      }) : null,
      target.contactId ? this.db.contact.updateMany({
        where: { id: target.contactId, ...stale },
        data: { lastActivityAt: at }
      }) : null,
      target.dealId ? this.db.deal.updateMany({
        where: { id: target.dealId, ...stale },
        data: { lastActivityAt: at }
      }) : null
    ]);
  }
  async recompute(target) {
    if (target.companyId) {
      const { _max } = await this.db.activity.aggregate({
        where: { companyId: target.companyId },
        _max: { createdAt: true }
      });
      await this.db.company.update({
        where: { id: target.companyId },
        data: { lastActivityAt: _max.createdAt }
      });
    }
    if (target.contactId) {
      const { _max } = await this.db.activity.aggregate({
        where: { contactId: target.contactId },
        _max: { createdAt: true }
      });
      await this.db.contact.update({
        where: { id: target.contactId },
        data: { lastActivityAt: _max.createdAt }
      });
    }
    if (target.dealId) {
      const { _max } = await this.db.activity.aggregate({
        where: { dealId: target.dealId },
        _max: { createdAt: true }
      });
      await this.db.deal.update({
        where: { id: target.dealId },
        data: { lastActivityAt: _max.createdAt }
      });
    }
  }
  async targetsOf(where, client = this.db) {
    const [companies, contacts, deals] = await Promise.all([
      client.activity.groupBy({ by: ["companyId"], where }),
      client.activity.groupBy({ by: ["contactId"], where }),
      client.activity.groupBy({ by: ["dealId"], where })
    ]);
    return {
      companyIds: present(companies.map((row) => row.companyId)),
      contactIds: present(contacts.map((row) => row.contactId)),
      dealIds: present(deals.map((row) => row.dealId))
    };
  }
  async recomputeMany(targets) {
    const statements = [
      this.restamp("company", "companyId", targets.companyIds),
      this.restamp("contact", "contactId", targets.contactIds),
      this.restamp("deal", "dealId", targets.dealIds)
    ].filter((statement) => statement !== null);
    if (statements.length === 0)
      return;
    await this.db.$transaction(statements);
  }
  async recomputeAfterDelete(targets, deleted) {
    try {
      await this.recomputeMany(targets);
    } catch (error) {
      this.logger.error({
        message: "A record was deleted but its activity stamps were not recomputed",
        ...deleted
      }, error instanceof Error ? error.stack : String(error));
    }
  }
  restamp(table, column, ids) {
    if (ids.length === 0)
      return null;
    const record = PrismaNamespace.raw(`"${table}"`);
    const key = PrismaNamespace.raw(`"${column}"`);
    return this.db.$executeRaw`
			UPDATE ${record} r
			SET "lastActivityAt" = (
				SELECT MAX(a."createdAt") FROM "activity" a WHERE a.${key} = r.id
			)
			WHERE r.id IN (${PrismaNamespace.join(ids)})`;
  }
  async recomputeAll() {
    await this.db.$transaction([
      this.db.$executeRaw`
				UPDATE "company" c
				SET "lastActivityAt" = a.max
				FROM (
					SELECT "companyId" AS id, MAX("createdAt") AS max
					FROM "activity" WHERE "companyId" IS NOT NULL GROUP BY "companyId"
				) a
				WHERE c.id = a.id AND c."lastActivityAt" IS DISTINCT FROM a.max`,
      this.db.$executeRaw`
				UPDATE "company" SET "lastActivityAt" = NULL
				WHERE "lastActivityAt" IS NOT NULL
				AND id NOT IN (SELECT "companyId" FROM "activity" WHERE "companyId" IS NOT NULL)`,
      this.db.$executeRaw`
				UPDATE "contact" c
				SET "lastActivityAt" = a.max
				FROM (
					SELECT "contactId" AS id, MAX("createdAt") AS max
					FROM "activity" WHERE "contactId" IS NOT NULL GROUP BY "contactId"
				) a
				WHERE c.id = a.id AND c."lastActivityAt" IS DISTINCT FROM a.max`,
      this.db.$executeRaw`
				UPDATE "contact" SET "lastActivityAt" = NULL
				WHERE "lastActivityAt" IS NOT NULL
				AND id NOT IN (SELECT "contactId" FROM "activity" WHERE "contactId" IS NOT NULL)`,
      this.db.$executeRaw`
				UPDATE "deal" d
				SET "lastActivityAt" = a.max
				FROM (
					SELECT "dealId" AS id, MAX("createdAt") AS max
					FROM "activity" WHERE "dealId" IS NOT NULL GROUP BY "dealId"
				) a
				WHERE d.id = a.id AND d."lastActivityAt" IS DISTINCT FROM a.max`,
      this.db.$executeRaw`
				UPDATE "deal" SET "lastActivityAt" = NULL
				WHERE "lastActivityAt" IS NOT NULL
				AND id NOT IN (SELECT "dealId" FROM "activity" WHERE "dealId" IS NOT NULL)`
    ]);
  }
}
ActivityStampService = __legacyDecorateClassTS([
  Injectable8(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], ActivityStampService);

// src/crm/values.ts
import { Prisma as PrismaNamespace2 } from "@crm/db";
function toCents(amount) {
  return amount === null ? null : amount.times(100).toNumber();
}
function fromCents(cents) {
  return cents === null || cents === undefined ? null : cents / 100;
}
function decimalFromCents(cents) {
  return cents === null || cents === undefined ? null : new PrismaNamespace2.Decimal(cents).dividedBy(100);
}
function blankToNull(value) {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
function normalizeEmail(value) {
  return blankToNull(value)?.toLowerCase() ?? null;
}

// src/activities/activities.service.ts
var AUTHOR_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true
};
var ENTRY_SELECT = {
  id: true,
  type: true,
  subject: true,
  body: true,
  occurredAt: true,
  dueAt: true,
  completedAt: true,
  meta: true,
  createdAt: true,
  createdBy: { select: AUTHOR_SELECT },
  company: { select: { id: true, name: true } },
  contact: { select: { id: true, firstName: true, lastName: true } },
  deal: { select: { id: true, name: true } },
  emailThread: {
    select: {
      id: true,
      messageCount: true,
      lastMessageAt: true
    }
  },
  calendarEvent: {
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      isAllDay: true,
      location: true,
      conferenceUrl: true,
      _count: { select: { attendees: true } }
    }
  }
};
var NOTE_TYPES = [
  ActivityType2.NOTE,
  ActivityType2.CALL,
  ActivityType2.EMAIL,
  ActivityType2.MEETING
];

class ActivitiesService {
  db;
  stamp;
  logger = new Logger4(ActivitiesService.name);
  constructor(db, stamp) {
    this.db = db;
    this.stamp = stamp;
  }
  async timeline(input) {
    const where = this.anchor(input);
    Object.assign(where, filterClause(input.filter));
    const rows = await this.db.activity.findMany({
      where,
      take: input.limit + 1,
      cursor: input.cursor ? { id: input.cursor } : undefined,
      skip: input.cursor ? 1 : undefined,
      orderBy: [
        { occurredAt: { sort: "desc", nulls: "last" } },
        { id: "desc" }
      ],
      select: ENTRY_SELECT
    });
    const hasMore = rows.length > input.limit;
    const entries = hasMore ? rows.slice(0, input.limit) : rows;
    return {
      entries: entries.map(serializeEntry),
      nextCursor: hasMore ? entries[entries.length - 1]?.id ?? null : null
    };
  }
  async timelineCounts(input) {
    const anchor = this.anchor(input);
    const [all, notes, upcoming, done, email, meetings] = await Promise.all([
      this.db.activity.count({ where: anchor }),
      this.db.activity.count({
        where: { ...anchor, ...filterClause("notes") }
      }),
      this.db.activity.count({
        where: { ...anchor, ...filterClause("upcoming") }
      }),
      this.db.activity.count({ where: { ...anchor, ...filterClause("done") } }),
      this.db.activity.count({
        where: { ...anchor, ...filterClause("email") }
      }),
      this.db.activity.count({
        where: { ...anchor, ...filterClause("meetings") }
      })
    ]);
    return { all, notes, upcoming, done, email, meetings };
  }
  async create(input, actingUserId) {
    const companyId = await this.resolveCompanyId(input);
    const isTask = input.type === ActivityType2.TASK;
    const activity = await this.db.activity.create({
      data: {
        type: input.type,
        subject: blankToNull(input.subject ?? ""),
        body: blankToNull(input.body ?? ""),
        occurredAt: parseDate(input.occurredAt) ?? new Date,
        dueAt: isTask ? parseDate(input.dueAt) : null,
        companyId,
        contactId: input.contactId ?? null,
        dealId: input.dealId ?? null,
        createdById: actingUserId
      },
      select: ENTRY_SELECT
    });
    await this.stamp.touch({ companyId, contactId: input.contactId, dealId: input.dealId }, activity.createdAt);
    this.logger.log({
      message: "Activity logged",
      activityId: activity.id,
      type: activity.type
    });
    return serializeEntry(activity);
  }
  async complete(id, completed) {
    const activity = await this.db.activity.findUnique({
      where: { id },
      select: { type: true }
    });
    if (!activity) {
      throw new NotFoundException(`No activity with id ${id}.`);
    }
    if (activity.type !== ActivityType2.TASK) {
      throw new BadRequestException("Only tasks can be completed.");
    }
    const updated = await this.db.activity.update({
      where: { id },
      data: { completedAt: completed ? new Date : null },
      select: ENTRY_SELECT
    });
    return serializeEntry(updated);
  }
  async myTasks(input, actingUserId) {
    const now = new Date;
    const where = {
      type: ActivityType2.TASK,
      completedAt: null,
      createdById: actingUserId
    };
    if (input.window === "overdue")
      where.dueAt = { lt: now };
    if (input.window === "upcoming")
      where.dueAt = { gte: now };
    const tasks = await this.db.activity.findMany({
      where,
      take: input.limit,
      orderBy: [
        { dueAt: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" }
      ],
      select: ENTRY_SELECT
    });
    return tasks.map(serializeEntry);
  }
  anchor(input) {
    if (input.dealId)
      return { dealId: input.dealId };
    if (input.contactId)
      return { contactId: input.contactId };
    if (input.companyId)
      return { companyId: input.companyId };
    throw new BadRequestException("A timeline needs a company, a contact or a deal.");
  }
  async resolveCompanyId(input) {
    if (input.companyId)
      return input.companyId;
    if (input.dealId) {
      const deal = await this.db.deal.findUnique({
        where: { id: input.dealId },
        select: { companyId: true }
      });
      if (!deal) {
        throw new NotFoundException(`No deal with id ${input.dealId}.`);
      }
      return deal.companyId;
    }
    if (input.contactId) {
      const contact = await this.db.contact.findUnique({
        where: { id: input.contactId },
        select: { companyId: true }
      });
      if (!contact) {
        throw new NotFoundException(`No contact with id ${input.contactId}.`);
      }
      return contact.companyId;
    }
    return null;
  }
}
ActivitiesService = __legacyDecorateClassTS([
  Injectable9(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof ActivityStampService === "undefined" ? Object : ActivityStampService
  ])
], ActivitiesService);
function filterClause(filter) {
  switch (filter) {
    case "notes":
      return { type: { in: NOTE_TYPES } };
    case "upcoming":
      return { type: ActivityType2.TASK, completedAt: null };
    case "done":
      return { type: ActivityType2.TASK, completedAt: { not: null } };
    case "history":
      return { NOT: { type: ActivityType2.TASK, completedAt: null } };
    case "email":
      return { type: ActivityType2.EMAIL };
    case "meetings":
      return { type: ActivityType2.MEETING };
    case "all":
      return {};
  }
}
function serializeEntry(entry) {
  return {
    ...entry,
    occurredAt: entry.occurredAt?.toISOString() ?? null,
    dueAt: entry.dueAt?.toISOString() ?? null,
    completedAt: entry.completedAt?.toISOString() ?? null,
    createdAt: entry.createdAt.toISOString(),
    meta: activityMeta2.parse(entry.meta),
    emailThread: entry.emailThread ? {
      id: entry.emailThread.id,
      messageCount: entry.emailThread.messageCount,
      lastMessageAt: entry.emailThread.lastMessageAt.toISOString()
    } : null,
    calendarEvent: entry.calendarEvent ? {
      id: entry.calendarEvent.id,
      startsAt: entry.calendarEvent.startsAt.toISOString(),
      endsAt: entry.calendarEvent.endsAt.toISOString(),
      isAllDay: entry.calendarEvent.isAllDay,
      location: entry.calendarEvent.location,
      conferenceUrl: entry.calendarEvent.conferenceUrl,
      attendeeCount: entry.calendarEvent._count.attendees
    } : null
  };
}
function parseDate(value) {
  if (value === null || value === undefined || value === "")
    return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`"${value}" is not a date.`);
  }
  return date;
}

// src/activities/activities.router.ts
class ActivitiesRouter {
  activities;
  constructor(activities) {
    this.activities = activities;
  }
  async timeline(input) {
    return this.activities.timeline(input);
  }
  async timelineCounts(input) {
    return this.activities.timelineCounts(input);
  }
  async myTasks(ctx, input) {
    return this.activities.myTasks(input, ctx.user.id);
  }
  async create(ctx, input) {
    return this.activities.create(input, ctx.user.id);
  }
  async complete(input) {
    return this.activities.complete(input.id, input.completed);
  }
}
__legacyDecorateClassTS([
  Query({
    input: timelineInput,
    output: timelineOutput,
    meta: restMeta("GET", "/activities", ["Activities"])
  }),
  __legacyDecorateParamTS(0, Input()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ActivitiesRouter.prototype, "timeline", null);
__legacyDecorateClassTS([
  Query({
    input: timelineCountsInput,
    output: timelineCountsOutput,
    meta: restMeta("GET", "/activities/counts", ["Activities"])
  }),
  __legacyDecorateParamTS(0, Input()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ActivitiesRouter.prototype, "timelineCounts", null);
__legacyDecorateClassTS([
  Query({
    input: myTasksInput,
    output: myTasksOutput,
    meta: restMeta("GET", "/activities/my-tasks", ["Activities"])
  }),
  __legacyDecorateParamTS(0, Ctx()),
  __legacyDecorateParamTS(1, Input()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ActivitiesRouter.prototype, "myTasks", null);
__legacyDecorateClassTS([
  Mutation({
    input: activityCreateInput,
    output: activityCreateOutput,
    meta: restMeta("POST", "/activities", ["Activities"])
  }),
  __legacyDecorateParamTS(0, Ctx()),
  __legacyDecorateParamTS(1, Input()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ActivitiesRouter.prototype, "create", null);
__legacyDecorateClassTS([
  Mutation({
    input: completeInput,
    output: completeOutput,
    meta: restMeta("PATCH", "/activities/{id}/complete", ["Activities"])
  }),
  __legacyDecorateParamTS(0, Input()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ActivitiesRouter.prototype, "complete", null);
ActivitiesRouter = __legacyDecorateClassTS([
  Router({ alias: "activities" }),
  UseMiddlewares(AuthMiddleware),
  __legacyDecorateParamTS(0, Inject2(ActivitiesService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof ActivitiesService === "undefined" ? Object : ActivitiesService
  ])
], ActivitiesRouter);

// src/activities/activities.module.ts
class ActivitiesModule {
}
ActivitiesModule = __legacyDecorateClassTS([
  Module2({
    imports: [TrpcModule],
    providers: [ActivitiesService, ActivitiesRouter],
    exports: [ActivitiesService]
  })
], ActivitiesModule);

// src/agent/agent.module.ts
import { Module as Module3 } from "@nestjs/common";

// src/agent/agent-access.service.ts
import {
  isWorkspaceAdmin,
  toWorkspaceRole,
  WORKSPACE_ID,
  workspaceRoleOf
} from "@crm/auth";
import {
  ForbiddenException,
  Injectable as Injectable10,
  NotFoundException as NotFoundException2
} from "@nestjs/common";

// src/agent/agent-visibility.ts
var TEAM_AGENT_STATUSES = ["LIVE", "PAUSED", "ARCHIVED"];
function isPrivateAgentDraft(status) {
  return status === "DRAFT" || status === "DEPLOYING";
}
function canReadAgent(status, createdById, userId) {
  return !isPrivateAgentDraft(status) || createdById === userId;
}

// src/agent/agent-access.service.ts
class AgentAccessService {
  db;
  constructor(db) {
    this.db = db;
  }
  async assertMember(userId) {
    const role = await workspaceRoleOf(userId);
    if (!role) {
      throw new ForbiddenException("You are not a member of this workspace.");
    }
    return role;
  }
  async assertCanManageInTransaction(tx, agentId, userId) {
    const [member] = await tx.$queryRaw`
			SELECT role
			FROM "member"
			WHERE "organizationId" = ${WORKSPACE_ID}
				AND "userId" = ${userId}
			FOR SHARE
		`;
    if (!member) {
      throw new ForbiddenException("You are not a member of this workspace.");
    }
    const role = toWorkspaceRole(member.role);
    const agent = await tx.agentDefinition.findFirst({
      where: { id: agentId, status: { not: "DELETED" } },
      select: {
        id: true,
        createdById: true,
        status: true,
        name: true,
        description: true
      }
    });
    if (!agent) {
      throw new NotFoundException2(`No agent with id ${agentId}.`);
    }
    if (isPrivateAgentDraft(agent.status) && agent.createdById !== userId) {
      throw new NotFoundException2(`No agent with id ${agentId}.`);
    }
    if (agent.createdById !== userId && !isWorkspaceAdmin(role)) {
      throw new ForbiddenException("Only the creator or a workspace admin can change this agent.");
    }
    return agent;
  }
  async assertCanRead(agentId, userId) {
    const role = await this.assertMember(userId);
    const agent = await this.db.agentDefinition.findFirst({
      where: { id: agentId, status: { not: "DELETED" } },
      select: {
        id: true,
        createdById: true,
        status: true,
        currentVersionId: true
      }
    });
    if (!agent || !canReadAgent(agent.status, agent.createdById, userId)) {
      throw new NotFoundException2(`No agent with id ${agentId}.`);
    }
    return {
      ...agent,
      role,
      canManage: agent.createdById === userId || isWorkspaceAdmin(role)
    };
  }
}
AgentAccessService = __legacyDecorateClassTS([
  Injectable10(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], AgentAccessService);

// src/agent/agent-definitions.service.ts
import { schemas as schemas2 } from "@crm/validation";
import { readAgentManifestSummary } from "@crm/validation/agent-manifest";
import {
  BadRequestException as BadRequestException2,
  Injectable as Injectable12,
  NotFoundException as NotFoundException3
} from "@nestjs/common";
import { z as z5 } from "zod";

// src/agent/agent-trigger.service.ts
import { PRIORITY } from "@crm/db/agent-tasks";
import { RECORD_ID_COLUMNS } from "@crm/db/fields";
import { lockIdempotencyKey } from "@crm/db/idempotency";
import { fieldBackfillPayload } from "@crm/validation/field-backfill";
import { Injectable as Injectable11, Logger as Logger5 } from "@nestjs/common";

// src/agent/agent-dispatch.config.ts
var SECOND_MS = 1000;
var MINUTE_MS = 60 * SECOND_MS;
var AGENT_DISPATCH = {
  poke: { timeoutMs: 2 * SECOND_MS },
  heartbeat: { everyMs: MINUTE_MS },
  cancel: {
    errorCode: "CANCELLED_BY_USER",
    message: "A workspace member stopped this run.",
    redeliverWithinMs: 10 * MINUTE_MS,
    redeliverBatch: 20
  },
  fieldBackfill: { concurrency: 8 }
};

// src/agent/bridge.ts
var DEFAULT_AGENT_URL = "http://127.0.0.1:2000";
function bridge() {
  const secret = process.env.AGENT_BRIDGE_SECRET?.trim();
  if (!secret)
    return null;
  const base = process.env.AGENT_URL?.trim() || DEFAULT_AGENT_URL;
  return { url: (path) => new URL(path, base), secret };
}

// src/agent/agent-trigger.service.ts
async function runWithConcurrency(items, concurrency, run) {
  const queue = items[Symbol.iterator]();
  const width = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: width }, async () => {
    for (const item of queue)
      await run(item);
  }));
}

class AgentTriggerService {
  db;
  logger = new Logger5(AgentTriggerService.name);
  cancellationsDelivered = new Set;
  constructor(db) {
    this.db = db;
  }
  async companyCreated(companyId, reason = "New company") {
    await this.enqueue({
      companyId,
      kind: "brand",
      reason,
      priority: PRIORITY.brand,
      budget: 2
    });
    await this.enqueue({
      companyId,
      kind: "company-profile",
      reason,
      priority: PRIORITY.companyProfile,
      budget: 4
    });
  }
  async companyRequested(companyId, reason) {
    const brand = await this.enqueue({
      companyId,
      kind: "brand",
      reason,
      priority: PRIORITY.brand,
      budget: 2
    }, true);
    const profile = await this.enqueue({
      companyId,
      kind: "company-profile",
      reason,
      priority: PRIORITY.requested,
      budget: 8
    }, true);
    return brand || profile;
  }
  async workspaceChanged(website, reason) {
    await this.enqueue({
      kind: "workspace-profile",
      reason: `${reason} (${website})`,
      priority: PRIORITY.workspace,
      budget: 4
    });
  }
  async contactCreated(contactId, reason, required = false) {
    return this.enqueue({
      contactId,
      kind: "identify",
      reason,
      priority: PRIORITY.identify,
      budget: 4
    }, required);
  }
  async slackPeopleRequested(reason, required = false) {
    await this.enqueue({
      kind: "slack-people-match",
      reason,
      priority: PRIORITY.slackPeople,
      budget: 1
    }, required);
  }
  async slackChannelJoinRequested(channelId, channelName) {
    await this.queueSlackChannelJoin(channelId, channelName);
  }
  async withTasks(work) {
    let queued = false;
    const result = await this.db.$transaction((tx) => work(tx, {
      slackChannelJoinRequested: async (channelId, channelName) => {
        const created = await this.queueSlackChannelJoin(channelId, channelName, tx);
        queued = queued || created;
      }
    }));
    if (queued)
      this.poke();
    return result;
  }
  queueSlackChannelJoin(channelId, channelName, client) {
    return this.enqueue({
      kind: "slack-channel-join",
      reason: `Add Comp AI to #${channelName}`,
      priority: PRIORITY.slackJoin,
      budget: 1,
      subject: { path: ["channelId"], value: channelId },
      payload: {
        type: "slack.channel.join",
        channelId,
        channelName
      }
    }, true, client);
  }
  async withCrmEvents(work) {
    const queued = [];
    const result = await this.db.$transaction((tx) => work(tx, async (input) => {
      await this.createEventTask(tx, input);
      queued.push(input);
    }));
    for (const input of queued) {
      this.logger.log({
        message: "Agent event queued",
        type: input.type,
        recordKind: input.record.kind,
        recordId: input.record.id
      });
    }
    if (queued.length > 0)
      this.poke();
    return result;
  }
  async fieldBackfillRecords(entity, keys, ids, reason) {
    if (ids.length === 0 || keys.length === 0) {
      return { queued: 0, merged: 0 };
    }
    const column = RECORD_ID_COLUMNS[entity];
    let queued = 0;
    let merged = 0;
    const queueOne = async (id) => {
      try {
        const outcome = await this.db.$transaction(async (tx) => {
          await lockIdempotencyKey(tx, `agent-task:field-backfill:${entity}:${id}`);
          const pending = await tx.agentTask.findFirst({
            where: {
              kind: "field-backfill",
              finishedAt: null,
              [column]: id
            },
            select: { id: true, payload: true }
          });
          if (!pending) {
            await tx.agentTask.create({
              data: {
                [column]: id,
                kind: "field-backfill",
                reason,
                priority: PRIORITY.fieldBackfill,
                budget: 8,
                dueAt: new Date,
                payload: { entity, keys }
              }
            });
            return "queued";
          }
          const parsed = fieldBackfillPayload.safeParse(pending.payload);
          const priorKeys = parsed.success ? parsed.data.keys : [];
          const nextKeys = [...new Set([...priorKeys, ...keys])];
          if (nextKeys.length === priorKeys.length)
            return "unchanged";
          await tx.agentTask.update({
            where: { id: pending.id },
            data: {
              payload: {
                entity,
                keys: nextKeys
              }
            }
          });
          return "merged";
        });
        if (outcome === "queued")
          queued += 1;
        if (outcome === "merged")
          merged += 1;
      } catch (error) {
        this.logger.error({
          message: "Could not queue agent task",
          kind: "field-backfill",
          entity,
          keys,
          recordId: id
        }, error instanceof Error ? error.stack : String(error));
      }
    };
    await runWithConcurrency(ids, AGENT_DISPATCH.fieldBackfill.concurrency, queueOne);
    this.logger.log({
      message: "Agent task queued",
      kind: "field-backfill",
      entity,
      keys,
      queued,
      merged
    });
    if (queued > 0 || merged > 0)
      this.poke();
    return { queued, merged };
  }
  async meetingSoon(contactId, when) {
    await this.enqueue({
      contactId,
      kind: "meeting-prep",
      reason: `Meeting on ${when.toDateString()} with someone we know nothing about`,
      priority: PRIORITY.meeting,
      budget: 10
    });
  }
  builderConversationQueued() {
    this.pokeRoute("/internal/crm/builder-dispatch");
  }
  deployedAgentRunQueued() {
    this.pokeRoute("/internal/crm/agent-dispatch");
  }
  deployedAgentRunCancelled(runId) {
    this.deliverCancellation(runId);
  }
  async redeliverCancellations() {
    try {
      const since = new Date(Date.now() - AGENT_DISPATCH.cancel.redeliverWithinMs);
      const runs = await this.db.agentRun.findMany({
        where: {
          status: "CANCELLED",
          errorCode: AGENT_DISPATCH.cancel.errorCode,
          startedAt: { not: null },
          finishedAt: { gte: since }
        },
        orderBy: { finishedAt: "desc" },
        take: AGENT_DISPATCH.cancel.redeliverBatch,
        select: { id: true }
      });
      const outstanding = new Set(runs.map((run) => run.id));
      for (const runId of this.cancellationsDelivered) {
        if (!outstanding.has(runId))
          this.cancellationsDelivered.delete(runId);
      }
      for (const run of runs) {
        if (this.cancellationsDelivered.has(run.id))
          continue;
        await this.deliverCancellation(run.id);
      }
    } catch (error) {
      this.logger.error({ message: "Could not redeliver run cancellations" }, error instanceof Error ? error.stack : String(error));
    }
  }
  async deliverCancellation(runId) {
    const delivered = await this.post("/internal/crm/cancel-run", { runId });
    if (delivered)
      this.cancellationsDelivered.add(runId);
  }
  async backfill(input) {
    const subject = input.contactIds ? "contactId" : "companyId";
    const ids = [...new Set(input.contactIds ?? input.companyIds ?? [])];
    if (ids.length === 0)
      return { queued: 0, alreadyQueued: 0 };
    try {
      const outstanding = await this.db.agentTask.findMany({
        where: {
          kind: input.kind,
          finishedAt: null,
          [subject]: { in: ids }
        },
        select: { companyId: true, contactId: true }
      });
      const taken = new Set(outstanding.map((row) => subject === "contactId" ? row.contactId : row.companyId));
      const fresh = ids.filter((id) => !taken.has(id));
      if (fresh.length > 0) {
        await this.db.agentTask.createMany({
          data: fresh.map((id) => ({
            contactId: input.contactIds ? id : null,
            companyId: input.companyIds ? id : null,
            kind: input.kind,
            reason: input.reason,
            priority: input.priority ?? PRIORITY.sweep,
            budget: input.budget ?? 4,
            dueAt: new Date
          }))
        });
      }
      this.logger.log({
        message: "Backfill queued",
        kind: input.kind,
        queued: fresh.length,
        alreadyQueued: ids.length - fresh.length
      });
      if (fresh.length > 0)
        this.poke();
      return {
        queued: fresh.length,
        alreadyQueued: ids.length - fresh.length
      };
    } catch (error) {
      this.logger.error({ message: "Could not queue backfill", kind: input.kind }, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
  async enqueue(task, required = false, client) {
    try {
      const write = async (tx) => {
        await lockIdempotencyKey(tx, `agent-task:${task.kind}:${task.contactId ?? ""}:${task.companyId ?? ""}:${task.subject?.value ?? ""}`);
        const pending = await tx.agentTask.findFirst({
          where: {
            kind: task.kind,
            finishedAt: null,
            contactId: task.contactId ?? undefined,
            companyId: task.companyId ?? undefined,
            payload: task.subject ? { path: task.subject.path, equals: task.subject.value } : undefined
          },
          select: { id: true }
        });
        if (pending)
          return false;
        await tx.agentTask.create({
          data: {
            contactId: task.contactId ?? null,
            companyId: task.companyId ?? null,
            kind: task.kind,
            reason: task.reason,
            priority: task.priority,
            budget: task.budget,
            dueAt: new Date,
            payload: task.payload ?? undefined
          }
        });
        return true;
      };
      const created = client ? await write(client) : await this.db.$transaction(write);
      if (!created)
        return false;
      this.logger.log({
        message: "Agent task queued",
        kind: task.kind,
        contactId: task.contactId,
        companyId: task.companyId
      });
      if (!client)
        this.poke();
      return true;
    } catch (error) {
      this.logger.error({ message: "Could not queue agent task", kind: task.kind }, error instanceof Error ? error.stack : String(error));
      if (required)
        throw error;
      return false;
    }
  }
  async createEventTask(tx, input) {
    const recordIds = {
      contactId: input.record.kind === "contact" ? input.record.id : null,
      companyId: input.record.kind === "company" ? input.record.id : null,
      dealId: input.record.kind === "deal" ? input.record.id : null
    };
    await tx.agentTask.create({
      data: {
        ...recordIds,
        kind: "agent-event",
        reason: input.type,
        payload: {
          type: input.type,
          record: input.record,
          occurredAt: input.occurredAt.toISOString(),
          data: input.data
        },
        priority: PRIORITY.event,
        budget: 1,
        dueAt: new Date
      }
    });
  }
  canReachAgent() {
    return bridge() !== null;
  }
  drainQueues() {
    this.poke();
    this.deployedAgentRunQueued();
    this.builderConversationQueued();
    this.redeliverCancellations();
  }
  poke() {
    this.pokeRoute("/internal/crm/dispatch");
  }
  pokeRoute(path) {
    this.post(path);
  }
  async post(path, body) {
    const agent = bridge();
    if (!agent)
      return false;
    try {
      const headers = new Headers({
        authorization: `Bearer ${agent.secret}`
      });
      if (body)
        headers.set("content-type", "application/json");
      const response = await fetch(agent.url(path), {
        method: "POST",
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(AGENT_DISPATCH.poke.timeoutMs)
      });
      if (!response.ok) {
        throw new Error(`Agent poke returned ${response.status}.`);
      }
      return true;
    } catch (error) {
      this.logger.debug({
        message: "Agent poke did not land; the cron will pick this up",
        reason: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
}
AgentTriggerService = __legacyDecorateClassTS([
  Injectable11(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], AgentTriggerService);

// src/agent/agents.contracts.ts
import { schemas } from "@crm/validation";
import { z as z4 } from "zod";
var agentManifest = schemas.agents.capabilities.loose();
var agentManifestSummaryOutput = z4.object({
  name: z4.string().optional(),
  description: z4.string().optional(),
  access: z4.array(z4.string()),
  triggers: z4.array(z4.object({ type: z4.string().optional(), summary: z4.string().optional() })),
  actions: z4.array(z4.object({ summary: z4.string().optional() })),
  dataScope: z4.object({ summary: z4.string().optional() })
});
var agentDefinitionStatus = z4.enum([
  "DRAFT",
  "DEPLOYING",
  "LIVE",
  "PAUSED",
  "ARCHIVED",
  "DELETED"
]);
var agentVersionStatus = z4.enum([
  "DRAFT",
  "VALIDATING",
  "READY",
  "DEPLOYED",
  "REJECTED"
]);
var agentRunStatus = z4.enum([
  "QUEUED",
  "RUNNING",
  "WAITING_FOR_APPROVAL",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED"
]);
var agentActionStatus = z4.enum([
  "PLANNED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED"
]);
var agentTriggerType = z4.enum(["MANUAL", "SCHEDULE", "EVENT", "WEBHOOK"]);
var agentUserSummaryOutput = z4.object({
  id: z4.string(),
  name: z4.string(),
  image: z4.string().nullable()
});
var agentVersionRefOutput = z4.object({
  id: z4.string(),
  number: z4.number()
});
var agentIdInput = z4.object({ id: z4.string().min(1) });
var agentHistoryInput = agentIdInput.extend({
  limit: z4.number().int().min(1).max(100).default(50)
});
var agentUpdateInput = agentIdInput.extend({
  name: z4.string().trim().min(1).max(120),
  description: z4.string().trim().max(500).nullable()
});
var agentRunNowInput = agentIdInput.extend({
  clientRequestId: z4.uuid()
});
var agentRetryRunInput = agentIdInput.extend({
  runId: z4.string().min(1),
  clientRequestId: z4.uuid()
});
var agentCancelRunInput = agentIdInput.extend({
  runId: z4.string().min(1)
});
var agentDeployInput = agentIdInput.extend({
  versionId: z4.string().min(1),
  clientRequestId: z4.uuid()
});
var agentReviseInput = agentIdInput.extend({
  clientRequestId: z4.uuid(),
  channel: z4.object({
    id: z4.string().trim().min(1).max(64),
    name: z4.string().trim().min(1).max(120)
  }).optional(),
  actions: z4.array(z4.string().trim().min(1).max(120)).max(20).optional(),
  resources: z4.array(z4.object({
    id: z4.string().trim().min(1).max(160),
    kind: z4.enum(["company", "contact", "deal", "integration"]),
    label: z4.string().trim().min(1).max(160)
  })).max(50).optional()
});
var agentSaveFileInput = agentIdInput.extend({
  clientRequestId: z4.uuid(),
  path: z4.string().trim().min(1).max(400),
  content: z4.string().max(500000)
});
var agentListItemOutput = z4.object({
  id: z4.string(),
  name: z4.string(),
  description: z4.string().nullable(),
  status: agentDefinitionStatus,
  createdAt: z4.string(),
  updatedAt: z4.string(),
  createdBy: agentUserSummaryOutput,
  currentVersion: z4.object({
    id: z4.string(),
    number: z4.number(),
    deployedAt: z4.string().nullable()
  }).nullable(),
  triggers: z4.array(z4.object({
    id: z4.string(),
    type: agentTriggerType,
    name: z4.string(),
    nextRunAt: z4.string().nullable()
  })),
  runCount: z4.number()
});
var agentListOutput = z4.array(agentListItemOutput);
var agentReviseOutput = z4.object({ versionId: z4.string() });
var agentFilesOutput = z4.object({
  versionId: z4.string().nullable(),
  files: z4.array(z4.object({
    path: z4.string(),
    language: z4.string(),
    content: z4.string(),
    previousContent: z4.string().nullable(),
    revision: z4.number()
  }))
});
var agentSaveFileOutput = z4.object({
  saved: z4.boolean(),
  versionId: z4.string().nullable()
});
var agentCapabilitiesResultOutput = z4.discriminatedUnion("readable", [
  z4.object({
    readable: z4.literal(false),
    problem: z4.string(),
    actions: z4.array(schemas.agents.capabilityAction),
    dataScope: z4.null(),
    channel: z4.null()
  }),
  z4.object({
    readable: z4.literal(true),
    problem: z4.null(),
    actions: z4.array(schemas.agents.capabilityAction),
    dataScope: schemas.agents.capabilities.shape.dataScope,
    channel: schemas.agents.capabilityDestination.nullable()
  })
]);
var agentByIdOutput = z4.object({
  id: z4.string(),
  name: z4.string(),
  description: z4.string().nullable(),
  status: agentDefinitionStatus,
  createdById: z4.string(),
  createdBy: agentUserSummaryOutput,
  canManage: z4.boolean(),
  createdAt: z4.string(),
  updatedAt: z4.string(),
  currentVersion: z4.object({
    id: z4.string(),
    number: z4.number(),
    status: agentVersionStatus,
    manifest: z4.unknown(),
    modelId: z4.string(),
    sandboxPolicy: z4.unknown(),
    approvedAt: z4.string().nullable(),
    deployedAt: z4.string().nullable()
  }).nullable(),
  reviewVersion: z4.object({
    id: z4.string(),
    number: z4.number(),
    status: z4.enum(["DRAFT", "READY"]),
    manifest: agentManifestSummaryOutput,
    modelId: z4.string(),
    sandboxPolicy: z4.unknown(),
    sourceConversationId: z4.string().nullable()
  }).nullable(),
  triggers: z4.array(z4.object({
    id: z4.string(),
    type: agentTriggerType,
    name: z4.string(),
    config: z4.unknown(),
    enabled: z4.boolean(),
    nextRunAt: z4.string().nullable(),
    lastRunAt: z4.string().nullable()
  })),
  runCount: z4.number(),
  capabilities: agentCapabilitiesResultOutput
});
var agentRunEventOutput = z4.object({
  id: z4.string(),
  sequence: z4.number(),
  type: z4.string(),
  data: z4.unknown(),
  emittedAt: z4.string()
});
var agentRunActionOutput = z4.object({
  id: z4.string(),
  type: z4.string(),
  provider: z4.string(),
  targetType: z4.string().nullable(),
  targetId: z4.string().nullable(),
  targetLabel: z4.string().nullable(),
  summary: z4.string(),
  status: agentActionStatus,
  externalId: z4.string().nullable(),
  attemptCount: z4.number(),
  errorCode: z4.string().nullable(),
  errorMessage: z4.string().nullable(),
  plannedAt: z4.string(),
  startedAt: z4.string().nullable(),
  completedAt: z4.string().nullable()
});
var agentRunSummaryOutput = z4.object({
  id: z4.string(),
  status: agentRunStatus,
  triggerType: agentTriggerType,
  summary: z4.string().nullable(),
  modelId: z4.string().nullable(),
  inputTokens: z4.number().nullable(),
  outputTokens: z4.number().nullable(),
  costUsd: z4.string().nullable(),
  errorCode: z4.string().nullable(),
  errorMessage: z4.string().nullable(),
  createdAt: z4.string(),
  startedAt: z4.string().nullable(),
  finishedAt: z4.string().nullable(),
  initiatedBy: agentUserSummaryOutput.nullable(),
  version: agentVersionRefOutput,
  totalEvents: z4.number(),
  eventsTruncated: z4.boolean(),
  canCancel: z4.boolean(),
  events: z4.array(agentRunEventOutput),
  actions: z4.array(agentRunActionOutput)
});
var agentHistoryOutput = z4.array(agentRunSummaryOutput);
var agentAuditEventOutput = z4.object({
  id: z4.string(),
  type: z4.string(),
  summary: z4.string(),
  before: z4.unknown().nullable(),
  after: z4.unknown().nullable(),
  requestId: z4.string().nullable(),
  emittedAt: z4.string(),
  actorType: z4.string(),
  actorId: z4.string().nullable(),
  actorUser: agentUserSummaryOutput.nullable(),
  version: agentVersionRefOutput.nullable()
});
var agentActivityOutput = z4.array(agentAuditEventOutput);
var agentUpdateOutput = z4.object({
  id: z4.string(),
  name: z4.string(),
  description: z4.string().nullable(),
  status: agentDefinitionStatus
});
var agentDeployOutput = z4.object({
  id: z4.string(),
  versionId: z4.string(),
  status: z4.literal("LIVE")
});
var agentPauseOutput = z4.object({
  id: z4.string(),
  name: z4.string(),
  status: z4.literal("PAUSED"),
  updatedAt: z4.string()
});
var agentResumeOutput = z4.object({
  id: z4.string(),
  name: z4.string(),
  status: z4.literal("LIVE"),
  updatedAt: z4.string()
});
var agentArchiveOutput = z4.object({
  id: z4.string(),
  name: z4.string(),
  status: z4.literal("ARCHIVED"),
  updatedAt: z4.string()
});
var agentRestoreOutput = z4.object({
  id: z4.string(),
  name: z4.string(),
  status: z4.literal("PAUSED"),
  updatedAt: z4.string()
});
var agentRemoveOutput = z4.object({
  id: z4.string(),
  name: z4.string(),
  status: z4.literal("DELETED"),
  updatedAt: z4.string(),
  disabledTriggers: z4.number(),
  cancelledRuns: z4.number()
});
var agentRunNowOutput = z4.object({ id: z4.string() });
var agentRetryRunOutput = z4.object({ id: z4.string() });
var agentCancelRunOutput = z4.object({
  id: z4.string(),
  status: agentRunStatus,
  cancelled: z4.boolean()
});

// src/agent/agent-definitions.service.ts
var INSTRUCTIONS_PATH = "agent/instructions.md";
var capabilityName = z5.string().nullable().catch(null);
var versionValidation = z5.object({ capabilities: z5.array(z5.json()).catch([]) }).catchall(z5.json()).catch({ capabilities: [] });

class AgentDefinitionsService {
  db;
  access;
  trigger;
  constructor(db, access, trigger) {
    this.db = db;
    this.access = access;
    this.trigger = trigger;
  }
  async list(userId) {
    await this.access.assertMember(userId);
    const rows = await this.db.agentDefinition.findMany({
      where: { status: { in: [...TEAM_AGENT_STATUSES] } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { id: true, name: true, image: true } },
        currentVersion: {
          select: { id: true, number: true, deployedAt: true }
        },
        triggers: {
          where: { enabled: true },
          orderBy: { nextRunAt: "asc" },
          take: 1,
          select: { id: true, type: true, name: true, nextRunAt: true }
        },
        _count: { select: { runs: true } }
      }
    });
    return rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      currentVersion: row.currentVersion ? {
        ...row.currentVersion,
        deployedAt: row.currentVersion.deployedAt?.toISOString() ?? null
      } : null,
      triggers: row.triggers.map((trigger) => ({
        ...trigger,
        nextRunAt: trigger.nextRunAt?.toISOString() ?? null
      })),
      runCount: row._count.runs
    }));
  }
  async byId(id, userId) {
    await this.access.assertCanRead(id, userId);
    const row = await this.db.agentDefinition.findFirst({
      where: { id, status: { not: "DELETED" } },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { id: true, name: true, image: true } },
        currentVersion: {
          select: {
            id: true,
            number: true,
            status: true,
            manifest: true,
            modelId: true,
            sandboxPolicy: true,
            approvedAt: true,
            deployedAt: true
          }
        },
        versions: {
          where: { status: { in: ["DRAFT", "READY"] } },
          orderBy: { number: "desc" },
          take: 1,
          select: {
            id: true,
            number: true,
            status: true,
            manifest: true,
            modelId: true,
            sandboxPolicy: true,
            sourceConversationId: true
          }
        },
        triggers: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            type: true,
            name: true,
            config: true,
            enabled: true,
            nextRunAt: true,
            lastRunAt: true
          }
        },
        _count: { select: { runs: true } }
      }
    });
    if (!row)
      throw new NotFoundException3(`No agent with id ${id}.`);
    const { versions, ...agent } = row;
    const draft = versions[0];
    return {
      ...agent,
      canManage: agent.createdById === userId || await this.canAdmin(userId),
      createdAt: agent.createdAt.toISOString(),
      updatedAt: agent.updatedAt.toISOString(),
      currentVersion: agent.currentVersion ? {
        ...agent.currentVersion,
        approvedAt: agent.currentVersion.approvedAt?.toISOString() ?? null,
        deployedAt: agent.currentVersion.deployedAt?.toISOString() ?? null
      } : null,
      reviewVersion: agent.status === "DRAFT" && draft ? { ...draft, manifest: readAgentManifestSummary(draft.manifest) } : null,
      triggers: agent.triggers.map((trigger) => ({
        ...trigger,
        nextRunAt: trigger.nextRunAt?.toISOString() ?? null,
        lastRunAt: trigger.lastRunAt?.toISOString() ?? null
      })),
      runCount: agent._count.runs,
      capabilities: readCapabilities(agent.currentVersion?.manifest ?? draft?.manifest)
    };
  }
  async update(input, userId) {
    const description = input.description?.trim() || null;
    const updated = await this.db.$transaction(async (tx) => {
      await this.access.assertCanManageInTransaction(tx, input.id, userId);
      const agent = await this.lockAgent(tx, input.id);
      const row = await tx.agentDefinition.update({
        where: { id: input.id },
        data: { name: input.name, description },
        select: { id: true, name: true, description: true, status: true }
      });
      await tx.agentAuditEvent.create({
        data: {
          agentId: input.id,
          actorUserId: userId,
          actorType: "USER",
          actorId: userId,
          type: "agent.updated",
          summary: "Changed agent details",
          before: { name: agent.name, description: agent.description },
          after: { name: input.name, description }
        }
      });
      return row;
    });
    return updated;
  }
  async files(id, userId) {
    await this.access.assertCanRead(id, userId);
    const agent = await this.db.agentDefinition.findFirst({
      where: { id, status: { not: "DELETED" } },
      select: { currentVersionId: true }
    });
    if (!agent?.currentVersionId)
      return { versionId: null, files: [] };
    const rows = await this.db.agentBuilderArtifact.findMany({
      where: { versionId: agent.currentVersionId },
      orderBy: [{ path: "asc" }, { revision: "desc" }],
      select: {
        path: true,
        language: true,
        content: true,
        previousContent: true,
        revision: true
      }
    });
    const latest = new Map;
    for (const row of rows)
      if (!latest.has(row.path))
        latest.set(row.path, row);
    return {
      versionId: agent.currentVersionId,
      files: [...latest.values()]
    };
  }
  async saveFile(input, userId) {
    return this.db.$transaction(async (tx) => {
      await this.access.assertCanManageInTransaction(tx, input.id, userId);
      const agent = await this.lockAgent(tx, input.id);
      const replay = await tx.agentAuditEvent.findFirst({
        where: {
          agentId: input.id,
          type: "agent.file.saved",
          requestId: input.clientRequestId
        },
        select: { versionId: true }
      });
      if (replay)
        return { saved: false, versionId: replay.versionId };
      if (!agent.currentVersionId) {
        throw new BadRequestException2("This agent has no deployed version.");
      }
      const current = await tx.agentVersion.findFirstOrThrow({
        where: { id: agent.currentVersionId },
        select: {
          status: true,
          instructions: true,
          manifest: true,
          modelId: true,
          modelContextWindowTokens: true,
          sandboxPolicy: true,
          validation: true,
          sourceConversationId: true,
          deployedAt: true,
          approvedAt: true
        }
      });
      const file = await tx.agentBuilderArtifact.findFirst({
        where: { versionId: agent.currentVersionId, path: input.path },
        orderBy: { revision: "desc" }
      });
      if (!file)
        throw new NotFoundException3(`No file at ${input.path}.`);
      if (file.content === input.content) {
        return { saved: false, versionId: agent.currentVersionId };
      }
      const version = await tx.agentVersion.create({
        data: {
          agentId: input.id,
          number: await nextVersionNumber(tx, input.id),
          status: current.status,
          instructions: input.path === INSTRUCTIONS_PATH ? input.content : current.instructions,
          manifest: current.manifest,
          modelId: current.modelId,
          modelContextWindowTokens: current.modelContextWindowTokens,
          sandboxPolicy: current.sandboxPolicy,
          validation: current.validation,
          sourceConversationId: current.sourceConversationId,
          approvedAt: current.approvedAt,
          deployedAt: current.deployedAt,
          createdById: userId
        },
        select: { id: true }
      });
      await carryArtifactsForward(tx, agent.currentVersionId, version.id);
      await tx.agentBuilderArtifact.updateMany({
        where: { versionId: version.id, path: input.path },
        data: { previousContent: file.content, content: input.content }
      });
      await tx.agentDefinition.update({
        where: { id: input.id },
        data: { currentVersionId: version.id }
      });
      const repointed = await tx.agentTrigger.updateMany({
        where: { agentId: input.id, versionId: agent.currentVersionId },
        data: { versionId: version.id }
      });
      await tx.agentAuditEvent.create({
        data: {
          agentId: input.id,
          versionId: version.id,
          actorUserId: userId,
          actorType: "USER",
          actorId: userId,
          type: "agent.file.saved",
          summary: `Edited ${input.path}`,
          before: { path: input.path, bytes: file.content.length },
          after: {
            path: input.path,
            bytes: input.content.length,
            triggers: repointed.count
          },
          requestId: input.clientRequestId
        }
      });
      return { saved: true, versionId: version.id };
    });
  }
  async revise(input, userId) {
    const versionId = await this.trigger.withTasks(async (tx, queue) => {
      await this.access.assertCanManageInTransaction(tx, input.id, userId);
      const agent = await this.lockAgent(tx, input.id);
      const replay = await tx.agentAuditEvent.findFirst({
        where: {
          agentId: input.id,
          type: "agent.revised",
          requestId: input.clientRequestId
        },
        select: { versionId: true }
      });
      if (replay)
        return replay.versionId;
      if (!agent.currentVersionId) {
        throw new BadRequestException2("This agent has no deployed version.");
      }
      const current = await tx.agentVersion.findFirstOrThrow({
        where: { id: agent.currentVersionId },
        select: {
          status: true,
          instructions: true,
          manifest: true,
          modelId: true,
          modelContextWindowTokens: true,
          sandboxPolicy: true,
          validation: true,
          sourceConversationId: true,
          deployedAt: true,
          approvedAt: true
        }
      });
      const parsed = agentManifest.safeParse(current.manifest);
      if (!parsed.success) {
        throw new BadRequestException2("This version's manifest cannot be read, so it cannot be changed.");
      }
      const manifest = parsed.data;
      const before = manifest.actions.find((action) => action.destination !== undefined);
      let actions = manifest.actions;
      if (input.actions) {
        const keep = new Set(input.actions);
        actions = actions.filter((action) => keep.has(action.type));
        if (actions.length === 0) {
          throw new BadRequestException2("An agent needs at least one action.");
        }
      }
      const channel = input.channel;
      if (channel) {
        if (!actions.some((action) => action.destination !== undefined)) {
          throw new BadRequestException2("None of this agent's actions post to a channel, so its channel cannot be changed.");
        }
        actions = actions.map((action) => action.destination ? {
          ...action,
          destination: {
            ...action.destination,
            id: channel.id,
            label: `#${channel.name}`
          }
        } : action);
      }
      const dataScope = input.resources ? {
        ...manifest.dataScope,
        mode: input.resources.length > 0 ? "SELECTED" : "WORKSPACE",
        resources: input.resources
      } : manifest.dataScope;
      const version = await tx.agentVersion.create({
        data: {
          agentId: input.id,
          number: await nextVersionNumber(tx, input.id),
          status: current.status,
          instructions: current.instructions,
          manifest: {
            ...manifest,
            actions,
            dataScope
          },
          modelId: current.modelId,
          modelContextWindowTokens: current.modelContextWindowTokens,
          sandboxPolicy: current.sandboxPolicy,
          validation: reviseValidation(current.validation, manifest.actions.map((action) => action.type), actions.map((action) => action.type)),
          sourceConversationId: current.sourceConversationId,
          approvedAt: current.approvedAt,
          deployedAt: current.deployedAt,
          createdById: userId
        },
        select: { id: true }
      });
      await carryArtifactsForward(tx, agent.currentVersionId, version.id);
      await tx.agentDefinition.update({
        where: { id: input.id },
        data: { currentVersionId: version.id }
      });
      const repointed = await tx.agentTrigger.updateMany({
        where: { agentId: input.id, versionId: agent.currentVersionId },
        data: { versionId: version.id }
      });
      if (channel && channel.id !== before?.destination?.id) {
        await queue.slackChannelJoinRequested(channel.id, channel.name);
      }
      await tx.agentAuditEvent.create({
        data: {
          agentId: input.id,
          versionId: version.id,
          actorUserId: userId,
          actorType: "USER",
          actorId: userId,
          type: "agent.revised",
          summary: reviseSummary(input),
          before: {
            channel: before?.destination?.label ?? null,
            actions: manifest.actions.map((action) => action.type),
            resources: manifest.dataScope.resources.length
          },
          after: {
            channel: channel ? `#${channel.name}` : null,
            actions: input.actions ?? null,
            resources: input.resources?.length ?? null,
            triggers: repointed.count
          },
          requestId: input.clientRequestId
        }
      });
      return version.id;
    });
    return { versionId };
  }
  async deploy(input, userId) {
    return this.db.$transaction(async (tx) => {
      await this.access.assertCanManageInTransaction(tx, input.id, userId);
      const agent = await this.lockAgent(tx, input.id);
      const existing = await tx.agentAuditEvent.findFirst({
        where: {
          agentId: input.id,
          type: "agent.deployed",
          requestId: input.clientRequestId
        },
        select: { versionId: true }
      });
      if (existing) {
        if (existing.versionId !== input.versionId) {
          throw new BadRequestException2("That deployment request has already been used.");
        }
        return { id: input.id, versionId: input.versionId, status: "LIVE" };
      }
      const version = await tx.agentVersion.findFirst({
        where: { id: input.versionId, agentId: input.id },
        select: { id: true, number: true, status: true, manifest: true }
      });
      if (!version) {
        throw new NotFoundException3(`No version with id ${input.versionId}.`);
      }
      if (version.status !== "READY" && version.status !== "DEPLOYED") {
        throw new BadRequestException2("Only a validated agent version can be deployed.");
      }
      const metadata = versionMetadata(version.manifest);
      const now = new Date;
      await tx.agentVersion.updateMany({
        where: {
          agentId: input.id,
          status: "DEPLOYED",
          id: { not: input.versionId }
        },
        data: { status: "READY" }
      });
      await tx.agentVersion.update({
        where: { id: input.versionId },
        data: {
          status: "DEPLOYED",
          approvedAt: now,
          deployedAt: now
        }
      });
      await tx.agentDefinition.update({
        where: { id: input.id },
        data: {
          currentVersionId: input.versionId,
          status: "LIVE",
          archivedAt: null,
          ...metadata
        }
      });
      await tx.agentTrigger.updateMany({
        where: { agentId: input.id },
        data: { enabled: false }
      });
      await tx.agentTrigger.updateMany({
        where: { agentId: input.id, versionId: input.versionId },
        data: { enabled: true }
      });
      await tx.agentAuditEvent.create({
        data: {
          agentId: input.id,
          versionId: input.versionId,
          actorUserId: userId,
          actorType: "USER",
          actorId: userId,
          type: "agent.deployed",
          summary: `Made version ${version.number} live for the team`,
          before: { status: agent.status },
          after: { status: "LIVE", version: version.number, ...metadata },
          requestId: input.clientRequestId
        }
      });
      return { id: input.id, versionId: input.versionId, status: "LIVE" };
    });
  }
  async pause(id, userId) {
    return this.changeStatus(id, userId, ["LIVE"], "PAUSED", "agent.paused", "Paused agent", "Only a live agent can be paused.");
  }
  async resume(id, userId) {
    return this.changeStatus(id, userId, ["PAUSED"], "LIVE", "agent.resumed", "Resumed agent", "Only a paused agent can be resumed.");
  }
  async archive(id, userId) {
    return this.changeStatus(id, userId, ["LIVE", "PAUSED"], "ARCHIVED", "agent.archived", "Archived agent", "Only a live or paused agent can be archived.", { archivedAt: new Date });
  }
  async restore(id, userId) {
    return this.changeStatus(id, userId, ["ARCHIVED"], "PAUSED", "agent.restored", "Restored agent", "Only an archived agent can be restored.", { archivedAt: null });
  }
  async remove(id, userId) {
    const now = new Date;
    return this.db.$transaction(async (tx) => {
      await this.access.assertCanManageInTransaction(tx, id, userId);
      const [current] = await tx.$queryRaw`
				SELECT id, status
				FROM "agentDefinition"
				WHERE id = ${id}
				FOR UPDATE
			`;
      if (!current || current.status === "DELETED") {
        throw new NotFoundException3(`No agent with id ${id}.`);
      }
      const disabledTriggers = await tx.agentTrigger.updateMany({
        where: { agentId: id, enabled: true },
        data: { enabled: false, nextRunAt: null }
      });
      const cancellableRuns = await tx.$queryRaw`
				SELECT id
				FROM "agentRun"
				WHERE "agentId" = ${id}
					AND (
						status IN ('QUEUED', 'WAITING_FOR_APPROVAL')
						OR (status = 'RUNNING' AND "sessionId" IS NULL)
					)
				ORDER BY id
				FOR UPDATE
			`;
      for (const run of cancellableRuns) {
        const cancelled = await tx.agentRun.update({
          where: { id: run.id },
          data: {
            status: "CANCELLED",
            finishedAt: now,
            errorCode: "AGENT_DELETED",
            errorMessage: "The agent was deleted before this run completed.",
            nextEventSequence: { increment: 1 }
          },
          select: { nextEventSequence: true }
        });
        await tx.agentRunEvent.create({
          data: {
            runId: run.id,
            sequence: cancelled.nextEventSequence,
            type: "run.cancelled",
            data: { reason: "agent.deleted" },
            emittedAt: now
          }
        });
      }
      const agent = await tx.agentDefinition.update({
        where: { id },
        data: { status: "DELETED", deletedAt: now },
        select: { id: true, name: true, status: true, updatedAt: true }
      });
      await tx.agentAuditEvent.create({
        data: {
          agentId: id,
          actorUserId: userId,
          actorType: "USER",
          actorId: userId,
          type: "agent.deleted",
          summary: "Deleted agent",
          before: { status: current.status },
          after: {
            status: "DELETED",
            disabledTriggers: disabledTriggers.count,
            cancelledRuns: cancellableRuns.length
          }
        }
      });
      return {
        ...agent,
        updatedAt: agent.updatedAt.toISOString(),
        disabledTriggers: disabledTriggers.count,
        cancelledRuns: cancellableRuns.length
      };
    });
  }
  async changeStatus(id, userId, allowedFrom, status, type, summary, invalidStatusMessage, extra = {}) {
    return this.db.$transaction(async (tx) => {
      await this.access.assertCanManageInTransaction(tx, id, userId);
      const before = await this.lockAgent(tx, id);
      if (!allowedFrom.includes(before.status)) {
        throw new BadRequestException2(invalidStatusMessage);
      }
      const agent = await tx.agentDefinition.update({
        where: { id },
        data: { status, ...extra },
        select: { id: true, name: true, status: true, updatedAt: true }
      });
      await tx.agentAuditEvent.create({
        data: {
          agentId: id,
          actorUserId: userId,
          actorType: "USER",
          actorId: userId,
          type,
          summary,
          before: { status: before.status },
          after: { status }
        }
      });
      return { ...agent, updatedAt: agent.updatedAt.toISOString() };
    });
  }
  async lockAgent(tx, id) {
    const [agent] = await tx.$queryRaw`
			SELECT id, status, name, description, "currentVersionId"
			FROM "agentDefinition"
			WHERE id = ${id}
			FOR UPDATE
		`;
    if (!agent || agent.status === "DELETED") {
      throw new NotFoundException3(`No agent with id ${id}.`);
    }
    return agent;
  }
  async canAdmin(userId) {
    const role = await this.access.assertMember(userId);
    return role === "owner" || role === "admin";
  }
}
AgentDefinitionsService = __legacyDecorateClassTS([
  Injectable12(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof AgentAccessService === "undefined" ? Object : AgentAccessService,
    typeof AgentTriggerService === "undefined" ? Object : AgentTriggerService
  ])
], AgentDefinitionsService);
function versionMetadata(manifest) {
  const summary = readAgentManifestSummary(manifest);
  const name = summary.name?.trim() ?? "";
  const description = summary.description === undefined ? undefined : summary.description.trim() || null;
  const metadata = {};
  if (name)
    metadata.name = name;
  if (description !== undefined)
    metadata.description = description;
  return metadata;
}
function readCapabilities(manifest) {
  const parsed = schemas2.agents.capabilities.safeParse(manifest);
  if (!parsed.success) {
    return {
      readable: false,
      problem: parsed.error.issues.map((issue) => `${issue.path.join(".") || "manifest"} ${issue.message}`).join("; "),
      actions: [],
      dataScope: null,
      channel: null
    };
  }
  const slack = parsed.data.actions.find((action) => action.destination !== undefined);
  return {
    readable: true,
    problem: null,
    actions: parsed.data.actions,
    dataScope: parsed.data.dataScope,
    channel: slack?.destination ?? null
  };
}
function reviseSummary(input) {
  const parts = [];
  if (input.channel)
    parts.push(`moved to #${input.channel.name}`);
  if (input.actions)
    parts.push(`${input.actions.length} actions`);
  if (input.resources)
    parts.push(`${input.resources.length} records`);
  return parts.length > 0 ? `Changed ${parts.join(", ")}` : "Changed settings";
}
function reviseValidation(validation, before, after) {
  const removed = before.filter((type) => !after.includes(type));
  const base = versionValidation.parse(validation);
  const capabilities = base.capabilities.flatMap((entry) => {
    const name = capabilityName.parse(entry);
    return name !== null && !removed.includes(name) ? [name] : [];
  });
  return {
    ...base,
    status: "passed",
    checkedAt: new Date().toISOString(),
    capabilities
  };
}
async function nextVersionNumber(tx, agentId) {
  const latest = await tx.agentVersion.findFirst({
    where: { agentId },
    orderBy: { number: "desc" },
    select: { number: true }
  });
  return (latest?.number ?? 0) + 1;
}
async function carryArtifactsForward(tx, fromVersionId, toVersionId) {
  const rows = await tx.agentBuilderArtifact.findMany({
    where: { versionId: fromVersionId },
    orderBy: [{ path: "asc" }, { revision: "desc" }]
  });
  const latest = new Map;
  for (const row of rows)
    if (!latest.has(row.path))
      latest.set(row.path, row);
  if (latest.size === 0)
    return;
  await tx.agentBuilderArtifact.createMany({
    data: [...latest.values()].map((row) => ({
      versionId: toVersionId,
      path: row.path,
      language: row.language,
      content: row.content,
      previousContent: row.previousContent,
      revision: row.revision,
      status: row.status
    }))
  });
}

// src/agent/agent-queue.service.ts
import { Injectable as Injectable13 } from "@nestjs/common";
class AgentQueueService {
  db;
  constructor(db) {
    this.db = db;
  }
  async queuedCompanies(ids) {
    if (ids.length === 0)
      return new Set;
    const rows = await this.db.agentTask.findMany({
      where: this.due({ companyId: { in: [...ids] } }),
      select: { companyId: true },
      distinct: ["companyId"]
    });
    return this.identifiers(rows.map((row) => row.companyId));
  }
  async queuedContacts(ids) {
    if (ids.length === 0)
      return new Set;
    const rows = await this.db.agentTask.findMany({
      where: this.due({ contactId: { in: [...ids] } }),
      select: { contactId: true },
      distinct: ["contactId"]
    });
    return this.identifiers(rows.map((row) => row.contactId));
  }
  async isQueued(subject) {
    const row = await this.db.agentTask.findFirst({
      where: this.due({
        companyId: subject.companyId,
        contactId: subject.contactId
      }),
      select: { id: true }
    });
    return row !== null;
  }
  due(subject) {
    return { ...subject, finishedAt: null, dueAt: { lte: new Date } };
  }
  identifiers(values) {
    return new Set(values.filter((value) => value !== null));
  }
}
AgentQueueService = __legacyDecorateClassTS([
  Injectable13(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], AgentQueueService);

// src/agent/agent-runs.service.ts
import { randomUUID } from "node:crypto";
import { Prisma } from "@crm/db";
import { lockIdempotencyKey as lockIdempotencyKey2 } from "@crm/db/idempotency";
import {
  BadRequestException as BadRequestException3,
  ConflictException,
  ForbiddenException as ForbiddenException2,
  Injectable as Injectable14,
  NotFoundException as NotFoundException4
} from "@nestjs/common";
var CANCELLABLE_STATUSES = [
  "QUEUED",
  "RUNNING",
  "WAITING_FOR_APPROVAL"
];
var RUN_EVENT_LIMIT = 200;

class AgentRunsService {
  db;
  access;
  trigger;
  constructor(db, access, trigger) {
    this.db = db;
    this.access = access;
    this.trigger = trigger;
  }
  async list(agentId, limit, userId) {
    const agent = await this.readableAgent(agentId, userId);
    const rows = await this.db.agentRun.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        status: true,
        triggerType: true,
        summary: true,
        modelId: true,
        inputTokens: true,
        outputTokens: true,
        costUsd: true,
        errorCode: true,
        errorMessage: true,
        createdAt: true,
        startedAt: true,
        finishedAt: true,
        initiatedBy: { select: { id: true, name: true, image: true } },
        version: { select: { id: true, number: true } },
        _count: { select: { events: true } },
        events: {
          orderBy: { sequence: "asc" },
          take: RUN_EVENT_LIMIT,
          select: {
            id: true,
            sequence: true,
            type: true,
            data: true,
            emittedAt: true
          }
        },
        actions: {
          orderBy: { plannedAt: "asc" },
          select: {
            id: true,
            type: true,
            provider: true,
            targetType: true,
            targetId: true,
            targetLabel: true,
            summary: true,
            status: true,
            externalId: true,
            attemptCount: true,
            errorCode: true,
            errorMessage: true,
            plannedAt: true,
            startedAt: true,
            completedAt: true
          }
        }
      }
    });
    return rows.map(({ _count, ...run }) => ({
      ...run,
      totalEvents: _count.events,
      eventsTruncated: _count.events > run.events.length,
      canCancel: CANCELLABLE_STATUSES.includes(run.status) && (agent.canManage || run.initiatedBy?.id === userId),
      costUsd: run.costUsd?.toString() ?? null,
      createdAt: run.createdAt.toISOString(),
      startedAt: run.startedAt?.toISOString() ?? null,
      finishedAt: run.finishedAt?.toISOString() ?? null,
      events: run.events.map((event) => ({
        ...event,
        emittedAt: event.emittedAt.toISOString()
      })),
      actions: run.actions.map((action) => ({
        ...action,
        plannedAt: action.plannedAt.toISOString(),
        startedAt: action.startedAt?.toISOString() ?? null,
        completedAt: action.completedAt?.toISOString() ?? null
      }))
    }));
  }
  async activity(agentId, limit, userId) {
    await this.readableAgent(agentId, userId);
    const rows = await this.db.agentAuditEvent.findMany({
      where: { agentId },
      orderBy: { emittedAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        summary: true,
        before: true,
        after: true,
        requestId: true,
        emittedAt: true,
        actorType: true,
        actorId: true,
        actorUser: { select: { id: true, name: true, image: true } },
        version: { select: { id: true, number: true } }
      }
    });
    return rows.map((event) => ({
      ...event,
      emittedAt: event.emittedAt.toISOString()
    }));
  }
  async runNow(input, userId) {
    await this.access.assertMember(userId);
    const existing = await this.db.agentRun.findUnique({
      where: { idempotencyKey: input.clientRequestId },
      select: { id: true, agentId: true }
    });
    if (existing) {
      this.assertReplayMatches(existing.agentId, input.id);
      this.trigger.deployedAgentRunQueued();
      return { id: existing.id };
    }
    const run = await this.db.$transaction(async (tx) => {
      await lockIdempotencyKey2(tx, input.clientRequestId);
      const replay = await tx.agentRun.findUnique({
        where: { idempotencyKey: input.clientRequestId },
        select: { id: true, agentId: true }
      });
      if (replay) {
        this.assertReplayMatches(replay.agentId, input.id);
        return { id: replay.id };
      }
      const [agent] = await tx.$queryRaw`
					SELECT id, status, "currentVersionId"
					FROM "agentDefinition"
					WHERE id = ${input.id}
					FOR UPDATE
				`;
      if (!agent || agent.status === "DELETED") {
        throw new NotFoundException4(`No agent with id ${input.id}.`);
      }
      if (agent.status !== "LIVE" || !agent.currentVersionId) {
        throw new BadRequestException3("This agent is not live yet.");
      }
      const active = await tx.agentRun.findFirst({
        where: {
          agentId: input.id,
          status: { in: [...CANCELLABLE_STATUSES] }
        },
        select: { id: true }
      });
      if (active) {
        throw new ConflictException("This agent already has an active run. Stop it or wait for it to finish.");
      }
      const created = await tx.agentRun.create({
        data: {
          agentId: input.id,
          versionId: agent.currentVersionId,
          initiatedById: userId,
          triggerType: "MANUAL",
          idempotencyKey: input.clientRequestId,
          correlationId: randomUUID(),
          events: {
            create: { sequence: 0, type: "run.queued", data: {} }
          }
        },
        select: { id: true }
      });
      await tx.agentAuditEvent.create({
        data: {
          agentId: input.id,
          versionId: agent.currentVersionId,
          actorUserId: userId,
          actorType: "USER",
          actorId: userId,
          type: "run.requested",
          summary: "Requested a manual run",
          requestId: input.clientRequestId
        }
      });
      return created;
    });
    this.trigger.deployedAgentRunQueued();
    return run;
  }
  async retryRun(input, userId) {
    await this.access.assertMember(userId);
    const run = await this.db.$transaction(async (tx) => {
      await lockIdempotencyKey2(tx, input.clientRequestId);
      const replay = await tx.agentRun.findUnique({
        where: { idempotencyKey: input.clientRequestId },
        select: { id: true, agentId: true }
      });
      if (replay) {
        this.assertReplayMatches(replay.agentId, input.id);
        return { id: replay.id };
      }
      const previous = await tx.agentRun.findUnique({
        where: { id: input.runId },
        select: {
          agentId: true,
          status: true,
          versionId: true,
          triggerId: true,
          triggerType: true,
          input: true
        }
      });
      if (!previous || previous.agentId !== input.id) {
        throw new NotFoundException4(`No run with id ${input.runId}.`);
      }
      if (CANCELLABLE_STATUSES.includes(previous.status)) {
        throw new ConflictException("This run has not finished yet.");
      }
      const [agent] = await tx.$queryRaw`
					SELECT id, status, "currentVersionId"
					FROM "agentDefinition"
					WHERE id = ${input.id}
					FOR UPDATE
				`;
      if (!agent || agent.status === "DELETED") {
        throw new NotFoundException4(`No agent with id ${input.id}.`);
      }
      if (agent.status !== "LIVE" || !agent.currentVersionId) {
        throw new BadRequestException3("This agent is not live yet.");
      }
      const active = await tx.agentRun.findFirst({
        where: { agentId: input.id, status: { in: [...CANCELLABLE_STATUSES] } },
        select: { id: true }
      });
      if (active) {
        throw new ConflictException("This agent already has an active run. Stop it or wait for it to finish.");
      }
      const created = await tx.agentRun.create({
        data: {
          agentId: input.id,
          versionId: previous.versionId,
          initiatedById: userId,
          triggerId: previous.triggerId,
          triggerType: previous.triggerType,
          input: previous.input ?? Prisma.DbNull,
          idempotencyKey: input.clientRequestId,
          correlationId: randomUUID(),
          events: { create: { sequence: 0, type: "run.queued", data: {} } }
        },
        select: { id: true }
      });
      await tx.agentAuditEvent.create({
        data: {
          agentId: input.id,
          versionId: previous.versionId,
          actorUserId: userId,
          actorType: "USER",
          actorId: userId,
          type: "run.requested",
          summary: `Retried run ${input.runId}`,
          requestId: input.clientRequestId
        }
      });
      return created;
    });
    this.trigger.deployedAgentRunQueued();
    return run;
  }
  async cancelRun(input, userId) {
    const agent = await this.readableAgent(input.id, userId);
    const outcome = await this.db.$transaction(async (tx) => {
      const [run] = await tx.$queryRaw`
				SELECT id, "agentId", "versionId", status, "initiatedById", "nextEventSequence"
				FROM "agentRun"
				WHERE id = ${input.runId}
				FOR UPDATE
			`;
      if (!run || run.agentId !== input.id) {
        throw new NotFoundException4(`No run with id ${input.runId}.`);
      }
      if (!agent.canManage && run.initiatedById !== userId) {
        throw new ForbiddenException2("Only the person who started this run, or a workspace admin, can stop it.");
      }
      if (!CANCELLABLE_STATUSES.includes(run.status)) {
        return { id: run.id, status: run.status, cancelled: false };
      }
      const sequence = run.nextEventSequence + 1;
      const finishedAt = new Date;
      await tx.agentRun.update({
        where: { id: run.id },
        data: {
          status: "CANCELLED",
          errorCode: AGENT_DISPATCH.cancel.errorCode,
          errorMessage: AGENT_DISPATCH.cancel.message,
          finishedAt,
          nextEventSequence: sequence
        }
      });
      await tx.agentAction.updateMany({
        where: { runId: run.id, status: { in: ["PLANNED", "RUNNING"] } },
        data: {
          status: "CANCELLED",
          errorCode: AGENT_DISPATCH.cancel.errorCode,
          errorMessage: AGENT_DISPATCH.cancel.message,
          completedAt: finishedAt
        }
      });
      await tx.agentRunEvent.create({
        data: {
          id: `run-terminal:${run.id}:cancelled`,
          runId: run.id,
          sequence,
          type: "run.cancelled",
          data: { reason: "user.cancelled" },
          emittedAt: finishedAt
        }
      });
      await tx.agentAuditEvent.upsert({
        where: {
          agentId_type_requestId: {
            agentId: run.agentId,
            type: "run.cancelled",
            requestId: run.id
          }
        },
        create: {
          agentId: run.agentId,
          versionId: run.versionId,
          actorUserId: userId,
          actorType: "USER",
          actorId: userId,
          type: "run.cancelled",
          summary: "Stopped a run",
          requestId: run.id
        },
        update: {}
      });
      return { id: run.id, status: "CANCELLED", cancelled: true };
    });
    if (outcome.cancelled) {
      this.trigger.deployedAgentRunCancelled(outcome.id);
    }
    return outcome;
  }
  async readableAgent(agentId, userId) {
    return this.access.assertCanRead(agentId, userId);
  }
  assertReplayMatches(existingAgentId, requestedAgentId) {
    if (existingAgentId !== requestedAgentId) {
      throw new BadRequestException3("That run request has already been used.");
    }
  }
}
AgentRunsService = __legacyDecorateClassTS([
  Injectable14(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof AgentAccessService === "undefined" ? Object : AgentAccessService,
    typeof AgentTriggerService === "undefined" ? Object : AgentTriggerService
  ])
], AgentRunsService);

// src/agent/agents.router.ts
import { Inject as Inject3 } from "@nestjs/common";
import {
  Ctx as Ctx2,
  Input as Input2,
  Mutation as Mutation2,
  Query as Query2,
  Router as Router2,
  UseMiddlewares as UseMiddlewares2
} from "nestjs-trpc";
class AgentsRouter {
  agents;
  runs;
  constructor(agents, runs) {
    this.agents = agents;
    this.runs = runs;
  }
  async list(ctx) {
    return this.agents.list(ctx.user.id);
  }
  async revise(ctx, input) {
    return this.agents.revise(input, ctx.user.id);
  }
  async files(ctx, id) {
    return this.agents.files(id, ctx.user.id);
  }
  async saveFile(ctx, input) {
    return this.agents.saveFile(input, ctx.user.id);
  }
  async byId(ctx, id) {
    return this.agents.byId(id, ctx.user.id);
  }
  async history(ctx, input) {
    return this.runs.list(input.id, input.limit, ctx.user.id);
  }
  async activity(ctx, input) {
    return this.runs.activity(input.id, input.limit, ctx.user.id);
  }
  async update(ctx, input) {
    return this.agents.update(input, ctx.user.id);
  }
  async deploy(ctx, input) {
    return this.agents.deploy(input, ctx.user.id);
  }
  async pause(ctx, id) {
    return this.agents.pause(id, ctx.user.id);
  }
  async resume(ctx, id) {
    return this.agents.resume(id, ctx.user.id);
  }
  async archive(ctx, id) {
    return this.agents.archive(id, ctx.user.id);
  }
  async restore(ctx, id) {
    return this.agents.restore(id, ctx.user.id);
  }
  async remove(ctx, id) {
    return this.agents.remove(id, ctx.user.id);
  }
  async runNow(ctx, input) {
    return this.runs.runNow(input, ctx.user.id);
  }
  async retryRun(ctx, input) {
    return this.runs.retryRun(input, ctx.user.id);
  }
  async cancelRun(ctx, input) {
    return this.runs.cancelRun(input, ctx.user.id);
  }
}
__legacyDecorateClassTS([
  Query2({
    output: agentListOutput,
    meta: restMeta("GET", "/agents", ["Agents"])
  }),
  __legacyDecorateParamTS(0, Ctx2()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], AgentsRouter.prototype, "list", null);
__legacyDecorateClassTS([
  Mutation2({
    input: agentReviseInput,
    output: agentReviseOutput,
    meta: restMeta("POST", "/agents/{id}/revise", ["Agents"])
  }),
  __legacyDecorateParamTS(0, Ctx2()),
  __legacyDecorateParamTS(1, Input2()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], AgentsRouter.prototype, "revise", null);
__legacyDecorateClassTS([
  Query2({
    input: agentIdInput,
    output: agentFilesOutput,
    meta: restMeta("GET", "/agents/{id}/files", ["Agents"])
  }),
  __legacyDecorateParamTS(0, Ctx2()),
  __legacyDecorateParamTS(1, Input2("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], AgentsRouter.prototype, "files", null);
__legacyDecorateClassTS([
  Mutation2({
    input: agentSaveFileInput,
    output: agentSaveFileOutput,
    meta: restMeta("POST", "/agents/{id}/save-file", ["Agents"])
  }),
  __legacyDecorateParamTS(0, Ctx2()),
  __legacyDecorateParamTS(1, Input2()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], AgentsRouter.prototype, "saveFile", null);
__legacyDecorateClassTS([
  Query2({
    input: agentIdInput,
    output: agentByIdOutput,
    meta: restMeta("GET", "/agents/{id}", ["Agents"])
  }),
  __legacyDecorateParamTS(0, Ctx2()),
  __legacyDecorateParamTS(1, Input2("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], AgentsRouter.prototype, "byId", null);
__legacyDecorateClassTS([
  Query2({
    input: agentHistoryInput,
    output: agentHistoryOutput,
    meta: restMeta("GET", "/agents/{id}/history", ["Agents"])
  }),
  __legacyDecorateParamTS(0, Ctx2()),
  __legacyDecorateParamTS(1, Input2()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], AgentsRouter.prototype, "history", null);
__legacyDecorateClassTS([
  Query2({
    input: agentHistoryInput,
    output: agentActivityOutput,
    meta: restMeta("GET", "/agents/{id}/activity", ["Agents"])
  }),
  __legacyDecorateParamTS(0, Ctx2()),
  __legacyDecorateParamTS(1, Input2()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], AgentsRouter.prototype, "activity", null);
__legacyDecorateClassTS([
  Mutation2({
    input: agentUpdateInput,
    output: agentUpdateOutput,
    meta: restMeta("PATCH", "/agents/{id}", ["Agents"])
  }),
  __legacyDecorateParamTS(0, Ctx2()),
  __legacyDecorateParamTS(1, Input2()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], AgentsRouter.prototype, "update", null);
__legacyDecorateClassTS([
  Mutation2({
    input: agentDeployInput,
    output: agentDeployOutput,
    meta: restMeta("POST", "/agents/{id}/deploy", ["Agents"])
  }),
  __legacyDecorateParamTS(0, Ctx2()),
  __legacyDecorateParamTS(1, Input2()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], AgentsRouter.prototype, "deploy", null);
__legacyDecorateClassTS([
  Mutation2({
    input: agentIdInput,
    output: agentPauseOutput,
    meta: restMeta("POST", "/agents/{id}/pause", ["Agents"])
  }),
  __legacyDecorateParamTS(0, Ctx2()),
  __legacyDecorateParamTS(1, Input2("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], AgentsRouter.prototype, "pause", null);
__legacyDecorateClassTS([
  Mutation2({
    input: agentIdInput,
    output: agentResumeOutput,
    meta: restMeta("POST", "/agents/{id}/resume", ["Agents"])
  }),
  __legacyDecorateParamTS(0, Ctx2()),
  __legacyDecorateParamTS(1, Input2("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], AgentsRouter.prototype, "resume", null);
__legacyDecorateClassTS([
  Mutation2({
    input: agentIdInput,
    output: agentArchiveOutput,
    meta: restMeta("POST", "/agents/{id}/archive", ["Agents"])
  }),
  __legacyDecorateParamTS(0, Ctx2()),
  __legacyDecorateParamTS(1, Input2("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], AgentsRouter.prototype, "archive", null);
__legacyDecorateClassTS([
  Mutation2({
    input: agentIdInput,
    output: agentRestoreOutput,
    meta: restMeta("POST", "/agents/{id}/restore", ["Agents"])
  }),
  __legacyDecorateParamTS(0, Ctx2()),
  __legacyDecorateParamTS(1, Input2("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], AgentsRouter.prototype, "restore", null);
__legacyDecorateClassTS([
  Mutation2({
    input: agentIdInput,
    output: agentRemoveOutput,
    meta: restMeta("DELETE", "/agents/{id}", ["Agents"])
  }),
  __legacyDecorateParamTS(0, Ctx2()),
  __legacyDecorateParamTS(1, Input2("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], AgentsRouter.prototype, "remove", null);
__legacyDecorateClassTS([
  Mutation2({
    input: agentRunNowInput,
    output: agentRunNowOutput,
    meta: restMeta("POST", "/agents/{id}/run", ["Agents"])
  }),
  __legacyDecorateParamTS(0, Ctx2()),
  __legacyDecorateParamTS(1, Input2()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], AgentsRouter.prototype, "runNow", null);
__legacyDecorateClassTS([
  Mutation2({
    input: agentRetryRunInput,
    output: agentRetryRunOutput,
    meta: restMeta("POST", "/agents/{id}/runs/{runId}/retry", ["Agents"])
  }),
  __legacyDecorateParamTS(0, Ctx2()),
  __legacyDecorateParamTS(1, Input2()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], AgentsRouter.prototype, "retryRun", null);
__legacyDecorateClassTS([
  Mutation2({
    input: agentCancelRunInput,
    output: agentCancelRunOutput,
    meta: restMeta("POST", "/agents/{id}/runs/{runId}/cancel", ["Agents"])
  }),
  __legacyDecorateParamTS(0, Ctx2()),
  __legacyDecorateParamTS(1, Input2()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], AgentsRouter.prototype, "cancelRun", null);
AgentsRouter = __legacyDecorateClassTS([
  Router2({ alias: "agents" }),
  UseMiddlewares2(AuthMiddleware),
  __legacyDecorateParamTS(0, Inject3(AgentDefinitionsService)),
  __legacyDecorateParamTS(1, Inject3(AgentRunsService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof AgentDefinitionsService === "undefined" ? Object : AgentDefinitionsService,
    typeof AgentRunsService === "undefined" ? Object : AgentRunsService
  ])
], AgentsRouter);

// src/agent/dispatch-heartbeat.service.ts
import {
  Injectable as Injectable15,
  Logger as Logger6
} from "@nestjs/common";
class DispatchHeartbeatService {
  trigger;
  logger = new Logger6(DispatchHeartbeatService.name);
  timer = null;
  constructor(trigger) {
    this.trigger = trigger;
  }
  onApplicationBootstrap() {
    if (!this.trigger.canReachAgent()) {
      this.logger.log({
        message: "No agent bridge secret, so queued work waits for the agent's own schedule."
      });
      return;
    }
    this.trigger.drainQueues();
    this.timer = setInterval(() => this.trigger.drainQueues(), AGENT_DISPATCH.heartbeat.everyMs);
    this.timer.unref?.();
  }
  onApplicationShutdown() {
    if (this.timer)
      clearInterval(this.timer);
    this.timer = null;
  }
}
DispatchHeartbeatService = __legacyDecorateClassTS([
  Injectable15(),
  __legacyMetadataTS("design:paramtypes", [
    typeof AgentTriggerService === "undefined" ? Object : AgentTriggerService
  ])
], DispatchHeartbeatService);

// src/agent/research-key.service.ts
import { Injectable as Injectable16, Logger as Logger7 } from "@nestjs/common";
import { z as z6 } from "zod";
var VERIFY_TIMEOUT_MS = 20000;
var verifyAnswer = z6.object({
  outcome: z6.string().nullable().catch(null),
  reason: z6.string().nullable().catch(null)
}).catch({ outcome: null, reason: null });

class ResearchKeyService {
  logger = new Logger7(ResearchKeyService.name);
  async verify(apiKey) {
    const agent = bridge();
    if (!agent) {
      return {
        outcome: "unknown",
        reason: "This install has no AGENT_BRIDGE_SECRET, so nothing can check."
      };
    }
    try {
      const response = await fetch(agent.url("/internal/crm/verify-key"), {
        method: "POST",
        headers: {
          authorization: `Bearer ${agent.secret}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({ apiKey }),
        signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS)
      });
      if (!response.ok) {
        return this.cannotTell(`The agent answered ${response.status}.`);
      }
      const body = verifyAnswer.parse(await response.json());
      if (body.outcome === "valid")
        return { outcome: "valid" };
      if (body.outcome === "invalid") {
        return {
          outcome: "invalid",
          reason: body.reason || "Context did not recognise that API key."
        };
      }
      return this.cannotTell(body.reason ?? "No answer.");
    } catch (error) {
      return this.cannotTell(error instanceof Error ? error.message : String(error));
    }
  }
  cannotTell(reason) {
    this.logger.warn({
      message: "Could not check the Context key; saving it unverified",
      reason
    });
    return { outcome: "unknown", reason };
  }
}
ResearchKeyService = __legacyDecorateClassTS([
  Injectable16()
], ResearchKeyService);

// src/agent/agent.module.ts
class AgentModule {
}
AgentModule = __legacyDecorateClassTS([
  Module3({
    imports: [TrpcModule],
    providers: [
      AgentAccessService,
      AgentDefinitionsService,
      AgentQueueService,
      AgentRunsService,
      AgentTriggerService,
      AgentsRouter,
      DispatchHeartbeatService,
      ResearchKeyService
    ],
    exports: [
      AgentAccessService,
      AgentTriggerService,
      AgentQueueService,
      ResearchKeyService
    ]
  })
], AgentModule);

// src/api-keys/api-keys.module.ts
import { Module as Module4 } from "@nestjs/common";

// src/api-keys/api-keys.router.ts
import { Inject as Inject4 } from "@nestjs/common";
import { fromNodeHeaders as fromNodeHeaders2 } from "better-auth/node";
import {
  Ctx as Ctx3,
  Input as Input3,
  Mutation as Mutation3,
  Query as Query3,
  Router as Router3,
  UseMiddlewares as UseMiddlewares3
} from "nestjs-trpc";

// src/api-keys/api-keys.contracts.ts
import { API_KEY_EXPIRATION } from "@crm/auth";
import { z as z8 } from "zod";

// src/trpc/list-input.ts
import { z as z7 } from "zod";
var listInput = z7.object({
  q: z7.string().default(""),
  sort: z7.string().default(""),
  dir: z7.enum(["asc", "desc"]).default("asc"),
  page: z7.number().int().min(1).default(1),
  pageSize: z7.number().int().min(1).max(100).default(25)
});
function paginate(input) {
  return {
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize
  };
}
function resolveOrderBy(input, columns, fallback) {
  const column = columns[input.sort];
  return column ? column(input.dir) : fallback;
}
function countsByKey(groups, key, nullKey) {
  const counts = {};
  for (const group of groups) {
    const value = group[key] ?? nullKey;
    if (value == null)
      continue;
    counts[value] = (counts[value] ?? 0) + group._count._all;
  }
  return counts;
}
var FACET_UNASSIGNED = "unassigned";
function splitSentinel(values, sentinel) {
  const ids = values.filter((value) => value !== sentinel);
  return { ids, includesSentinel: ids.length !== values.length };
}
function ownerFilter(values) {
  if (values.length === 0)
    return;
  const { ids, includesSentinel } = splitSentinel(values, FACET_UNASSIGNED);
  if (includesSentinel && ids.length === 0)
    return { ownerId: null };
  if (!includesSentinel)
    return { ownerId: { in: ids } };
  return { OR: [{ ownerId: { in: ids } }, { ownerId: null }] };
}
function archivedFilter(archived) {
  return { archivedAt: archived ? { not: null } : null };
}
var ACTIVITY_WINDOWS = ["7", "30", "90"];
var activityWindowSet = new Set(ACTIVITY_WINDOWS);
var activityFacetInput = z7.array(z7.string()).refine((values) => values.every((value) => activityWindowSet.has(value)), {
  message: `Activity must be one of: ${ACTIVITY_WINDOWS.join(", ")}.`
});
function activityCutoff(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
function activityFilter(values) {
  if (values.length === 0)
    return;
  const days = values.reduce((max, value) => Math.max(max, Number(value)), 0);
  return { lastActivityAt: { gte: activityCutoff(days) } };
}
async function activityFacetCounts(countWhere) {
  const counts = await Promise.all(ACTIVITY_WINDOWS.map((days) => countWhere({ lastActivityAt: { gte: activityCutoff(Number(days)) } })));
  return Object.fromEntries(ACTIVITY_WINDOWS.map((days, index) => [days, counts[index]]));
}

// src/api-keys/api-keys.contracts.ts
var apiKeyListInput = listInput;
var createApiKeyInput = z8.object({
  name: z8.string().trim().min(1).max(64),
  expiresInDays: z8.number().int().min(API_KEY_EXPIRATION.minDays).max(API_KEY_EXPIRATION.maxDays).nullable()
});
var revokeApiKeyInput = z8.object({
  id: z8.string().trim().min(1)
});
var apiKeySummaryOutput = z8.object({
  id: z8.string(),
  name: z8.string().nullable(),
  start: z8.string().nullable(),
  enabled: z8.boolean(),
  createdAt: z8.string(),
  lastRequest: z8.string().nullable(),
  expiresAt: z8.string().nullable()
});
var apiKeyListOutput = z8.object({
  rows: z8.array(apiKeySummaryOutput),
  total: z8.number(),
  facetCounts: z8.record(z8.string(), z8.record(z8.string(), z8.number()))
});
var createApiKeyOutput = apiKeySummaryOutput.extend({
  key: z8.string()
});
var revokeApiKeyOutput = z8.object({ id: z8.string() });

// src/api-keys/api-keys.service.ts
import { auth as auth2, DAY_SECONDS } from "@crm/auth";
import {
  HttpException as HttpException2,
  Injectable as Injectable17,
  InternalServerErrorException,
  Logger as Logger8
} from "@nestjs/common";
import { APIError } from "better-auth/api";
var KEY_SELECT = {
  id: true,
  name: true,
  start: true,
  enabled: true,
  createdAt: true,
  lastRequest: true,
  expiresAt: true
};
var SORTABLE = {
  name: (dir) => ({ name: dir }),
  createdAt: (dir) => ({ createdAt: dir }),
  lastRequest: (dir) => ({ lastRequest: dir }),
  expiresAt: (dir) => ({ expiresAt: dir })
};
var STATUS_BY_CODE = new Map([
  ["BAD_REQUEST", 400],
  ["UNAUTHORIZED", 401],
  ["FORBIDDEN", 403],
  ["NOT_FOUND", 404],
  ["CONFLICT", 409],
  ["UNPROCESSABLE_ENTITY", 400]
]);
function toSummary(row) {
  return {
    id: row.id,
    name: row.name,
    start: row.start,
    enabled: row.enabled ?? true,
    createdAt: row.createdAt.toISOString(),
    lastRequest: row.lastRequest?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null
  };
}

class ApiKeysService {
  db;
  logger = new Logger8(ApiKeysService.name);
  constructor(db) {
    this.db = db;
  }
  async list(userId, input) {
    const where = this.searchWhere(userId, input.q);
    const { skip, take } = paginate(input);
    const [rows, total] = await Promise.all([
      this.db.apikey.findMany({
        where,
        skip,
        take,
        select: KEY_SELECT,
        orderBy: resolveOrderBy(input, SORTABLE, { createdAt: "desc" })
      }),
      this.db.apikey.count({ where })
    ]);
    return { rows: rows.map(toSummary), total, facetCounts: {} };
  }
  async create(userId, headers, input) {
    const created = await this.call(() => auth2.api.createApiKey({
      headers,
      body: {
        name: input.name,
        expiresIn: input.expiresInDays === null ? null : input.expiresInDays * DAY_SECONDS
      }
    }));
    this.logger.log({
      message: "API key created",
      userId,
      apiKeyId: created.id
    });
    return {
      id: created.id,
      name: created.name,
      start: created.start,
      enabled: created.enabled,
      createdAt: created.createdAt.toISOString(),
      lastRequest: created.lastRequest?.toISOString() ?? null,
      expiresAt: created.expiresAt?.toISOString() ?? null,
      key: created.key
    };
  }
  async revoke(userId, headers, input) {
    await this.call(() => auth2.api.deleteApiKey({ headers, body: { keyId: input.id } }));
    this.logger.log({
      message: "API key revoked",
      userId,
      apiKeyId: input.id
    });
    return { id: input.id };
  }
  searchWhere(userId, q) {
    const where = { referenceId: userId };
    const term = q.trim();
    if (term) {
      where.name = { contains: term, mode: "insensitive" };
    }
    return where;
  }
  async call(run) {
    try {
      return await run();
    } catch (error) {
      if (error instanceof APIError) {
        const status = STATUS_BY_CODE.get(error.body?.code ?? "") ?? error.statusCode;
        throw new HttpException2(error.body?.message ?? "The API key could not be saved.", status);
      }
      this.logger.error({ message: "API key call failed" }, error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException("Could not reach the auth service.");
    }
  }
}
ApiKeysService = __legacyDecorateClassTS([
  Injectable17(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], ApiKeysService);

// src/api-keys/api-keys.router.ts
function headersOf(ctx) {
  return fromNodeHeaders2(ctx.req?.headers ?? {});
}

class ApiKeysRouter {
  apiKeys;
  constructor(apiKeys) {
    this.apiKeys = apiKeys;
  }
  async list(ctx, input) {
    return this.apiKeys.list(ctx.user.id, input);
  }
  async create(ctx, input) {
    return this.apiKeys.create(ctx.user.id, headersOf(ctx), input);
  }
  async revoke(ctx, input) {
    return this.apiKeys.revoke(ctx.user.id, headersOf(ctx), input);
  }
}
__legacyDecorateClassTS([
  Query3({
    input: apiKeyListInput,
    output: apiKeyListOutput,
    meta: restMeta("GET", "/api-keys", ["API Keys"])
  }),
  __legacyDecorateParamTS(0, Ctx3()),
  __legacyDecorateParamTS(1, Input3()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ApiKeysRouter.prototype, "list", null);
__legacyDecorateClassTS([
  Mutation3({
    input: createApiKeyInput,
    output: createApiKeyOutput,
    meta: restMeta("POST", "/api-keys", ["API Keys"])
  }),
  __legacyDecorateParamTS(0, Ctx3()),
  __legacyDecorateParamTS(1, Input3()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ApiKeysRouter.prototype, "create", null);
__legacyDecorateClassTS([
  Mutation3({
    input: revokeApiKeyInput,
    output: revokeApiKeyOutput,
    meta: restMeta("DELETE", "/api-keys/{id}", ["API Keys"])
  }),
  __legacyDecorateParamTS(0, Ctx3()),
  __legacyDecorateParamTS(1, Input3()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ApiKeysRouter.prototype, "revoke", null);
ApiKeysRouter = __legacyDecorateClassTS([
  Router3({ alias: "apiKeys" }),
  UseMiddlewares3(AuthMiddleware, SessionOnlyMiddleware),
  __legacyDecorateParamTS(0, Inject4(ApiKeysService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof ApiKeysService === "undefined" ? Object : ApiKeysService
  ])
], ApiKeysRouter);

// src/api-keys/api-keys.module.ts
class ApiKeysModule {
}
ApiKeysModule = __legacyDecorateClassTS([
  Module4({
    imports: [TrpcModule],
    providers: [ApiKeysService, ApiKeysRouter],
    exports: [ApiKeysService]
  })
], ApiKeysModule);

// src/archive/archive.module.ts
import { Module as Module10 } from "@nestjs/common";

// src/companies/companies.module.ts
import { Module as Module7 } from "@nestjs/common";

// src/currency/currency.module.ts
import { Module as Module5 } from "@nestjs/common";

// src/currency/conversion.service.ts
import { Prisma as Prisma2 } from "@crm/db";
import { minorUnitsOf, normalizeCurrency } from "@crm/db/currency";
import {
  convertToBase,
  resolveRate
} from "@crm/db/fx";
import { readReportingCurrency } from "@crm/db/settings";
import { Injectable as Injectable18, Logger as Logger9 } from "@nestjs/common";
class ConversionService {
  db;
  logger = new Logger9(ConversionService.name);
  constructor(db) {
    this.db = db;
  }
  async reportingCurrency() {
    return readReportingCurrency(this.db);
  }
  async rateFor(currency) {
    const base = await this.reportingCurrency();
    return resolveRate(this.db, base, currency);
  }
  async convert(amount, currency) {
    return convertToBase(this.db, amount, currency, await this.reportingCurrency());
  }
  async dealFields(amount, currency) {
    const converted = await this.convert(amount, currency);
    if (!converted) {
      return {
        baseAmount: null,
        baseCurrency: null,
        fxRate: null,
        fxRateAt: null
      };
    }
    return {
      baseAmount: converted.baseAmount,
      baseCurrency: converted.baseCurrency,
      fxRate: converted.fxRate,
      fxRateAt: converted.fxRateAt
    };
  }
  countedWhere(base) {
    return { baseAmount: { not: null }, baseCurrency: base };
  }
  pendingWhere(base) {
    return {
      amount: { not: null },
      OR: [
        { baseAmount: null },
        { baseCurrency: null },
        { baseCurrency: { not: base } }
      ]
    };
  }
  async unconverted(where = {}) {
    const base = await this.reportingCurrency();
    const rows = await this.db.deal.groupBy({
      by: ["currency"],
      where: { AND: [where, this.pendingWhere(base)] },
      _count: { _all: true }
    });
    return {
      count: rows.reduce((total, row) => total + row._count._all, 0),
      currencies: rows.map((row) => normalizeCurrency(row.currency)).filter((code, index, all) => all.indexOf(code) === index).sort()
    };
  }
  async rerateAll() {
    return this.rerate(false);
  }
  async fillMissing() {
    return this.rerate(true);
  }
  async rerate(onlyMissing) {
    const base = await this.reportingCurrency();
    const groups = await this.db.deal.groupBy({
      by: ["currency"],
      where: onlyMissing ? this.pendingWhere(base) : { amount: { not: null } },
      _count: { _all: true }
    });
    const codes = [
      ...new Set(groups.map((group) => normalizeCurrency(group.currency)))
    ];
    const places = minorUnitsOf(base);
    let converted = 0;
    let cleared = 0;
    const missing = [];
    for (const code of codes) {
      const rate = await resolveRate(this.db, base, code);
      if (!rate) {
        missing.push(code);
        if (!onlyMissing) {
          cleared += await this.clear(code);
        }
        continue;
      }
      converted += await this.write(base, code, rate, places, onlyMissing);
    }
    this.logger.log({
      message: onlyMissing ? "Filled in deal amounts that had no rate" : "Re-rated every deal against the reporting currency",
      base,
      converted,
      cleared,
      missing
    });
    return { converted, cleared, missing: missing.sort() };
  }
  async write(base, code, rate, places, onlyMissing) {
    const value = new Prisma2.Decimal(rate.rate).toString();
    const filter = onlyMissing ? Prisma2.sql`AND ("baseAmount" IS NULL OR "baseCurrency" IS DISTINCT FROM ${base})` : Prisma2.empty;
    return this.db.$executeRaw`
			UPDATE "deal"
			SET "baseAmount" = ROUND("amount" * ${value}::numeric, ${places}::int),
			    "baseCurrency" = ${base},
			    "fxRate" = ${value}::numeric,
			    "fxRateAt" = ${rate.asOf}
			WHERE "amount" IS NOT NULL
			  AND upper(btrim("currency")) = ${code}
			  ${filter}
		`;
  }
  async clear(code) {
    return this.db.$executeRaw`
			UPDATE "deal"
			SET "baseAmount" = NULL,
			    "baseCurrency" = NULL,
			    "fxRate" = NULL,
			    "fxRateAt" = NULL
			WHERE upper(btrim("currency")) = ${code}
			  AND "baseAmount" IS NOT NULL
		`;
  }
}
ConversionService = __legacyDecorateClassTS([
  Injectable18(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], ConversionService);

// src/currency/currency.router.ts
import { Inject as Inject5 } from "@nestjs/common";
import {
  Ctx as Ctx4,
  Input as Input4,
  Mutation as Mutation4,
  Query as Query4,
  Router as Router4,
  UseMiddlewares as UseMiddlewares4
} from "nestjs-trpc";

// src/currency/currency.contracts.ts
import { RateSource } from "@crm/db";
import { isCurrencyCode } from "@crm/db/currency";
import { z as z9 } from "zod";
var currencyCode = z9.string().trim().length(3, "A currency code is three letters, like USD.").refine(isCurrencyCode, "That is not a currency this CRM can convert.");
var setReportingCurrencyInput = z9.object({
  currency: currencyCode
});
var setManualRateInput = z9.object({
  currency: currencyCode,
  rate: z9.number().positive("A rate has to be greater than zero.").finite("That is not a rate.")
});
var removeManualRateInput = z9.object({
  currency: currencyCode
});
var rateSourceOutput = z9.enum([RateSource.FETCHED, RateSource.MANUAL]);
var currencyRateOutput = z9.object({
  currency: z9.string(),
  name: z9.string().nullable(),
  rate: z9.number(),
  asOf: z9.string(),
  source: rateSourceOutput,
  provider: z9.string().nullable(),
  overriding: z9.boolean()
});
var currencyInUseOutput = z9.object({
  currency: z9.string(),
  name: z9.string().nullable(),
  deals: z9.number(),
  convertible: z9.boolean()
});
var unconvertedOutput = z9.object({
  count: z9.number(),
  currencies: z9.array(z9.string())
});
var currencyMetaOutput = z9.object({
  code: z9.string(),
  name: z9.string(),
  minorUnits: z9.number()
});
var currencySettingsOutput = z9.object({
  reportingCurrency: z9.string(),
  refreshedAt: z9.string().nullable(),
  rates: z9.array(currencyRateOutput),
  inUse: z9.array(currencyInUseOutput),
  unconverted: unconvertedOutput,
  catalog: z9.array(currencyMetaOutput),
  canManage: z9.boolean()
});

// src/currency/currency.service.ts
import { canManageCurrency, workspaceRoleOf as workspaceRoleOf2 } from "@crm/auth";
import { Prisma as Prisma4, RateSource as RateSource3 } from "@crm/db";
import { CURRENCIES, currencyName, normalizeCurrency as normalizeCurrency3 } from "@crm/db/currency";
import { writeReportingCurrency } from "@crm/db/settings";
import {
  BadRequestException as BadRequestException4,
  ForbiddenException as ForbiddenException3,
  Injectable as Injectable20,
  Logger as Logger11
} from "@nestjs/common";

// src/currency/rates.service.ts
import { Prisma as Prisma3, RateSource as RateSource2 } from "@crm/db";
import {
  CURRENCY_CODES,
  isCurrencyCode as isCurrencyCode2,
  normalizeCurrency as normalizeCurrency2
} from "@crm/db/currency";
import {
  readRatesRefreshedAt,
  readReportingCurrency as readReportingCurrency2,
  writeRatesRefreshedAt
} from "@crm/db/settings";
import { Injectable as Injectable19, Logger as Logger10 } from "@nestjs/common";
import { z as z10 } from "zod";
var RATES_PROVIDER = "open.er-api.com";
var RATES_URL = "https://open.er-api.com/v6/latest";
var RATES_TIMEOUT_MS = 6000;
var RATES_ATTEMPTS = 2;
var RETRY_DELAY_MS = 400;
var UNREADABLE_FEED = {
  result: "",
  time_last_update_unix: null,
  rates: {},
  "error-type": null
};
var openExchangeResponse = z10.object({
  result: z10.string().catch(""),
  time_last_update_unix: z10.number().refine(Number.isFinite).nullable().catch(null),
  rates: z10.record(z10.string(), z10.json()).catch({}),
  "error-type": z10.string().nullable().catch(null)
}).catch(UNREADABLE_FEED);
function parseAsOf(seconds) {
  if (seconds === null)
    return null;
  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class RatesService {
  db;
  logger = new Logger10(RatesService.name);
  constructor(db) {
    this.db = db;
  }
  async refreshedAt() {
    return readRatesRefreshedAt(this.db);
  }
  async refresh() {
    const base = await readReportingCurrency2(this.db);
    const quotes = await this.fetch(base);
    if (!quotes) {
      return {
        ok: false,
        base,
        written: 0,
        asOf: null,
        reason: `Could not reach ${RATES_PROVIDER}. Rates entered by hand are unaffected.`
      };
    }
    const written = await this.store(base, quotes.rates, quotes.asOf);
    await writeRatesRefreshedAt(this.db, new Date);
    this.logger.log({
      message: "Exchange rates refreshed",
      base,
      written,
      asOf: quotes.asOf.toISOString()
    });
    return {
      ok: true,
      base,
      written,
      asOf: quotes.asOf.toISOString(),
      reason: null
    };
  }
  async store(base, rates, asOf) {
    let written = 0;
    for (const [quoteCurrency, rate] of rates) {
      await this.db.exchangeRate.upsert({
        where: {
          baseCurrency_quoteCurrency_source: {
            baseCurrency: base,
            quoteCurrency,
            source: RateSource2.FETCHED
          }
        },
        create: {
          baseCurrency: base,
          quoteCurrency,
          rate,
          asOf,
          source: RateSource2.FETCHED,
          provider: RATES_PROVIDER
        },
        update: { rate, asOf, provider: RATES_PROVIDER }
      });
      written += 1;
    }
    const supported = [...CURRENCY_CODES];
    const stale = await this.db.exchangeRate.deleteMany({
      where: {
        source: RateSource2.FETCHED,
        OR: [
          { baseCurrency: { notIn: supported } },
          { quoteCurrency: { notIn: supported } }
        ]
      }
    });
    if (stale.count > 0) {
      this.logger.log({
        message: "Dropped fetched rates for currencies that are not supported",
        base,
        dropped: stale.count
      });
    }
    return written;
  }
  async fetch(base) {
    for (let attempt = 1;attempt <= RATES_ATTEMPTS; attempt += 1) {
      const quotes = await this.attempt(base, attempt);
      if (quotes)
        return quotes;
      if (attempt < RATES_ATTEMPTS)
        await wait(RETRY_DELAY_MS);
    }
    return null;
  }
  async attempt(base, attempt) {
    try {
      const response = await fetch(`${RATES_URL}/${encodeURIComponent(base)}`, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(RATES_TIMEOUT_MS)
      });
      if (!response.ok) {
        this.logger.warn({
          message: "Exchange rate request failed",
          status: response.status,
          base,
          attempt
        });
        return null;
      }
      const body = openExchangeResponse.parse(await response.json());
      if (body.result !== "success") {
        this.logger.warn({
          message: "Exchange rate provider refused the request",
          base,
          attempt,
          errorType: body["error-type"]
        });
        return null;
      }
      const asOf = parseAsOf(body.time_last_update_unix) ?? new Date;
      const rates = new Map;
      for (const [code, value] of Object.entries(body.rates)) {
        const quoteCurrency = normalizeCurrency2(code);
        if (!isCurrencyCode2(quoteCurrency))
          continue;
        if (quoteCurrency === normalizeCurrency2(base))
          continue;
        const perBase = Number(value);
        if (!Number.isFinite(perBase) || perBase <= 0)
          continue;
        rates.set(quoteCurrency, new Prisma3.Decimal(1).dividedBy(perBase).toDecimalPlaces(10));
      }
      if (rates.size === 0) {
        this.logger.warn({
          message: "Exchange rate response carried no usable rates",
          base,
          attempt
        });
        return null;
      }
      return { rates, asOf };
    } catch (error) {
      this.logger.warn({
        message: "Exchange rates unavailable",
        base,
        attempt,
        reason: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
}
RatesService = __legacyDecorateClassTS([
  Injectable19(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], RatesService);

// src/currency/currency.service.ts
class CurrencyService {
  db;
  conversion;
  rates;
  logger = new Logger11(CurrencyService.name);
  constructor(db, conversion, rates) {
    this.db = db;
    this.conversion = conversion;
    this.rates = rates;
  }
  async settings(actingUserId) {
    const reportingCurrency = await this.conversion.reportingCurrency();
    const [rows, refreshedAt, unconverted, usage] = await Promise.all([
      this.db.exchangeRate.findMany({
        where: { baseCurrency: reportingCurrency },
        select: {
          quoteCurrency: true,
          rate: true,
          asOf: true,
          source: true,
          provider: true
        }
      }),
      this.rates.refreshedAt(),
      this.conversion.unconverted(),
      this.db.deal.groupBy({
        by: ["currency"],
        where: { amount: { not: null } },
        _count: { _all: true }
      })
    ]);
    const manual = new Set(rows.filter((row) => row.source === RateSource3.MANUAL).map((row) => row.quoteCurrency));
    const effective = new Map;
    for (const row of rows) {
      const currency = normalizeCurrency3(row.quoteCurrency);
      if (row.source === RateSource3.FETCHED && manual.has(row.quoteCurrency)) {
        continue;
      }
      effective.set(currency, {
        currency,
        name: currencyName(currency),
        rate: row.rate.toNumber(),
        asOf: row.asOf.toISOString(),
        source: row.source,
        provider: row.provider,
        overriding: row.source === RateSource3.MANUAL && manual.has(row.quoteCurrency)
      });
    }
    const convertible = new Set([reportingCurrency, ...effective.keys()]);
    return {
      reportingCurrency,
      refreshedAt: refreshedAt?.toISOString() ?? null,
      rates: [...effective.values()].sort((a, b) => a.currency.localeCompare(b.currency)),
      inUse: usage.map((row) => {
        const currency = normalizeCurrency3(row.currency);
        return {
          currency,
          name: currencyName(currency),
          deals: row._count._all,
          convertible: convertible.has(currency)
        };
      }).sort((a, b) => b.deals - a.deals || a.currency.localeCompare(b.currency)),
      unconverted,
      catalog: [...CURRENCIES],
      canManage: canManageCurrency(await workspaceRoleOf2(actingUserId))
    };
  }
  async requireManager(userId) {
    if (!canManageCurrency(await workspaceRoleOf2(userId))) {
      throw new ForbiddenException3("Only an owner or an admin can change how money is reported.");
    }
  }
  async setReportingCurrency(actingUserId, code) {
    await this.requireManager(actingUserId);
    const currency = normalizeCurrency3(code);
    const current = await this.conversion.reportingCurrency();
    if (currency === current)
      return this.settings(actingUserId);
    await writeReportingCurrency(this.db, currency);
    const refresh = await this.rates.refresh();
    const rerated = await this.conversion.rerateAll();
    this.logger.log({
      message: "Reporting currency changed",
      from: current,
      to: currency,
      ratesFetched: refresh.written,
      converted: rerated.converted,
      cleared: rerated.cleared,
      missing: rerated.missing
    });
    return this.settings(actingUserId);
  }
  async setManualRate(actingUserId, code, rate) {
    await this.requireManager(actingUserId);
    const quoteCurrency = normalizeCurrency3(code);
    const baseCurrency = await this.conversion.reportingCurrency();
    if (quoteCurrency === baseCurrency) {
      throw new BadRequestException4(`${baseCurrency} is the reporting currency — its rate is always 1.`);
    }
    const asOf = new Date;
    await this.db.exchangeRate.upsert({
      where: {
        baseCurrency_quoteCurrency_source: {
          baseCurrency,
          quoteCurrency,
          source: RateSource3.MANUAL
        }
      },
      create: {
        baseCurrency,
        quoteCurrency,
        rate: new Prisma4.Decimal(rate),
        asOf,
        source: RateSource3.MANUAL
      },
      update: { rate: new Prisma4.Decimal(rate), asOf }
    });
    const filled = await this.conversion.fillMissing();
    this.logger.log({
      message: "Manual exchange rate saved",
      baseCurrency,
      quoteCurrency,
      converted: filled.converted
    });
    return this.settings(actingUserId);
  }
  async removeManualRate(actingUserId, code) {
    await this.requireManager(actingUserId);
    const quoteCurrency = normalizeCurrency3(code);
    const baseCurrency = await this.conversion.reportingCurrency();
    await this.db.exchangeRate.deleteMany({
      where: { baseCurrency, quoteCurrency, source: RateSource3.MANUAL }
    });
    this.logger.log({
      message: "Manual exchange rate removed",
      baseCurrency,
      quoteCurrency
    });
    return this.settings(actingUserId);
  }
  async refresh(actingUserId) {
    await this.requireManager(actingUserId);
    const refresh = await this.rates.refresh();
    if (!refresh.ok) {
      throw new BadRequestException4(refresh.reason ?? "Could not fetch rates.");
    }
    await this.conversion.fillMissing();
    return this.settings(actingUserId);
  }
}
CurrencyService = __legacyDecorateClassTS([
  Injectable20(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof ConversionService === "undefined" ? Object : ConversionService,
    typeof RatesService === "undefined" ? Object : RatesService
  ])
], CurrencyService);

// src/currency/currency.router.ts
class CurrencyRouter {
  currency;
  constructor(currency) {
    this.currency = currency;
  }
  async settings(ctx) {
    return this.currency.settings(ctx.user.id);
  }
  async setReportingCurrency(ctx, input) {
    return this.currency.setReportingCurrency(ctx.user.id, input.currency);
  }
  async setManualRate(ctx, input) {
    return this.currency.setManualRate(ctx.user.id, input.currency, input.rate);
  }
  async removeManualRate(ctx, input) {
    return this.currency.removeManualRate(ctx.user.id, input.currency);
  }
  async refreshRates(ctx) {
    return this.currency.refresh(ctx.user.id);
  }
}
__legacyDecorateClassTS([
  Query4({
    output: currencySettingsOutput,
    meta: restMeta("GET", "/currency/settings", ["Currency"])
  }),
  __legacyDecorateParamTS(0, Ctx4()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CurrencyRouter.prototype, "settings", null);
__legacyDecorateClassTS([
  Mutation4({
    input: setReportingCurrencyInput,
    output: currencySettingsOutput,
    meta: restMeta("PATCH", "/currency/reporting-currency", ["Currency"])
  }),
  __legacyDecorateParamTS(0, Ctx4()),
  __legacyDecorateParamTS(1, Input4()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CurrencyRouter.prototype, "setReportingCurrency", null);
__legacyDecorateClassTS([
  Mutation4({
    input: setManualRateInput,
    output: currencySettingsOutput,
    meta: restMeta("PUT", "/currency/rates/{currency}", ["Currency"])
  }),
  __legacyDecorateParamTS(0, Ctx4()),
  __legacyDecorateParamTS(1, Input4()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CurrencyRouter.prototype, "setManualRate", null);
__legacyDecorateClassTS([
  Mutation4({
    input: removeManualRateInput,
    output: currencySettingsOutput,
    meta: restMeta("DELETE", "/currency/rates/{currency}", ["Currency"])
  }),
  __legacyDecorateParamTS(0, Ctx4()),
  __legacyDecorateParamTS(1, Input4()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CurrencyRouter.prototype, "removeManualRate", null);
__legacyDecorateClassTS([
  Mutation4({
    output: currencySettingsOutput,
    meta: restMeta("POST", "/currency/rates/refresh", ["Currency"])
  }),
  __legacyDecorateParamTS(0, Ctx4()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CurrencyRouter.prototype, "refreshRates", null);
CurrencyRouter = __legacyDecorateClassTS([
  Router4({ alias: "currency" }),
  UseMiddlewares4(AuthMiddleware),
  __legacyDecorateParamTS(0, Inject5(CurrencyService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof CurrencyService === "undefined" ? Object : CurrencyService
  ])
], CurrencyRouter);

// src/currency/rates.controller.ts
import {
  Controller,
  ForbiddenException as ForbiddenException4,
  Get,
  Headers as Headers2,
  Logger as Logger12,
  Post,
  ServiceUnavailableException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ApiExcludeEndpoint,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags
} from "@nestjs/swagger";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
class RatesController {
  rates;
  conversion;
  logger = new Logger12(RatesController.name);
  secret;
  constructor(rates, conversion, config) {
    this.rates = rates;
    this.conversion = conversion;
    this.secret = config.get("CRON_SECRET", { infer: true });
  }
  async ratesViaGet(authorization) {
    return this.run(authorization);
  }
  async ratesViaPost(authorization) {
    return this.run(authorization);
  }
  async run(authorization) {
    if (!this.secret) {
      this.logger.error({
        message: "CRON_SECRET is not set — refusing to run the rates route."
      });
      throw new ServiceUnavailableException("Rate refresh is not configured.");
    }
    if (!timingSafeEquals(authorization ?? "", `Bearer ${this.secret}`)) {
      throw new ForbiddenException4;
    }
    const refresh = await this.rates.refresh();
    if (!refresh.ok)
      return refresh;
    const filled = await this.conversion.fillMissing();
    return { ...refresh, converted: filled.converted, missing: filled.missing };
  }
}
__legacyDecorateClassTS([
  Get("rates"),
  AllowAnonymous(),
  ApiOperation({
    summary: "Refresh exchange rates and convert amounts left pending"
  }),
  ApiOkResponse({ description: "Rates refreshed; conversion counts." }),
  __legacyDecorateParamTS(0, Headers2("authorization")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], RatesController.prototype, "ratesViaGet", null);
__legacyDecorateClassTS([
  Post("rates"),
  AllowAnonymous(),
  ApiExcludeEndpoint(),
  __legacyDecorateParamTS(0, Headers2("authorization")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], RatesController.prototype, "ratesViaPost", null);
RatesController = __legacyDecorateClassTS([
  ApiTags("Internal — Cron"),
  ApiHeader({
    name: "authorization",
    description: "`Bearer <CRON_SECRET>`",
    required: true
  }),
  ApiForbiddenResponse({ description: "CRON_SECRET did not match." }),
  ApiServiceUnavailableResponse({ description: "CRON_SECRET is not set." }),
  Controller("internal/sync"),
  __legacyMetadataTS("design:paramtypes", [
    typeof RatesService === "undefined" ? Object : RatesService,
    typeof ConversionService === "undefined" ? Object : ConversionService,
    typeof ConfigService === "undefined" ? Object : ConfigService
  ])
], RatesController);
function timingSafeEquals(a, b) {
  if (a.length !== b.length)
    return false;
  let mismatch = 0;
  for (let index = 0;index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

// src/currency/currency.module.ts
class CurrencyModule {
}
CurrencyModule = __legacyDecorateClassTS([
  Module5({
    imports: [TrpcModule],
    controllers: [RatesController],
    providers: [ConversionService, RatesService, CurrencyService, CurrencyRouter],
    exports: [ConversionService]
  })
], CurrencyModule);

// src/fields/fields.module.ts
import { Module as Module6 } from "@nestjs/common";

// src/fields/fields.router.ts
import { Inject as Inject6 } from "@nestjs/common";
import { Input as Input5, Mutation as Mutation5, Query as Query5, Router as Router5, UseMiddlewares as UseMiddlewares5 } from "nestjs-trpc";

// src/fields/fields.contracts.ts
import { FIELD_ENTITIES, FIELD_TYPES } from "@crm/db/fields";
import { z as z11 } from "zod";
var fieldEntity = z11.enum(FIELD_ENTITIES);
var fieldListInput = z11.object({
  entity: fieldEntity,
  includeArchived: z11.boolean().default(false)
});
var fieldByKeyInput = z11.object({
  entity: fieldEntity,
  key: z11.string().trim().min(1)
});
var fieldEntityInput = z11.object({
  entity: fieldEntity
});
var fieldOptionInput = z11.object({
  id: z11.string().optional(),
  label: z11.string().trim().min(1, "An option needs a label.")
});
var fieldCreateInput = z11.object({
  entity: fieldEntity,
  label: z11.string().trim().min(1, "A field needs a label."),
  type: z11.enum(FIELD_TYPES),
  options: z11.array(fieldOptionInput).default([]),
  agentFilled: z11.boolean().default(true),
  agentBrief: z11.string().trim().nullable().default(null),
  required: z11.boolean().default(false),
  showOnSheet: z11.boolean().default(true),
  showOnTable: z11.boolean().default(false),
  showOnFilter: z11.boolean().default(false)
});
var fieldUpdateData = z11.object({
  label: z11.string().trim().min(1).optional(),
  type: z11.enum(FIELD_TYPES).optional(),
  options: z11.array(fieldOptionInput).optional(),
  agentFilled: z11.boolean().optional(),
  agentBrief: z11.string().trim().nullable().optional(),
  required: z11.boolean().optional(),
  showOnSheet: z11.boolean().optional(),
  showOnTable: z11.boolean().optional(),
  showOnFilter: z11.boolean().optional()
});
var fieldUpdateArgs = z11.object({
  id: z11.string(),
  data: fieldUpdateData
});
var fieldIdInput = z11.object({ id: z11.string() });
var fieldReorderInput = z11.object({
  entity: fieldEntity,
  ids: z11.array(z11.string()).min(1)
});
var recordFieldValue = z11.union([z11.string(), z11.number(), z11.boolean(), z11.null()], { error: "A field holds text, a number, true or false, or nothing at all." });
var recordFieldValues = z11.record(z11.string(), recordFieldValue);
var fieldOptionOutput = z11.object({
  id: z11.string(),
  label: z11.string(),
  position: z11.number()
});
var serializedFieldOutput = z11.object({
  id: z11.string(),
  entity: fieldEntity,
  key: z11.string(),
  label: z11.string(),
  type: z11.enum(FIELD_TYPES),
  typeLabel: z11.string(),
  agentFilled: z11.boolean(),
  agentBrief: z11.string().nullable(),
  required: z11.boolean(),
  showOnSheet: z11.boolean(),
  showOnTable: z11.boolean(),
  showOnFilter: z11.boolean(),
  position: z11.number(),
  archived: z11.boolean(),
  options: z11.array(fieldOptionOutput)
});
var fieldListOutput = z11.array(serializedFieldOutput);
var fieldFiltersOutput = z11.array(serializedFieldOutput);
var fieldReorderOutput = z11.array(serializedFieldOutput);
var fieldCoverageOutput = z11.object({
  filled: z11.number(),
  total: z11.number()
});
var fieldDeleteOutput = z11.object({ id: z11.string() });
var fieldBackfillOutput = z11.object({ queued: z11.boolean() });

// src/fields/fields.service.ts
import {
  Prisma as PrismaNamespace3
} from "@crm/db";
import {
  attachValues,
  FieldValueError,
  fieldKeyFromLabel,
  readValue,
  recordColumn,
  serializeField,
  usesOptions,
  writeValues
} from "@crm/db/fields";
import {
  BadRequestException as BadRequestException5,
  ConflictException as ConflictException2,
  Injectable as Injectable21,
  NotFoundException as NotFoundException5
} from "@nestjs/common";

// src/fields/fields-config.ts
var FIELDS_CONFIG = {
  backfill: {
    maxRecordsPerRun: 500
  }
};

// src/fields/fields.service.ts
var WITH_OPTIONS = {
  options: { orderBy: { position: "asc" } }
};
var RELATIONS = {
  COMPANY: "company",
  CONTACT: "contact",
  DEAL: "deal"
};

class FieldsService {
  db;
  agent;
  constructor(db, agent) {
    this.db = db;
    this.agent = agent;
  }
  async list(entity, includeArchived) {
    const definitions = await this.db.fieldDefinition.findMany({
      where: { entity, archivedAt: includeArchived ? undefined : null },
      include: WITH_OPTIONS,
      orderBy: { position: "asc" }
    });
    return definitions.map(serializeField);
  }
  async byKey(entity, key) {
    const definition = await this.db.fieldDefinition.findUnique({
      where: { entity_key: { entity, key } },
      include: WITH_OPTIONS
    });
    if (!definition)
      throw new NotFoundException5("That field does not exist.");
    return serializeField(definition);
  }
  async create(input) {
    const key = fieldKeyFromLabel(input.label);
    if (!key) {
      throw new BadRequestException5("That label does not make a usable key.");
    }
    const taken = await this.db.fieldDefinition.findUnique({
      where: { entity_key: { entity: input.entity, key } },
      select: { id: true }
    });
    if (taken) {
      throw new ConflictException2(`There is already a field called "${key}".`);
    }
    if (usesOptions(input.type) && input.options.length === 0) {
      throw new BadRequestException5("A select needs at least one option.");
    }
    const last = await this.db.fieldDefinition.findFirst({
      where: { entity: input.entity },
      orderBy: { position: "desc" },
      select: { position: true }
    });
    const definition = await this.db.fieldDefinition.create({
      data: {
        entity: input.entity,
        key,
        label: input.label,
        type: input.type,
        agentFilled: input.agentFilled,
        agentBrief: input.agentBrief,
        required: input.required,
        showOnSheet: input.showOnSheet,
        showOnTable: input.showOnTable,
        showOnFilter: input.showOnFilter,
        position: (last?.position ?? -1) + 1,
        options: usesOptions(input.type) ? {
          create: input.options.map((option, index) => ({
            label: option.label,
            position: index
          }))
        } : undefined
      },
      include: WITH_OPTIONS
    });
    if (definition.agentFilled) {
      const ids = await this.missingRecordIds(definition.entity, definition.id, FIELDS_CONFIG.backfill.maxRecordsPerRun);
      await this.agent.fieldBackfillRecords(definition.entity, [definition.key], ids, `New field: ${definition.label}`);
    }
    return serializeField(definition);
  }
  async update(id, data) {
    const existing = await this.db.fieldDefinition.findUnique({
      where: { id },
      include: WITH_OPTIONS
    });
    if (!existing)
      throw new NotFoundException5("That field does not exist.");
    const type = data.type ?? existing.type;
    if (data.type && data.type !== existing.type) {
      const values = await this.db.fieldValue.count({
        where: { fieldId: id }
      });
      if (values > 0) {
        throw new ConflictException2("This field already holds values, so its type cannot change. Archive it and make a new one.");
      }
    }
    const optionCount = data.options ? data.options.length : existing.options.filter((option) => option.archivedAt === null).length;
    if (usesOptions(type) && optionCount === 0) {
      throw new BadRequestException5("A select needs at least one option.");
    }
    const definition = await this.db.$transaction(async (tx) => {
      if (data.options && usesOptions(type)) {
        const keep = new Set(data.options.map((option) => option.id).filter((value) => Boolean(value)));
        await tx.fieldOption.updateMany({
          where: { fieldId: id, id: { notIn: [...keep] }, archivedAt: null },
          data: { archivedAt: new Date }
        });
        for (const [index, option] of data.options.entries()) {
          if (option.id) {
            await tx.fieldOption.update({
              where: { id: option.id },
              data: { label: option.label, position: index }
            });
            continue;
          }
          await tx.fieldOption.create({
            data: { fieldId: id, label: option.label, position: index }
          });
        }
      }
      return tx.fieldDefinition.update({
        where: { id },
        data: {
          label: data.label,
          type: data.type,
          agentFilled: data.agentFilled,
          agentBrief: data.agentBrief,
          required: data.required,
          showOnSheet: data.showOnSheet,
          showOnTable: data.showOnTable,
          showOnFilter: data.showOnFilter
        },
        include: WITH_OPTIONS
      });
    });
    const briefChanged = data.agentBrief !== undefined && data.agentBrief !== existing.agentBrief;
    const turnedOn = data.agentFilled === true && !existing.agentFilled;
    if (definition.agentFilled && (briefChanged || turnedOn)) {
      const ids = await this.missingRecordIds(definition.entity, definition.id, FIELDS_CONFIG.backfill.maxRecordsPerRun);
      await this.agent.fieldBackfillRecords(definition.entity, [definition.key], ids, briefChanged ? `Brief changed: ${definition.label}` : `Turned on: ${definition.label}`);
    }
    return serializeField(definition);
  }
  async reorder(input) {
    const owned = await this.db.fieldDefinition.findMany({
      where: { id: { in: input.ids }, entity: input.entity },
      select: { id: true }
    });
    if (owned.length !== input.ids.length) {
      throw new BadRequestException5("That order names a field which is not on this record type.");
    }
    await this.db.$transaction(input.ids.map((id, index) => this.db.fieldDefinition.update({
      where: { id },
      data: { position: index }
    })));
    return this.list(input.entity, false);
  }
  async archive(id) {
    try {
      const definition = await this.db.fieldDefinition.update({
        where: { id },
        data: { archivedAt: new Date },
        include: WITH_OPTIONS
      });
      return serializeField(definition);
    } catch (error) {
      throw this.translate(error);
    }
  }
  async restore(id) {
    try {
      const definition = await this.db.fieldDefinition.update({
        where: { id },
        data: { archivedAt: null },
        include: WITH_OPTIONS
      });
      return serializeField(definition);
    } catch (error) {
      throw this.translate(error);
    }
  }
  async delete(id) {
    try {
      await this.db.fieldDefinition.delete({ where: { id } });
    } catch (error) {
      throw this.translate(error);
    }
    return { id };
  }
  async backfill(id) {
    const definition = await this.db.fieldDefinition.findUnique({
      where: { id },
      select: {
        entity: true,
        key: true,
        label: true,
        agentFilled: true,
        archivedAt: true
      }
    });
    if (!definition)
      throw new NotFoundException5("That field does not exist.");
    if (!definition.agentFilled || definition.archivedAt !== null) {
      throw new BadRequestException5("Your agents do not fill this field, so there is nothing to run.");
    }
    const ids = await this.missingRecordIds(definition.entity, id, FIELDS_CONFIG.backfill.maxRecordsPerRun);
    const result = await this.agent.fieldBackfillRecords(definition.entity, [definition.key], ids, "Asked to fill the rest");
    return { queued: result.queued > 0 || result.merged > 0 };
  }
  async queueBackfillForNewRecord(entity, recordId) {
    const definitions = await this.db.fieldDefinition.findMany({
      where: { entity, archivedAt: null, agentFilled: true },
      select: { key: true }
    });
    if (definitions.length === 0)
      return;
    await this.agent.fieldBackfillRecords(entity, definitions.map((definition) => definition.key), [recordId], "New record");
  }
  async missingRecordIds(entity, fieldId, cap) {
    const where = { fieldValues: { none: { fieldId } } };
    const rows = entity === "COMPANY" ? await this.db.company.findMany({
      where,
      select: { id: true },
      take: cap
    }) : entity === "CONTACT" ? await this.db.contact.findMany({
      where,
      select: { id: true },
      take: cap
    }) : await this.db.deal.findMany({
      where,
      select: { id: true },
      take: cap
    });
    return rows.map((row) => row.id);
  }
  async coverage(id) {
    const definition = await this.db.fieldDefinition.findUnique({
      where: { id },
      select: { entity: true }
    });
    if (!definition)
      throw new NotFoundException5("That field does not exist.");
    const column = recordColumn(definition.entity);
    const [filled, total] = await Promise.all([
      this.db.fieldValue.count({
        where: { fieldId: id, [column]: { not: null } }
      }),
      definition.entity === "COMPANY" ? this.db.company.count() : definition.entity === "CONTACT" ? this.db.contact.count() : this.db.deal.count()
    ]);
    return { filled, total };
  }
  async definitionsFor(entity, client = this.db) {
    return client.fieldDefinition.findMany({
      where: { entity, archivedAt: null },
      include: WITH_OPTIONS,
      orderBy: { position: "asc" }
    });
  }
  async valuesFor(entity, recordId) {
    const column = recordColumn(entity);
    const [definitions, rows] = await Promise.all([
      this.definitionsFor(entity),
      this.db.fieldValue.findMany({ where: { [column]: recordId } })
    ]);
    return attachValues(definitions, rows);
  }
  async tableValuesFor(entity, recordIds) {
    const byRecord = new Map;
    if (recordIds.length === 0)
      return byRecord;
    const definitions = await this.db.fieldDefinition.findMany({
      where: { entity, archivedAt: null, showOnTable: true },
      include: WITH_OPTIONS,
      orderBy: { position: "asc" }
    });
    if (definitions.length === 0)
      return byRecord;
    const column = recordColumn(entity);
    const rows = await this.db.fieldValue.findMany({
      where: {
        [column]: { in: recordIds },
        fieldId: { in: definitions.map((definition) => definition.id) }
      }
    });
    const byId = new Map(definitions.map((entry) => [entry.id, entry]));
    for (const row of rows) {
      const recordId = row[column];
      if (!recordId)
        continue;
      const definition = byId.get(row.fieldId);
      if (!definition)
        continue;
      const current = byRecord.get(recordId) ?? {};
      current[definition.key] = tableValue(definition, readValue(definition, row));
      byRecord.set(recordId, current);
    }
    return byRecord;
  }
  async filters(entity) {
    const definitions = await this.filterableFieldsFor(entity);
    return definitions.map(serializeField);
  }
  async filterableFieldsFor(entity) {
    return this.db.fieldDefinition.findMany({
      where: {
        entity,
        archivedAt: null,
        showOnFilter: true,
        type: { in: ["SELECT", "USER"] }
      },
      include: WITH_OPTIONS,
      orderBy: { position: "asc" }
    });
  }
  async filterFacetCounts(entity, relationWhere, definitions) {
    const facetCounts = {};
    if (definitions.length === 0)
      return facetCounts;
    const relation = RELATIONS[entity];
    const byId = new Map(definitions.map((definition) => [definition.id, definition]));
    const selectIds = definitions.filter((definition) => definition.type === "SELECT").map((definition) => definition.id);
    const userIds = definitions.filter((definition) => definition.type === "USER").map((definition) => definition.id);
    const [selectGroups, userGroups] = await Promise.all([
      selectIds.length > 0 ? this.db.fieldValue.groupBy({
        by: ["fieldId", "optionId"],
        where: {
          fieldId: { in: selectIds },
          optionId: { not: null },
          [relation]: relationWhere
        },
        _count: { _all: true }
      }) : [],
      userIds.length > 0 ? this.db.fieldValue.groupBy({
        by: ["fieldId", "userId"],
        where: {
          fieldId: { in: userIds },
          userId: { not: null },
          [relation]: relationWhere
        },
        _count: { _all: true }
      }) : []
    ]);
    for (const group of selectGroups) {
      const definition = byId.get(group.fieldId);
      if (!definition || !group.optionId)
        continue;
      const bucket = facetCounts[definition.key] ?? {};
      facetCounts[definition.key] = bucket;
      bucket[group.optionId] = (bucket[group.optionId] ?? 0) + group._count._all;
    }
    for (const group of userGroups) {
      const definition = byId.get(group.fieldId);
      if (!definition || !group.userId)
        continue;
      const bucket = facetCounts[definition.key] ?? {};
      facetCounts[definition.key] = bucket;
      bucket[group.userId] = (bucket[group.userId] ?? 0) + group._count._all;
    }
    return facetCounts;
  }
  fieldFilters(definitions, selected) {
    const byKey = new Map(definitions.map((definition) => [definition.key, definition]));
    return Object.entries(selected).filter(([, values]) => values.length > 0).flatMap(([key, values]) => {
      const definition = byKey.get(key);
      if (!definition)
        return [];
      return [
        {
          fieldValues: {
            some: definition.type === "USER" ? { fieldId: definition.id, userId: { in: values } } : { fieldId: definition.id, optionId: { in: values } }
          }
        }
      ];
    });
  }
  async applyValues(tx, entity, recordId, values) {
    if (Object.keys(values).length === 0)
      return;
    const definitions = await this.definitionsFor(entity, tx);
    try {
      await writeValues(tx, entity, recordId, definitions, values);
    } catch (error) {
      if (error instanceof FieldValueError) {
        throw new BadRequestException5(error.message);
      }
      throw error;
    }
  }
  translate(cause) {
    if (cause instanceof PrismaNamespace3.PrismaClientKnownRequestError && cause.code === "P2025") {
      throw new NotFoundException5("That field does not exist.");
    }
    throw cause;
  }
}
FieldsService = __legacyDecorateClassTS([
  Injectable21(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof AgentTriggerService === "undefined" ? Object : AgentTriggerService
  ])
], FieldsService);
function tableValue(definition, value) {
  if (definition.type !== "SELECT" || typeof value !== "string")
    return value;
  return definition.options.find((option) => option.id === value)?.label ?? null;
}

// src/fields/fields.router.ts
class FieldsRouter {
  fields;
  constructor(fields) {
    this.fields = fields;
  }
  async list(input) {
    return this.fields.list(input.entity, input.includeArchived);
  }
  async byKey(input) {
    return this.fields.byKey(input.entity, input.key);
  }
  async filters(input) {
    return this.fields.filters(input.entity);
  }
  async coverage(id) {
    return this.fields.coverage(id);
  }
  async create(input) {
    return this.fields.create(input);
  }
  async update(input) {
    return this.fields.update(input.id, input.data);
  }
  async reorder(input) {
    return this.fields.reorder(input);
  }
  async archive(id) {
    return this.fields.archive(id);
  }
  async restore(id) {
    return this.fields.restore(id);
  }
  async delete(id) {
    return this.fields.delete(id);
  }
  async backfill(id) {
    return this.fields.backfill(id);
  }
}
__legacyDecorateClassTS([
  Query5({
    input: fieldListInput,
    output: fieldListOutput,
    meta: restMeta("GET", "/fields", ["Fields"])
  }),
  __legacyDecorateParamTS(0, Input5()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], FieldsRouter.prototype, "list", null);
__legacyDecorateClassTS([
  Query5({
    input: fieldByKeyInput,
    output: serializedFieldOutput,
    meta: restMeta("GET", "/fields/{entity}/{key}", ["Fields"])
  }),
  __legacyDecorateParamTS(0, Input5()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], FieldsRouter.prototype, "byKey", null);
__legacyDecorateClassTS([
  Query5({
    input: fieldEntityInput,
    output: fieldFiltersOutput,
    meta: restMeta("GET", "/fields/{entity}/filterable", ["Fields"])
  }),
  __legacyDecorateParamTS(0, Input5()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], FieldsRouter.prototype, "filters", null);
__legacyDecorateClassTS([
  Query5({
    input: fieldIdInput,
    output: fieldCoverageOutput,
    meta: restMeta("GET", "/fields/{id}/coverage", ["Fields"])
  }),
  __legacyDecorateParamTS(0, Input5("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], FieldsRouter.prototype, "coverage", null);
__legacyDecorateClassTS([
  Mutation5({
    input: fieldCreateInput,
    output: serializedFieldOutput,
    meta: restMeta("POST", "/fields", ["Fields"])
  }),
  __legacyDecorateParamTS(0, Input5()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], FieldsRouter.prototype, "create", null);
__legacyDecorateClassTS([
  Mutation5({
    input: fieldUpdateArgs,
    output: serializedFieldOutput,
    meta: restMeta("PATCH", "/fields/{id}", ["Fields"])
  }),
  __legacyDecorateParamTS(0, Input5()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], FieldsRouter.prototype, "update", null);
__legacyDecorateClassTS([
  Mutation5({
    input: fieldReorderInput,
    output: fieldReorderOutput,
    meta: restMeta("POST", "/fields/reorder", ["Fields"])
  }),
  __legacyDecorateParamTS(0, Input5()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], FieldsRouter.prototype, "reorder", null);
__legacyDecorateClassTS([
  Mutation5({
    input: fieldIdInput,
    output: serializedFieldOutput,
    meta: restMeta("POST", "/fields/{id}/archive", ["Fields"])
  }),
  __legacyDecorateParamTS(0, Input5("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], FieldsRouter.prototype, "archive", null);
__legacyDecorateClassTS([
  Mutation5({
    input: fieldIdInput,
    output: serializedFieldOutput,
    meta: restMeta("POST", "/fields/{id}/restore", ["Fields"])
  }),
  __legacyDecorateParamTS(0, Input5("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], FieldsRouter.prototype, "restore", null);
__legacyDecorateClassTS([
  Mutation5({
    input: fieldIdInput,
    output: fieldDeleteOutput,
    meta: restMeta("DELETE", "/fields/{id}", ["Fields"])
  }),
  __legacyDecorateParamTS(0, Input5("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], FieldsRouter.prototype, "delete", null);
__legacyDecorateClassTS([
  Mutation5({
    input: fieldIdInput,
    output: fieldBackfillOutput,
    meta: restMeta("POST", "/fields/{id}/backfill", ["Fields"])
  }),
  __legacyDecorateParamTS(0, Input5("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], FieldsRouter.prototype, "backfill", null);
FieldsRouter = __legacyDecorateClassTS([
  Router5({ alias: "fields" }),
  UseMiddlewares5(AuthMiddleware),
  __legacyDecorateParamTS(0, Inject6(FieldsService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof FieldsService === "undefined" ? Object : FieldsService
  ])
], FieldsRouter);

// src/fields/fields.module.ts
class FieldsModule {
}
FieldsModule = __legacyDecorateClassTS([
  Module6({
    imports: [TrpcModule, AgentModule],
    providers: [FieldsService, FieldsRouter],
    exports: [FieldsService]
  })
], FieldsModule);

// src/companies/companies.router.ts
import { Inject as Inject7 } from "@nestjs/common";
import {
  Ctx as Ctx5,
  Input as Input6,
  Mutation as Mutation6,
  Query as Query6,
  Router as Router6,
  UseMiddlewares as UseMiddlewares6
} from "nestjs-trpc";

// src/companies/companies.contracts.ts
import { DealStage, EnrichmentStatus, RecordSource } from "@crm/db";
import { FIELD_TYPES as FIELD_TYPES2 } from "@crm/db/fields";
import { z as z13 } from "zod";

// src/crm/bulk.ts
import { BadRequestException as BadRequestException6 } from "@nestjs/common";
import { z as z12 } from "zod";
var MAX_BULK_IDS = 100;
var bulkIdsInput = z12.object({
  ids: z12.array(z12.string()).min(1, "Nothing was selected.").max(MAX_BULK_IDS, "Too many records at once — select a page at a time.")
});
async function requireOwner(db, ownerId) {
  if (!ownerId)
    return;
  const owner = await db.user.findUnique({
    where: { id: ownerId },
    select: { id: true }
  });
  if (!owner) {
    throw new BadRequestException6("That owner does not work here any more.");
  }
}
async function runBulk(ids, act) {
  const unique = [...new Set(ids)];
  let succeeded = 0;
  let skipped = 0;
  let message = null;
  for (const id of unique) {
    try {
      const outcome = await act(id);
      if (outcome === null) {
        skipped += 1;
      } else {
        succeeded += 1;
      }
    } catch (error) {
      message ??= error instanceof Error ? error.message : "Something went wrong.";
    }
  }
  return {
    requested: unique.length,
    succeeded,
    skipped,
    failed: unique.length - succeeded - skipped,
    message
  };
}

// src/companies/companies.contracts.ts
var companyListInput = listInput.extend({
  owner: z13.array(z13.string()).default([]),
  industry: z13.array(z13.string()).default([]),
  enrichment: z13.array(z13.string()).default([]),
  source: z13.array(z13.string()).default([]),
  activity: activityFacetInput.default([]),
  fields: z13.record(z13.string(), z13.array(z13.string())).default({}),
  archived: z13.boolean().default(false)
});
var companyCreateInput = z13.object({
  name: z13.string().trim().min(1, "A company needs a name."),
  domain: z13.string().trim().optional(),
  ownerId: z13.string().nullable().optional()
});
var companyUpdateInput = z13.object({
  name: z13.string().trim().min(1).optional(),
  domain: z13.string().optional(),
  website: z13.string().optional(),
  description: z13.string().optional(),
  industry: z13.string().optional(),
  city: z13.string().optional(),
  stateCode: z13.string().optional(),
  country: z13.string().optional(),
  phone: z13.string().optional(),
  email: z13.string().optional(),
  linkedinUrl: z13.string().optional(),
  ownerId: z13.string().nullable().optional(),
  fields: recordFieldValues.optional()
});
var companyUpdateArgs = z13.object({
  id: z13.string(),
  data: companyUpdateInput
});
var companyIdInput = z13.object({ id: z13.string() });
var setPrimaryContactInput = z13.object({
  companyId: z13.string(),
  contactId: z13.string().nullable()
});
var companyOptionsInput = z13.object({
  q: z13.string().default("")
});
var companyBulkInput = bulkIdsInput;
var companyBulkOwnerInput = bulkIdsInput.extend({
  ownerId: z13.string().nullable()
});
var companyEnrichmentStatus = z13.enum(Object.values(EnrichmentStatus));
var companyRecordSource = z13.enum(Object.values(RecordSource));
var companyDealStage = z13.enum(Object.values(DealStage));
var companyFieldType = z13.enum(FIELD_TYPES2);
var ownerSummaryOutput = z13.object({
  id: z13.string(),
  name: z13.string(),
  email: z13.string(),
  image: z13.string().nullable()
});
var companyFieldOptionOutput = z13.object({
  id: z13.string(),
  label: z13.string(),
  position: z13.number()
});
var companyRecordFieldOutput = z13.object({
  id: z13.string(),
  entity: fieldEntity,
  key: z13.string(),
  label: z13.string(),
  type: companyFieldType,
  typeLabel: z13.string(),
  agentFilled: z13.boolean(),
  agentBrief: z13.string().nullable(),
  required: z13.boolean(),
  showOnSheet: z13.boolean(),
  showOnTable: z13.boolean(),
  showOnFilter: z13.boolean(),
  position: z13.number(),
  archived: z13.boolean(),
  options: z13.array(companyFieldOptionOutput),
  value: z13.union([z13.string(), z13.number(), z13.boolean(), z13.null()])
});
var companyRowOutput = z13.object({
  id: z13.string(),
  name: z13.string(),
  domain: z13.string().nullable(),
  iconUrl: z13.string().nullable(),
  iconDarkUrl: z13.string().nullable(),
  iconTone: z13.string().nullable(),
  logoUrl: z13.string().nullable(),
  brandColor: z13.string().nullable(),
  industry: z13.string().nullable(),
  enrichmentStatus: companyEnrichmentStatus,
  queued: z13.boolean(),
  source: companyRecordSource,
  owner: ownerSummaryOutput.nullable(),
  contactCount: z13.number(),
  openDealCount: z13.number(),
  lastActivityAt: z13.string().nullable(),
  createdAt: z13.string(),
  archivedAt: z13.string().nullable(),
  fields: recordFieldValues
});
var companyListOutput = z13.object({
  rows: z13.array(companyRowOutput),
  total: z13.number(),
  facetCounts: z13.record(z13.string(), z13.record(z13.string(), z13.number()))
});
var companyDetailContactOutput = z13.object({
  id: z13.string(),
  firstName: z13.string(),
  lastName: z13.string().nullable(),
  email: z13.string().nullable(),
  title: z13.string().nullable(),
  imageUrl: z13.string().nullable(),
  owner: ownerSummaryOutput.nullable()
});
var companyDetailDealOutput = z13.object({
  id: z13.string(),
  name: z13.string(),
  stage: companyDealStage,
  currency: z13.string(),
  expectedCloseDate: z13.string().nullable(),
  owner: ownerSummaryOutput.nullable(),
  amountCents: z13.number().nullable(),
  baseAmountCents: z13.number().nullable()
});
var companyDetailPrimaryContactOutput = z13.object({
  id: z13.string(),
  firstName: z13.string(),
  lastName: z13.string().nullable(),
  email: z13.string().nullable(),
  phone: z13.string().nullable(),
  title: z13.string().nullable()
});
var companyDetailOutput = z13.object({
  id: z13.string(),
  name: z13.string(),
  domain: z13.string().nullable(),
  website: z13.string().nullable(),
  description: z13.string().nullable(),
  logoUrl: z13.string().nullable(),
  logoDarkUrl: z13.string().nullable(),
  iconUrl: z13.string().nullable(),
  iconDarkUrl: z13.string().nullable(),
  iconTone: z13.string().nullable(),
  brandColor: z13.string().nullable(),
  industry: z13.string().nullable(),
  subIndustry: z13.string().nullable(),
  city: z13.string().nullable(),
  stateCode: z13.string().nullable(),
  country: z13.string().nullable(),
  countryCode: z13.string().nullable(),
  phone: z13.string().nullable(),
  email: z13.string().nullable(),
  linkedinUrl: z13.string().nullable(),
  twitterUrl: z13.string().nullable(),
  githubUrl: z13.string().nullable(),
  pricingUrl: z13.string().nullable(),
  careersUrl: z13.string().nullable(),
  enrichmentStatus: companyEnrichmentStatus,
  enrichmentError: z13.string().nullable(),
  source: companyRecordSource,
  owner: ownerSummaryOutput.nullable(),
  contacts: z13.array(companyDetailContactOutput),
  fields: z13.array(companyRecordFieldOutput),
  queued: z13.boolean(),
  createdAt: z13.string(),
  archivedAt: z13.string().nullable(),
  enrichedAt: z13.string().nullable(),
  primaryContactId: z13.string().nullable(),
  primaryContact: companyDetailPrimaryContactOutput.nullable(),
  reportingCurrency: z13.string(),
  deals: z13.array(companyDetailDealOutput)
});
var companyOptionOutput = z13.array(z13.object({
  id: z13.string(),
  name: z13.string(),
  domain: z13.string().nullable(),
  iconUrl: z13.string().nullable()
}));
var companySummaryOutput = z13.object({
  id: z13.string(),
  name: z13.string(),
  domain: z13.string().nullable()
});
var companyArchiveResultOutput = z13.object({
  id: z13.string(),
  name: z13.string()
});
var companyBulkResultOutput = z13.object({
  requested: z13.number(),
  succeeded: z13.number(),
  failed: z13.number(),
  message: z13.string().nullable()
});
var companyEnrichOutput = z13.object({
  id: z13.string(),
  queued: z13.boolean()
});
var companyResearchOutput = z13.object({
  ok: z13.literal(true),
  queued: z13.boolean()
});
var companySetPrimaryContactOutput = z13.object({
  id: z13.string(),
  primaryContactId: z13.string().nullable()
});

// src/companies/companies.service.ts
import {
  Prisma as PrismaNamespace4
} from "@crm/db";
import { OPEN_DEAL_STAGES } from "@crm/db/deal-stage";
import {
  BadRequestException as BadRequestException7,
  ConflictException as ConflictException3,
  Injectable as Injectable23,
  Logger as Logger14,
  NotFoundException as NotFoundException6
} from "@nestjs/common";

// src/archive/archive-config.ts
var ARCHIVE = {
  prune: {
    maxBatch: 500
  }
};

// src/companies/domain.ts
function normalizeDomain(input) {
  const trimmed = input?.trim().toLowerCase();
  if (!trimmed)
    return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  let host;
  try {
    host = new URL(withScheme).hostname;
  } catch {
    return null;
  }
  const bare = host.replace(/^www\./, "");
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(bare) ? bare : null;
}
function domainFromEmail(email) {
  const at = email?.trim().toLowerCase().lastIndexOf("@") ?? -1;
  if (at < 1)
    return null;
  const domain = normalizeDomain(email?.slice(at + 1));
  if (!domain)
    return null;
  return FREE_EMAIL_DOMAINS.has(domain) || isMachineDomain(domain) ? null : domain;
}
function isMachineDomain(input) {
  const domain = normalizeDomain(input);
  if (!domain)
    return false;
  return MACHINE_DOMAINS.has(domain) || MACHINE_SUFFIXES.some((suffix) => domain.endsWith(suffix));
}
var FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "gmx.de",
  "mail.com",
  "yandex.ru",
  "qq.com",
  "163.com"
]);
var MACHINE_DOMAINS = new Set([
  "calendar.google.com",
  "googlegroups.com",
  "docs.google.com",
  "drive.google.com",
  "appspotmail.com",
  "amazonses.com",
  "sendgrid.net",
  "zoomcrc.com"
]);
var MACHINE_SUFFIXES = [
  ".calendar.google.com",
  ".bounces.google.com",
  ".appspotmail.com",
  ".amazonses.com",
  ".sendgrid.net",
  ".invalid",
  ".local",
  ".localhost"
];

// src/companies/favicon.service.ts
import { mirror } from "@crm/db/blob";
import { resolveFavicon } from "@crm/db/favicon";
import { Injectable as Injectable22, Logger as Logger13 } from "@nestjs/common";
class FaviconService {
  db;
  logger = new Logger13(FaviconService.name);
  constructor(db) {
    this.db = db;
  }
  async backfill(companyId, domain) {
    try {
      const resolved = await resolveFavicon(domain);
      if (!resolved)
        return false;
      const iconUrl = await mirror(resolved, `companies/${companyId}/icon`) ?? resolved;
      const { count } = await this.db.company.updateMany({
        where: { id: companyId, iconUrl: null, domain },
        data: { iconUrl }
      });
      if (count > 0) {
        this.logger.log({ message: "Favicon resolved", companyId, iconUrl });
      }
      return count > 0;
    } catch (error) {
      this.logger.debug({
        message: "Favicon lookup failed",
        companyId,
        domain,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
}
FaviconService = __legacyDecorateClassTS([
  Injectable22(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], FaviconService);

// src/companies/companies.service.ts
var OWNER_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true
};
var SORTABLE2 = {
  name: (dir) => ({ name: dir }),
  domain: (dir) => ({ domain: dir }),
  industry: (dir) => ({ industry: dir }),
  createdAt: (dir) => ({ createdAt: dir }),
  contacts: (dir) => ({ contacts: { _count: dir } }),
  deals: (dir) => ({ deals: { _count: dir } }),
  owner: (dir) => ({ owner: { name: dir } }),
  lastActivity: (dir) => ({ lastActivityAt: { sort: dir, nulls: "last" } }),
  archivedAt: (dir) => ({ archivedAt: { sort: dir, nulls: "last" } })
};

class CompaniesService {
  db;
  agent;
  queue;
  favicon;
  stamp;
  conversion;
  fields;
  logger = new Logger14(CompaniesService.name);
  constructor(db, agent, queue, favicon, stamp, conversion, fields) {
    this.db = db;
    this.agent = agent;
    this.queue = queue;
    this.favicon = favicon;
    this.stamp = stamp;
    this.conversion = conversion;
    this.fields = fields;
  }
  async list(input) {
    const filterableFields = await this.fields.filterableFieldsFor("COMPANY");
    const where = this.buildWhere(input, filterableFields);
    const { skip, take } = paginate(input);
    const [rows, total, facetCounts] = await Promise.all([
      this.db.company.findMany({
        where,
        skip,
        take,
        orderBy: resolveOrderBy(input, SORTABLE2, {
          createdAt: "desc"
        }),
        select: {
          id: true,
          name: true,
          domain: true,
          iconUrl: true,
          iconDarkUrl: true,
          iconTone: true,
          logoUrl: true,
          brandColor: true,
          industry: true,
          enrichmentStatus: true,
          source: true,
          owner: { select: OWNER_SELECT },
          _count: {
            select: {
              contacts: true,
              deals: { where: { stage: { in: [...OPEN_DEAL_STAGES] } } }
            }
          },
          lastActivityAt: true,
          createdAt: true,
          archivedAt: true
        }
      }),
      this.db.company.count({ where }),
      this.facetCounts(input, filterableFields)
    ]);
    const ids = rows.map((row) => row.id);
    const [queued, tableFields] = await Promise.all([
      this.queue.queuedCompanies(ids),
      this.fields.tableValuesFor("COMPANY", ids)
    ]);
    return {
      rows: rows.map((row) => ({
        id: row.id,
        name: row.name,
        domain: row.domain,
        iconUrl: row.iconUrl,
        iconDarkUrl: row.iconDarkUrl,
        iconTone: row.iconTone,
        logoUrl: row.logoUrl,
        brandColor: row.brandColor,
        industry: row.industry,
        enrichmentStatus: row.enrichmentStatus,
        queued: queued.has(row.id),
        source: row.source,
        owner: row.owner,
        contactCount: row._count.contacts,
        openDealCount: row._count.deals,
        lastActivityAt: row.lastActivityAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        archivedAt: row.archivedAt?.toISOString() ?? null,
        fields: tableFields.get(row.id) ?? {}
      })),
      total,
      facetCounts
    };
  }
  async byId(id) {
    const company = await this.db.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        domain: true,
        website: true,
        description: true,
        logoUrl: true,
        logoDarkUrl: true,
        iconUrl: true,
        iconDarkUrl: true,
        iconTone: true,
        brandColor: true,
        industry: true,
        subIndustry: true,
        city: true,
        stateCode: true,
        country: true,
        countryCode: true,
        phone: true,
        email: true,
        linkedinUrl: true,
        twitterUrl: true,
        githubUrl: true,
        pricingUrl: true,
        careersUrl: true,
        enrichmentStatus: true,
        enrichedAt: true,
        enrichmentError: true,
        source: true,
        createdAt: true,
        archivedAt: true,
        owner: { select: OWNER_SELECT },
        primaryContact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            title: true
          }
        },
        contacts: {
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            title: true,
            imageUrl: true,
            owner: { select: OWNER_SELECT }
          }
        },
        deals: {
          orderBy: [{ stage: "asc" }, { expectedCloseDate: "asc" }],
          select: {
            id: true,
            name: true,
            stage: true,
            amount: true,
            currency: true,
            baseAmount: true,
            expectedCloseDate: true,
            owner: { select: OWNER_SELECT }
          }
        }
      }
    });
    if (!company) {
      throw new NotFoundException6(`No company with id ${id}.`);
    }
    const {
      deals,
      primaryContact,
      enrichedAt,
      createdAt,
      archivedAt,
      ...rest
    } = company;
    return {
      ...rest,
      fields: await this.fields.valuesFor("COMPANY", id),
      queued: await this.queue.isQueued({ companyId: id }),
      createdAt: createdAt.toISOString(),
      archivedAt: archivedAt?.toISOString() ?? null,
      enrichedAt: enrichedAt?.toISOString() ?? null,
      primaryContactId: primaryContact?.id ?? null,
      primaryContact,
      reportingCurrency: await this.conversion.reportingCurrency(),
      deals: deals.map((deal) => ({
        ...deal,
        amount: undefined,
        baseAmount: undefined,
        amountCents: toCents(deal.amount),
        baseAmountCents: toCents(deal.baseAmount),
        expectedCloseDate: deal.expectedCloseDate?.toISOString() ?? null
      }))
    };
  }
  async options(q) {
    return this.db.company.findMany({
      where: this.searchFilter(q),
      select: { id: true, name: true, domain: true, iconUrl: true },
      orderBy: { name: "asc" },
      take: 100
    });
  }
  async create(input) {
    const domain = normalizeDomain(input.domain);
    if (domain) {
      const existing = await this.db.company.findFirst({
        where: { domain, archivedAt: null },
        select: { id: true, name: true }
      });
      if (existing) {
        throw new ConflictException3(`${existing.name} already uses the domain ${domain}.`);
      }
    }
    const company = await this.agent.withCrmEvents(async (tx, emit) => {
      const created = await tx.company.create({
        data: {
          name: input.name.trim(),
          domain,
          website: domain ? `https://${domain}` : null,
          ownerId: input.ownerId ?? null
        },
        select: { id: true, name: true, domain: true, createdAt: true }
      });
      await emit({
        type: "company.created",
        record: { kind: "company", id: created.id },
        occurredAt: created.createdAt,
        data: { name: created.name, domain: created.domain }
      });
      return created;
    });
    this.logger.log({
      message: "Company created",
      companyId: company.id,
      domain: company.domain
    });
    await this.agent.companyCreated(company.id);
    this.favicon.backfill(company.id, company.domain);
    this.fields.queueBackfillForNewRecord("COMPANY", company.id);
    return { id: company.id, name: company.name, domain: company.domain };
  }
  async update(id, input) {
    const data = {};
    if (input.name !== undefined)
      data.name = input.name.trim();
    if (input.website !== undefined)
      data.website = blankToNull(input.website);
    if (input.description !== undefined) {
      data.description = blankToNull(input.description);
    }
    if (input.industry !== undefined)
      data.industry = blankToNull(input.industry);
    if (input.city !== undefined)
      data.city = blankToNull(input.city);
    if (input.stateCode !== undefined) {
      data.stateCode = blankToNull(input.stateCode);
    }
    if (input.country !== undefined)
      data.country = blankToNull(input.country);
    if (input.phone !== undefined)
      data.phone = blankToNull(input.phone);
    if (input.email !== undefined)
      data.email = blankToNull(input.email);
    if (input.linkedinUrl !== undefined) {
      data.linkedinUrl = blankToNull(input.linkedinUrl);
    }
    if (input.ownerId !== undefined) {
      data.owner = input.ownerId ? { connect: { id: input.ownerId } } : { disconnect: true };
    }
    if (input.domain !== undefined) {
      const domain = normalizeDomain(input.domain);
      if (input.domain.trim() && !domain) {
        throw new BadRequestException7(`"${input.domain}" is not a domain — try something like "stripe.com".`);
      }
      data.domain = domain;
      const current = await this.db.company.findUnique({
        where: { id },
        select: { domain: true }
      });
      if (current && current.domain !== domain) {
        data.enrichmentStatus = "PENDING";
        data.enrichmentError = null;
        data.iconUrl = null;
        data.iconDarkUrl = null;
        data.iconTone = null;
      }
    }
    try {
      const updated = await this.db.$transaction(async (tx) => {
        if (input.fields) {
          await this.fields.applyValues(tx, "COMPANY", id, input.fields);
        }
        return tx.company.update({
          where: { id },
          data,
          select: { id: true, name: true, domain: true }
        });
      });
      if (data.enrichmentStatus === "PENDING") {
        await this.agent.companyCreated(id, "Domain changed — anything we knew was about a different company");
        this.favicon.backfill(id, updated.domain);
      }
      return updated;
    } catch (error) {
      throw this.translate(error, id);
    }
  }
  async archive(id) {
    try {
      const company = await this.db.company.update({
        where: { id },
        data: { archivedAt: new Date },
        select: { name: true }
      });
      this.logger.log({ message: "Company archived", companyId: id });
      return { id, name: company.name };
    } catch (error) {
      throw this.translate(error, id);
    }
  }
  async restore(id) {
    try {
      const company = await this.db.company.update({
        where: { id },
        data: { archivedAt: null },
        select: { name: true }
      });
      this.logger.log({ message: "Company restored", companyId: id });
      return { id, name: company.name };
    } catch (error) {
      throw this.translate(error, id);
    }
  }
  async purge(id, guard) {
    let deleted;
    try {
      deleted = await this.db.$transaction(async (tx) => {
        const [row] = await tx.$queryRaw`
					SELECT "archivedAt" FROM company WHERE id = ${id} FOR UPDATE
				`;
        if (!row) {
          if (guard)
            return null;
          throw new NotFoundException6(`No company with id ${id}.`);
        }
        if (guard && (!row.archivedAt || row.archivedAt > guard.archivedBefore)) {
          return null;
        }
        const targets = await this.stamp.targetsOf({ OR: [{ companyId: id }, { deal: { companyId: id } }] }, tx);
        const deals = await tx.deal.findMany({
          where: { companyId: id },
          select: { id: true }
        });
        await tx.agentTask.deleteMany({
          where: {
            OR: [
              { companyId: id },
              { dealId: { in: deals.map((deal) => deal.id) } }
            ]
          }
        });
        const company = await tx.company.delete({
          where: { id },
          select: { name: true }
        });
        return { targets, name: company.name };
      });
    } catch (error) {
      throw this.translate(error, id);
    }
    if (!deleted)
      return null;
    await this.stamp.recomputeAfterDelete(deleted.targets, { companyId: id });
    this.logger.log({
      message: "Company purged",
      companyId: id,
      name: deleted.name
    });
    return { id, name: deleted.name };
  }
  async purgeExpired(before) {
    const expired = await this.db.company.findMany({
      where: { archivedAt: { lte: before } },
      select: { id: true },
      take: ARCHIVE.prune.maxBatch
    });
    return runBulk(expired.map((row) => row.id), (id) => this.purge(id, { archivedBefore: before }));
  }
  async bulkAssignOwner(input) {
    const ownerId = input.ownerId || null;
    await requireOwner(this.db, ownerId);
    const ids = [...new Set(input.ids)];
    const { count } = await this.db.company.updateMany({
      where: { id: { in: ids } },
      data: { ownerId }
    });
    this.logger.log({
      message: "Companies reassigned",
      count,
      ownerId
    });
    return {
      requested: ids.length,
      succeeded: count,
      skipped: 0,
      failed: ids.length - count,
      message: null
    };
  }
  async bulkEnrich(ids) {
    return runBulk(ids, (id) => this.enrich(id));
  }
  async bulkArchive(ids) {
    return runBulk(ids, (id) => this.archive(id));
  }
  async bulkRestore(ids) {
    return runBulk(ids, (id) => this.restore(id));
  }
  async bulkPurge(ids) {
    return runBulk(ids, (id) => this.purge(id));
  }
  async enrich(id) {
    const company = await this.db.company.findUnique({
      where: { id },
      select: { id: true, updatedAt: true }
    });
    if (!company) {
      throw new NotFoundException6(`No company with id ${id}.`);
    }
    const queued = await this.agent.companyRequested(id, "A rep asked for a fresh look");
    if (queued) {
      await this.db.company.updateMany({
        where: { id, updatedAt: company.updatedAt },
        data: { enrichmentStatus: "PENDING", enrichmentError: null }
      });
    }
    return { id, queued };
  }
  async research(id, actingUserId) {
    const company = await this.db.company.findUnique({
      where: { id },
      select: { id: true, domain: true }
    });
    if (!company) {
      throw new NotFoundException6(`No company with id ${id}.`);
    }
    if (!company.domain) {
      throw new BadRequestException7("There is nothing to read without a domain — add one first.");
    }
    const queued = await this.agent.companyRequested(id, `Briefing requested by a rep (${actingUserId})`);
    return { ok: true, queued };
  }
  async setPrimaryContact(companyId, contactId) {
    if (contactId) {
      const contact = await this.db.contact.findUnique({
        where: { id: contactId },
        select: { companyId: true }
      });
      if (!contact) {
        throw new NotFoundException6(`No contact with id ${contactId}.`);
      }
      if (contact.companyId !== companyId) {
        throw new BadRequestException7("That contact does not work at this company.");
      }
    }
    try {
      return await this.db.company.update({
        where: { id: companyId },
        data: { primaryContactId: contactId },
        select: { id: true, primaryContactId: true }
      });
    } catch (error) {
      throw this.translate(error, companyId);
    }
  }
  searchFilter(q) {
    const term = q.trim();
    if (!term)
      return {};
    return {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { domain: { contains: term, mode: "insensitive" } }
      ]
    };
  }
  buildWhere(input, filterableFields) {
    const and = [
      this.searchFilter(input.q),
      archivedFilter(input.archived),
      ...this.fields.fieldFilters(filterableFields, input.fields)
    ];
    const owner = ownerFilter(input.owner);
    if (owner)
      and.push(owner);
    if (input.industry.length > 0)
      and.push({ industry: { in: input.industry } });
    if (input.enrichment.length > 0) {
      and.push({
        enrichmentStatus: { in: input.enrichment }
      });
    }
    if (input.source.length > 0) {
      and.push({ source: { in: input.source } });
    }
    const activity = activityFilter(input.activity);
    if (activity)
      and.push(activity);
    return { AND: and };
  }
  async facetCounts(input, filterableFields) {
    const where = {
      AND: [this.searchFilter(input.q), archivedFilter(input.archived)]
    };
    const [owners, industries, enrichment, sources, activity, fieldFacets] = await Promise.all([
      this.db.company.groupBy({
        by: ["ownerId"],
        where,
        _count: { _all: true }
      }),
      this.db.company.groupBy({
        by: ["industry"],
        where,
        _count: { _all: true }
      }),
      this.db.company.groupBy({
        by: ["enrichmentStatus"],
        where,
        _count: { _all: true }
      }),
      this.db.company.groupBy({
        by: ["source"],
        where,
        _count: { _all: true }
      }),
      activityFacetCounts((activityWhere) => this.db.company.count({ where: { AND: [where, activityWhere] } })),
      this.fields.filterFacetCounts("COMPANY", where, filterableFields)
    ]);
    return {
      owner: countsByKey(owners, "ownerId", FACET_UNASSIGNED),
      industry: countsByKey(industries, "industry"),
      enrichment: countsByKey(enrichment, "enrichmentStatus"),
      source: countsByKey(sources, "source"),
      activity,
      ...Object.fromEntries(Object.entries(fieldFacets).map(([key, counts]) => [
        `field:${key}`,
        counts
      ]))
    };
  }
  translate(cause, id) {
    if (cause instanceof PrismaNamespace4.PrismaClientKnownRequestError) {
      if (cause.code === "P2025") {
        throw new NotFoundException6(`No company with id ${id}.`);
      }
      if (cause.code === "P2002") {
        throw new ConflictException3("Another company already uses that domain.");
      }
    }
    throw cause;
  }
}
CompaniesService = __legacyDecorateClassTS([
  Injectable23(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof AgentTriggerService === "undefined" ? Object : AgentTriggerService,
    typeof AgentQueueService === "undefined" ? Object : AgentQueueService,
    typeof FaviconService === "undefined" ? Object : FaviconService,
    typeof ActivityStampService === "undefined" ? Object : ActivityStampService,
    typeof ConversionService === "undefined" ? Object : ConversionService,
    typeof FieldsService === "undefined" ? Object : FieldsService
  ])
], CompaniesService);

// src/companies/companies.router.ts
class CompaniesRouter {
  companies;
  constructor(companies) {
    this.companies = companies;
  }
  async list(input) {
    return this.companies.list(input);
  }
  async byId(id) {
    return this.companies.byId(id);
  }
  async options(q) {
    return this.companies.options(q);
  }
  async create(input) {
    return this.companies.create(input);
  }
  async update(input) {
    return this.companies.update(input.id, input.data);
  }
  async archive(id) {
    return this.companies.archive(id);
  }
  async restore(id) {
    return this.companies.restore(id);
  }
  async purge(id) {
    return this.companies.purge(id);
  }
  async bulkAssignOwner(input) {
    return this.companies.bulkAssignOwner(input);
  }
  async bulkEnrich(ids) {
    return this.companies.bulkEnrich(ids);
  }
  async bulkArchive(ids) {
    return this.companies.bulkArchive(ids);
  }
  async bulkRestore(ids) {
    return this.companies.bulkRestore(ids);
  }
  async bulkPurge(ids) {
    return this.companies.bulkPurge(ids);
  }
  async enrich(id) {
    return this.companies.enrich(id);
  }
  async research(ctx, id) {
    return this.companies.research(id, ctx.user.id);
  }
  async setPrimaryContact(input) {
    return this.companies.setPrimaryContact(input.companyId, input.contactId);
  }
}
__legacyDecorateClassTS([
  Query6({
    input: companyListInput,
    output: companyListOutput,
    meta: restMeta("POST", "/companies/search", ["Companies"])
  }),
  __legacyDecorateParamTS(0, Input6()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CompaniesRouter.prototype, "list", null);
__legacyDecorateClassTS([
  Query6({
    input: companyIdInput,
    output: companyDetailOutput,
    meta: restMeta("GET", "/companies/{id}", ["Companies"])
  }),
  __legacyDecorateParamTS(0, Input6("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CompaniesRouter.prototype, "byId", null);
__legacyDecorateClassTS([
  Query6({
    input: companyOptionsInput,
    output: companyOptionOutput,
    meta: restMeta("GET", "/companies/options", ["Companies"])
  }),
  __legacyDecorateParamTS(0, Input6("q")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CompaniesRouter.prototype, "options", null);
__legacyDecorateClassTS([
  Mutation6({
    input: companyCreateInput,
    output: companySummaryOutput,
    meta: restMeta("POST", "/companies", ["Companies"])
  }),
  __legacyDecorateParamTS(0, Input6()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CompaniesRouter.prototype, "create", null);
__legacyDecorateClassTS([
  Mutation6({
    input: companyUpdateArgs,
    output: companySummaryOutput,
    meta: restMeta("PATCH", "/companies/{id}", ["Companies"])
  }),
  __legacyDecorateParamTS(0, Input6()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CompaniesRouter.prototype, "update", null);
__legacyDecorateClassTS([
  Mutation6({
    input: companyIdInput,
    output: companyArchiveResultOutput,
    meta: restMeta("POST", "/companies/{id}/archive", ["Companies"])
  }),
  __legacyDecorateParamTS(0, Input6("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CompaniesRouter.prototype, "archive", null);
__legacyDecorateClassTS([
  Mutation6({
    input: companyIdInput,
    output: companyArchiveResultOutput,
    meta: restMeta("POST", "/companies/{id}/restore", ["Companies"])
  }),
  __legacyDecorateParamTS(0, Input6("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CompaniesRouter.prototype, "restore", null);
__legacyDecorateClassTS([
  Mutation6({
    input: companyIdInput,
    output: companyArchiveResultOutput,
    meta: restMeta("DELETE", "/companies/{id}", ["Companies"])
  }),
  __legacyDecorateParamTS(0, Input6("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CompaniesRouter.prototype, "purge", null);
__legacyDecorateClassTS([
  Mutation6({
    input: companyBulkOwnerInput,
    output: companyBulkResultOutput,
    meta: restMeta("POST", "/companies/bulk-assign-owner", ["Companies"])
  }),
  __legacyDecorateParamTS(0, Input6()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CompaniesRouter.prototype, "bulkAssignOwner", null);
__legacyDecorateClassTS([
  Mutation6({
    input: companyBulkInput,
    output: companyBulkResultOutput,
    meta: restMeta("POST", "/companies/bulk-enrich", ["Companies"])
  }),
  __legacyDecorateParamTS(0, Input6("ids")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    Array
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CompaniesRouter.prototype, "bulkEnrich", null);
__legacyDecorateClassTS([
  Mutation6({
    input: companyBulkInput,
    output: companyBulkResultOutput,
    meta: restMeta("POST", "/companies/bulk-archive", ["Companies"])
  }),
  __legacyDecorateParamTS(0, Input6("ids")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    Array
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CompaniesRouter.prototype, "bulkArchive", null);
__legacyDecorateClassTS([
  Mutation6({
    input: companyBulkInput,
    output: companyBulkResultOutput,
    meta: restMeta("POST", "/companies/bulk-restore", ["Companies"])
  }),
  __legacyDecorateParamTS(0, Input6("ids")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    Array
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CompaniesRouter.prototype, "bulkRestore", null);
__legacyDecorateClassTS([
  Mutation6({
    input: companyBulkInput,
    output: companyBulkResultOutput,
    meta: restMeta("POST", "/companies/bulk-purge", ["Companies"])
  }),
  __legacyDecorateParamTS(0, Input6("ids")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    Array
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CompaniesRouter.prototype, "bulkPurge", null);
__legacyDecorateClassTS([
  Mutation6({
    input: companyIdInput,
    output: companyEnrichOutput,
    meta: restMeta("POST", "/companies/{id}/enrich", ["Companies"])
  }),
  __legacyDecorateParamTS(0, Input6("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CompaniesRouter.prototype, "enrich", null);
__legacyDecorateClassTS([
  Mutation6({
    input: companyIdInput,
    output: companyResearchOutput,
    meta: restMeta("POST", "/companies/{id}/research", ["Companies"])
  }),
  __legacyDecorateParamTS(0, Ctx5()),
  __legacyDecorateParamTS(1, Input6("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CompaniesRouter.prototype, "research", null);
__legacyDecorateClassTS([
  Mutation6({
    input: setPrimaryContactInput,
    output: companySetPrimaryContactOutput,
    meta: restMeta("POST", "/companies/{companyId}/set-primary-contact", [
      "Companies"
    ])
  }),
  __legacyDecorateParamTS(0, Input6()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], CompaniesRouter.prototype, "setPrimaryContact", null);
CompaniesRouter = __legacyDecorateClassTS([
  Router6({ alias: "companies" }),
  UseMiddlewares6(AuthMiddleware),
  __legacyDecorateParamTS(0, Inject7(CompaniesService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof CompaniesService === "undefined" ? Object : CompaniesService
  ])
], CompaniesRouter);

// src/companies/company-directory.service.ts
import { EnrichmentStatus as EnrichmentStatus2 } from "@crm/db";
import { lockIdempotencyKey as lockIdempotencyKey3 } from "@crm/db/idempotency";
import { Injectable as Injectable24, Logger as Logger15 } from "@nestjs/common";
class CompanyDirectoryService {
  agent;
  logger = new Logger15(CompanyDirectoryService.name);
  constructor(agent) {
    this.agent = agent;
  }
  async companyForEmail(email, options = {}) {
    const domain = domainFromEmail(email);
    if (!domain)
      return null;
    const outcome = await this.agent.withCrmEvents(async (tx, emit) => {
      await lockIdempotencyKey3(tx, `company-directory:${domain}`);
      const existing = await tx.company.findFirst({
        where: { domain, archivedAt: null },
        select: { id: true }
      });
      if (existing)
        return { id: existing.id, created: false };
      const company = await tx.company.create({
        data: {
          name: domain,
          domain,
          website: `https://${domain}`,
          enrichmentStatus: EnrichmentStatus2.PENDING,
          ownerId: options.ownerId ?? null
        },
        select: { id: true, name: true, domain: true, createdAt: true }
      });
      await emit({
        type: "company.created",
        record: { kind: "company", id: company.id },
        occurredAt: company.createdAt,
        data: { name: company.name, domain: company.domain }
      });
      return { id: company.id, created: true };
    });
    if (!outcome.created)
      return outcome.id;
    await this.agent.companyCreated(outcome.id, `Created from an email domain (${domain}) — it has no name but the domain`);
    this.logger.log({
      message: "Company created from an email domain",
      companyId: outcome.id,
      domain
    });
    return outcome.id;
  }
}
CompanyDirectoryService = __legacyDecorateClassTS([
  Injectable24(),
  __legacyMetadataTS("design:paramtypes", [
    typeof AgentTriggerService === "undefined" ? Object : AgentTriggerService
  ])
], CompanyDirectoryService);

// src/companies/companies.module.ts
class CompaniesModule {
}
CompaniesModule = __legacyDecorateClassTS([
  Module7({
    imports: [FieldsModule, TrpcModule, AgentModule, CurrencyModule],
    providers: [
      CompaniesService,
      CompanyDirectoryService,
      CompaniesRouter,
      FaviconService
    ],
    exports: [CompaniesService, CompanyDirectoryService, FaviconService]
  })
], CompaniesModule);

// src/contacts/contacts.module.ts
import { Module as Module8 } from "@nestjs/common";

// src/contacts/contacts.router.ts
import { Inject as Inject8 } from "@nestjs/common";
import {
  Ctx as Ctx6,
  Input as Input7,
  Mutation as Mutation7,
  Query as Query7,
  Router as Router7,
  UseMiddlewares as UseMiddlewares7
} from "nestjs-trpc";

// src/contacts/contacts.contracts.ts
import {
  DealStage as DealStage2,
  EnrichmentStatus as EnrichmentStatus3,
  FactBand,
  FactStatus,
  RecordSource as RecordSource2
} from "@crm/db";
import { FIELD_ENTITIES as FIELD_ENTITIES2, FIELD_TYPES as FIELD_TYPES3 } from "@crm/db/fields";
import { z as z14 } from "zod";
var contactListInput = listInput.extend({
  owner: z14.array(z14.string()).default([]),
  company: z14.array(z14.string()).default([]),
  source: z14.array(z14.string()).default([]),
  title: z14.array(z14.string()).default([]),
  seniority: z14.array(z14.string()).default([]),
  persona: z14.array(z14.string()).default([]),
  activity: activityFacetInput.default([]),
  fields: z14.record(z14.string(), z14.array(z14.string())).default({}),
  archived: z14.boolean().default(false)
});
var contactCreateInput = z14.object({
  firstName: z14.string().trim().min(1, "A contact needs a first name."),
  lastName: z14.string().trim().optional(),
  email: z14.email("That is not an email address.").optional().or(z14.literal("")),
  phone: z14.string().trim().optional(),
  title: z14.string().trim().optional(),
  companyId: z14.string().nullable().optional(),
  ownerId: z14.string().nullable().optional()
});
var contactUpdateInput = z14.object({
  firstName: z14.string().trim().min(1).optional(),
  lastName: z14.string().optional(),
  email: z14.string().optional(),
  phone: z14.string().optional(),
  title: z14.string().optional(),
  linkedinUrl: z14.string().optional(),
  twitterUrl: z14.string().optional(),
  githubUrl: z14.string().optional(),
  companyId: z14.string().nullable().optional(),
  ownerId: z14.string().nullable().optional(),
  fields: recordFieldValues.optional()
});
var contactUpdateArgs = z14.object({
  id: z14.string(),
  data: contactUpdateInput
});
var contactIdInput = z14.object({ id: z14.string() });
var contactBulkInput = bulkIdsInput;
var contactBulkOwnerInput = bulkIdsInput.extend({
  ownerId: z14.string().nullable()
});
var contactBulkCompanyInput = bulkIdsInput.extend({
  companyId: z14.string().nullable()
});
var factDecisionInput = z14.object({
  factId: z14.string(),
  decision: z14.enum(["accept", "dismiss"])
});
var fieldValueOutput = z14.union([
  z14.string(),
  z14.number(),
  z14.boolean(),
  z14.null()
]);
var fieldOptionOutput2 = z14.object({
  id: z14.string(),
  label: z14.string(),
  position: z14.number()
});
var recordFieldOutput = z14.object({
  id: z14.string(),
  entity: z14.enum(FIELD_ENTITIES2),
  key: z14.string(),
  label: z14.string(),
  type: z14.enum(FIELD_TYPES3),
  typeLabel: z14.string(),
  agentFilled: z14.boolean(),
  agentBrief: z14.string().nullable(),
  required: z14.boolean(),
  showOnSheet: z14.boolean(),
  showOnTable: z14.boolean(),
  showOnFilter: z14.boolean(),
  position: z14.number(),
  archived: z14.boolean(),
  options: z14.array(fieldOptionOutput2),
  value: fieldValueOutput
});
var contactCompanyOutput = z14.object({
  id: z14.string(),
  name: z14.string(),
  domain: z14.string().nullable(),
  iconUrl: z14.string().nullable(),
  iconDarkUrl: z14.string().nullable(),
  iconTone: z14.string().nullable(),
  logoUrl: z14.string().nullable()
});
var contactOwnerOutput = z14.object({
  id: z14.string(),
  name: z14.string(),
  email: z14.string(),
  image: z14.string().nullable()
});
var contactRowOutput = z14.object({
  id: z14.string(),
  firstName: z14.string(),
  lastName: z14.string().nullable(),
  email: z14.string().nullable(),
  title: z14.string().nullable(),
  imageUrl: z14.string().nullable(),
  source: z14.enum(Object.values(RecordSource2)),
  company: contactCompanyOutput.nullable(),
  owner: contactOwnerOutput.nullable(),
  lastActivityAt: z14.string().nullable(),
  createdAt: z14.string(),
  archivedAt: z14.string().nullable(),
  fields: z14.record(z14.string(), fieldValueOutput)
});
var contactListOutput = z14.object({
  rows: z14.array(contactRowOutput),
  total: z14.number(),
  facetCounts: z14.record(z14.string(), z14.record(z14.string(), z14.number()))
});
var contactBriefSectionsOutput = z14.object({
  currentRole: z14.string().optional(),
  tenure: z14.string().optional(),
  previousRoles: z14.array(z14.string()).optional(),
  seniority: z14.string().optional(),
  function: z14.string().optional(),
  location: z14.string().optional()
});
var contactBriefOutput = z14.object({
  narrative: z14.string(),
  sections: contactBriefSectionsOutput,
  score: z14.number(),
  sourceUrl: z14.string().nullable(),
  refreshedAt: z14.string()
});
var contactFactEvidenceOutput = z14.object({
  kind: z14.string(),
  detail: z14.string(),
  sourceUrl: z14.string().optional()
});
var contactFactOutput = z14.object({
  id: z14.string(),
  field: z14.string(),
  value: z14.string(),
  score: z14.number(),
  band: z14.enum(Object.values(FactBand)),
  evidence: z14.array(contactFactEvidenceOutput),
  method: z14.string(),
  sourceUrl: z14.string().nullable(),
  status: z14.enum(Object.values(FactStatus)),
  observedAt: z14.string()
});
var contactRelationshipMeetingOutput = z14.object({
  title: z14.string(),
  startsAt: z14.string()
});
var contactRelationshipColleagueOutput = z14.object({
  id: z14.string(),
  name: z14.string(),
  title: z14.string().nullable()
});
var contactRelationshipOutput = z14.object({
  emails: z14.number(),
  threads: z14.number(),
  lastReplyAt: z14.string().nullable(),
  meetings: z14.number(),
  nextMeeting: contactRelationshipMeetingOutput.nullable(),
  colleagues: z14.array(contactRelationshipColleagueOutput)
});
var contactDealOutput = z14.object({
  id: z14.string(),
  name: z14.string(),
  stage: z14.enum(Object.values(DealStage2)),
  currency: z14.string(),
  expectedCloseDate: z14.string().nullable(),
  owner: contactOwnerOutput,
  role: z14.string().nullable(),
  amountCents: z14.number().nullable()
});
var contactByIdOutput = z14.object({
  id: z14.string(),
  firstName: z14.string(),
  lastName: z14.string().nullable(),
  email: z14.string().nullable(),
  phone: z14.string().nullable(),
  title: z14.string().nullable(),
  linkedinUrl: z14.string().nullable(),
  twitterUrl: z14.string().nullable(),
  githubUrl: z14.string().nullable(),
  imageUrl: z14.string().nullable(),
  enrichmentStatus: z14.enum(Object.values(EnrichmentStatus3)),
  enrichmentError: z14.string().nullable(),
  owner: contactOwnerOutput.nullable(),
  company: contactCompanyOutput.extend({
    industry: z14.string().nullable(),
    primaryContactId: z14.string().nullable()
  }).nullable(),
  fields: z14.array(recordFieldOutput),
  queued: z14.boolean(),
  createdAt: z14.string(),
  archivedAt: z14.string().nullable(),
  brief: contactBriefOutput.nullable(),
  facts: z14.array(contactFactOutput),
  relationship: contactRelationshipOutput,
  isPrimaryContact: z14.boolean(),
  deals: z14.array(contactDealOutput)
});
var contactBasicOutput = z14.object({
  id: z14.string(),
  firstName: z14.string(),
  lastName: z14.string().nullable()
});
var contactNameOutput = z14.object({
  id: z14.string(),
  name: z14.string()
});
var contactEnrichOutput = z14.object({
  id: z14.string(),
  queued: z14.boolean()
});
var bulkResultOutput = z14.object({
  requested: z14.number(),
  succeeded: z14.number(),
  failed: z14.number(),
  message: z14.string().nullable()
});
var decideFactOutput = z14.object({
  contactId: z14.string(),
  field: z14.string(),
  applied: z14.boolean()
});

// src/contacts/contacts.service.ts
import {
  FactStatus as FactStatus2,
  Prisma as PrismaNamespace5
} from "@crm/db";
import {
  ConflictException as ConflictException4,
  Injectable as Injectable25,
  Logger as Logger16,
  NotFoundException as NotFoundException7
} from "@nestjs/common";
var OWNER_SELECT2 = {
  id: true,
  name: true,
  email: true,
  image: true
};
var COMPANY_SELECT = {
  id: true,
  name: true,
  domain: true,
  iconUrl: true,
  iconDarkUrl: true,
  iconTone: true,
  logoUrl: true
};
var NO_COMPANY = "none";
var FACT_COLUMNS = {
  title: "title",
  seniority: "seniority",
  function: "function",
  linkedinUrl: "linkedinUrl",
  twitterUrl: "twitterUrl",
  githubUrl: "githubUrl"
};
var SORTABLE3 = {
  name: (dir) => [{ lastName: dir }, { firstName: dir }],
  email: (dir) => [{ email: dir }],
  title: (dir) => [{ title: dir }, { lastName: "asc" }],
  company: (dir) => [{ company: { name: dir } }, { lastName: "asc" }],
  createdAt: (dir) => [{ createdAt: dir }],
  owner: (dir) => [{ owner: { name: dir } }, { lastName: "asc" }],
  lastActivity: (dir) => [{ lastActivityAt: { sort: dir, nulls: "last" } }],
  archivedAt: (dir) => [{ archivedAt: { sort: dir, nulls: "last" } }]
};

class ContactsService {
  db;
  companies;
  agent;
  queue;
  stamp;
  fields;
  logger = new Logger16(ContactsService.name);
  constructor(db, companies, agent, queue, stamp, fields) {
    this.db = db;
    this.companies = companies;
    this.agent = agent;
    this.queue = queue;
    this.stamp = stamp;
    this.fields = fields;
  }
  async list(input) {
    const filterableFields = await this.fields.filterableFieldsFor("CONTACT");
    const where = this.buildWhere(input, filterableFields);
    const { skip, take } = paginate(input);
    const [rows, total, facetCounts] = await Promise.all([
      this.db.contact.findMany({
        where,
        skip,
        take,
        orderBy: resolveOrderBy(input, SORTABLE3, [{ createdAt: "desc" }]),
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          title: true,
          imageUrl: true,
          source: true,
          company: { select: COMPANY_SELECT },
          owner: { select: OWNER_SELECT2 },
          lastActivityAt: true,
          createdAt: true,
          archivedAt: true
        }
      }),
      this.db.contact.count({ where }),
      this.facetCounts(input, filterableFields)
    ]);
    const tableFields = await this.fields.tableValuesFor("CONTACT", rows.map((row) => row.id));
    return {
      rows: rows.map((row) => ({
        ...row,
        lastActivityAt: row.lastActivityAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        archivedAt: row.archivedAt?.toISOString() ?? null,
        fields: tableFields.get(row.id) ?? {}
      })),
      total,
      facetCounts
    };
  }
  async byId(id) {
    const contact = await this.db.contact.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        title: true,
        linkedinUrl: true,
        twitterUrl: true,
        githubUrl: true,
        imageUrl: true,
        enrichmentStatus: true,
        enrichmentError: true,
        createdAt: true,
        archivedAt: true,
        brief: {
          select: {
            narrative: true,
            sections: true,
            score: true,
            sourceUrl: true,
            refreshedAt: true
          }
        },
        facts: {
          where: { status: { in: [FactStatus2.APPLIED, FactStatus2.PROPOSED] } },
          orderBy: { observedAt: "desc" },
          select: {
            id: true,
            field: true,
            value: true,
            score: true,
            band: true,
            evidence: true,
            method: true,
            sourceUrl: true,
            status: true,
            observedAt: true
          }
        },
        company: {
          select: { ...COMPANY_SELECT, industry: true, primaryContactId: true }
        },
        owner: { select: OWNER_SELECT2 },
        deals: {
          select: {
            role: true,
            deal: {
              select: {
                id: true,
                name: true,
                stage: true,
                amount: true,
                currency: true,
                expectedCloseDate: true,
                owner: { select: OWNER_SELECT2 }
              }
            }
          }
        }
      }
    });
    if (!contact) {
      throw new NotFoundException7(`No contact with id ${id}.`);
    }
    const relationship = await this.relationship(id, contact.company?.id ?? null);
    const { deals, createdAt, archivedAt, brief, facts, company, ...rest } = contact;
    return {
      ...rest,
      company,
      fields: await this.fields.valuesFor("CONTACT", id),
      queued: await this.queue.isQueued({ contactId: id }),
      createdAt: createdAt.toISOString(),
      archivedAt: archivedAt?.toISOString() ?? null,
      brief: brief ? {
        ...brief,
        sections: brief.sections,
        refreshedAt: brief.refreshedAt.toISOString()
      } : null,
      facts: facts.map((fact) => ({
        ...fact,
        evidence: fact.evidence,
        observedAt: fact.observedAt.toISOString()
      })),
      relationship,
      isPrimaryContact: company?.primaryContactId === contact.id,
      deals: deals.map(({ role, deal }) => ({
        ...deal,
        role,
        amount: undefined,
        amountCents: toCents(deal.amount),
        expectedCloseDate: deal.expectedCloseDate?.toISOString() ?? null
      }))
    };
  }
  async create(input) {
    const email = normalizeEmail(input.email ?? "");
    if (email) {
      const existing = await this.db.contact.findFirst({
        where: {
          email: { equals: email, mode: "insensitive" },
          archivedAt: null
        },
        select: { id: true, firstName: true, lastName: true }
      });
      if (existing) {
        throw new ConflictException4(`${[existing.firstName, existing.lastName].filter(Boolean).join(" ")} already uses ${email}.`);
      }
    }
    const companyId = input.companyId ?? (email ? await this.companies.companyForEmail(email, {
      ownerId: input.ownerId
    }) : null);
    const contact = await this.agent.withCrmEvents(async (tx, emit) => {
      await this.allowAgain(tx, email);
      const created = await tx.contact.create({
        data: {
          firstName: input.firstName.trim(),
          lastName: blankToNull(input.lastName ?? ""),
          email,
          phone: blankToNull(input.phone ?? ""),
          title: blankToNull(input.title ?? ""),
          companyId,
          ownerId: input.ownerId ?? null
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          companyId: true,
          createdAt: true
        }
      });
      await emit({
        type: "contact.created",
        record: { kind: "contact", id: created.id },
        occurredAt: created.createdAt,
        data: {
          firstName: created.firstName,
          lastName: created.lastName,
          email: created.email,
          companyId: created.companyId
        }
      });
      return created;
    });
    this.logger.log({ message: "Contact created", contactId: contact.id });
    await this.agent.contactCreated(contact.id, "Added by a rep, with nothing on the record yet");
    this.fields.queueBackfillForNewRecord("CONTACT", contact.id).catch((error) => {
      this.logger.error({
        message: "Contact backfill queueing failed",
        contactId: contact.id
      }, error.stack);
    });
    return {
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName
    };
  }
  async archive(id) {
    try {
      const contact = await this.db.contact.update({
        where: { id },
        data: { archivedAt: new Date },
        select: { firstName: true, lastName: true }
      });
      this.logger.log({ message: "Contact archived", contactId: id });
      return { id, name: nameOf(contact) };
    } catch (error) {
      throw this.translate(error, id);
    }
  }
  async restore(id) {
    try {
      const contact = await this.db.contact.update({
        where: { id },
        data: { archivedAt: null },
        select: { firstName: true, lastName: true }
      });
      this.logger.log({ message: "Contact restored", contactId: id });
      return { id, name: nameOf(contact) };
    } catch (error) {
      throw this.translate(error, id);
    }
  }
  async purge(id, guard) {
    let deleted;
    try {
      deleted = await this.db.$transaction(async (tx) => {
        const [row] = await tx.$queryRaw`
					SELECT "archivedAt" FROM contact WHERE id = ${id} FOR UPDATE
				`;
        if (!row) {
          if (guard)
            return null;
          throw new NotFoundException7(`No contact with id ${id}.`);
        }
        if (guard && (!row.archivedAt || row.archivedAt > guard.archivedBefore)) {
          return null;
        }
        const targets = await this.stamp.targetsOf({ contactId: id }, tx);
        await tx.agentTask.deleteMany({ where: { contactId: id } });
        await tx.agentEvent.deleteMany({ where: { contactId: id } });
        const contact = await tx.contact.delete({
          where: { id },
          select: { firstName: true, lastName: true, email: true }
        });
        const name = nameOf(contact);
        const suppress = normalizeEmail(contact.email ?? "");
        if (suppress) {
          await tx.suppressedContact.upsert({
            where: { email: suppress },
            create: {
              email: suppress,
              reason: `Deleted from the CRM (${name})`
            },
            update: {}
          });
        }
        return { targets, name, suppressed: suppress !== null };
      });
    } catch (error) {
      throw this.translate(error, id);
    }
    if (!deleted)
      return null;
    await this.stamp.recomputeAfterDelete(deleted.targets, { contactId: id });
    this.logger.log({
      message: "Contact purged",
      contactId: id,
      suppressed: deleted.suppressed
    });
    return { id, name: deleted.name };
  }
  async purgeExpired(before) {
    const expired = await this.db.contact.findMany({
      where: { archivedAt: { lte: before } },
      select: { id: true },
      take: ARCHIVE.prune.maxBatch
    });
    return runBulk(expired.map((row) => row.id), (id) => this.purge(id, { archivedBefore: before }));
  }
  async update(id, input) {
    const data = {};
    if (input.firstName !== undefined)
      data.firstName = input.firstName.trim();
    if (input.lastName !== undefined)
      data.lastName = blankToNull(input.lastName);
    const email = input.email === undefined ? null : normalizeEmail(input.email);
    if (input.email !== undefined)
      data.email = email;
    if (input.phone !== undefined)
      data.phone = blankToNull(input.phone);
    if (input.title !== undefined)
      data.title = blankToNull(input.title);
    if (input.linkedinUrl !== undefined) {
      data.linkedinUrl = blankToNull(input.linkedinUrl);
    }
    if (input.twitterUrl !== undefined) {
      data.twitterUrl = blankToNull(input.twitterUrl);
    }
    if (input.githubUrl !== undefined) {
      data.githubUrl = blankToNull(input.githubUrl);
    }
    if (input.companyId !== undefined) {
      data.company = input.companyId ? { connect: { id: input.companyId } } : { disconnect: true };
    }
    if (input.ownerId !== undefined) {
      data.owner = input.ownerId ? { connect: { id: input.ownerId } } : { disconnect: true };
    }
    try {
      return await this.db.$transaction(async (tx) => {
        if (input.fields) {
          await this.fields.applyValues(tx, "CONTACT", id, input.fields);
        }
        const updated = await tx.contact.update({
          where: { id },
          data,
          select: { id: true, firstName: true, lastName: true }
        });
        if (email !== null) {
          await this.allowAgain(tx, email);
        }
        return updated;
      });
    } catch (error) {
      throw this.translate(error, id);
    }
  }
  async bulkAssignOwner(input) {
    const ownerId = input.ownerId || null;
    await requireOwner(this.db, ownerId);
    const ids = [...new Set(input.ids)];
    const { count } = await this.db.contact.updateMany({
      where: { id: { in: ids } },
      data: { ownerId }
    });
    this.logger.log({
      message: "Contacts reassigned",
      count,
      ownerId
    });
    return {
      requested: ids.length,
      succeeded: count,
      skipped: 0,
      failed: ids.length - count,
      message: null
    };
  }
  async bulkSetCompany(input) {
    const companyId = input.companyId || null;
    if (companyId) {
      const company = await this.db.company.findUnique({
        where: { id: companyId },
        select: { id: true }
      });
      if (!company) {
        throw new NotFoundException7(`No company with id ${companyId}.`);
      }
    }
    const ids = [...new Set(input.ids)];
    const { count } = await this.db.contact.updateMany({
      where: { id: { in: ids } },
      data: { companyId }
    });
    this.logger.log({
      message: "Contacts moved",
      count,
      companyId
    });
    return {
      requested: ids.length,
      succeeded: count,
      skipped: 0,
      failed: ids.length - count,
      message: null
    };
  }
  async bulkEnrich(ids) {
    return runBulk(ids, (id) => this.enrich(id));
  }
  async bulkArchive(ids) {
    return runBulk(ids, (id) => this.archive(id));
  }
  async bulkRestore(ids) {
    return runBulk(ids, (id) => this.restore(id));
  }
  async bulkPurge(ids) {
    return runBulk(ids, (id) => this.purge(id));
  }
  async allowAgain(tx, email) {
    if (!email)
      return;
    await tx.suppressedContact.deleteMany({
      where: { email: { equals: email, mode: "insensitive" } }
    });
  }
  async relationship(contactId, companyId) {
    const now = new Date;
    const [threads, lastReply, meetings, nextMeeting, colleagues] = await Promise.all([
      this.db.emailThread.aggregate({
        where: { contactId },
        _sum: { messageCount: true },
        _count: { _all: true }
      }),
      this.db.emailMessage.findFirst({
        where: { thread: { contactId }, direction: "INBOUND" },
        orderBy: { sentAt: "desc" },
        select: { sentAt: true }
      }),
      this.db.calendarEvent.count({
        where: {
          OR: [{ contactId }, { attendees: { some: { contactId } } }]
        }
      }),
      this.db.calendarEvent.findFirst({
        where: {
          startsAt: { gt: now },
          OR: [{ contactId }, { attendees: { some: { contactId } } }]
        },
        orderBy: { startsAt: "asc" },
        select: { title: true, startsAt: true }
      }),
      companyId ? this.db.contact.findMany({
        where: { companyId, id: { not: contactId } },
        orderBy: { lastActivityAt: { sort: "desc", nulls: "last" } },
        take: 4,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          title: true
        }
      }) : Promise.resolve([])
    ]);
    return {
      emails: threads._sum.messageCount ?? 0,
      threads: threads._count._all,
      lastReplyAt: lastReply?.sentAt.toISOString() ?? null,
      meetings,
      nextMeeting: nextMeeting ? {
        title: nextMeeting.title,
        startsAt: nextMeeting.startsAt.toISOString()
      } : null,
      colleagues: colleagues.map((colleague) => ({
        id: colleague.id,
        name: [colleague.firstName, colleague.lastName].filter(Boolean).join(" "),
        title: colleague.title
      }))
    };
  }
  async enrich(id) {
    const contact = await this.db.contact.findUnique({
      where: { id },
      select: { id: true, imageUrl: true, linkedinUrl: true, updatedAt: true }
    });
    if (!contact) {
      throw new NotFoundException7(`No contact with id ${id}.`);
    }
    const queued = await this.agent.contactCreated(id, contact.linkedinUrl && !contact.imageUrl ? "A rep asked for a fresh look — they have a LinkedIn profile on file but no picture" : "A rep asked for a fresh look", true);
    if (queued) {
      await this.db.contact.updateMany({
        where: { id, updatedAt: contact.updatedAt },
        data: { enrichmentStatus: "PENDING", enrichmentError: null }
      });
    }
    return { id, queued };
  }
  async decideFact(input, userId) {
    const fact = await this.db.contactFact.findUnique({
      where: { id: input.factId },
      select: {
        id: true,
        contactId: true,
        field: true,
        value: true,
        status: true
      }
    });
    if (!fact) {
      throw new NotFoundException7(`No fact with id ${input.factId}.`);
    }
    if (fact.status !== FactStatus2.PROPOSED) {
      throw new ConflictException4("That suggestion has already been settled.");
    }
    const accepted = input.decision === "accept";
    const column = FACT_COLUMNS[fact.field];
    await this.db.$transaction(async (tx) => {
      if (accepted) {
        await tx.contactFact.updateMany({
          where: {
            contactId: fact.contactId,
            field: fact.field,
            id: { not: fact.id },
            status: { in: [FactStatus2.APPLIED, FactStatus2.PROPOSED] }
          },
          data: { status: FactStatus2.SUPERSEDED, supersededAt: new Date }
        });
      }
      await tx.contactFact.update({
        where: { id: fact.id },
        data: {
          status: accepted ? FactStatus2.APPLIED : FactStatus2.DISMISSED,
          decidedById: userId,
          decidedAt: new Date
        }
      });
      if (accepted && column) {
        await tx.contact.update({
          where: { id: fact.contactId },
          data: { [column]: fact.value }
        });
      }
      if (accepted && fact.field === "name") {
        const [firstName, ...rest] = fact.value.trim().split(/\s+/);
        if (firstName) {
          await tx.contact.update({
            where: { id: fact.contactId },
            data: {
              firstName,
              lastName: rest.length > 0 ? rest.join(" ") : null
            }
          });
        }
      }
    });
    this.logger.log({
      message: "Fact decided",
      factId: fact.id,
      contactId: fact.contactId,
      field: fact.field,
      decision: input.decision
    });
    return { contactId: fact.contactId, field: fact.field, applied: accepted };
  }
  searchFilter(q) {
    const term = q.trim();
    if (!term)
      return {};
    return {
      OR: [
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { company: { name: { contains: term, mode: "insensitive" } } }
      ]
    };
  }
  companyFilter(values) {
    if (values.length === 0)
      return;
    const { ids, includesSentinel } = splitSentinel(values, NO_COMPANY);
    if (includesSentinel && ids.length === 0)
      return { companyId: null };
    if (!includesSentinel)
      return { companyId: { in: ids } };
    return { OR: [{ companyId: { in: ids } }, { companyId: null }] };
  }
  buildWhere(input, filterableFields) {
    const and = [
      this.searchFilter(input.q),
      archivedFilter(input.archived),
      ...this.fields.fieldFilters(filterableFields, input.fields)
    ];
    const owner = ownerFilter(input.owner);
    if (owner)
      and.push(owner);
    const company = this.companyFilter(input.company);
    if (company)
      and.push(company);
    if (input.source.length > 0) {
      and.push({ source: { in: input.source } });
    }
    if (input.title.length > 0)
      and.push({ title: { in: input.title } });
    if (input.seniority.length > 0) {
      and.push({ seniority: { in: input.seniority } });
    }
    if (input.persona.length > 0)
      and.push({ function: { in: input.persona } });
    const activity = activityFilter(input.activity);
    if (activity)
      and.push(activity);
    return { AND: and };
  }
  async facetCounts(input, filterableFields) {
    const where = {
      AND: [this.searchFilter(input.q), archivedFilter(input.archived)]
    };
    const [
      owners,
      companies,
      sources,
      titles,
      seniorities,
      personas,
      activity,
      fieldFacets
    ] = await Promise.all([
      this.db.contact.groupBy({
        by: ["ownerId"],
        where,
        _count: { _all: true }
      }),
      this.db.contact.groupBy({
        by: ["companyId"],
        where,
        _count: { _all: true }
      }),
      this.db.contact.groupBy({
        by: ["source"],
        where,
        _count: { _all: true }
      }),
      this.db.contact.groupBy({
        by: ["title"],
        where,
        _count: { _all: true }
      }),
      this.db.contact.groupBy({
        by: ["seniority"],
        where,
        _count: { _all: true }
      }),
      this.db.contact.groupBy({
        by: ["function"],
        where,
        _count: { _all: true }
      }),
      activityFacetCounts((activityWhere) => this.db.contact.count({ where: { AND: [where, activityWhere] } })),
      this.fields.filterFacetCounts("CONTACT", where, filterableFields)
    ]);
    return {
      owner: countsByKey(owners, "ownerId", FACET_UNASSIGNED),
      company: countsByKey(companies, "companyId", NO_COMPANY),
      source: countsByKey(sources, "source"),
      title: countsByKey(titles, "title"),
      seniority: countsByKey(seniorities, "seniority"),
      persona: countsByKey(personas, "function"),
      activity,
      ...Object.fromEntries(Object.entries(fieldFacets).map(([key, counts]) => [
        `field:${key}`,
        counts
      ]))
    };
  }
  translate(cause, id) {
    if (cause instanceof PrismaNamespace5.PrismaClientKnownRequestError) {
      if (cause.code === "P2025") {
        throw new NotFoundException7(`No contact with id ${id}.`);
      }
      if (cause.code === "P2002") {
        throw new ConflictException4("Another contact already uses that email address.");
      }
    }
    throw cause;
  }
}
ContactsService = __legacyDecorateClassTS([
  Injectable25(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof CompanyDirectoryService === "undefined" ? Object : CompanyDirectoryService,
    typeof AgentTriggerService === "undefined" ? Object : AgentTriggerService,
    typeof AgentQueueService === "undefined" ? Object : AgentQueueService,
    typeof ActivityStampService === "undefined" ? Object : ActivityStampService,
    typeof FieldsService === "undefined" ? Object : FieldsService
  ])
], ContactsService);
function nameOf(contact) {
  return [contact.firstName, contact.lastName].filter(Boolean).join(" ");
}

// src/contacts/contacts.router.ts
class ContactsRouter {
  contacts;
  constructor(contacts) {
    this.contacts = contacts;
  }
  async list(input) {
    return this.contacts.list(input);
  }
  async byId(id) {
    return this.contacts.byId(id);
  }
  async create(input) {
    return this.contacts.create(input);
  }
  async update(input) {
    return this.contacts.update(input.id, input.data);
  }
  async archive(id) {
    return this.contacts.archive(id);
  }
  async restore(id) {
    return this.contacts.restore(id);
  }
  async purge(id) {
    return this.contacts.purge(id);
  }
  async enrich(id) {
    return this.contacts.enrich(id);
  }
  async bulkAssignOwner(input) {
    return this.contacts.bulkAssignOwner(input);
  }
  async bulkSetCompany(input) {
    return this.contacts.bulkSetCompany(input);
  }
  async bulkEnrich(ids) {
    return this.contacts.bulkEnrich(ids);
  }
  async bulkArchive(ids) {
    return this.contacts.bulkArchive(ids);
  }
  async bulkRestore(ids) {
    return this.contacts.bulkRestore(ids);
  }
  async bulkPurge(ids) {
    return this.contacts.bulkPurge(ids);
  }
  async decideFact(ctx, input) {
    return this.contacts.decideFact(input, ctx.user.id);
  }
}
__legacyDecorateClassTS([
  Query7({
    input: contactListInput,
    output: contactListOutput,
    meta: restMeta("POST", "/contacts/search", ["Contacts"])
  }),
  __legacyDecorateParamTS(0, Input7()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ContactsRouter.prototype, "list", null);
__legacyDecorateClassTS([
  Query7({
    input: contactIdInput,
    output: contactByIdOutput,
    meta: restMeta("GET", "/contacts/{id}", ["Contacts"])
  }),
  __legacyDecorateParamTS(0, Input7("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ContactsRouter.prototype, "byId", null);
__legacyDecorateClassTS([
  Mutation7({
    input: contactCreateInput,
    output: contactBasicOutput,
    meta: restMeta("POST", "/contacts", ["Contacts"])
  }),
  __legacyDecorateParamTS(0, Input7()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ContactsRouter.prototype, "create", null);
__legacyDecorateClassTS([
  Mutation7({
    input: contactUpdateArgs,
    output: contactBasicOutput,
    meta: restMeta("PATCH", "/contacts/{id}", ["Contacts"])
  }),
  __legacyDecorateParamTS(0, Input7()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ContactsRouter.prototype, "update", null);
__legacyDecorateClassTS([
  Mutation7({
    input: contactIdInput,
    output: contactNameOutput,
    meta: restMeta("POST", "/contacts/{id}/archive", ["Contacts"])
  }),
  __legacyDecorateParamTS(0, Input7("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ContactsRouter.prototype, "archive", null);
__legacyDecorateClassTS([
  Mutation7({
    input: contactIdInput,
    output: contactNameOutput,
    meta: restMeta("POST", "/contacts/{id}/restore", ["Contacts"])
  }),
  __legacyDecorateParamTS(0, Input7("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ContactsRouter.prototype, "restore", null);
__legacyDecorateClassTS([
  Mutation7({
    input: contactIdInput,
    output: contactNameOutput,
    meta: restMeta("DELETE", "/contacts/{id}", ["Contacts"])
  }),
  __legacyDecorateParamTS(0, Input7("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ContactsRouter.prototype, "purge", null);
__legacyDecorateClassTS([
  Mutation7({
    input: contactIdInput,
    output: contactEnrichOutput,
    meta: restMeta("POST", "/contacts/{id}/enrich", ["Contacts"])
  }),
  __legacyDecorateParamTS(0, Input7("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ContactsRouter.prototype, "enrich", null);
__legacyDecorateClassTS([
  Mutation7({
    input: contactBulkOwnerInput,
    output: bulkResultOutput,
    meta: restMeta("POST", "/contacts/bulk-assign-owner", ["Contacts"])
  }),
  __legacyDecorateParamTS(0, Input7()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ContactsRouter.prototype, "bulkAssignOwner", null);
__legacyDecorateClassTS([
  Mutation7({
    input: contactBulkCompanyInput,
    output: bulkResultOutput,
    meta: restMeta("POST", "/contacts/bulk-set-company", ["Contacts"])
  }),
  __legacyDecorateParamTS(0, Input7()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ContactsRouter.prototype, "bulkSetCompany", null);
__legacyDecorateClassTS([
  Mutation7({
    input: contactBulkInput,
    output: bulkResultOutput,
    meta: restMeta("POST", "/contacts/bulk-enrich", ["Contacts"])
  }),
  __legacyDecorateParamTS(0, Input7("ids")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    Array
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ContactsRouter.prototype, "bulkEnrich", null);
__legacyDecorateClassTS([
  Mutation7({
    input: contactBulkInput,
    output: bulkResultOutput,
    meta: restMeta("POST", "/contacts/bulk-archive", ["Contacts"])
  }),
  __legacyDecorateParamTS(0, Input7("ids")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    Array
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ContactsRouter.prototype, "bulkArchive", null);
__legacyDecorateClassTS([
  Mutation7({
    input: contactBulkInput,
    output: bulkResultOutput,
    meta: restMeta("POST", "/contacts/bulk-restore", ["Contacts"])
  }),
  __legacyDecorateParamTS(0, Input7("ids")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    Array
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ContactsRouter.prototype, "bulkRestore", null);
__legacyDecorateClassTS([
  Mutation7({
    input: contactBulkInput,
    output: bulkResultOutput,
    meta: restMeta("POST", "/contacts/bulk-purge", ["Contacts"])
  }),
  __legacyDecorateParamTS(0, Input7("ids")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    Array
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ContactsRouter.prototype, "bulkPurge", null);
__legacyDecorateClassTS([
  Mutation7({
    input: factDecisionInput,
    output: decideFactOutput,
    meta: restMeta("POST", "/contacts/decide-fact", ["Contacts"])
  }),
  __legacyDecorateParamTS(0, Ctx6()),
  __legacyDecorateParamTS(1, Input7()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ContactsRouter.prototype, "decideFact", null);
ContactsRouter = __legacyDecorateClassTS([
  Router7({ alias: "contacts" }),
  UseMiddlewares7(AuthMiddleware),
  __legacyDecorateParamTS(0, Inject8(ContactsService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof ContactsService === "undefined" ? Object : ContactsService
  ])
], ContactsRouter);

// src/contacts/contacts.module.ts
class ContactsModule {
}
ContactsModule = __legacyDecorateClassTS([
  Module8({
    imports: [FieldsModule, TrpcModule, AgentModule, CompaniesModule],
    providers: [ContactsService, ContactsRouter],
    exports: [ContactsService]
  })
], ContactsModule);

// src/deals/deals.module.ts
import { Module as Module9 } from "@nestjs/common";

// src/deals/deals.router.ts
import { Inject as Inject9 } from "@nestjs/common";
import {
  Ctx as Ctx7,
  Input as Input8,
  Mutation as Mutation8,
  Query as Query8,
  Router as Router8,
  UseMiddlewares as UseMiddlewares8
} from "nestjs-trpc";

// src/deals/deals.contracts.ts
import { DealStage as DealStage3 } from "@crm/db";
import { FIELD_ENTITIES as FIELD_ENTITIES3, FIELD_TYPES as FIELD_TYPES4 } from "@crm/db/fields";
import { z as z15 } from "zod";
var MAX_AMOUNT_CENTS = 99999999999999;
var amountCents = z15.number().int().min(0).max(MAX_AMOUNT_CENTS, "That amount is too large to record.").nullable().optional();
var CLOSING_WINDOWS = [
  "overdue",
  "this-month",
  "next-month",
  "later",
  "none"
];
var dealListInput = listInput.extend({
  status: z15.string().default("all"),
  owner: z15.array(z15.string()).default([]),
  stage: z15.array(z15.string()).default([]),
  closing: z15.array(z15.string()).default([]),
  fields: z15.record(z15.string(), z15.array(z15.string())).default({}),
  archived: z15.boolean().default(false)
});
var stageEnum = z15.enum(Object.values(DealStage3));
var dealCreateInput = z15.object({
  name: z15.string().trim().min(1, "A deal needs a name."),
  companyId: z15.string().min(1, "A deal belongs to a company."),
  ownerId: z15.string().min(1, "A deal needs an owner."),
  stage: stageEnum.optional(),
  amountCents,
  currency: currencyCode.optional(),
  expectedCloseDate: z15.string().nullable().optional()
});
var dealUpdateInput = z15.object({
  name: z15.string().trim().min(1).optional(),
  description: z15.string().nullable().optional(),
  companyId: z15.string().optional(),
  ownerId: z15.string().optional(),
  amountCents,
  currency: currencyCode.optional(),
  expectedCloseDate: z15.string().nullable().optional(),
  fields: recordFieldValues.optional()
});
var dealUpdateArgs = z15.object({
  id: z15.string(),
  data: dealUpdateInput
});
var dealIdInput = z15.object({ id: z15.string() });
var setStageInput = z15.object({
  id: z15.string(),
  stage: stageEnum,
  closedReason: z15.string().trim().optional()
});
var dealContactRole = z15.string().trim().max(80, "That role is too long.").nullable();
var dealContactsInput = z15.object({ dealId: z15.string() });
var dealAttachContactInput = z15.object({
  dealId: z15.string(),
  contactId: z15.string().min(1, "Choose somebody to bring onto the deal."),
  role: dealContactRole.optional()
});
var dealDetachContactInput = z15.object({
  dealId: z15.string(),
  contactId: z15.string()
});
var dealContactRoleInput = z15.object({
  dealId: z15.string(),
  contactId: z15.string(),
  role: dealContactRole
});
var dealBulkInput = bulkIdsInput;
var dealBulkOwnerInput = bulkIdsInput.extend({
  ownerId: z15.string().min(1, "A deal needs an owner.")
});
var dealBulkStageInput = bulkIdsInput.extend({
  stage: stageEnum,
  closedReason: z15.string().trim().optional()
});
var fieldValueOutput2 = z15.union([
  z15.string(),
  z15.number(),
  z15.boolean(),
  z15.null()
]);
var fieldOptionOutput3 = z15.object({
  id: z15.string(),
  label: z15.string(),
  position: z15.number()
});
var recordFieldOutput2 = z15.object({
  id: z15.string(),
  entity: z15.enum(FIELD_ENTITIES3),
  key: z15.string(),
  label: z15.string(),
  type: z15.enum(FIELD_TYPES4),
  typeLabel: z15.string(),
  agentFilled: z15.boolean(),
  agentBrief: z15.string().nullable(),
  required: z15.boolean(),
  showOnSheet: z15.boolean(),
  showOnTable: z15.boolean(),
  showOnFilter: z15.boolean(),
  position: z15.number(),
  archived: z15.boolean(),
  options: z15.array(fieldOptionOutput3),
  value: fieldValueOutput2
});
var dealOwnerOutput = z15.object({
  id: z15.string(),
  name: z15.string(),
  email: z15.string(),
  image: z15.string().nullable()
});
var dealCompanyOutput = z15.object({
  id: z15.string(),
  name: z15.string(),
  domain: z15.string().nullable(),
  iconUrl: z15.string().nullable(),
  iconDarkUrl: z15.string().nullable(),
  iconTone: z15.string().nullable(),
  logoUrl: z15.string().nullable()
});
var dealCompanyDetailOutput = dealCompanyOutput.extend({
  industry: z15.string().nullable()
});
var dealContactSummaryOutput = z15.object({
  id: z15.string(),
  firstName: z15.string(),
  lastName: z15.string().nullable(),
  email: z15.string().nullable(),
  title: z15.string().nullable(),
  imageUrl: z15.string().nullable()
});
var dealContactOutput = dealContactSummaryOutput.extend({
  role: z15.string().nullable()
});
var dealListRowOutput = z15.object({
  id: z15.string(),
  name: z15.string(),
  stage: stageEnum,
  currency: z15.string(),
  company: dealCompanyOutput,
  owner: dealOwnerOutput,
  amountCents: z15.number().nullable(),
  baseAmountCents: z15.number().nullable(),
  expectedCloseDate: z15.string().nullable(),
  closedAt: z15.string().nullable(),
  lastActivityAt: z15.string().nullable(),
  createdAt: z15.string(),
  archivedAt: z15.string().nullable(),
  fields: z15.record(z15.string(), fieldValueOutput2)
});
var dealListOutput = z15.object({
  rows: z15.array(dealListRowOutput),
  total: z15.number(),
  facetCounts: z15.record(z15.string(), z15.record(z15.string(), z15.number())),
  openValueCents: z15.number().nullable(),
  reportingCurrency: z15.string(),
  unconverted: z15.object({
    count: z15.number(),
    currencies: z15.array(z15.string())
  })
});
var dealDetailOutput = z15.object({
  id: z15.string(),
  name: z15.string(),
  description: z15.string().nullable(),
  stage: stageEnum,
  currency: z15.string(),
  closedReason: z15.string().nullable(),
  company: dealCompanyDetailOutput,
  owner: dealOwnerOutput,
  fields: z15.array(recordFieldOutput2),
  amountCents: z15.number().nullable(),
  baseAmountCents: z15.number().nullable(),
  reportingCurrency: z15.string(),
  fxRate: z15.number().nullable(),
  fxRateAt: z15.string().nullable(),
  stageChangedAt: z15.string(),
  expectedCloseDate: z15.string().nullable(),
  closedAt: z15.string().nullable(),
  createdAt: z15.string(),
  archivedAt: z15.string().nullable(),
  contacts: z15.array(dealContactOutput)
});
var dealCreateOutput = z15.object({
  id: z15.string(),
  name: z15.string(),
  companyId: z15.string()
});
var dealMutateOutput = z15.object({
  id: z15.string(),
  name: z15.string()
});
var dealSetStageOutput = z15.object({
  id: z15.string(),
  stage: stageEnum,
  changed: z15.boolean()
});
var dealContactOptionsOutput = z15.array(dealContactSummaryOutput);
var dealContactLinkOutput = z15.object({
  dealId: z15.string(),
  contactId: z15.string()
});
var dealContactRoleOutput = z15.object({
  dealId: z15.string(),
  contactId: z15.string(),
  role: z15.string().nullable()
});
var dealBulkResultOutput = z15.object({
  requested: z15.number(),
  succeeded: z15.number(),
  failed: z15.number(),
  message: z15.string().nullable()
});

// src/deals/deals.service.ts
import {
  ActivityType as ActivityType3,
  Prisma as PrismaNamespace6
} from "@crm/db";
import { normalizeCurrency as normalizeCurrency4 } from "@crm/db/currency";
import {
  CLOSED_DEAL_STAGES,
  isClosedStage,
  LOSING_DEAL_STAGES,
  OPEN_DEAL_STAGES as OPEN_DEAL_STAGES2
} from "@crm/db/deal-stage";
import {
  BadRequestException as BadRequestException8,
  Injectable as Injectable26,
  Logger as Logger17,
  NotFoundException as NotFoundException8
} from "@nestjs/common";
var OWNER_SELECT3 = {
  id: true,
  name: true,
  email: true,
  image: true
};
var COMPANY_SELECT2 = {
  id: true,
  name: true,
  domain: true,
  iconUrl: true,
  iconDarkUrl: true,
  iconTone: true,
  logoUrl: true
};
var CONTACT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  title: true,
  imageUrl: true
};
var LOSING = new Set(LOSING_DEAL_STAGES);
var SORTABLE4 = {
  name: (dir) => [{ name: dir }],
  company: (dir) => [{ company: { name: dir } }, { name: "asc" }],
  stage: (dir) => [{ stage: dir }, { expectedCloseDate: "asc" }],
  amount: (dir) => [{ baseAmount: { sort: dir, nulls: "last" } }],
  expectedCloseDate: (dir) => [{ expectedCloseDate: dir }],
  createdAt: (dir) => [{ createdAt: dir }],
  owner: (dir) => [{ owner: { name: dir } }, { name: "asc" }],
  lastActivity: (dir) => [{ lastActivityAt: { sort: dir, nulls: "last" } }],
  archivedAt: (dir) => [{ archivedAt: { sort: dir, nulls: "last" } }]
};

class DealsService {
  db;
  agent;
  stamp;
  conversion;
  fields;
  logger = new Logger17(DealsService.name);
  constructor(db, agent, stamp, conversion, fields) {
    this.db = db;
    this.agent = agent;
    this.stamp = stamp;
    this.conversion = conversion;
    this.fields = fields;
  }
  async list(input) {
    const filterableFields = await this.fields.filterableFieldsFor("DEAL");
    const where = this.buildWhere(input, filterableFields);
    const { skip, take } = paginate(input);
    const openWhere = { ...where, stage: { in: [...OPEN_DEAL_STAGES2] } };
    const base = await this.conversion.reportingCurrency();
    const [rows, total, facetCounts, openValue, unconverted] = await Promise.all([
      this.db.deal.findMany({
        where,
        skip,
        take,
        orderBy: resolveOrderBy(input, SORTABLE4, [{ createdAt: "desc" }]),
        select: {
          id: true,
          name: true,
          stage: true,
          amount: true,
          currency: true,
          baseAmount: true,
          expectedCloseDate: true,
          closedAt: true,
          company: { select: COMPANY_SELECT2 },
          owner: { select: OWNER_SELECT3 },
          lastActivityAt: true,
          createdAt: true,
          archivedAt: true
        }
      }),
      this.db.deal.count({ where }),
      this.facetCounts(input, filterableFields),
      this.db.deal.aggregate({
        where: { AND: [openWhere, this.conversion.countedWhere(base)] },
        _sum: { baseAmount: true }
      }),
      this.conversion.unconverted(openWhere)
    ]);
    const tableFields = await this.fields.tableValuesFor("DEAL", rows.map((row) => row.id));
    return {
      rows: rows.map(({
        amount,
        baseAmount,
        expectedCloseDate,
        closedAt,
        lastActivityAt,
        createdAt,
        archivedAt,
        ...row
      }) => ({
        ...row,
        amountCents: toCents(amount),
        baseAmountCents: toCents(baseAmount),
        expectedCloseDate: expectedCloseDate?.toISOString() ?? null,
        closedAt: closedAt?.toISOString() ?? null,
        lastActivityAt: lastActivityAt?.toISOString() ?? null,
        createdAt: createdAt.toISOString(),
        archivedAt: archivedAt?.toISOString() ?? null,
        fields: tableFields.get(row.id) ?? {}
      })),
      total,
      facetCounts,
      openValueCents: toCents(openValue._sum.baseAmount),
      reportingCurrency: base,
      unconverted
    };
  }
  async byId(id) {
    const deal = await this.db.deal.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        stage: true,
        stageChangedAt: true,
        amount: true,
        currency: true,
        baseAmount: true,
        fxRate: true,
        fxRateAt: true,
        expectedCloseDate: true,
        closedAt: true,
        closedReason: true,
        createdAt: true,
        archivedAt: true,
        company: { select: { ...COMPANY_SELECT2, industry: true } },
        owner: { select: OWNER_SELECT3 },
        contacts: {
          select: { role: true, contact: { select: CONTACT_SELECT } },
          orderBy: { contact: { firstName: "asc" } }
        }
      }
    });
    if (!deal) {
      throw new NotFoundException8(`No deal with id ${id}.`);
    }
    const {
      contacts,
      amount,
      baseAmount,
      fxRate,
      fxRateAt,
      archivedAt,
      ...rest
    } = deal;
    return {
      ...rest,
      fields: await this.fields.valuesFor("DEAL", id),
      amountCents: toCents(amount),
      baseAmountCents: toCents(baseAmount),
      reportingCurrency: await this.conversion.reportingCurrency(),
      fxRate: fxRate?.toNumber() ?? null,
      fxRateAt: fxRateAt?.toISOString() ?? null,
      stageChangedAt: deal.stageChangedAt.toISOString(),
      expectedCloseDate: deal.expectedCloseDate?.toISOString() ?? null,
      closedAt: deal.closedAt?.toISOString() ?? null,
      createdAt: deal.createdAt.toISOString(),
      archivedAt: archivedAt?.toISOString() ?? null,
      contacts: contacts.map(({ role, contact }) => ({ ...contact, role }))
    };
  }
  async create(input) {
    const stage = input.stage ?? "DEMO_BOOKED";
    const closed = isClosedStage(stage);
    const now = new Date;
    const currency = normalizeCurrency4(input.currency ?? await this.conversion.reportingCurrency());
    const fx = await this.conversion.dealFields(decimalFromCents(input.amountCents), currency);
    try {
      const deal = await this.agent.withCrmEvents(async (tx, emit) => {
        const created = await tx.deal.create({
          data: {
            name: input.name.trim(),
            companyId: input.companyId,
            ownerId: input.ownerId,
            stage,
            stageChangedAt: now,
            closedAt: closed ? now : null,
            amount: fromCents(input.amountCents),
            currency,
            ...fx,
            expectedCloseDate: parseDate2(input.expectedCloseDate)
          },
          select: { id: true, name: true, companyId: true }
        });
        await emit({
          type: "deal.created",
          record: { kind: "deal", id: created.id },
          occurredAt: now,
          data: { companyId: created.companyId, stage }
        });
        if (closed) {
          await emit({
            type: "deal.closed",
            record: { kind: "deal", id: created.id },
            occurredAt: now,
            data: { companyId: created.companyId, from: null, to: stage }
          });
        }
        return created;
      });
      this.logger.log({ message: "Deal created", dealId: deal.id, stage });
      this.fields.queueBackfillForNewRecord("DEAL", deal.id);
      return deal;
    } catch (error) {
      throw this.translateRelations(error);
    }
  }
  async update(id, input) {
    const data = {};
    if (input.name !== undefined)
      data.name = input.name.trim();
    if (input.description !== undefined) {
      data.description = input.description === null ? null : blankToNull(input.description);
    }
    if (input.companyId !== undefined) {
      data.company = { connect: { id: input.companyId } };
    }
    if (input.ownerId !== undefined) {
      data.owner = { connect: { id: input.ownerId } };
    }
    if (input.amountCents !== undefined) {
      data.amount = fromCents(input.amountCents);
    }
    if (input.currency !== undefined) {
      data.currency = normalizeCurrency4(input.currency);
    }
    if (input.expectedCloseDate !== undefined) {
      data.expectedCloseDate = parseDate2(input.expectedCloseDate);
    }
    if (input.amountCents !== undefined || input.currency !== undefined) {
      const current = await this.db.deal.findUnique({
        where: { id },
        select: { amount: true, currency: true }
      });
      if (!current) {
        throw new NotFoundException8(`No deal with id ${id}.`);
      }
      const amount = input.amountCents !== undefined ? decimalFromCents(input.amountCents) : current.amount;
      const currency = input.currency !== undefined ? normalizeCurrency4(input.currency) : normalizeCurrency4(current.currency);
      Object.assign(data, await this.conversion.dealFields(amount, currency));
    }
    try {
      return await this.db.$transaction(async (tx) => {
        if (input.fields) {
          await this.fields.applyValues(tx, "DEAL", id, input.fields);
        }
        return tx.deal.update({
          where: { id },
          data,
          select: { id: true, name: true }
        });
      });
    } catch (error) {
      throw this.translate(error, id);
    }
  }
  async archive(id) {
    try {
      const deal = await this.db.deal.update({
        where: { id },
        data: { archivedAt: new Date },
        select: { name: true }
      });
      this.logger.log({ message: "Deal archived", dealId: id });
      return { id, name: deal.name };
    } catch (error) {
      throw this.translate(error, id);
    }
  }
  async restore(id) {
    try {
      const deal = await this.db.deal.update({
        where: { id },
        data: { archivedAt: null },
        select: { name: true }
      });
      this.logger.log({ message: "Deal restored", dealId: id });
      return { id, name: deal.name };
    } catch (error) {
      throw this.translate(error, id);
    }
  }
  async purge(id, guard) {
    let deleted;
    try {
      deleted = await this.db.$transaction(async (tx) => {
        const [row] = await tx.$queryRaw`
					SELECT "archivedAt" FROM deal WHERE id = ${id} FOR UPDATE
				`;
        if (!row) {
          if (guard)
            return null;
          throw new NotFoundException8(`No deal with id ${id}.`);
        }
        if (guard && (!row.archivedAt || row.archivedAt > guard.archivedBefore)) {
          return null;
        }
        const targets = await this.stamp.targetsOf({ dealId: id }, tx);
        await tx.agentTask.deleteMany({ where: { dealId: id } });
        const deal = await tx.deal.delete({
          where: { id },
          select: { name: true }
        });
        return { targets, name: deal.name };
      });
    } catch (error) {
      throw this.translate(error, id);
    }
    if (!deleted)
      return null;
    await this.stamp.recomputeAfterDelete(deleted.targets, { dealId: id });
    this.logger.log({
      message: "Deal purged",
      dealId: id,
      name: deleted.name
    });
    return { id, name: deleted.name };
  }
  async purgeExpired(before) {
    const expired = await this.db.deal.findMany({
      where: { archivedAt: { lte: before } },
      select: { id: true },
      take: ARCHIVE.prune.maxBatch
    });
    return runBulk(expired.map((row) => row.id), (id) => this.purge(id, { archivedBefore: before }));
  }
  async setStage(input, actingUserId) {
    const closedReason = input.closedReason?.trim();
    const closed = isClosedStage(input.stage);
    const transition = await this.agent.withCrmEvents(async (tx, emit) => {
      const [deal2] = await tx.$queryRaw`
				SELECT id, stage, "companyId"
				FROM deal
				WHERE id = ${input.id}
				FOR UPDATE
			`;
      if (!deal2) {
        throw new NotFoundException8(`No deal with id ${input.id}.`);
      }
      if (deal2.stage === input.stage) {
        return {
          changed: false,
          deal: deal2,
          updated: { id: deal2.id, stage: deal2.stage },
          now: null
        };
      }
      if (LOSING.has(input.stage) && !closedReason) {
        throw new BadRequestException8("Say why it was lost — a closed-lost deal with no reason teaches nobody anything.");
      }
      const now2 = new Date;
      const updated2 = await tx.deal.update({
        where: { id: input.id },
        data: {
          stage: input.stage,
          stageChangedAt: now2,
          closedAt: closed ? now2 : null,
          closedReason: closed ? closedReason ?? null : null
        },
        select: { id: true, stage: true }
      });
      await tx.activity.create({
        data: {
          type: ActivityType3.STAGE_CHANGE,
          subject: "Stage changed",
          body: closedReason ?? null,
          occurredAt: now2,
          companyId: deal2.companyId,
          dealId: deal2.id,
          createdById: actingUserId,
          meta: { from: deal2.stage, to: input.stage }
        }
      });
      await emit({
        type: "deal.stage.changed",
        record: { kind: "deal", id: deal2.id },
        occurredAt: now2,
        data: { companyId: deal2.companyId, from: deal2.stage, to: input.stage }
      });
      if (!isClosedStage(deal2.stage) && closed) {
        await emit({
          type: "deal.closed",
          record: { kind: "deal", id: deal2.id },
          occurredAt: now2,
          data: {
            companyId: deal2.companyId,
            from: deal2.stage,
            to: input.stage
          }
        });
      }
      if (isClosedStage(deal2.stage) && !closed) {
        await emit({
          type: "deal.opened",
          record: { kind: "deal", id: deal2.id },
          occurredAt: now2,
          data: {
            companyId: deal2.companyId,
            from: deal2.stage,
            to: input.stage
          }
        });
      }
      return { changed: true, deal: deal2, updated: updated2, now: now2 };
    });
    if (!transition.changed) {
      return { ...transition.updated, changed: false };
    }
    const { deal, updated, now } = transition;
    await this.stamp.touch({ companyId: deal.companyId, dealId: deal.id }, now);
    this.logger.log({
      message: "Deal stage changed",
      dealId: deal.id,
      from: deal.stage,
      to: input.stage
    });
    return { ...updated, changed: true };
  }
  async contactOptions(dealId) {
    const deal = await this.db.deal.findUnique({
      where: { id: dealId },
      select: { companyId: true, contacts: { select: { contactId: true } } }
    });
    if (!deal) {
      throw new NotFoundException8(`No deal with id ${dealId}.`);
    }
    return this.db.contact.findMany({
      where: {
        companyId: deal.companyId,
        id: { notIn: deal.contacts.map((row) => row.contactId) }
      },
      select: CONTACT_SELECT,
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: 100
    });
  }
  async attachContact(input) {
    const company = await this.companyOf(input.dealId);
    const contact = await this.db.contact.findUnique({
      where: { id: input.contactId },
      select: { companyId: true }
    });
    if (!contact) {
      throw new NotFoundException8(`No contact with id ${input.contactId}.`);
    }
    if (contact.companyId !== company.id) {
      throw new BadRequestException8(`That contact does not work at ${company.name}.`);
    }
    const role = roleOrNull(input.role ?? null);
    await this.db.dealContact.upsert({
      where: {
        dealId_contactId: {
          dealId: input.dealId,
          contactId: input.contactId
        }
      },
      create: { dealId: input.dealId, contactId: input.contactId, role },
      update: role === null ? {} : { role }
    });
    this.logger.log({
      message: "Contact attached to deal",
      dealId: input.dealId,
      contactId: input.contactId
    });
    return { dealId: input.dealId, contactId: input.contactId };
  }
  async detachContact(input) {
    const { count } = await this.db.dealContact.deleteMany({
      where: { dealId: input.dealId, contactId: input.contactId }
    });
    if (count === 0) {
      throw new NotFoundException8("That contact is not on this deal.");
    }
    this.logger.log({
      message: "Contact detached from deal",
      dealId: input.dealId,
      contactId: input.contactId
    });
    return { dealId: input.dealId, contactId: input.contactId };
  }
  async setContactRole(input) {
    const role = roleOrNull(input.role);
    const { count } = await this.db.dealContact.updateMany({
      where: { dealId: input.dealId, contactId: input.contactId },
      data: { role }
    });
    if (count === 0) {
      throw new NotFoundException8("That contact is not on this deal.");
    }
    return { dealId: input.dealId, contactId: input.contactId, role };
  }
  async bulkAssignOwner(input) {
    await requireOwner(this.db, input.ownerId);
    const ids = [...new Set(input.ids)];
    const { count } = await this.db.deal.updateMany({
      where: { id: { in: ids } },
      data: { ownerId: input.ownerId }
    });
    this.logger.log({
      message: "Deals reassigned",
      count,
      ownerId: input.ownerId
    });
    return {
      requested: ids.length,
      succeeded: count,
      skipped: 0,
      failed: ids.length - count,
      message: null
    };
  }
  async bulkSetStage(input, actingUserId) {
    const closedReason = input.closedReason?.trim();
    if (LOSING.has(input.stage) && !closedReason) {
      throw new BadRequestException8("Say why they were lost — a closed-lost deal with no reason teaches nobody anything.");
    }
    return runBulk(input.ids, (id) => this.setStage({ id, stage: input.stage, closedReason }, actingUserId));
  }
  async bulkArchive(ids) {
    return runBulk(ids, (id) => this.archive(id));
  }
  async bulkRestore(ids) {
    return runBulk(ids, (id) => this.restore(id));
  }
  async bulkPurge(ids) {
    return runBulk(ids, (id) => this.purge(id));
  }
  async companyOf(dealId) {
    const deal = await this.db.deal.findUnique({
      where: { id: dealId },
      select: { company: { select: { id: true, name: true } } }
    });
    if (!deal) {
      throw new NotFoundException8(`No deal with id ${dealId}.`);
    }
    return deal.company;
  }
  searchFilter(q) {
    const term = q.trim();
    if (!term)
      return {};
    return {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { company: { name: { contains: term, mode: "insensitive" } } }
      ]
    };
  }
  buildWhere(input, filterableFields) {
    const and = [
      this.searchFilter(input.q),
      archivedFilter(input.archived),
      ...this.fields.fieldFilters(filterableFields, input.fields)
    ];
    const owner = ownerFilter(input.owner);
    if (owner)
      and.push(owner);
    if (input.status === "open") {
      and.push({ stage: { in: [...OPEN_DEAL_STAGES2] } });
    } else if (input.status === "closed") {
      and.push({ stage: { in: [...CLOSED_DEAL_STAGES] } });
    }
    if (input.stage.length > 0) {
      and.push({ stage: { in: input.stage } });
    }
    if (input.closing.length > 0) {
      and.push({
        OR: input.closing.map((window) => closingFilter(window))
      });
    }
    return { AND: and };
  }
  async facetCounts(input, filterableFields) {
    const where = {
      AND: [this.searchFilter(input.q), archivedFilter(input.archived)]
    };
    const [owners, stages, fieldFacets, ...closingCounts] = await Promise.all([
      this.db.deal.groupBy({ by: ["ownerId"], where, _count: { _all: true } }),
      this.db.deal.groupBy({ by: ["stage"], where, _count: { _all: true } }),
      this.fields.filterFacetCounts("DEAL", where, filterableFields),
      ...CLOSING_WINDOWS.map((window) => this.db.deal.count({ where: { AND: [where, closingFilter(window)] } }))
    ]);
    const stageCounts = countsByKey(stages, "stage");
    const openCount = OPEN_DEAL_STAGES2.reduce((total, stage) => total + (stageCounts[stage] ?? 0), 0);
    const closedCount = CLOSED_DEAL_STAGES.reduce((total, stage) => total + (stageCounts[stage] ?? 0), 0);
    return {
      status: { open: openCount, closed: closedCount },
      owner: countsByKey(owners, "ownerId", FACET_UNASSIGNED),
      stage: stageCounts,
      closing: Object.fromEntries(CLOSING_WINDOWS.map((window, index) => [
        window,
        closingCounts[index] ?? 0
      ])),
      ...Object.fromEntries(Object.entries(fieldFacets).map(([key, counts]) => [
        `field:${key}`,
        counts
      ]))
    };
  }
  translate(cause, id) {
    if (cause instanceof PrismaNamespace6.PrismaClientKnownRequestError && cause.code === "P2025") {
      throw new NotFoundException8(`No deal with id ${id}.`);
    }
    return this.translateRelations(cause);
  }
  translateRelations(cause) {
    if (cause instanceof PrismaNamespace6.PrismaClientKnownRequestError && (cause.code === "P2003" || cause.code === "P2025")) {
      throw new BadRequestException8("That company or owner does not exist any more.");
    }
    throw cause;
  }
}
DealsService = __legacyDecorateClassTS([
  Injectable26(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof AgentTriggerService === "undefined" ? Object : AgentTriggerService,
    typeof ActivityStampService === "undefined" ? Object : ActivityStampService,
    typeof ConversionService === "undefined" ? Object : ConversionService,
    typeof FieldsService === "undefined" ? Object : FieldsService
  ])
], DealsService);
function closingFilter(window) {
  const now = new Date;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfMonthAfter = new Date(now.getFullYear(), now.getMonth() + 2, 1);
  switch (window) {
    case "overdue":
      return {
        expectedCloseDate: { lt: now },
        stage: { in: [...OPEN_DEAL_STAGES2] }
      };
    case "this-month":
      return {
        expectedCloseDate: { gte: startOfMonth, lt: startOfNextMonth }
      };
    case "next-month":
      return {
        expectedCloseDate: { gte: startOfNextMonth, lt: startOfMonthAfter }
      };
    case "later":
      return { expectedCloseDate: { gte: startOfMonthAfter } };
    case "none":
      return { expectedCloseDate: null };
  }
}
function roleOrNull(value) {
  return value === null ? null : blankToNull(value);
}
function parseDate2(value) {
  if (value === null || value === undefined || value === "")
    return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException8(`"${value}" is not a date.`);
  }
  return date;
}

// src/deals/deals.router.ts
class DealsRouter {
  deals;
  constructor(deals) {
    this.deals = deals;
  }
  async list(input) {
    return this.deals.list(input);
  }
  async byId(id) {
    return this.deals.byId(id);
  }
  async create(input) {
    return this.deals.create(input);
  }
  async update(input) {
    return this.deals.update(input.id, input.data);
  }
  async archive(id) {
    return this.deals.archive(id);
  }
  async restore(id) {
    return this.deals.restore(id);
  }
  async purge(id) {
    return this.deals.purge(id);
  }
  async setStage(ctx, input) {
    return this.deals.setStage(input, ctx.user.id);
  }
  async contactOptions(dealId) {
    return this.deals.contactOptions(dealId);
  }
  async attachContact(input) {
    return this.deals.attachContact(input);
  }
  async detachContact(input) {
    return this.deals.detachContact(input);
  }
  async setContactRole(input) {
    return this.deals.setContactRole(input);
  }
  async bulkAssignOwner(input) {
    return this.deals.bulkAssignOwner(input);
  }
  async bulkSetStage(ctx, input) {
    return this.deals.bulkSetStage(input, ctx.user.id);
  }
  async bulkArchive(ids) {
    return this.deals.bulkArchive(ids);
  }
  async bulkRestore(ids) {
    return this.deals.bulkRestore(ids);
  }
  async bulkPurge(ids) {
    return this.deals.bulkPurge(ids);
  }
}
__legacyDecorateClassTS([
  Query8({
    input: dealListInput,
    output: dealListOutput,
    meta: restMeta("POST", "/deals/search", ["Deals"])
  }),
  __legacyDecorateParamTS(0, Input8()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], DealsRouter.prototype, "list", null);
__legacyDecorateClassTS([
  Query8({
    input: dealIdInput,
    output: dealDetailOutput,
    meta: restMeta("GET", "/deals/{id}", ["Deals"])
  }),
  __legacyDecorateParamTS(0, Input8("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], DealsRouter.prototype, "byId", null);
__legacyDecorateClassTS([
  Mutation8({
    input: dealCreateInput,
    output: dealCreateOutput,
    meta: restMeta("POST", "/deals", ["Deals"])
  }),
  __legacyDecorateParamTS(0, Input8()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], DealsRouter.prototype, "create", null);
__legacyDecorateClassTS([
  Mutation8({
    input: dealUpdateArgs,
    output: dealMutateOutput,
    meta: restMeta("PATCH", "/deals/{id}", ["Deals"])
  }),
  __legacyDecorateParamTS(0, Input8()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], DealsRouter.prototype, "update", null);
__legacyDecorateClassTS([
  Mutation8({
    input: dealIdInput,
    output: dealMutateOutput,
    meta: restMeta("POST", "/deals/{id}/archive", ["Deals"])
  }),
  __legacyDecorateParamTS(0, Input8("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], DealsRouter.prototype, "archive", null);
__legacyDecorateClassTS([
  Mutation8({
    input: dealIdInput,
    output: dealMutateOutput,
    meta: restMeta("POST", "/deals/{id}/restore", ["Deals"])
  }),
  __legacyDecorateParamTS(0, Input8("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], DealsRouter.prototype, "restore", null);
__legacyDecorateClassTS([
  Mutation8({
    input: dealIdInput,
    output: dealMutateOutput,
    meta: restMeta("DELETE", "/deals/{id}", ["Deals"])
  }),
  __legacyDecorateParamTS(0, Input8("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], DealsRouter.prototype, "purge", null);
__legacyDecorateClassTS([
  Mutation8({
    input: setStageInput,
    output: dealSetStageOutput,
    meta: restMeta("PATCH", "/deals/{id}/stage", ["Deals"])
  }),
  __legacyDecorateParamTS(0, Ctx7()),
  __legacyDecorateParamTS(1, Input8()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], DealsRouter.prototype, "setStage", null);
__legacyDecorateClassTS([
  Query8({
    input: dealContactsInput,
    output: dealContactOptionsOutput,
    meta: restMeta("GET", "/deals/{dealId}/contact-options", ["Deals"])
  }),
  __legacyDecorateParamTS(0, Input8("dealId")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], DealsRouter.prototype, "contactOptions", null);
__legacyDecorateClassTS([
  Mutation8({
    input: dealAttachContactInput,
    output: dealContactLinkOutput,
    meta: restMeta("POST", "/deals/{dealId}/contacts", ["Deals"])
  }),
  __legacyDecorateParamTS(0, Input8()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], DealsRouter.prototype, "attachContact", null);
__legacyDecorateClassTS([
  Mutation8({
    input: dealDetachContactInput,
    output: dealContactLinkOutput,
    meta: restMeta("DELETE", "/deals/{dealId}/contacts/{contactId}", ["Deals"])
  }),
  __legacyDecorateParamTS(0, Input8()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], DealsRouter.prototype, "detachContact", null);
__legacyDecorateClassTS([
  Mutation8({
    input: dealContactRoleInput,
    output: dealContactRoleOutput,
    meta: restMeta("PATCH", "/deals/{dealId}/contacts/{contactId}/role", [
      "Deals"
    ])
  }),
  __legacyDecorateParamTS(0, Input8()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], DealsRouter.prototype, "setContactRole", null);
__legacyDecorateClassTS([
  Mutation8({
    input: dealBulkOwnerInput,
    output: dealBulkResultOutput,
    meta: restMeta("POST", "/deals/bulk-assign-owner", ["Deals"])
  }),
  __legacyDecorateParamTS(0, Input8()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], DealsRouter.prototype, "bulkAssignOwner", null);
__legacyDecorateClassTS([
  Mutation8({
    input: dealBulkStageInput,
    output: dealBulkResultOutput,
    meta: restMeta("POST", "/deals/bulk-set-stage", ["Deals"])
  }),
  __legacyDecorateParamTS(0, Ctx7()),
  __legacyDecorateParamTS(1, Input8()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], DealsRouter.prototype, "bulkSetStage", null);
__legacyDecorateClassTS([
  Mutation8({
    input: dealBulkInput,
    output: dealBulkResultOutput,
    meta: restMeta("POST", "/deals/bulk-archive", ["Deals"])
  }),
  __legacyDecorateParamTS(0, Input8("ids")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    Array
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], DealsRouter.prototype, "bulkArchive", null);
__legacyDecorateClassTS([
  Mutation8({
    input: dealBulkInput,
    output: dealBulkResultOutput,
    meta: restMeta("POST", "/deals/bulk-restore", ["Deals"])
  }),
  __legacyDecorateParamTS(0, Input8("ids")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    Array
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], DealsRouter.prototype, "bulkRestore", null);
__legacyDecorateClassTS([
  Mutation8({
    input: dealBulkInput,
    output: dealBulkResultOutput,
    meta: restMeta("POST", "/deals/bulk-purge", ["Deals"])
  }),
  __legacyDecorateParamTS(0, Input8("ids")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    Array
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], DealsRouter.prototype, "bulkPurge", null);
DealsRouter = __legacyDecorateClassTS([
  Router8({ alias: "deals" }),
  UseMiddlewares8(AuthMiddleware),
  __legacyDecorateParamTS(0, Inject9(DealsService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof DealsService === "undefined" ? Object : DealsService
  ])
], DealsRouter);

// src/deals/deals.module.ts
class DealsModule {
}
DealsModule = __legacyDecorateClassTS([
  Module9({
    imports: [AgentModule, FieldsModule, TrpcModule, CurrencyModule],
    providers: [DealsService, DealsRouter],
    exports: [DealsService]
  })
], DealsModule);

// src/archive/archive-retention.controller.ts
import { readArchiveRetentionDays } from "@crm/db/settings";
import {
  Controller as Controller2,
  ForbiddenException as ForbiddenException5,
  Get as Get2,
  Headers as Headers3,
  Logger as Logger18,
  Post as Post2,
  ServiceUnavailableException as ServiceUnavailableException2
} from "@nestjs/common";
import { ConfigService as ConfigService2 } from "@nestjs/config";
import {
  ApiExcludeEndpoint as ApiExcludeEndpoint2,
  ApiForbiddenResponse as ApiForbiddenResponse2,
  ApiHeader as ApiHeader2,
  ApiOkResponse as ApiOkResponse2,
  ApiOperation as ApiOperation2,
  ApiServiceUnavailableResponse as ApiServiceUnavailableResponse2,
  ApiTags as ApiTags2
} from "@nestjs/swagger";
import { AllowAnonymous as AllowAnonymous2 } from "@thallesp/nestjs-better-auth";
var DAY_MS = 24 * 60 * 60000;

class ArchiveRetentionController {
  db;
  companies;
  contacts;
  deals;
  logger = new Logger18(ArchiveRetentionController.name);
  secret;
  constructor(db, companies, contacts, deals, config) {
    this.db = db;
    this.companies = companies;
    this.contacts = contacts;
    this.deals = deals;
    this.secret = config.get("CRON_SECRET", { infer: true });
  }
  async pruneViaGet(authorization) {
    return this.run(authorization);
  }
  async pruneViaPost(authorization) {
    return this.run(authorization);
  }
  async run(authorization) {
    if (!this.secret) {
      this.logger.error({
        message: "CRON_SECRET is not set — refusing to run archive pruning."
      });
      throw new ServiceUnavailableException2("Pruning is not configured.");
    }
    if (!timingSafeEquals2(authorization ?? "", `Bearer ${this.secret}`)) {
      throw new ForbiddenException5;
    }
    const retentionDays = await readArchiveRetentionDays(this.db);
    const before = new Date(Date.now() - retentionDays * DAY_MS);
    const [companies, contacts, deals] = await Promise.all([
      this.companies.purgeExpired(before),
      this.contacts.purgeExpired(before),
      this.deals.purgeExpired(before)
    ]);
    this.logger.log({
      message: "Archive retention swept",
      retentionDays,
      companies: companies.succeeded,
      companiesSkipped: companies.skipped,
      contacts: contacts.succeeded,
      contactsSkipped: contacts.skipped,
      deals: deals.succeeded,
      dealsSkipped: deals.skipped
    });
    return { retentionDays, companies, contacts, deals };
  }
}
__legacyDecorateClassTS([
  Get2("prune"),
  AllowAnonymous2(),
  ApiOperation2({
    summary: "Purge companies, contacts and deals past the archive window"
  }),
  ApiOkResponse2({ description: "The prune ran; per-record-type counts." }),
  __legacyDecorateParamTS(0, Headers3("authorization")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ArchiveRetentionController.prototype, "pruneViaGet", null);
__legacyDecorateClassTS([
  Post2("prune"),
  AllowAnonymous2(),
  ApiExcludeEndpoint2(),
  __legacyDecorateParamTS(0, Headers3("authorization")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ArchiveRetentionController.prototype, "pruneViaPost", null);
ArchiveRetentionController = __legacyDecorateClassTS([
  ApiTags2("Internal — Cron"),
  ApiHeader2({
    name: "authorization",
    description: "`Bearer <CRON_SECRET>`",
    required: true
  }),
  ApiForbiddenResponse2({ description: "CRON_SECRET did not match." }),
  ApiServiceUnavailableResponse2({ description: "CRON_SECRET is not set." }),
  Controller2("internal/archive"),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof CompaniesService === "undefined" ? Object : CompaniesService,
    typeof ContactsService === "undefined" ? Object : ContactsService,
    typeof DealsService === "undefined" ? Object : DealsService,
    typeof ConfigService2 === "undefined" ? Object : ConfigService2
  ])
], ArchiveRetentionController);
function timingSafeEquals2(a, b) {
  if (a.length !== b.length)
    return false;
  let mismatch = 0;
  for (let index = 0;index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

// src/archive/archive.module.ts
class ArchiveModule {
}
ArchiveModule = __legacyDecorateClassTS([
  Module10({
    imports: [CompaniesModule, ContactsModule, DealsModule],
    controllers: [ArchiveRetentionController]
  })
], ArchiveModule);

// src/auth/auth.module.ts
import { Module as Module11 } from "@nestjs/common";

// src/auth/auth.controller.ts
import { SESSION_COOKIE_NAME } from "@crm/auth";
import { Controller as Controller3, Get as Get3 } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse as ApiOkResponse3,
  ApiOperation as ApiOperation3,
  ApiTags as ApiTags3,
  ApiUnauthorizedResponse
} from "@nestjs/swagger";
import {
  OptionalAuth,
  Session
} from "@thallesp/nestjs-better-auth";

// src/auth/auth.service.ts
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject as Inject10, Injectable as Injectable27, Logger as Logger19, NotFoundException as NotFoundException9 } from "@nestjs/common";
var PROFILE_TTL_MS = 5 * 60000;
var profileKey = (userId) => `auth:profile:${userId}`;

class AuthService {
  db;
  cache;
  logger = new Logger19(AuthService.name);
  constructor(db, cache) {
    this.db = db;
    this.cache = cache;
  }
  async getProfile(userId) {
    const key = profileKey(userId);
    const cached = await this.cache.get(key);
    if (cached) {
      return cached;
    }
    this.logger.debug({ message: "Profile cache miss", userId });
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true
      }
    });
    if (!user) {
      this.logger.warn({ message: "Session user no longer exists", userId });
      throw new NotFoundException9(`No user with id ${userId}.`);
    }
    const profile = {
      ...user,
      createdAt: user.createdAt.toISOString()
    };
    await this.cache.set(key, profile, PROFILE_TTL_MS);
    return profile;
  }
  async invalidateProfile(userId) {
    await this.cache.del(profileKey(userId));
    this.logger.debug({ message: "Invalidated cached profile", userId });
  }
}
AuthService = __legacyDecorateClassTS([
  Injectable27(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyDecorateParamTS(1, Inject10(CACHE_MANAGER)),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof Cache === "undefined" ? Object : Cache
  ])
], AuthService);

// src/auth/auth.controller.ts
class AuthController {
  authService;
  constructor(authService) {
    this.authService = authService;
  }
  async getMe(session) {
    return { user: await this.authService.getProfile(session.user.id) };
  }
  getSession(session) {
    if (!session) {
      return { authenticated: false, user: null };
    }
    return {
      authenticated: true,
      user: { id: session.user.id, email: session.user.email },
      expiresAt: session.session.expiresAt
    };
  }
}
__legacyDecorateClassTS([
  Get3("me"),
  ApiOperation3({ summary: "Get the signed-in user's profile" }),
  ApiOkResponse3({ description: "The signed-in user's profile." }),
  ApiUnauthorizedResponse({ description: "No valid session." }),
  __legacyDecorateParamTS(0, Session()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof CrmSession === "undefined" ? Object : CrmSession
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
__legacyDecorateClassTS([
  Get3("session"),
  OptionalAuth(),
  ApiOperation3({
    summary: "Check whether the current request carries a valid session"
  }),
  ApiOkResponse3({
    description: "Whether the request is authenticated, and as whom."
  }),
  __legacyDecorateParamTS(0, Session()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof CrmSession === "undefined" ? Object : CrmSession
  ]),
  __legacyMetadataTS("design:returntype", undefined)
], AuthController.prototype, "getSession", null);
AuthController = __legacyDecorateClassTS([
  ApiTags3("Auth"),
  ApiCookieAuth(SESSION_COOKIE_NAME),
  Controller3("auth"),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthService === "undefined" ? Object : AuthService
  ])
], AuthController);

// src/auth/auth-hooks.service.ts
import { Injectable as Injectable28, Logger as Logger20 } from "@nestjs/common";
import { AfterUpdate, DatabaseHook } from "@thallesp/nestjs-better-auth";
class AuthHooksService {
  authService;
  logger = new Logger20(AuthHooksService.name);
  constructor(authService) {
    this.authService = authService;
  }
  async onUserUpdated(user) {
    try {
      await this.authService.invalidateProfile(user.id);
    } catch (error) {
      this.logger.error({ message: "Failed to invalidate cached profile", userId: user.id }, error instanceof Error ? error.stack : String(error));
    }
  }
}
__legacyDecorateClassTS([
  AfterUpdate("user"),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    Object
  ]),
  __legacyMetadataTS("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], AuthHooksService.prototype, "onUserUpdated", null);
AuthHooksService = __legacyDecorateClassTS([
  DatabaseHook(),
  Injectable28(),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthService === "undefined" ? Object : AuthService
  ])
], AuthHooksService);

// src/auth/auth.module.ts
class AuthModule {
}
AuthModule = __legacyDecorateClassTS([
  Module11({
    controllers: [AuthController],
    providers: [AuthService, AuthHooksService],
    exports: [AuthService]
  })
], AuthModule);

// src/backfill/backfill.module.ts
import { Module as Module12 } from "@nestjs/common";

// src/backfill/backfill.service.ts
import { onSignedIn } from "@crm/auth";
import { EnrichmentStatus as EnrichmentStatus4 } from "@crm/db";
import { PRIORITY as PRIORITY2 } from "@crm/db/agent-tasks";
import { readWorkspaceIdentity } from "@crm/db/workspace";
import { CACHE_MANAGER as CACHE_MANAGER2 } from "@nestjs/cache-manager";
import { Inject as Inject11, Injectable as Injectable30, Logger as Logger22 } from "@nestjs/common";

// src/backfill/image-mirror.service.ts
import { blobEnabled, mirror as mirror2 } from "@crm/db/blob";
import {
  BLOB_HOST_SUFFIX,
  COMPANY_IMAGE_FIELDS
} from "@crm/db/images";
import { Injectable as Injectable29, Logger as Logger21 } from "@nestjs/common";
var MAX_PER_SWEEP = 25;
var EXTERNAL_CONTACT_IMAGE = {
  imageUrl: { not: null },
  NOT: { imageUrl: { contains: BLOB_HOST_SUFFIX } }
};
var EXTERNAL_USER_IMAGE = {
  image: { not: null },
  NOT: { image: { contains: BLOB_HOST_SUFFIX } }
};

class ImageMirrorService {
  db;
  logger = new Logger21(ImageMirrorService.name);
  constructor(db) {
    this.db = db;
  }
  async sweep() {
    if (!blobEnabled())
      return { scanned: 0, copied: 0 };
    const results = [
      await this.sweepCompanies(),
      await this.sweepContacts(),
      await this.sweepUsers()
    ];
    const total = results.reduce((sum, result) => ({
      scanned: sum.scanned + result.scanned,
      copied: sum.copied + result.copied
    }), { scanned: 0, copied: 0 });
    if (total.copied > 0) {
      this.logger.log({ message: "Mirrored external images", ...total });
    }
    return total;
  }
  async sweepCompanies() {
    const rows = await this.db.company.findMany({
      where: {
        OR: COMPANY_IMAGE_FIELDS.map(externalCompanyImage)
      },
      orderBy: { createdAt: "asc" },
      take: MAX_PER_SWEEP,
      select: {
        id: true,
        logoUrl: true,
        logoDarkUrl: true,
        iconUrl: true,
        iconDarkUrl: true
      }
    });
    let copied = 0;
    for (const row of rows) {
      const data = {};
      for (const field of COMPANY_IMAGE_FIELDS) {
        const current = row[field];
        if (!current)
          continue;
        const stored = await mirror2(current, `companies/${row.id}/${field}`);
        if (!stored || stored === current)
          continue;
        data[field] = stored;
        copied += 1;
      }
      if (Object.keys(data).length === 0)
        continue;
      await this.db.company.updateMany({
        where: { id: row.id, ...unchanged(row) },
        data
      });
    }
    return { scanned: rows.length, copied };
  }
  async sweepContacts() {
    const rows = await this.db.contact.findMany({
      where: EXTERNAL_CONTACT_IMAGE,
      orderBy: { createdAt: "asc" },
      take: MAX_PER_SWEEP,
      select: { id: true, imageUrl: true }
    });
    let copied = 0;
    for (const row of rows) {
      if (!row.imageUrl)
        continue;
      const stored = await mirror2(row.imageUrl, `contacts/${row.id}`);
      if (!stored || stored === row.imageUrl)
        continue;
      const { count } = await this.db.contact.updateMany({
        where: { id: row.id, imageUrl: row.imageUrl },
        data: { imageUrl: stored }
      });
      copied += count;
    }
    return { scanned: rows.length, copied };
  }
  async sweepUsers() {
    const rows = await this.db.user.findMany({
      where: EXTERNAL_USER_IMAGE,
      take: MAX_PER_SWEEP,
      select: { id: true, image: true }
    });
    let copied = 0;
    for (const row of rows) {
      if (!row.image)
        continue;
      const stored = await mirror2(row.image, `users/${row.id}/avatar`);
      if (!stored || stored === row.image)
        continue;
      const { count } = await this.db.user.updateMany({
        where: { id: row.id, image: row.image },
        data: { image: stored }
      });
      copied += count;
    }
    return { scanned: rows.length, copied };
  }
}
ImageMirrorService = __legacyDecorateClassTS([
  Injectable29(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], ImageMirrorService);
function externalCompanyImage(field) {
  const mirrored = {};
  mirrored[field] = { contains: BLOB_HOST_SUFFIX };
  const where = { NOT: mirrored };
  where[field] = { not: null };
  return where;
}
function unchanged(row) {
  const where = {};
  for (const field of COMPANY_IMAGE_FIELDS)
    where[field] = row[field] ?? null;
  return where;
}

// src/backfill/backfill.service.ts
var MAX_PER_RUN = 500;
var MAX_FAVICONS = 25;
var NEVER_SUCCEEDED = {
  in: [EnrichmentStatus4.PENDING, EnrichmentStatus4.FAILED]
};
var AUTO_KEY = "backfill:auto";
var AUTO_EVERY_MS = 5 * 60000;
var RECHECK_PHOTO_AFTER_MS = 30 * 24 * 60 * 60000;
var RECHECK_BRAND_AFTER_MS = 30 * 24 * 60 * 60000;
var RECHECK_WORKSPACE_AFTER_MS = 7 * 24 * 60 * 60000;

class BackfillService {
  db;
  agent;
  favicon;
  images;
  cache;
  logger = new Logger22(BackfillService.name);
  constructor(db, agent, favicon, images, cache) {
    this.db = db;
    this.agent = agent;
    this.favicon = favicon;
    this.images = images;
    this.cache = cache;
  }
  onModuleInit() {
    onSignedIn(() => {
      this.auto();
    });
  }
  async auto() {
    if (await this.cache.get(AUTO_KEY))
      return { started: false };
    await this.cache.set(AUTO_KEY, true, AUTO_EVERY_MS);
    (async () => {
      try {
        await this.sweepWorkspace();
        const companies = await this.runCompanies(false);
        const contacts = await this.runContacts();
        const mirrored = await this.images.sweep();
        this.logger.log({
          message: "Automatic backfill swept",
          queued: companies.queued + contacts.queued,
          remaining: companies.remaining + contacts.remaining,
          iconsResolving: companies.iconsResolving,
          imagesMirrored: mirrored.copied
        });
      } catch (error) {
        this.logger.error({ message: "Automatic backfill failed" }, error instanceof Error ? error.stack : String(error));
      }
    })();
    return { started: true };
  }
  async sweepWorkspace() {
    const us = await readWorkspaceIdentity(this.db);
    if (!us?.website || us.profile)
      return;
    const attempted = await this.db.agentTask.findFirst({
      where: {
        kind: "workspace-profile",
        finishedAt: { gte: new Date(Date.now() - RECHECK_WORKSPACE_AFTER_MS) }
      },
      select: { id: true }
    });
    if (attempted)
      return;
    await this.agent.workspaceChanged(us.website, "We still have no profile of the company using this CRM");
  }
  async run(scope) {
    if (scope === "contacts")
      return this.runContacts();
    return this.runCompanies(scope === "deals");
  }
  async runCompanies(dealsOnly) {
    const onDeals = dealsOnly ? { deals: { some: {} } } : {};
    const needsBrand = this.companiesNeedingBrand();
    const needsArtwork = await this.companiesNeedingArtwork();
    const [total, rows, artworkRows] = await Promise.all([
      this.db.company.count({
        where: { ...onDeals, OR: [needsBrand, needsArtwork] }
      }),
      this.db.company.findMany({
        where: { ...needsBrand, ...onDeals },
        orderBy: { createdAt: "asc" },
        take: MAX_PER_RUN,
        select: { id: true }
      }),
      this.db.company.findMany({
        where: { ...needsArtwork, ...onDeals },
        orderBy: { createdAt: "asc" },
        take: MAX_PER_RUN,
        select: { id: true }
      })
    ]);
    const companyIds = [
      ...new Set([
        ...rows.map((row) => row.id),
        ...artworkRows.map((row) => row.id)
      ])
    ].slice(0, MAX_PER_RUN);
    const brand = await this.agent.backfill({
      kind: "brand",
      reason: "Backfill — this company has no logo or icon",
      companyIds,
      budget: 2,
      priority: PRIORITY2.brand
    });
    const profile = await this.agent.backfill({
      kind: "company-profile",
      reason: "Backfill — this company was never successfully looked up",
      companyIds: rows.map((row) => row.id)
    });
    const queued = {
      queued: brand.queued + profile.queued,
      alreadyQueued: brand.alreadyQueued + profile.alreadyQueued
    };
    const iconsResolving = dealsOnly ? 0 : await this.sweepFavicons();
    return {
      ...queued,
      remaining: Math.max(0, total - companyIds.length),
      iconsResolving
    };
  }
  async runContacts() {
    const needsPhoto = await this.contactsNeedingPhoto();
    const [photoTotal, photoRows] = await Promise.all([
      this.db.contact.count({ where: needsPhoto }),
      this.db.contact.findMany({
        where: needsPhoto,
        orderBy: { createdAt: "asc" },
        take: MAX_PER_RUN,
        select: { id: true }
      })
    ]);
    const photos = await this.agent.backfill({
      kind: "portrait",
      reason: "Backfill — somewhere to look for a picture, and no picture",
      contactIds: photoRows.map((row) => row.id),
      budget: 1,
      priority: PRIORITY2.portrait
    });
    const headroom = MAX_PER_RUN - photoRows.length;
    const [researchTotal, researchRows] = await Promise.all([
      this.db.contact.count({ where: this.contactsNeverResearched() }),
      headroom > 0 ? this.db.contact.findMany({
        where: this.contactsNeverResearched(),
        orderBy: { createdAt: "asc" },
        take: headroom,
        select: { id: true }
      }) : Promise.resolve([])
    ]);
    const research = await this.agent.backfill({
      kind: "identify",
      reason: "Backfill — this contact was never researched",
      contactIds: researchRows.map((row) => row.id)
    });
    return {
      queued: photos.queued + research.queued,
      alreadyQueued: photos.alreadyQueued + research.alreadyQueued,
      remaining: Math.max(0, photoTotal - photoRows.length) + Math.max(0, researchTotal - researchRows.length),
      iconsResolving: 0
    };
  }
  async sweepFavicons() {
    const rows = await this.db.company.findMany({
      where: { domain: { not: null }, iconUrl: null },
      orderBy: { createdAt: "asc" },
      take: MAX_FAVICONS,
      select: { id: true, domain: true }
    });
    if (rows.length === 0)
      return 0;
    (async () => {
      let resolved = 0;
      for (const row of rows) {
        if (await this.favicon.backfill(row.id, row.domain))
          resolved += 1;
      }
      this.logger.log({
        message: "Favicon sweep finished",
        attempted: rows.length,
        resolved
      });
    })();
    return rows.length;
  }
  companiesNeedingBrand() {
    return { domain: { not: null }, enrichmentStatus: NEVER_SUCCEEDED };
  }
  async companiesNeedingArtwork() {
    const since = new Date(Date.now() - RECHECK_BRAND_AFTER_MS);
    const checked = await this.db.agentTask.findMany({
      where: { kind: "brand", finishedAt: { gte: since } },
      select: { companyId: true }
    });
    const recentlyChecked = checked.map((row) => row.companyId).filter((id) => id !== null);
    const where = {
      domain: { not: null },
      logoUrl: null,
      iconUrl: null
    };
    if (recentlyChecked.length > 0)
      where.id = { notIn: recentlyChecked };
    return where;
  }
  async contactsNeedingPhoto() {
    const since = new Date(Date.now() - RECHECK_PHOTO_AFTER_MS);
    const checked = await this.db.agentTask.findMany({
      where: { kind: "portrait", finishedAt: { gte: since } },
      select: { contactId: true }
    });
    const recentlyChecked = checked.map((row) => row.contactId).filter((id) => id !== null);
    const where = {
      imageUrl: null,
      OR: [
        { linkedinUrl: { not: null } },
        { githubUrl: { not: null } },
        { company: { domain: { not: null } } }
      ]
    };
    if (recentlyChecked.length > 0)
      where.id = { notIn: recentlyChecked };
    return where;
  }
  contactsNeverResearched() {
    return { enrichmentStatus: NEVER_SUCCEEDED };
  }
}
BackfillService = __legacyDecorateClassTS([
  Injectable30(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyDecorateParamTS(4, Inject11(CACHE_MANAGER2)),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof AgentTriggerService === "undefined" ? Object : AgentTriggerService,
    typeof FaviconService === "undefined" ? Object : FaviconService,
    typeof ImageMirrorService === "undefined" ? Object : ImageMirrorService,
    typeof Cache === "undefined" ? Object : Cache
  ])
], BackfillService);

// src/backfill/backfill.module.ts
class BackfillModule {
}
BackfillModule = __legacyDecorateClassTS([
  Module12({
    imports: [AgentModule, CompaniesModule],
    providers: [BackfillService, ImageMirrorService],
    exports: [BackfillService]
  })
], BackfillModule);

// src/cache/cache.module.ts
import KeyvRedis from "@keyv/redis";
import { CacheModule } from "@nestjs/cache-manager";
import { Logger as Logger23, Module as Module13 } from "@nestjs/common";
import { ConfigService as ConfigService3 } from "@nestjs/config";
var DEFAULT_TTL_MS = 60000;

class AppCacheModule {
}
AppCacheModule = __legacyDecorateClassTS([
  Module13({
    imports: [
      CacheModule.registerAsync({
        isGlobal: true,
        inject: [ConfigService3],
        useFactory: (config) => {
          const logger = new Logger23("CacheModule");
          const redisUrl = config.get("REDIS_URL", { infer: true });
          const ttl = config.get("CACHE_TTL_MS", { infer: true }) ?? DEFAULT_TTL_MS;
          if (!redisUrl) {
            logger.warn({
              message: "REDIS_URL is not set — falling back to a per-instance in-memory cache.",
              ttl
            });
            return { ttl };
          }
          logger.log({ message: "Cache backed by Redis", ttl });
          return { ttl, stores: [new KeyvRedis(redisUrl)] };
        }
      })
    ],
    exports: [CacheModule]
  })
], AppCacheModule);

// src/config/env.validation.ts
import { plainToInstance, Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync
} from "class-validator";
var NodeEnv;
((NodeEnv2) => {
  NodeEnv2["Development"] = "development";
  NodeEnv2["Production"] = "production";
  NodeEnv2["Test"] = "test";
})(NodeEnv ||= {});

class EnvironmentVariables {
  constructor() {
    this.NODE_ENV = "development" /* Development */;
    this.PORT = 3001;
  }
}
__legacyDecorateClassTS([
  IsEnum(NodeEnv),
  __legacyMetadataTS("design:type", typeof NodeEnv === "undefined" ? Object : NodeEnv)
], EnvironmentVariables.prototype, "NODE_ENV", undefined);
__legacyDecorateClassTS([
  Type(() => Number),
  IsInt(),
  Min(1),
  Max(65535),
  __legacyMetadataTS("design:type", Object)
], EnvironmentVariables.prototype, "PORT", undefined);
__legacyDecorateClassTS([
  IsString(),
  MinLength(1, {
    message: "DATABASE_URL is required. `docker compose up -d` starts one, or set it to any Postgres connection string."
  }),
  __legacyMetadataTS("design:type", String)
], EnvironmentVariables.prototype, "DATABASE_URL", undefined);
__legacyDecorateClassTS([
  IsString(),
  MinLength(32, {
    message: "BETTER_AUTH_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 32"
  }),
  __legacyMetadataTS("design:type", String)
], EnvironmentVariables.prototype, "BETTER_AUTH_SECRET", undefined);
__legacyDecorateClassTS([
  IsString(),
  MinLength(1, {
    message: 'ALLOWED_SIGN_IN is required — it is the only thing deciding who can sign in. Set it to your email domain, e.g. ALLOWED_SIGN_IN="acme.com", or to a single address for a one-person install.'
  }),
  __legacyMetadataTS("design:type", String)
], EnvironmentVariables.prototype, "ALLOWED_SIGN_IN", undefined);
__legacyDecorateClassTS([
  IsOptional(),
  IsString(),
  __legacyMetadataTS("design:type", String)
], EnvironmentVariables.prototype, "GOOGLE_CLIENT_ID", undefined);
__legacyDecorateClassTS([
  IsOptional(),
  IsString(),
  __legacyMetadataTS("design:type", String)
], EnvironmentVariables.prototype, "GOOGLE_CLIENT_SECRET", undefined);
__legacyDecorateClassTS([
  IsOptional(),
  IsString(),
  __legacyMetadataTS("design:type", String)
], EnvironmentVariables.prototype, "MICROSOFT_CLIENT_ID", undefined);
__legacyDecorateClassTS([
  IsOptional(),
  IsString(),
  __legacyMetadataTS("design:type", String)
], EnvironmentVariables.prototype, "MICROSOFT_CLIENT_SECRET", undefined);
__legacyDecorateClassTS([
  IsOptional(),
  IsString(),
  __legacyMetadataTS("design:type", String)
], EnvironmentVariables.prototype, "MICROSOFT_TENANT_ID", undefined);
__legacyDecorateClassTS([
  IsOptional(),
  IsString(),
  __legacyMetadataTS("design:type", String)
], EnvironmentVariables.prototype, "SLACK_CLIENT_ID", undefined);
__legacyDecorateClassTS([
  IsOptional(),
  IsString(),
  __legacyMetadataTS("design:type", String)
], EnvironmentVariables.prototype, "SLACK_CLIENT_SECRET", undefined);
__legacyDecorateClassTS([
  IsOptional(),
  IsUrl({ require_tld: false }),
  __legacyMetadataTS("design:type", String)
], EnvironmentVariables.prototype, "API_URL", undefined);
__legacyDecorateClassTS([
  IsOptional(),
  IsString(),
  __legacyMetadataTS("design:type", String)
], EnvironmentVariables.prototype, "APP_URL", undefined);
__legacyDecorateClassTS([
  IsOptional(),
  IsString(),
  __legacyMetadataTS("design:type", String)
], EnvironmentVariables.prototype, "AUTH_COOKIE_DOMAIN", undefined);
__legacyDecorateClassTS([
  IsOptional(),
  IsString(),
  __legacyMetadataTS("design:type", String)
], EnvironmentVariables.prototype, "REDIS_URL", undefined);
__legacyDecorateClassTS([
  IsOptional(),
  Type(() => Number),
  IsInt(),
  Min(0),
  __legacyMetadataTS("design:type", Number)
], EnvironmentVariables.prototype, "CACHE_TTL_MS", undefined);
__legacyDecorateClassTS([
  IsOptional(),
  IsString(),
  MinLength(16, {
    message: "CRON_SECRET must be at least 16 characters."
  }),
  __legacyMetadataTS("design:type", String)
], EnvironmentVariables.prototype, "CRON_SECRET", undefined);
__legacyDecorateClassTS([
  IsOptional(),
  IsString(),
  __legacyMetadataTS("design:type", String)
], EnvironmentVariables.prototype, "BLOB_READ_WRITE_TOKEN", undefined);
__legacyDecorateClassTS([
  IsOptional(),
  IsUrl({ require_tld: false, require_protocol: true }, {
    message: "AGENT_URL must be a full URL with a scheme, like http://127.0.0.1:2000."
  }),
  __legacyMetadataTS("design:type", String)
], EnvironmentVariables.prototype, "AGENT_URL", undefined);
__legacyDecorateClassTS([
  IsOptional(),
  IsString(),
  __legacyMetadataTS("design:type", String)
], EnvironmentVariables.prototype, "AGENT_BRIDGE_SECRET", undefined);
__legacyDecorateClassTS([
  IsOptional(),
  IsString(),
  __legacyMetadataTS("design:type", String)
], EnvironmentVariables.prototype, "CRM_TELEMETRY_DISABLED", undefined);
function validateEnv(config) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true
  });
  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: false
  });
  if (errors.length > 0) {
    const details = errors.map((error) => Object.values(error.constraints ?? {}).join(", ")).join(`
  - `);
    throw new Error(`Invalid environment configuration:
  - ${details}

See .env.example at the root of the repo.`);
  }
  return validated;
}

// src/conversations/conversations.module.ts
import { Module as Module14 } from "@nestjs/common";

// src/conversations/conversation-attachments.controller.ts
import { SESSION_COOKIE_NAME as SESSION_COOKIE_NAME2 } from "@crm/auth";
import {
  Controller as Controller4,
  Get as Get4,
  Param,
  Query as Query9,
  Res,
  StreamableFile
} from "@nestjs/common";
import {
  ApiCookieAuth as ApiCookieAuth2,
  ApiOkResponse as ApiOkResponse4,
  ApiOperation as ApiOperation4,
  ApiParam,
  ApiQuery,
  ApiTags as ApiTags4
} from "@nestjs/swagger";
import { Session as Session2 } from "@thallesp/nestjs-better-auth";

// src/conversations/conversations.service.ts
import { WORKSPACE_ID as WORKSPACE_ID2 } from "@crm/auth";
import { Prisma as PrismaNamespace7 } from "@crm/db";
import { readAgentManifestSummary as readAgentManifestSummary2 } from "@crm/validation/agent-manifest";
import {
  builderQuestion
} from "@crm/validation/builder-question";
import {
  BadRequestException as BadRequestException9,
  Injectable as Injectable31,
  Logger as Logger24,
  NotFoundException as NotFoundException10,
  Optional
} from "@nestjs/common";

// src/conversations/conversation-attachments.ts
import { z as z16 } from "zod";
var builderMessageFields = z16.record(z16.string(), z16.json()).catch({});
function builderMessageWithAttachments(value, attachments, shareToken) {
  return {
    ...builderMessageFields.parse(value),
    attachments: attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      type: attachment.mediaType,
      size: attachment.size,
      previewUrl: isPreviewableImage(attachment.mediaType) ? attachmentUrl(attachment.id, shareToken) : null
    }))
  };
}
function isPreviewableImage(mediaType) {
  return ["image/gif", "image/jpeg", "image/png", "image/webp"].includes(mediaType.toLowerCase());
}
function attachmentUrl(id, shareToken) {
  const path = `/api/conversations/attachments/${encodeURIComponent(id)}`;
  return shareToken ? `${path}?share=${encodeURIComponent(shareToken)}` : path;
}

// src/conversations/conversation-share-token.ts
import { createHash } from "node:crypto";
function conversationShareTokenHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

// src/conversations/conversations.service.ts
class ConversationsService {
  db;
  agent;
  logger = new Logger24(ConversationsService.name);
  constructor(db, agent) {
    this.db = db;
    this.agent = agent;
  }
  async list(input, userId) {
    const recordId = this.recordId(input);
    this.logger.debug({ message: "Conversation list read", recordId });
    const rows = await this.db.agentConversation.findMany({
      where: {
        userId,
        contactId: input.contactId ?? undefined,
        companyId: input.companyId ?? undefined,
        dealId: input.dealId ?? undefined
      },
      orderBy: { lastMessageAt: "desc" },
      take: 20,
      select: {
        id: true,
        sessionId: true,
        continuationToken: true,
        streamIndex: true,
        title: true,
        messageCount: true,
        lastMessageAt: true
      }
    });
    const summaries = rows.flatMap((row) => row.sessionId ? [
      {
        ...row,
        sessionId: row.sessionId,
        lastMessageAt: row.lastMessageAt.toISOString()
      }
    ] : []);
    return summaries;
  }
  async listBuilder(userId) {
    await this.assertWorkspaceMember(userId);
    const rows = await this.db.agentConversation.findMany({
      where: { userId, kind: "BUILDER" },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
      select: {
        id: true,
        sessionId: true,
        continuationToken: true,
        streamIndex: true,
        title: true,
        messageCount: true,
        lastMessageAt: true,
        lastAssistantAt: true,
        lastReadAt: true,
        agent: { select: { id: true, name: true, status: true } },
        _count: {
          select: {
            submissions: { where: { commandType: "CREATE_AGENT" } }
          }
        },
        submissions: {
          where: { status: { in: ["PENDING", "SENDING"] } },
          select: { id: true },
          take: 1
        }
      }
    });
    return rows.map((row) => {
      const unread = Boolean(row.lastAssistantAt && (!row.lastReadAt || row.lastAssistantAt > row.lastReadAt));
      const working = row.submissions.length > 0 || Boolean(row.sessionId && !row.continuationToken);
      return {
        id: row.id,
        sessionId: row.sessionId,
        continuationToken: row.continuationToken,
        streamIndex: row.streamIndex,
        title: row.title,
        messageCount: row.messageCount,
        lastMessageAt: row.lastMessageAt.toISOString(),
        lastAssistantAt: row.lastAssistantAt?.toISOString() ?? null,
        unread,
        state: row._count.submissions > 0 && row.agent?.status === "LIVE" ? "deployed" : working ? "working" : unread ? "unread" : "idle",
        agent: row.agent
      };
    });
  }
  async builderResources(q, userId) {
    await this.assertWorkspaceMember(userId);
    const search = q.trim();
    const contains = search ? { contains: search, mode: "insensitive" } : undefined;
    const [companies, contacts, deals, slackAccount] = await Promise.all([
      this.db.company.findMany({
        where: contains ? { name: contains } : undefined,
        orderBy: { lastActivityAt: { sort: "desc", nulls: "last" } },
        take: 6,
        select: { id: true, name: true, domain: true, logoUrl: true }
      }),
      this.db.contact.findMany({
        where: contains ? {
          OR: [
            { firstName: contains },
            { lastName: contains },
            { email: contains }
          ]
        } : undefined,
        orderBy: { lastActivityAt: { sort: "desc", nulls: "last" } },
        take: 6,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
          company: { select: { name: true } }
        }
      }),
      this.db.deal.findMany({
        where: contains ? { name: contains } : undefined,
        orderBy: { lastActivityAt: { sort: "desc", nulls: "last" } },
        take: 6,
        select: {
          id: true,
          name: true,
          company: { select: { name: true, logoUrl: true } }
        }
      }),
      this.db.account.findFirst({
        where: { providerId: "slack", accessToken: { not: null } },
        select: { id: true }
      })
    ]);
    return [
      ...slackAccount && (!search || "slack".includes(search.toLowerCase())) ? [
        {
          kind: "integration",
          id: "slack:workspace",
          label: "Slack",
          detail: "Connected workspace",
          imageUrl: null
        }
      ] : [],
      ...companies.map((company) => ({
        kind: "company",
        id: company.id,
        label: company.name,
        detail: company.domain,
        imageUrl: company.logoUrl
      })),
      ...contacts.map((contact) => ({
        kind: "contact",
        id: contact.id,
        label: [contact.firstName, contact.lastName].filter(Boolean).join(" "),
        detail: contact.company?.name ?? contact.email,
        imageUrl: contact.imageUrl
      })),
      ...deals.map((deal) => ({
        kind: "deal",
        id: deal.id,
        label: deal.name,
        detail: deal.company.name,
        imageUrl: deal.company.logoUrl
      }))
    ];
  }
  async builderById(id, userId) {
    await this.assertWorkspaceMember(userId);
    const row = await this.db.agentConversation.findFirst({
      where: { id, userId, kind: "BUILDER" },
      select: {
        id: true,
        sessionId: true,
        continuationToken: true,
        pendingInputRequest: true,
        streamIndex: true,
        title: true,
        messageCount: true,
        lastMessageAt: true,
        lastAssistantAt: true,
        lastReadAt: true,
        agent: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            createdBy: { select: { id: true, name: true } },
            currentVersion: {
              select: {
                id: true,
                number: true,
                status: true,
                manifest: true,
                modelId: true,
                sandboxPolicy: true,
                deployedAt: true
              }
            },
            triggers: {
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                type: true,
                name: true,
                config: true,
                enabled: true,
                nextRunAt: true
              }
            }
          }
        },
        createdVersions: {
          orderBy: { number: "desc" },
          take: 1,
          select: {
            id: true,
            number: true,
            status: true,
            instructions: true,
            manifest: true,
            modelId: true,
            sandboxPolicy: true,
            validation: true,
            createdAt: true
          }
        },
        builderArtifacts: {
          orderBy: [{ createdAt: "desc" }, { revision: "desc" }],
          take: 100,
          select: {
            id: true,
            versionId: true,
            path: true,
            language: true,
            content: true,
            previousContent: true,
            revision: true,
            status: true,
            createdAt: true
          }
        },
        feedback: {
          where: { userId },
          select: { messageId: true, rating: true }
        },
        submissions: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            clientRequestId: true,
            commandType: true,
            message: true,
            status: true,
            errorCode: true,
            errorMessage: true,
            createdAt: true,
            sentAt: true,
            acceptedAt: true,
            attachments: {
              orderBy: { position: "asc" },
              select: {
                id: true,
                name: true,
                mediaType: true,
                size: true
              }
            }
          }
        }
      }
    });
    if (!row) {
      throw new NotFoundException10(`No builder conversation with id ${id}.`);
    }
    const { pendingInputRequest, ...conversation } = row;
    return {
      ...conversation,
      pendingQuestion: pendingBuilderQuestionOf(pendingInputRequest),
      lastMessageAt: row.lastMessageAt.toISOString(),
      lastAssistantAt: row.lastAssistantAt?.toISOString() ?? null,
      lastReadAt: row.lastReadAt?.toISOString() ?? null,
      agent: row.agent ? {
        ...row.agent,
        currentVersion: row.agent.currentVersion ? {
          ...row.agent.currentVersion,
          deployedAt: row.agent.currentVersion.deployedAt?.toISOString() ?? null
        } : null,
        triggers: row.agent.triggers.map((trigger) => ({
          ...trigger,
          nextRunAt: trigger.nextRunAt?.toISOString() ?? null
        }))
      } : null,
      createdVersions: row.createdVersions.map((version) => ({
        ...version,
        manifest: readAgentManifestSummary2(version.manifest),
        createdAt: version.createdAt.toISOString()
      })),
      builderArtifacts: row.builderArtifacts.map((artifact) => ({
        ...artifact,
        createdAt: artifact.createdAt.toISOString()
      })),
      submissions: row.submissions.map(({ attachments, ...submission }) => ({
        ...submission,
        message: builderMessageWithAttachments(submission.message, attachments),
        createdAt: submission.createdAt.toISOString(),
        sentAt: submission.sentAt?.toISOString() ?? null,
        acceptedAt: submission.acceptedAt?.toISOString() ?? null
      }))
    };
  }
  async createBuilder(input, userId) {
    await this.assertWorkspaceMember(userId);
    const existing = await this.requestByClientId(input.clientRequestId);
    if (existing) {
      return this.replayBuilderCreation(existing, userId);
    }
    const now = new Date;
    try {
      const conversation = await this.db.agentConversation.create({
        data: {
          kind: "BUILDER",
          userId,
          title: null,
          lastReadAt: now,
          lastMessageAt: now,
          submissions: {
            create: {
              submittedById: userId,
              clientRequestId: input.clientRequestId,
              commandType: input.commandType,
              message: this.builderMessage(input),
              attachments: {
                create: this.attachmentWrites(input.attachments)
              }
            }
          }
        },
        select: { id: true }
      });
      this.agent?.builderConversationQueued();
      return conversation;
    } catch (error) {
      if (!isUniqueConstraint(error))
        throw error;
      const winner = await this.requestByClientId(input.clientRequestId);
      if (!winner)
        throw error;
      return this.replayBuilderCreation(winner, userId);
    }
  }
  async submitBuilder(input, userId) {
    await this.assertWorkspaceMember(userId);
    const existing = await this.requestByClientId(input.clientRequestId);
    if (existing) {
      return this.replayBuilderSubmission(existing, input.id, userId);
    }
    const conversation = await this.db.agentConversation.findFirst({
      where: { id: input.id, userId, kind: "BUILDER" },
      select: { id: true }
    });
    if (!conversation) {
      throw new NotFoundException10(`No builder conversation with id ${input.id}.`);
    }
    try {
      const attachmentWrites = await this.submissionAttachmentWrites(input, userId);
      const submission = await this.db.$transaction(async (tx) => {
        const created = await tx.agentConversationSubmission.create({
          data: {
            conversationId: input.id,
            submittedById: userId,
            clientRequestId: input.clientRequestId,
            commandType: input.commandType,
            message: this.builderMessage(input),
            attachments: {
              create: attachmentWrites
            }
          },
          select: { id: true }
        });
        await tx.agentConversation.update({
          where: { id: input.id },
          data: { lastMessageAt: new Date, lastReadAt: new Date }
        });
        return created;
      });
      this.agent?.builderConversationQueued();
      return submission;
    } catch (error) {
      if (!isUniqueConstraint(error))
        throw error;
      const winner = await this.requestByClientId(input.clientRequestId);
      if (!winner)
        throw error;
      return this.replayBuilderSubmission(winner, input.id, userId);
    }
  }
  async answerBuilderQuestion(input, userId) {
    await this.assertWorkspaceMember(userId);
    const existing = await this.requestByClientId(input.clientRequestId);
    if (existing) {
      return this.replayBuilderSubmission(existing, input.id, userId);
    }
    const conversation = await this.db.agentConversation.findFirst({
      where: { id: input.id, userId, kind: "BUILDER" },
      select: {
        id: true,
        sessionId: true,
        continuationToken: true,
        pendingInputRequest: true
      }
    });
    if (!conversation) {
      throw new NotFoundException10(`No builder conversation with id ${input.id}.`);
    }
    if (!conversation.sessionId || !conversation.continuationToken) {
      throw new BadRequestException9("The agent is no longer waiting for that answer.");
    }
    const question = pendingBuilderQuestionOf(conversation.pendingInputRequest);
    if (!question) {
      throw new BadRequestException9("The agent is no longer waiting for that answer.");
    }
    if (question.requestId !== input.requestId) {
      throw new BadRequestException9("That follow-up question is no longer active.");
    }
    const options = question.options;
    const selected = input.optionId ? options.find((option) => option.id === input.optionId) : null;
    if (input.optionId && !selected) {
      throw new BadRequestException9("That answer is not available for this question.");
    }
    const acceptsText = question.allowFreeform || question.display === "text";
    if (input.text && !acceptsText) {
      throw new BadRequestException9("Choose one of the available answers for this question.");
    }
    const answer = input.optionId ?? input.text;
    if (!answer) {
      throw new BadRequestException9("Choose an answer before submitting.");
    }
    const displayText = selected?.label ?? answer;
    const inputResponse = input.optionId ? { requestId: input.requestId, optionId: input.optionId } : { requestId: input.requestId, text: input.text };
    try {
      const submission = await this.db.$transaction(async (tx) => {
        const created = await tx.agentConversationSubmission.create({
          data: {
            conversationId: input.id,
            submittedById: userId,
            clientRequestId: input.clientRequestId,
            inputRequestId: input.requestId,
            commandType: "CREATE_AGENT",
            message: {
              text: displayText,
              resources: [],
              attachments: [],
              inputResponse
            }
          },
          select: { id: true }
        });
        await tx.agentConversation.update({
          where: { id: input.id },
          data: { lastMessageAt: new Date, lastReadAt: new Date }
        });
        return created;
      });
      this.agent?.builderConversationQueued();
      return submission;
    } catch (error) {
      if (!isUniqueConstraint(error))
        throw error;
      const winner = await this.requestByClientId(input.clientRequestId);
      if (winner) {
        return this.replayBuilderSubmission(winner, input.id, userId);
      }
      const answered = await this.db.agentConversationSubmission.findFirst({
        where: {
          conversationId: input.id,
          inputRequestId: input.requestId
        },
        select: { id: true }
      });
      if (answered) {
        throw new BadRequestException9("That follow-up question has already been answered.");
      }
      throw error;
    }
  }
  async markRead(id, userId) {
    await this.assertWorkspaceMember(userId);
    const updated = await this.db.agentConversation.updateMany({
      where: { id, userId, kind: "BUILDER" },
      data: { lastReadAt: new Date }
    });
    if (updated.count === 0) {
      throw new NotFoundException10(`No builder conversation with id ${id}.`);
    }
    return { id };
  }
  async attachment(id, userId, shareToken) {
    await this.assertWorkspaceMember(userId);
    const share = shareToken?.trim();
    const row = await this.db.agentConversationAttachment.findFirst({
      where: {
        id,
        submission: {
          conversation: {
            kind: "BUILDER",
            OR: [
              { userId },
              ...share ? [
                {
                  shares: {
                    some: {
                      tokenHash: conversationShareTokenHash(share),
                      revokedAt: null,
                      OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date } }
                      ]
                    }
                  }
                }
              ] : []
            ]
          }
        }
      },
      select: { name: true, mediaType: true, content: true }
    });
    if (!row) {
      throw new NotFoundException10("That attachment is unavailable.");
    }
    return {
      ...row,
      previewable: isPreviewableImage(row.mediaType)
    };
  }
  async rateBuilderResponse(input, userId) {
    await this.assertWorkspaceMember(userId);
    const conversation = await this.db.agentConversation.findFirst({
      where: { id: input.id, userId, kind: "BUILDER" },
      select: { id: true }
    });
    if (!conversation) {
      throw new NotFoundException10(`No builder conversation with id ${input.id}.`);
    }
    const key = {
      conversationId_userId_messageId: {
        conversationId: input.id,
        userId,
        messageId: input.messageId
      }
    };
    if (!input.rating) {
      await this.db.agentConversationFeedback.deleteMany({
        where: key.conversationId_userId_messageId
      });
      return { id: input.messageId, rating: null };
    }
    await this.db.agentConversationFeedback.upsert({
      where: key,
      create: {
        conversationId: input.id,
        userId,
        messageId: input.messageId,
        rating: input.rating
      },
      update: { rating: input.rating }
    });
    return { id: input.messageId, rating: input.rating };
  }
  async save(input, userId) {
    const recordId = this.recordId(input);
    const updateExisting = async (existing2) => {
      if (existing2.userId !== userId || existing2.kind !== "RECORD") {
        throw new NotFoundException10(`No record conversation with session ${input.sessionId}.`);
      }
      const existingRecordId = existing2.contactId ?? existing2.companyId ?? existing2.dealId;
      if (existingRecordId !== recordId) {
        throw new BadRequestException9("A conversation cannot be moved to another CRM record.");
      }
      const updated = await this.db.agentConversation.updateMany({
        where: {
          id: existing2.id,
          kind: "RECORD",
          userId,
          contactId: input.contactId ?? null,
          companyId: input.companyId ?? null,
          dealId: input.dealId ?? null
        },
        data: {
          continuationToken: input.continuationToken ?? null,
          streamIndex: input.streamIndex ?? 0,
          messageCount: input.messageCount ?? 0,
          lastMessageAt: new Date
        }
      });
      if (updated.count !== 1) {
        throw new NotFoundException10(`No record conversation with session ${input.sessionId}.`);
      }
      return { id: existing2.id };
    };
    const existing = await this.db.agentConversation.findUnique({
      where: { sessionId: input.sessionId },
      select: {
        id: true,
        kind: true,
        userId: true,
        contactId: true,
        companyId: true,
        dealId: true
      }
    });
    let conversation;
    if (existing) {
      conversation = await updateExisting(existing);
    } else {
      try {
        conversation = await this.db.agentConversation.create({
          data: {
            sessionId: input.sessionId,
            continuationToken: input.continuationToken ?? null,
            streamIndex: input.streamIndex ?? 0,
            title: input.title?.slice(0, 120) ?? null,
            messageCount: input.messageCount ?? 0,
            userId,
            contactId: input.contactId ?? null,
            companyId: input.companyId ?? null,
            dealId: input.dealId ?? null
          },
          select: { id: true }
        });
      } catch (error) {
        if (!isUniqueConstraint(error))
          throw error;
        const winner = await this.db.agentConversation.findUnique({
          where: { sessionId: input.sessionId },
          select: {
            id: true,
            kind: true,
            userId: true,
            contactId: true,
            companyId: true,
            dealId: true
          }
        });
        if (!winner)
          throw error;
        conversation = await updateExisting(winner);
      }
    }
    return conversation;
  }
  async events(input, userId) {
    const conversation = await this.db.agentConversation.findUnique({
      where: { id: input.id },
      select: { kind: true, sessionId: true, userId: true }
    });
    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException10(`No conversation with id ${input.id}.`);
    }
    if (conversation.kind === "BUILDER") {
      await this.assertWorkspaceMember(userId);
    }
    const eventWhere = conversation.kind === "BUILDER" ? {
      OR: [
        { conversationId: input.id },
        ...conversation.sessionId ? [{ sessionId: conversation.sessionId }] : []
      ]
    } : conversation.sessionId ? { sessionId: conversation.sessionId } : { id: { in: [] } };
    const events = await this.db.agentEvent.findMany({
      where: eventWhere,
      orderBy: [{ emittedAt: "desc" }, { id: "desc" }],
      take: input.limit,
      select: { id: true, type: true, data: true, emittedAt: true }
    });
    return events.reverse().map((event) => ({
      type: event.type,
      data: event.data,
      meta: { id: event.id, at: event.emittedAt.toISOString() }
    }));
  }
  async remove(id, userId) {
    const conversation = await this.db.agentConversation.findUnique({
      where: { id },
      select: {
        id: true,
        kind: true,
        userId: true,
        sessionId: true
      }
    });
    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException10(`No conversation with id ${id}.`);
    }
    if (conversation.kind === "BUILDER") {
      await this.assertWorkspaceMember(userId);
    }
    await this.db.$transaction(async (tx) => {
      await tx.agentBuilderArtifact.deleteMany({
        where: { conversationId: id, versionId: null }
      });
      await tx.agentEvent.deleteMany({
        where: {
          OR: [
            { conversationId: id },
            ...conversation.sessionId ? [{ sessionId: conversation.sessionId }] : []
          ]
        }
      });
      await tx.agentConversation.delete({ where: { id } });
    });
    this.logger.log({ message: "Conversation removed", conversationId: id });
    return { id };
  }
  recordId(input) {
    const recordIds = [input.contactId, input.companyId, input.dealId].filter((recordId2) => Boolean(recordId2));
    const [recordId] = recordIds;
    if (!recordId || recordIds.length !== 1) {
      throw new BadRequestException9("Choose exactly one contact, company or deal.");
    }
    return recordId;
  }
  builderMessage(input) {
    return {
      text: input.message,
      resources: input.resources,
      attachments: input.attachments.map(({ name, type, size }) => ({
        name,
        type,
        size
      }))
    };
  }
  attachmentWrites(attachments) {
    return attachments.map((attachment, position) => ({
      name: attachment.name,
      mediaType: attachment.type,
      size: attachment.size,
      content: Buffer.from(attachment.contentBase64, "base64"),
      position
    }));
  }
  async submissionAttachmentWrites(input, userId) {
    const referencedIds = input.attachments.flatMap((attachment) => ("contentBase64" in attachment) ? [] : [attachment.id]);
    const referenced = referencedIds.length > 0 ? await this.db.agentConversationAttachment.findMany({
      where: {
        id: { in: referencedIds },
        submission: {
          conversation: { id: input.id, userId, kind: "BUILDER" }
        }
      },
      select: {
        id: true,
        name: true,
        mediaType: true,
        size: true,
        content: true
      }
    }) : [];
    const referencedById = new Map(referenced.map((row) => [row.id, row]));
    if (referencedIds.some((id) => !referencedById.has(id))) {
      throw new BadRequestException9("One or more attachments are no longer available.");
    }
    return input.attachments.map((attachment, position) => {
      if ("contentBase64" in attachment) {
        return {
          name: attachment.name,
          mediaType: attachment.type,
          size: attachment.size,
          content: Buffer.from(attachment.contentBase64, "base64"),
          position
        };
      }
      const stored = referencedById.get(attachment.id);
      if (!stored) {
        throw new BadRequestException9("One or more attachments are no longer available.");
      }
      return {
        name: stored.name,
        mediaType: stored.mediaType,
        size: stored.size,
        content: stored.content,
        position
      };
    });
  }
  async assertWorkspaceMember(userId) {
    const member = await this.db.member.findUnique({
      where: {
        organizationId_userId: { organizationId: WORKSPACE_ID2, userId }
      },
      select: { id: true }
    });
    if (!member) {
      throw new NotFoundException10("No workspace membership was found.");
    }
  }
  requestByClientId(clientRequestId) {
    return this.db.agentConversationSubmission.findUnique({
      where: { clientRequestId },
      select: {
        id: true,
        conversationId: true,
        submittedById: true,
        conversation: { select: { id: true, userId: true, kind: true } }
      }
    });
  }
  replayBuilderCreation(existing, userId) {
    if (existing.conversation.userId !== userId || existing.conversation.kind !== "BUILDER") {
      throw new BadRequestException9("That request has already been used.");
    }
    return { id: existing.conversation.id };
  }
  replayBuilderSubmission(existing, conversationId, userId) {
    if (existing.conversationId !== conversationId || existing.submittedById !== userId) {
      throw new BadRequestException9("That request has already been used.");
    }
    return { id: existing.id };
  }
}
ConversationsService = __legacyDecorateClassTS([
  Injectable31(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyDecorateParamTS(1, Optional()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof AgentTriggerService === "undefined" ? Object : AgentTriggerService
  ])
], ConversationsService);
function isUniqueConstraint(cause) {
  return cause instanceof PrismaNamespace7.PrismaClientKnownRequestError && cause.code === "P2002";
}
function pendingBuilderQuestionOf(value) {
  return builderQuestion.parse(value);
}

// src/conversations/conversation-attachments.controller.ts
class ConversationAttachmentsController {
  conversations;
  constructor(conversations) {
    this.conversations = conversations;
  }
  async read(id, shareToken, session, response) {
    const attachment = await this.conversations.attachment(id, session.user.id, shareToken);
    const content = Buffer.from(attachment.content);
    const disposition = attachment.previewable ? "inline" : "attachment";
    const mediaType = attachment.previewable ? attachment.mediaType : "application/octet-stream";
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("Content-Length", content.byteLength.toString());
    response.setHeader("Content-Type", mediaType);
    response.setHeader("Content-Disposition", `${disposition}; filename*=UTF-8''${encodeHeaderValue(attachment.name)}`);
    response.setHeader("X-Content-Type-Options", "nosniff");
    return new StreamableFile(content);
  }
}
__legacyDecorateClassTS([
  Get4(":id"),
  ApiOperation4({ summary: "Download a conversation attachment" }),
  ApiParam({ name: "id", description: "Attachment id." }),
  ApiQuery({
    name: "share",
    required: false,
    description: "Share token, for a link opened outside a session."
  }),
  ApiOkResponse4({ description: "The attachment's raw bytes." }),
  __legacyDecorateParamTS(0, Param("id")),
  __legacyDecorateParamTS(1, Query9("share")),
  __legacyDecorateParamTS(2, Session2()),
  __legacyDecorateParamTS(3, Res({ passthrough: true })),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String,
    String,
    typeof CrmSession === "undefined" ? Object : CrmSession,
    typeof Response === "undefined" ? Object : Response
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ConversationAttachmentsController.prototype, "read", null);
ConversationAttachmentsController = __legacyDecorateClassTS([
  ApiTags4("Conversations"),
  ApiCookieAuth2(SESSION_COOKIE_NAME2),
  Controller4("api/conversations/attachments"),
  __legacyMetadataTS("design:paramtypes", [
    typeof ConversationsService === "undefined" ? Object : ConversationsService
  ])
], ConversationAttachmentsController);
function encodeHeaderValue(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

// src/conversations/conversation-sharing.service.ts
import { randomBytes } from "node:crypto";
import { WORKSPACE_ID as WORKSPACE_ID3 } from "@crm/auth";
import {
  ForbiddenException as ForbiddenException6,
  Injectable as Injectable32,
  NotFoundException as NotFoundException11
} from "@nestjs/common";
class ConversationSharingService {
  db;
  constructor(db) {
    this.db = db;
  }
  async status(conversationId, userId) {
    await this.ownedBuilder(conversationId, userId);
    const share = await this.db.agentConversationShare.findFirst({
      where: {
        conversationId,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date } }]
      },
      select: { createdAt: true, expiresAt: true }
    });
    return {
      enabled: share !== null,
      createdAt: share?.createdAt.toISOString() ?? null,
      expiresAt: share?.expiresAt?.toISOString() ?? null
    };
  }
  async create(conversationId, userId) {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = conversationShareTokenHash(token);
    const created = await this.db.$transaction(async (tx) => {
      if (!await this.lockOwnedBuilder(tx, conversationId, userId)) {
        return false;
      }
      await tx.agentConversationShare.updateMany({
        where: { conversationId, revokedAt: null },
        data: { revokedAt: new Date }
      });
      await tx.agentConversationShare.create({
        data: { conversationId, createdById: userId, tokenHash }
      });
      return true;
    });
    if (!created)
      this.missingBuilder(conversationId);
    return { token };
  }
  async revoke(conversationId, userId) {
    const revoked = await this.db.$transaction(async (tx) => {
      if (!await this.lockOwnedBuilder(tx, conversationId, userId)) {
        return false;
      }
      await tx.agentConversationShare.updateMany({
        where: { conversationId, revokedAt: null },
        data: { revokedAt: new Date }
      });
      return true;
    });
    if (!revoked)
      this.missingBuilder(conversationId);
    return { id: conversationId };
  }
  async resolve(token, userId) {
    await this.assertWorkspaceMember(userId);
    const share = await this.db.agentConversationShare.findFirst({
      where: {
        tokenHash: conversationShareTokenHash(token),
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date } }],
        conversation: { kind: "BUILDER" }
      },
      select: {
        conversation: {
          select: {
            id: true,
            title: true,
            sessionId: true,
            lastMessageAt: true,
            user: { select: { name: true } },
            agent: { select: { id: true, name: true, status: true } },
            builderArtifacts: {
              orderBy: [{ createdAt: "desc" }, { revision: "desc" }],
              take: 100,
              select: {
                id: true,
                versionId: true,
                path: true,
                language: true,
                content: true,
                previousContent: true,
                revision: true,
                status: true,
                createdAt: true
              }
            },
            submissions: {
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                commandType: true,
                message: true,
                status: true,
                errorMessage: true,
                createdAt: true,
                attachments: {
                  orderBy: { position: "asc" },
                  select: {
                    id: true,
                    name: true,
                    mediaType: true,
                    size: true
                  }
                }
              }
            }
          }
        }
      }
    });
    if (!share) {
      throw new NotFoundException11("That shared conversation is unavailable.");
    }
    const { conversation } = share;
    const events = await this.db.agentEvent.findMany({
      where: {
        OR: [
          { conversationId: conversation.id },
          ...conversation.sessionId ? [{ sessionId: conversation.sessionId }] : []
        ]
      },
      orderBy: [{ emittedAt: "desc" }, { id: "desc" }],
      take: 5000,
      select: { id: true, type: true, data: true, emittedAt: true }
    });
    return {
      id: conversation.id,
      title: conversation.title,
      ownerName: conversation.user.name,
      lastMessageAt: conversation.lastMessageAt.toISOString(),
      agent: conversation.agent,
      builderArtifacts: conversation.builderArtifacts.map((artifact) => ({
        ...artifact,
        createdAt: artifact.createdAt.toISOString()
      })),
      submissions: conversation.submissions.map(({ attachments, ...submission }) => ({
        ...submission,
        message: builderMessageWithAttachments(submission.message, attachments, token),
        createdAt: submission.createdAt.toISOString()
      })),
      events: events.reverse().map((event) => ({
        type: event.type,
        data: event.data,
        meta: { id: event.id, at: event.emittedAt.toISOString() }
      }))
    };
  }
  async ownedBuilder(conversationId, userId) {
    const conversation = await this.db.agentConversation.findFirst({
      where: { id: conversationId, userId, kind: "BUILDER" },
      select: { id: true }
    });
    if (!conversation) {
      this.missingBuilder(conversationId);
    }
    return conversation;
  }
  async lockOwnedBuilder(tx, conversationId, userId) {
    const rows = await tx.$queryRaw`
			SELECT id
			FROM "agentConversation"
			WHERE id = ${conversationId}
			FOR UPDATE
		`;
    if (rows.length === 0)
      return false;
    return await tx.agentConversation.count({
      where: { id: conversationId, userId, kind: "BUILDER" }
    }) === 1;
  }
  missingBuilder(conversationId) {
    throw new NotFoundException11(`No builder conversation with id ${conversationId}.`);
  }
  async assertWorkspaceMember(userId) {
    const member = await this.db.member.findUnique({
      where: {
        organizationId_userId: { organizationId: WORKSPACE_ID3, userId }
      },
      select: { id: true }
    });
    if (!member) {
      throw new ForbiddenException6("This conversation belongs to another team.");
    }
  }
}
ConversationSharingService = __legacyDecorateClassTS([
  Injectable32(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], ConversationSharingService);

// src/conversations/conversations.router.ts
import { Inject as Inject12 } from "@nestjs/common";
import {
  Ctx as Ctx8,
  Input as Input9,
  Mutation as Mutation9,
  Query as Query10,
  Router as Router9,
  UseMiddlewares as UseMiddlewares9
} from "nestjs-trpc";

// src/conversations/conversations.contracts.ts
import {
  AgentBuilderArtifactStatus,
  AgentConversationCommandType,
  AgentConversationSubmissionStatus,
  AgentDefinitionStatus,
  AgentResponseRating,
  AgentTriggerType,
  AgentVersionStatus
} from "@crm/db";
import { z as z17 } from "zod";
var agentManifestSummaryOutput2 = z17.object({
  name: z17.string().optional(),
  description: z17.string().optional(),
  access: z17.array(z17.string()),
  triggers: z17.array(z17.object({ type: z17.string().optional(), summary: z17.string().optional() })),
  actions: z17.array(z17.object({ summary: z17.string().optional() })),
  dataScope: z17.object({ summary: z17.string().optional() })
});
var builderQuestionOutput = z17.object({
  kind: z17.literal("question"),
  requestId: z17.string(),
  prompt: z17.string(),
  display: z17.enum(["confirmation", "select", "text"]).optional(),
  options: z17.array(z17.object({
    id: z17.string(),
    label: z17.string(),
    description: z17.string().optional(),
    style: z17.enum(["danger", "default", "primary"]).optional()
  })),
  allowFreeform: z17.boolean().optional()
}).nullable();
var recordShape = {
  contactId: z17.string().trim().min(1).optional(),
  companyId: z17.string().trim().min(1).optional(),
  dealId: z17.string().trim().min(1).optional()
};
var hasExactlyOneRecord = (input) => [input.contactId, input.companyId, input.dealId].filter(Boolean).length === 1;
var recordMessage = "Choose exactly one contact, company or deal.";
var conversationListInput = z17.object(recordShape).refine(hasExactlyOneRecord, { message: recordMessage });
var conversationSaveInput = z17.object({
  ...recordShape,
  sessionId: z17.string().trim().min(1),
  continuationToken: z17.string().nullish(),
  streamIndex: z17.number().int().min(0).optional(),
  title: z17.string().trim().max(120).optional(),
  messageCount: z17.number().int().min(0).optional()
}).refine(hasExactlyOneRecord, { message: recordMessage });
var conversationIdInput = z17.object({ id: z17.string() });
var conversationEventsInput = z17.object({
  id: z17.string(),
  limit: z17.number().int().min(1).max(5000).default(2000)
});
var builderResource = z17.object({
  kind: z17.enum(["integration", "company", "contact", "deal"]),
  id: z17.string().trim().min(1).max(160),
  label: z17.string().trim().min(1).max(120),
  detail: z17.string().trim().max(160).nullable().optional(),
  imageUrl: z17.url().nullable().optional()
});
var builderAttachment = z17.object({
  name: z17.string().trim().min(1).max(180),
  type: z17.string().trim().min(1).max(120),
  size: z17.number().int().min(1).max(2000000),
  contentBase64: z17.string().min(1).max(2800000).regex(/^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{2}==|[A-Za-z\d+/]{3}=)?$/, "Attachment content must be valid base64.")
}).refine((attachment) => decodedBase64Size(attachment.contentBase64) === attachment.size, { message: "Attachment size does not match its content.", path: ["size"] });
var builderStoredAttachment = z17.object({
  id: z17.string().trim().min(1),
  name: z17.string().trim().min(1).max(180),
  type: z17.string().trim().min(1).max(120),
  size: z17.number().int().min(1).max(2000000),
  previewUrl: z17.string().nullable().optional()
});
var builderPromptShape = {
  clientRequestId: z17.uuid(),
  commandType: z17.enum(["CHAT", "CREATE_AGENT"]).default("CHAT"),
  message: z17.string().trim().min(1).max(20000),
  resources: z17.array(builderResource).max(20).default([])
};
var builderConversationCreateInput = z17.object({
  ...builderPromptShape,
  attachments: z17.array(builderAttachment).max(5).default([])
});
var builderConversationSubmitInput = z17.object({
  ...builderPromptShape,
  id: z17.string().min(1),
  attachments: z17.array(z17.union([builderAttachment, builderStoredAttachment])).max(5).default([])
});
var builderQuestionResponseInput = z17.object({
  id: z17.string().min(1),
  clientRequestId: z17.uuid(),
  requestId: z17.string().trim().min(1).max(240),
  optionId: z17.string().trim().min(1).max(160).optional(),
  text: z17.string().trim().min(1).max(20000).optional()
}).refine((input) => Boolean(input.optionId) !== Boolean(input.text), {
  message: "Choose one option or enter a written answer."
});
var sharedConversationInput = z17.object({
  token: z17.string().trim().min(32).max(256)
});
var builderResourceSearchInput = z17.object({
  q: z17.string().trim().max(120).default("")
});
var builderResponseRatingInput = z17.object({
  id: z17.string().min(1),
  messageId: z17.string().trim().min(1).max(240),
  rating: z17.enum(["UP", "DOWN"]).nullable()
});
function decodedBase64Size(value) {
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  return value.length / 4 * 3 - padding;
}
var agentDefinitionStatusOutput = z17.enum(Object.values(AgentDefinitionStatus));
var agentVersionStatusOutput = z17.enum(Object.values(AgentVersionStatus));
var agentBuilderArtifactStatusOutput = z17.enum(Object.values(AgentBuilderArtifactStatus));
var agentTriggerTypeOutput = z17.enum(Object.values(AgentTriggerType));
var agentConversationCommandTypeOutput = z17.enum(Object.values(AgentConversationCommandType));
var agentConversationSubmissionStatusOutput = z17.enum(Object.values(AgentConversationSubmissionStatus));
var agentResponseRatingOutput = z17.enum(Object.values(AgentResponseRating));
var conversationIdOutput = z17.object({ id: z17.string() });
var conversationSummaryOutput = z17.object({
  id: z17.string(),
  sessionId: z17.string(),
  continuationToken: z17.string().nullable(),
  streamIndex: z17.number(),
  title: z17.string().nullable(),
  messageCount: z17.number(),
  lastMessageAt: z17.string()
});
var conversationListOutput = z17.array(conversationSummaryOutput);
var builderConversationAgentSummaryOutput = z17.object({
  id: z17.string(),
  name: z17.string(),
  status: agentDefinitionStatusOutput
});
var builderConversationSummaryOutput = z17.object({
  id: z17.string(),
  sessionId: z17.string().nullable(),
  continuationToken: z17.string().nullable(),
  streamIndex: z17.number(),
  title: z17.string().nullable(),
  messageCount: z17.number(),
  lastMessageAt: z17.string(),
  lastAssistantAt: z17.string().nullable(),
  unread: z17.boolean(),
  state: z17.enum(["working", "unread", "deployed", "idle"]),
  agent: builderConversationAgentSummaryOutput.nullable()
});
var builderListOutput = z17.array(builderConversationSummaryOutput);
var builderResourceOutput = z17.object({
  kind: z17.enum(["integration", "company", "contact", "deal"]),
  id: z17.string(),
  label: z17.string(),
  detail: z17.string().nullable(),
  imageUrl: z17.string().nullable()
});
var builderResourcesOutput = z17.array(builderResourceOutput);
var agentBuilderArtifactOutput = z17.object({
  id: z17.string(),
  versionId: z17.string().nullable(),
  path: z17.string(),
  language: z17.string(),
  content: z17.string(),
  previousContent: z17.string().nullable(),
  revision: z17.number(),
  status: agentBuilderArtifactStatusOutput,
  createdAt: z17.string()
});
var agentTriggerSummaryOutput = z17.object({
  id: z17.string(),
  type: agentTriggerTypeOutput,
  name: z17.string(),
  config: z17.unknown(),
  enabled: z17.boolean(),
  nextRunAt: z17.string().nullable()
});
var agentCurrentVersionSummaryOutput = z17.object({
  id: z17.string(),
  number: z17.number(),
  status: agentVersionStatusOutput,
  manifest: z17.unknown(),
  modelId: z17.string(),
  sandboxPolicy: z17.unknown(),
  deployedAt: z17.string().nullable()
});
var builderAgentDetailOutput = z17.object({
  id: z17.string(),
  name: z17.string(),
  description: z17.string().nullable(),
  status: agentDefinitionStatusOutput,
  createdBy: z17.object({ id: z17.string(), name: z17.string() }),
  currentVersion: agentCurrentVersionSummaryOutput.nullable(),
  triggers: z17.array(agentTriggerSummaryOutput)
});
var builderCreatedVersionOutput = z17.object({
  id: z17.string(),
  number: z17.number(),
  status: agentVersionStatusOutput,
  instructions: z17.string(),
  manifest: agentManifestSummaryOutput2,
  modelId: z17.string(),
  sandboxPolicy: z17.unknown(),
  validation: z17.unknown().nullable(),
  createdAt: z17.string()
});
var builderFeedbackOutput = z17.object({
  messageId: z17.string(),
  rating: agentResponseRatingOutput
});
var builderSubmissionOutput = z17.object({
  id: z17.string(),
  clientRequestId: z17.string(),
  commandType: agentConversationCommandTypeOutput,
  message: z17.record(z17.string(), z17.unknown()),
  status: agentConversationSubmissionStatusOutput,
  errorCode: z17.string().nullable(),
  errorMessage: z17.string().nullable(),
  createdAt: z17.string(),
  sentAt: z17.string().nullable(),
  acceptedAt: z17.string().nullable()
});
var builderConversationDetailOutput = z17.object({
  id: z17.string(),
  sessionId: z17.string().nullable(),
  continuationToken: z17.string().nullable(),
  streamIndex: z17.number(),
  title: z17.string().nullable(),
  messageCount: z17.number(),
  lastMessageAt: z17.string(),
  lastAssistantAt: z17.string().nullable(),
  lastReadAt: z17.string().nullable(),
  pendingQuestion: builderQuestionOutput,
  agent: builderAgentDetailOutput.nullable(),
  createdVersions: z17.array(builderCreatedVersionOutput),
  builderArtifacts: z17.array(agentBuilderArtifactOutput),
  feedback: z17.array(builderFeedbackOutput),
  submissions: z17.array(builderSubmissionOutput)
});
var conversationEventOutput = z17.object({
  type: z17.string(),
  data: z17.unknown(),
  meta: z17.object({ id: z17.string(), at: z17.string() })
});
var conversationEventsOutput = z17.array(conversationEventOutput);
var builderResponseRatingOutput = z17.object({
  id: z17.string(),
  rating: agentResponseRatingOutput.nullable()
});
var conversationShareStatusOutput = z17.object({
  enabled: z17.boolean(),
  createdAt: z17.string().nullable(),
  expiresAt: z17.string().nullable()
});
var conversationShareTokenOutput = z17.object({ token: z17.string() });
var sharedConversationAgentOutput = z17.object({
  id: z17.string(),
  name: z17.string(),
  status: agentDefinitionStatusOutput
});
var sharedConversationSubmissionOutput = z17.object({
  id: z17.string(),
  commandType: agentConversationCommandTypeOutput,
  message: z17.record(z17.string(), z17.unknown()),
  status: agentConversationSubmissionStatusOutput,
  errorMessage: z17.string().nullable(),
  createdAt: z17.string()
});
var sharedConversationOutput = z17.object({
  id: z17.string(),
  title: z17.string().nullable(),
  ownerName: z17.string(),
  lastMessageAt: z17.string(),
  agent: sharedConversationAgentOutput.nullable(),
  builderArtifacts: z17.array(agentBuilderArtifactOutput),
  submissions: z17.array(sharedConversationSubmissionOutput),
  events: conversationEventsOutput
});

// src/conversations/conversations.router.ts
class ConversationsRouter {
  conversations;
  sharing;
  constructor(conversations, sharing) {
    this.conversations = conversations;
    this.sharing = sharing;
  }
  async list(ctx, input) {
    return this.conversations.list(input, ctx.user.id);
  }
  async builderList(ctx) {
    return this.conversations.listBuilder(ctx.user.id);
  }
  async builderResources(ctx, q) {
    return this.conversations.builderResources(q, ctx.user.id);
  }
  async builderById(ctx, id) {
    return this.conversations.builderById(id, ctx.user.id);
  }
  async events(ctx, input) {
    return this.conversations.events(input, ctx.user.id);
  }
  async save(ctx, input) {
    return this.conversations.save(input, ctx.user.id);
  }
  async createBuilder(ctx, input) {
    return this.conversations.createBuilder(input, ctx.user.id);
  }
  async submitBuilder(ctx, input) {
    return this.conversations.submitBuilder(input, ctx.user.id);
  }
  async answerBuilderQuestion(ctx, input) {
    return this.conversations.answerBuilderQuestion(input, ctx.user.id);
  }
  async rateBuilderResponse(ctx, input) {
    return this.conversations.rateBuilderResponse(input, ctx.user.id);
  }
  async markRead(ctx, id) {
    return this.conversations.markRead(id, ctx.user.id);
  }
  async shareStatus(ctx, id) {
    return this.sharing.status(id, ctx.user.id);
  }
  async createShare(ctx, id) {
    return this.sharing.create(id, ctx.user.id);
  }
  async revokeShare(ctx, id) {
    return this.sharing.revoke(id, ctx.user.id);
  }
  async shared(ctx, token) {
    return this.sharing.resolve(token, ctx.user.id);
  }
  async remove(ctx, id) {
    return this.conversations.remove(id, ctx.user.id);
  }
}
__legacyDecorateClassTS([
  Query10({
    input: conversationListInput,
    output: conversationListOutput,
    meta: restMeta("GET", "/conversations", ["Conversations"])
  }),
  __legacyDecorateParamTS(0, Ctx8()),
  __legacyDecorateParamTS(1, Input9()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ConversationsRouter.prototype, "list", null);
__legacyDecorateClassTS([
  Query10({
    output: builderListOutput,
    meta: restMeta("GET", "/conversations/builder", ["Conversations"])
  }),
  __legacyDecorateParamTS(0, Ctx8()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ConversationsRouter.prototype, "builderList", null);
__legacyDecorateClassTS([
  Query10({
    input: builderResourceSearchInput,
    output: builderResourcesOutput,
    meta: restMeta("GET", "/conversations/builder-resources", [
      "Conversations"
    ])
  }),
  __legacyDecorateParamTS(0, Ctx8()),
  __legacyDecorateParamTS(1, Input9("q")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ConversationsRouter.prototype, "builderResources", null);
__legacyDecorateClassTS([
  Query10({
    input: conversationIdInput,
    output: builderConversationDetailOutput,
    meta: restMeta("GET", "/conversations/builder/{id}", ["Conversations"])
  }),
  __legacyDecorateParamTS(0, Ctx8()),
  __legacyDecorateParamTS(1, Input9("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ConversationsRouter.prototype, "builderById", null);
__legacyDecorateClassTS([
  Query10({
    input: conversationEventsInput,
    output: conversationEventsOutput,
    meta: restMeta("GET", "/conversations/{id}/events", ["Conversations"])
  }),
  __legacyDecorateParamTS(0, Ctx8()),
  __legacyDecorateParamTS(1, Input9()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ConversationsRouter.prototype, "events", null);
__legacyDecorateClassTS([
  Mutation9({
    input: conversationSaveInput,
    output: conversationIdOutput,
    meta: restMeta("POST", "/conversations", ["Conversations"])
  }),
  __legacyDecorateParamTS(0, Ctx8()),
  __legacyDecorateParamTS(1, Input9()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ConversationsRouter.prototype, "save", null);
__legacyDecorateClassTS([
  Mutation9({
    input: builderConversationCreateInput,
    output: conversationIdOutput,
    meta: restMeta("POST", "/conversations/builder", ["Conversations"])
  }),
  __legacyDecorateParamTS(0, Ctx8()),
  __legacyDecorateParamTS(1, Input9()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ConversationsRouter.prototype, "createBuilder", null);
__legacyDecorateClassTS([
  Mutation9({
    input: builderConversationSubmitInput,
    output: conversationIdOutput,
    meta: restMeta("POST", "/conversations/{id}/submit-builder", [
      "Conversations"
    ])
  }),
  __legacyDecorateParamTS(0, Ctx8()),
  __legacyDecorateParamTS(1, Input9()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ConversationsRouter.prototype, "submitBuilder", null);
__legacyDecorateClassTS([
  Mutation9({
    input: builderQuestionResponseInput,
    output: conversationIdOutput,
    meta: restMeta("POST", "/conversations/{id}/answer-builder-question", [
      "Conversations"
    ])
  }),
  __legacyDecorateParamTS(0, Ctx8()),
  __legacyDecorateParamTS(1, Input9()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ConversationsRouter.prototype, "answerBuilderQuestion", null);
__legacyDecorateClassTS([
  Mutation9({
    input: builderResponseRatingInput,
    output: builderResponseRatingOutput,
    meta: restMeta("POST", "/conversations/{id}/rate-builder-response", [
      "Conversations"
    ])
  }),
  __legacyDecorateParamTS(0, Ctx8()),
  __legacyDecorateParamTS(1, Input9()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ConversationsRouter.prototype, "rateBuilderResponse", null);
__legacyDecorateClassTS([
  Mutation9({
    input: conversationIdInput,
    output: conversationIdOutput,
    meta: restMeta("PATCH", "/conversations/{id}/read", ["Conversations"])
  }),
  __legacyDecorateParamTS(0, Ctx8()),
  __legacyDecorateParamTS(1, Input9("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ConversationsRouter.prototype, "markRead", null);
__legacyDecorateClassTS([
  Query10({
    input: conversationIdInput,
    output: conversationShareStatusOutput,
    meta: restMeta("GET", "/conversations/{id}/share", ["Conversations"])
  }),
  __legacyDecorateParamTS(0, Ctx8()),
  __legacyDecorateParamTS(1, Input9("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ConversationsRouter.prototype, "shareStatus", null);
__legacyDecorateClassTS([
  Mutation9({
    input: conversationIdInput,
    output: conversationShareTokenOutput,
    meta: restMeta("POST", "/conversations/{id}/share", ["Conversations"])
  }),
  __legacyDecorateParamTS(0, Ctx8()),
  __legacyDecorateParamTS(1, Input9("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ConversationsRouter.prototype, "createShare", null);
__legacyDecorateClassTS([
  Mutation9({
    input: conversationIdInput,
    output: conversationIdOutput,
    meta: restMeta("DELETE", "/conversations/{id}/share", ["Conversations"])
  }),
  __legacyDecorateParamTS(0, Ctx8()),
  __legacyDecorateParamTS(1, Input9("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ConversationsRouter.prototype, "revokeShare", null);
__legacyDecorateClassTS([
  Query10({
    input: sharedConversationInput,
    output: sharedConversationOutput,
    meta: restMeta("GET", "/conversations/shared/{token}", ["Conversations"])
  }),
  __legacyDecorateParamTS(0, Ctx8()),
  __legacyDecorateParamTS(1, Input9("token")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ConversationsRouter.prototype, "shared", null);
__legacyDecorateClassTS([
  Mutation9({
    input: conversationIdInput,
    output: conversationIdOutput,
    meta: restMeta("DELETE", "/conversations/{id}", ["Conversations"])
  }),
  __legacyDecorateParamTS(0, Ctx8()),
  __legacyDecorateParamTS(1, Input9("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], ConversationsRouter.prototype, "remove", null);
ConversationsRouter = __legacyDecorateClassTS([
  Router9({ alias: "conversations" }),
  UseMiddlewares9(AuthMiddleware),
  __legacyDecorateParamTS(0, Inject12(ConversationsService)),
  __legacyDecorateParamTS(1, Inject12(ConversationSharingService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof ConversationsService === "undefined" ? Object : ConversationsService,
    typeof ConversationSharingService === "undefined" ? Object : ConversationSharingService
  ])
], ConversationsRouter);

// src/conversations/conversations.module.ts
class ConversationsModule {
}
ConversationsModule = __legacyDecorateClassTS([
  Module14({
    imports: [TrpcModule, AgentModule],
    controllers: [ConversationAttachmentsController],
    providers: [
      ConversationsService,
      ConversationSharingService,
      ConversationsRouter
    ],
    exports: [ConversationsService]
  })
], ConversationsModule);

// src/crm/crm.module.ts
import { Global, Module as Module15 } from "@nestjs/common";

// src/crm/enrichment-log.service.ts
import { ActivityType as ActivityType4 } from "@crm/db";
import { Injectable as Injectable33 } from "@nestjs/common";
class EnrichmentLogService {
  db;
  stamp;
  constructor(db, stamp) {
    this.db = db;
    this.stamp = stamp;
  }
  async record(event) {
    const author = await this.authorFor(event);
    if (!author)
      return null;
    const activity = await this.db.activity.create({
      data: {
        type: ActivityType4.ENRICHMENT,
        subject: event.subject,
        body: event.body ?? null,
        occurredAt: new Date,
        companyId: event.companyId ?? null,
        contactId: event.contactId ?? null,
        createdById: author,
        meta: { ...event.meta, automated: true }
      },
      select: { id: true, createdAt: true }
    });
    await this.stamp.touch({ companyId: event.companyId, contactId: event.contactId }, activity.createdAt);
    return activity.id;
  }
  async authorFor(event) {
    if (event.contactId) {
      const contact = await this.db.contact.findUnique({
        where: { id: event.contactId },
        select: { ownerId: true }
      });
      if (contact?.ownerId)
        return contact.ownerId;
    }
    if (event.companyId) {
      const company = await this.db.company.findUnique({
        where: { id: event.companyId },
        select: { ownerId: true }
      });
      if (company?.ownerId)
        return company.ownerId;
    }
    const anyUser = await this.db.user.findFirst({ select: { id: true } });
    return anyUser?.id ?? null;
  }
}
EnrichmentLogService = __legacyDecorateClassTS([
  Injectable33(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof ActivityStampService === "undefined" ? Object : ActivityStampService
  ])
], EnrichmentLogService);

// src/crm/crm.module.ts
class CrmModule {
}
CrmModule = __legacyDecorateClassTS([
  Global(),
  Module15({
    providers: [ActivityStampService, EnrichmentLogService],
    exports: [ActivityStampService, EnrichmentLogService]
  })
], CrmModule);

// src/dashboard/dashboard.module.ts
import { Module as Module16 } from "@nestjs/common";

// src/dashboard/dashboard.router.ts
import { Inject as Inject13 } from "@nestjs/common";
import { Ctx as Ctx9, Input as Input10, Query as Query11, Router as Router10, UseMiddlewares as UseMiddlewares10 } from "nestjs-trpc";

// src/dashboard/dashboard.contracts.ts
import { ActivityType as ActivityType5, DealStage as DealStage4 } from "@crm/db";
import { activityMeta as activityMeta3 } from "@crm/validation/activity-meta";
import { z as z18 } from "zod";
var DASHBOARD_SCOPES = ["me", "everyone"];
var dashboardSummaryInput = z18.object({
  scope: z18.enum(DASHBOARD_SCOPES).default("me")
});
var stageEnum2 = z18.enum(Object.values(DealStage4));
var ownerOutput = z18.object({
  id: z18.string(),
  name: z18.string(),
  email: z18.string(),
  image: z18.string().nullable()
});
var companyBriefOutput = z18.object({
  id: z18.string(),
  name: z18.string(),
  iconUrl: z18.string().nullable(),
  iconDarkUrl: z18.string().nullable(),
  iconTone: z18.string().nullable()
});
var linkedRecordOutput = z18.object({ id: z18.string(), name: z18.string() });
var monthlyTotalOutput = z18.object({
  count: z18.number(),
  valueCents: z18.number()
});
var stageBucketOutput = z18.object({
  stage: stageEnum2,
  count: z18.number(),
  valueCents: z18.number()
});
var trendPointOutput = z18.object({
  month: z18.string(),
  won: z18.number(),
  created: z18.number()
});
var unconvertedOutput2 = z18.object({
  count: z18.number(),
  currencies: z18.array(z18.string())
});
var biggestOpenDealOutput = z18.object({
  id: z18.string(),
  name: z18.string(),
  stage: stageEnum2,
  currency: z18.string(),
  company: companyBriefOutput,
  owner: ownerOutput,
  amountCents: z18.number().nullable(),
  baseAmountCents: z18.number().nullable(),
  expectedCloseDate: z18.string().nullable(),
  stageChangedAt: z18.string()
});
var overdueTaskOutput = z18.object({
  id: z18.string(),
  subject: z18.string().nullable(),
  company: linkedRecordOutput.nullable(),
  deal: linkedRecordOutput.nullable(),
  dueAt: z18.string().nullable()
});
var recentActivityOutput = z18.object({
  id: z18.string(),
  type: z18.nativeEnum(ActivityType5),
  subject: z18.string().nullable(),
  body: z18.string().nullable(),
  createdBy: ownerOutput,
  company: linkedRecordOutput.nullable(),
  deal: linkedRecordOutput.nullable(),
  createdAt: z18.string(),
  meta: activityMeta3
});
var dashboardSummaryOutput = z18.object({
  scope: z18.enum(DASHBOARD_SCOPES),
  reportingCurrency: z18.string(),
  unconverted: unconvertedOutput2,
  pipeline: z18.object({
    stages: z18.array(stageBucketOutput),
    totalCents: z18.number(),
    totalDeals: z18.number()
  }),
  wonThisMonth: monthlyTotalOutput,
  wonPrevMonth: monthlyTotalOutput,
  performance: z18.object({
    windowDays: z18.number(),
    wins: z18.number(),
    losses: z18.number(),
    winRate: z18.number().nullable(),
    avgDealCents: z18.number().nullable(),
    avgCycleDays: z18.number().nullable()
  }),
  trend: z18.array(trendPointOutput),
  closingThisMonthTotal: monthlyTotalOutput,
  biggestOpen: z18.array(biggestOpenDealOutput),
  overdueTasks: z18.array(overdueTaskOutput),
  recentActivity: z18.array(recentActivityOutput)
});

// src/dashboard/dashboard.service.ts
import { ActivityType as ActivityType6, DealStage as DealStage5 } from "@crm/db";
import { OPEN_DEAL_STAGES as OPEN_DEAL_STAGES3 } from "@crm/db/deal-stage";
import { activityMeta as activityMeta4 } from "@crm/validation/activity-meta";
import { Injectable as Injectable34 } from "@nestjs/common";
var OWNER_SELECT4 = {
  id: true,
  name: true,
  email: true,
  image: true
};
var TREND_MONTHS = 6;
var RATE_WINDOW_DAYS = 90;
var DAY_MS2 = 24 * 60 * 60 * 1000;
var MONTH_LABEL = new Intl.DateTimeFormat("en-US", { month: "short" });
function monthStart(from, offset) {
  return new Date(from.getFullYear(), from.getMonth() + offset, 1);
}
function monthKey(date) {
  return date.getFullYear() * 12 + date.getMonth();
}

class DashboardService {
  db;
  conversion;
  constructor(db, conversion) {
    this.db = db;
    this.conversion = conversion;
  }
  async summary(actingUserId, input) {
    const mine = input.scope === "me";
    const owned = mine ? { ownerId: actingUserId } : {};
    const now = new Date;
    const startOfMonth = monthStart(now, 0);
    const startOfNextMonth = monthStart(now, 1);
    const startOfPrevMonth = monthStart(now, -1);
    const trendStart = monthStart(now, -(TREND_MONTHS - 1));
    const rateStart = new Date(now.getTime() - RATE_WINDOW_DAYS * DAY_MS2);
    const base = await this.conversion.reportingCurrency();
    const counted = this.conversion.countedWhere(base);
    const [
      openByStage,
      openValueByStage,
      recentDeals,
      closingThisMonthTotals,
      biggestOpen,
      overdueTasks,
      recentActivity,
      unconverted
    ] = await Promise.all([
      this.db.deal.groupBy({
        by: ["stage"],
        where: { ...owned, stage: { in: [...OPEN_DEAL_STAGES3] } },
        _count: { _all: true }
      }),
      this.db.deal.groupBy({
        by: ["stage"],
        where: {
          AND: [{ ...owned, stage: { in: [...OPEN_DEAL_STAGES3] } }, counted]
        },
        _sum: { baseAmount: true }
      }),
      this.db.deal.findMany({
        where: {
          ...owned,
          OR: [
            { createdAt: { gte: trendStart } },
            { closedAt: { gte: trendStart } }
          ]
        },
        select: {
          baseAmount: true,
          baseCurrency: true,
          stage: true,
          createdAt: true,
          closedAt: true
        }
      }),
      this.db.deal.aggregate({
        where: {
          AND: [
            {
              ...owned,
              stage: { in: [...OPEN_DEAL_STAGES3] },
              expectedCloseDate: { gte: startOfMonth, lt: startOfNextMonth }
            },
            counted
          ]
        },
        _count: { _all: true },
        _sum: { baseAmount: true }
      }),
      this.db.deal.findMany({
        where: { ...owned, stage: { in: [...OPEN_DEAL_STAGES3] } },
        orderBy: [
          { baseAmount: { sort: "desc", nulls: "last" } },
          { expectedCloseDate: "asc" }
        ],
        take: 6,
        select: {
          id: true,
          name: true,
          stage: true,
          amount: true,
          currency: true,
          baseAmount: true,
          baseCurrency: true,
          expectedCloseDate: true,
          stageChangedAt: true,
          company: {
            select: {
              id: true,
              name: true,
              iconUrl: true,
              iconDarkUrl: true,
              iconTone: true
            }
          },
          owner: { select: OWNER_SELECT4 }
        }
      }),
      this.db.activity.findMany({
        where: {
          type: ActivityType6.TASK,
          completedAt: null,
          dueAt: { lt: now },
          createdById: actingUserId
        },
        orderBy: [{ dueAt: "asc" }],
        take: 10,
        select: {
          id: true,
          subject: true,
          dueAt: true,
          company: { select: { id: true, name: true } },
          deal: { select: { id: true, name: true } }
        }
      }),
      this.db.activity.findMany({
        where: mine ? { createdById: actingUserId } : {},
        orderBy: [{ createdAt: "desc" }],
        take: 12,
        select: {
          id: true,
          type: true,
          subject: true,
          body: true,
          createdAt: true,
          meta: true,
          createdBy: { select: OWNER_SELECT4 },
          company: { select: { id: true, name: true } },
          deal: { select: { id: true, name: true } }
        }
      }),
      this.conversion.unconverted(owned)
    ]);
    const stages = OPEN_DEAL_STAGES3.map((stage) => {
      const group = openByStage.find((row) => row.stage === stage);
      const value = openValueByStage.find((row) => row.stage === stage);
      return {
        stage,
        count: group?._count._all ?? 0,
        valueCents: toCents(value?._sum.baseAmount ?? null) ?? 0
      };
    });
    const firstBucket = monthKey(trendStart);
    const trend = Array.from({ length: TREND_MONTHS }, (_, index) => ({
      month: MONTH_LABEL.format(monthStart(trendStart, index)),
      won: 0,
      created: 0
    }));
    const wonThisMonth = { count: 0, valueCents: 0 };
    const wonPrevMonth = { count: 0, valueCents: 0 };
    let wins = 0;
    let losses = 0;
    let valuedWins = 0;
    let wonCents = 0;
    let cycleDays = 0;
    for (const deal of recentDeals) {
      const valued = deal.baseCurrency === base ? toCents(deal.baseAmount) : null;
      const cents = valued ?? 0;
      const created = trend[monthKey(deal.createdAt) - firstBucket];
      if (created)
        created.created += cents;
      const { closedAt, stage } = deal;
      if (!closedAt)
        continue;
      const won = stage === DealStage5.CLOSED_WON;
      if (won) {
        const closed = trend[monthKey(closedAt) - firstBucket];
        if (closed)
          closed.won += cents;
        if (closedAt >= startOfMonth && closedAt < startOfNextMonth) {
          wonThisMonth.count += 1;
          wonThisMonth.valueCents += cents;
        } else if (closedAt >= startOfPrevMonth && closedAt < startOfMonth) {
          wonPrevMonth.count += 1;
          wonPrevMonth.valueCents += cents;
        }
      }
      if (closedAt < rateStart)
        continue;
      if (won) {
        wins += 1;
        if (valued !== null) {
          valuedWins += 1;
          wonCents += cents;
        }
        cycleDays += (closedAt.getTime() - deal.createdAt.getTime()) / DAY_MS2;
      } else if (stage === DealStage5.CLOSED_LOST) {
        losses += 1;
      }
    }
    const decided = wins + losses;
    return {
      scope: input.scope,
      reportingCurrency: base,
      unconverted,
      pipeline: {
        stages,
        totalCents: stages.reduce((total, s) => total + s.valueCents, 0),
        totalDeals: stages.reduce((total, s) => total + s.count, 0)
      },
      wonThisMonth,
      wonPrevMonth,
      performance: {
        windowDays: RATE_WINDOW_DAYS,
        wins,
        losses,
        winRate: decided === 0 ? null : wins / decided,
        avgDealCents: valuedWins === 0 ? null : Math.round(wonCents / valuedWins),
        avgCycleDays: wins === 0 ? null : Math.round(cycleDays / wins)
      },
      trend,
      closingThisMonthTotal: {
        count: closingThisMonthTotals._count._all,
        valueCents: toCents(closingThisMonthTotals._sum.baseAmount) ?? 0
      },
      biggestOpen: biggestOpen.map(({
        amount,
        baseAmount,
        baseCurrency,
        expectedCloseDate,
        stageChangedAt,
        ...deal
      }) => ({
        ...deal,
        amountCents: toCents(amount),
        baseAmountCents: baseCurrency === base ? toCents(baseAmount) : null,
        expectedCloseDate: expectedCloseDate?.toISOString() ?? null,
        stageChangedAt: stageChangedAt.toISOString()
      })).sort((a, b) => (b.baseAmountCents ?? -1) - (a.baseAmountCents ?? -1)),
      overdueTasks: overdueTasks.map(({ dueAt, ...task }) => ({
        ...task,
        dueAt: dueAt?.toISOString() ?? null
      })),
      recentActivity: recentActivity.map(({ createdAt, meta, ...entry }) => ({
        ...entry,
        createdAt: createdAt.toISOString(),
        meta: activityMeta4.parse(meta)
      }))
    };
  }
}
DashboardService = __legacyDecorateClassTS([
  Injectable34(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof ConversionService === "undefined" ? Object : ConversionService
  ])
], DashboardService);

// src/dashboard/dashboard.router.ts
class DashboardRouter {
  dashboard;
  constructor(dashboard) {
    this.dashboard = dashboard;
  }
  async summary(ctx, input) {
    return this.dashboard.summary(ctx.user.id, input);
  }
}
__legacyDecorateClassTS([
  Query11({
    input: dashboardSummaryInput,
    output: dashboardSummaryOutput,
    meta: restMeta("GET", "/dashboard/summary", ["Dashboard"])
  }),
  __legacyDecorateParamTS(0, Ctx9()),
  __legacyDecorateParamTS(1, Input10()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], DashboardRouter.prototype, "summary", null);
DashboardRouter = __legacyDecorateClassTS([
  Router10({ alias: "dashboard" }),
  UseMiddlewares10(AuthMiddleware),
  __legacyDecorateParamTS(0, Inject13(DashboardService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof DashboardService === "undefined" ? Object : DashboardService
  ])
], DashboardRouter);

// src/dashboard/dashboard.module.ts
class DashboardModule {
}
DashboardModule = __legacyDecorateClassTS([
  Module16({
    imports: [TrpcModule, CurrencyModule],
    providers: [DashboardService, DashboardRouter]
  })
], DashboardModule);

// src/database/database.module.ts
import { db } from "@crm/db";
import {
  Global as Global2,
  Logger as Logger25,
  Module as Module17
} from "@nestjs/common";
class DatabaseModule {
  db;
  logger = new Logger25(DatabaseModule.name);
  constructor(db2) {
    this.db = db2;
  }
  async onModuleInit() {
    try {
      await this.db.$connect();
      this.logger.log({ message: "Database connected" });
    } catch (error) {
      this.logger.fatal({ message: "Database connection failed" }, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }
  async onApplicationShutdown(signal) {
    await this.db.$disconnect();
    this.logger.log({ message: "Database disconnected", signal });
  }
}
DatabaseModule = __legacyDecorateClassTS([
  Global2(),
  Module17({
    providers: [{ provide: DATABASE, useValue: db }],
    exports: [DATABASE]
  }),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], DatabaseModule);

// src/enrichment/enrichment.module.ts
import { Module as Module18 } from "@nestjs/common";

// src/enrichment/enrichment.router.ts
import { enrichmentQueueInput } from "@crm/validation/enrichment-queue";
import { Inject as Inject14 } from "@nestjs/common";
import { Input as Input11, Query as Query12, Router as Router11, UseMiddlewares as UseMiddlewares11 } from "nestjs-trpc";
import { z as z19 } from "zod";

// src/enrichment/enrichment.service.ts
import { ENRICHMENT_PAGE, pageSize } from "@crm/validation/enrichment-queue";
import { Injectable as Injectable35 } from "@nestjs/common";

// src/enrichment/enrichment-copy.ts
import { MAX_ATTEMPTS } from "@crm/db/agent-tasks";
var STEPS = {
  brand: "Fetching the logo",
  portrait: "Finding their photo",
  "meeting-prep": "Getting ready for your meeting",
  identify: "Reading their profile",
  profile: "Reading their profile",
  recheck: "Checking for anything new",
  "company-profile": "Reading the company website",
  "workspace-profile": "Reading your own website",
  "field-backfill": "Filling in the blank details",
  "slack-people-match": "Matching people in Slack",
  "slack-channel-join": "Joining a Slack channel",
  "agent-event": "Reacting to a change"
};
var STEP_BY_KIND = new Map(Object.entries(STEPS));
var UNKNOWN_STEP = "Looking them up";
var WAITING = "Waiting";
var GAVE_UP = "Could not look this up";
var SECOND_MS2 = 1000;
var DAY_MS3 = 24 * 60 * 60 * SECOND_MS2;
var DAYS_IN_WEEK = 7;
var DAYS_IN_MONTH = 30;
var WEEKS_FROM = 14;
var MONTHS_FROM = 60;
var TODAY = "Later today";
var TOMORROW = "Tomorrow";
function enrichmentStep(kind) {
  return STEP_BY_KIND.get(kind) ?? UNKNOWN_STEP;
}
function enrichmentQueueState(attempts, leasedUntil, now) {
  if (leasedUntil !== null && leasedUntil.getTime() > now.getTime()) {
    return "running";
  }
  return attempts >= MAX_ATTEMPTS ? "failed" : "queued";
}
function enrichmentQueueLine(state, kind) {
  if (state === "queued")
    return WAITING;
  if (state === "failed")
    return GAVE_UP;
  return enrichmentStep(kind);
}
function enrichmentDueLabel(dueAt, now) {
  const ahead = dueAt.getTime() - now.getTime();
  if (ahead < DAY_MS3)
    return TODAY;
  const days = Math.floor(ahead / DAY_MS3);
  if (days === 1)
    return TOMORROW;
  if (days < WEEKS_FROM)
    return `In ${days} days`;
  if (days < MONTHS_FROM)
    return `In ${Math.round(days / DAYS_IN_WEEK)} weeks`;
  return `In ${Math.round(days / DAYS_IN_MONTH)} months`;
}

// src/enrichment/enrichment.service.ts
var TASK_SELECT = {
  id: true,
  contactId: true,
  companyId: true,
  kind: true,
  attempts: true,
  leasedUntil: true,
  startedAt: true,
  dueAt: true
};

class EnrichmentService {
  db;
  constructor(db2) {
    this.db = db2;
  }
  async queue(limit = ENRICHMENT_PAGE) {
    const take = pageSize(limit);
    const now = new Date;
    const named = {
      finishedAt: null,
      OR: [{ contactId: { not: null } }, { companyId: { not: null } }]
    };
    const dueWhere = {
      ...named,
      dueAt: { lte: now }
    };
    const scheduledWhere = {
      ...named,
      dueAt: { gt: now }
    };
    const [tasks, total, booked, scheduledTotal] = await Promise.all([
      this.db.agentTask.findMany({
        where: dueWhere,
        orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
        take,
        select: TASK_SELECT
      }),
      this.db.agentTask.count({ where: dueWhere }),
      this.db.agentTask.findMany({
        where: scheduledWhere,
        orderBy: [{ dueAt: "asc" }],
        take,
        select: TASK_SELECT
      }),
      this.db.agentTask.count({ where: scheduledWhere })
    ]);
    const everyTask = [...tasks, ...booked];
    const contactIds = unique(everyTask.map((task) => task.contactId));
    const companyIds = unique(everyTask.map((task) => task.companyId));
    const [contacts, companies] = await Promise.all([
      contactIds.length === 0 ? [] : this.db.contact.findMany({
        where: { id: { in: contactIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true
        }
      }),
      companyIds.length === 0 ? [] : this.db.company.findMany({
        where: { id: { in: companyIds } },
        select: {
          id: true,
          name: true,
          iconUrl: true,
          logoUrl: true,
          iconDarkUrl: true,
          logoDarkUrl: true,
          iconTone: true
        }
      })
    ]);
    const contactById = new Map(contacts.map((contact) => [
      contact.id,
      {
        kind: "contact",
        id: contact.id,
        name: [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.email || "Unnamed contact",
        email: contact.email,
        imageUrl: contact.imageUrl
      }
    ]));
    const companyById = new Map(companies.map((company) => [
      company.id,
      {
        kind: "company",
        id: company.id,
        name: company.name,
        logoUrl: company.iconUrl ?? company.logoUrl,
        logoDarkUrl: company.iconDarkUrl ?? company.logoDarkUrl,
        logoTone: company.iconTone
      }
    ]));
    const subjectOf = (task) => task.contactId ? contactById.get(task.contactId) : task.companyId ? companyById.get(task.companyId) : undefined;
    const rows = [];
    for (const task of tasks) {
      const subject = subjectOf(task);
      if (!subject)
        continue;
      const state = enrichmentQueueState(task.attempts, task.leasedUntil, now);
      rows.push({
        id: task.id,
        state,
        line: enrichmentQueueLine(state, task.kind),
        startedAt: task.startedAt?.toISOString() ?? null,
        subject
      });
    }
    const scheduled = [];
    for (const task of booked) {
      const subject = subjectOf(task);
      if (!subject)
        continue;
      scheduled.push({
        id: task.id,
        due: enrichmentDueLabel(task.dueAt, now),
        subject
      });
    }
    return { rows, total, scheduled, scheduledTotal };
  }
}
EnrichmentService = __legacyDecorateClassTS([
  Injectable35(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], EnrichmentService);
function unique(ids) {
  return [...new Set(ids.filter((id) => id !== null))];
}

// src/enrichment/enrichment.router.ts
var enrichmentContactSubjectOutput = z19.object({
  kind: z19.literal("contact"),
  id: z19.string(),
  name: z19.string(),
  email: z19.string().nullable(),
  imageUrl: z19.string().nullable()
});
var enrichmentCompanySubjectOutput = z19.object({
  kind: z19.literal("company"),
  id: z19.string(),
  name: z19.string(),
  logoUrl: z19.string().nullable(),
  logoDarkUrl: z19.string().nullable(),
  logoTone: z19.string().nullable()
});
var enrichmentQueueSubjectOutput = z19.discriminatedUnion("kind", [
  enrichmentContactSubjectOutput,
  enrichmentCompanySubjectOutput
]);
var enrichmentQueueRowOutput = z19.object({
  id: z19.string(),
  state: z19.enum(["running", "queued", "failed"]),
  line: z19.string(),
  startedAt: z19.string().nullable(),
  subject: enrichmentQueueSubjectOutput
});
var enrichmentScheduledRowOutput = z19.object({
  id: z19.string(),
  due: z19.string(),
  subject: enrichmentQueueSubjectOutput
});
var enrichmentQueueOutput = z19.object({
  rows: z19.array(enrichmentQueueRowOutput),
  total: z19.number(),
  scheduled: z19.array(enrichmentScheduledRowOutput),
  scheduledTotal: z19.number()
});

class EnrichmentRouter {
  enrichment;
  constructor(enrichment) {
    this.enrichment = enrichment;
  }
  async queue(input) {
    return this.enrichment.queue(input.limit);
  }
}
__legacyDecorateClassTS([
  Query12({
    input: enrichmentQueueInput,
    output: enrichmentQueueOutput,
    meta: restMeta("GET", "/enrichment/queue", ["Enrichment"])
  }),
  __legacyDecorateParamTS(0, Input11()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z19 === "undefined" || typeof z19.infer === "undefined" ? Object : z19.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], EnrichmentRouter.prototype, "queue", null);
EnrichmentRouter = __legacyDecorateClassTS([
  Router11({ alias: "enrichment" }),
  UseMiddlewares11(AuthMiddleware),
  __legacyDecorateParamTS(0, Inject14(EnrichmentService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof EnrichmentService === "undefined" ? Object : EnrichmentService
  ])
], EnrichmentRouter);

// src/enrichment/enrichment.module.ts
class EnrichmentModule {
}
EnrichmentModule = __legacyDecorateClassTS([
  Module18({
    imports: [TrpcModule],
    providers: [EnrichmentService, EnrichmentRouter]
  })
], EnrichmentModule);

// src/google/google.module.ts
import { Module as Module20 } from "@nestjs/common";

// src/mailbox/mailbox.module.ts
import { Module as Module19 } from "@nestjs/common";

// src/mailbox/mailbox-api.client.ts
import { Injectable as Injectable36, Logger as Logger26 } from "@nestjs/common";
var DEFAULT_TIMEOUT_MS = 20000;
var MIN_BACKOFF_MS = 30000;
var MAX_BACKOFF_MS = 15 * 60000;

class MailboxApiClient {
  logger = new Logger26(MailboxApiClient.name);
  async get(url, accessToken, params = {}) {
    const target = new URL(url);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined)
        target.searchParams.set(key, String(value));
    }
    const controller = new AbortController;
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    try {
      const response = await fetch(target, {
        headers: { authorization: `Bearer ${accessToken}` },
        signal: controller.signal
      });
      return await this.interpret(response, target.pathname);
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      return {
        outcome: "failed",
        reason: aborted ? `Timed out after ${DEFAULT_TIMEOUT_MS}ms.` : error instanceof Error ? error.message : String(error),
        retryable: true
      };
    } finally {
      clearTimeout(timeout);
    }
  }
  async interpret(response, path) {
    if (response.ok) {
      return { outcome: "ok", data: await response.json() };
    }
    const detail = await this.reason(response);
    switch (response.status) {
      case 401:
        return { outcome: "unauthorized", reason: detail };
      case 404:
      case 410:
        return { outcome: "cursor-invalid", reason: detail };
      case 403:
        if (/rate|quota|userRateLimitExceeded|limitExceeded/i.test(detail)) {
          return {
            outcome: "rate-limited",
            reason: detail,
            retryAfterMs: this.backoffFrom(response)
          };
        }
        return { outcome: "failed", reason: detail, retryable: false };
      case 429:
        return {
          outcome: "rate-limited",
          reason: detail,
          retryAfterMs: this.backoffFrom(response)
        };
      default: {
        const retryable = response.status >= 500;
        this.logger.warn({
          message: "Mailbox API call failed",
          path,
          status: response.status,
          retryable
        });
        return { outcome: "failed", reason: detail, retryable };
      }
    }
  }
  backoffFrom(response) {
    const header = response.headers.get("retry-after");
    const seconds = header ? Number(header) : Number.NaN;
    const suggested = Number.isFinite(seconds) ? seconds * 1000 : MIN_BACKOFF_MS;
    return Math.min(Math.max(suggested, MIN_BACKOFF_MS), MAX_BACKOFF_MS);
  }
  async reason(response) {
    try {
      const body = await response.json();
      return body.error?.message ?? body.error?.status ?? body.error?.code ?? `HTTP ${response.status}`;
    } catch {
      return `HTTP ${response.status}`;
    }
  }
}
MailboxApiClient = __legacyDecorateClassTS([
  Injectable36()
], MailboxApiClient);

// src/mailbox/mailbox-match.service.ts
import { workspaceDomains } from "@crm/auth/workspace";
import { lockIdempotencyKey as lockIdempotencyKey4 } from "@crm/db/idempotency";
import { Injectable as Injectable37, Logger as Logger27 } from "@nestjs/common";

// src/mailbox/participants.ts
var AUTOMATED_LOCAL_PARTS = [
  "noreply",
  "no-reply",
  "donotreply",
  "do-not-reply",
  "notifications",
  "notification",
  "mailer-daemon",
  "postmaster",
  "bounce",
  "bounces",
  "auto-confirm",
  "automated",
  "calendar-invite",
  "calendar",
  "invite",
  "invites",
  "invitations",
  "meetings",
  "scheduling",
  "booking",
  "bookings",
  "reply",
  "support",
  "help",
  "hello",
  "info",
  "contact",
  "sales",
  "billing",
  "accounts",
  "team"
];
function parseAddress(input) {
  const trimmed = input.trim();
  if (!trimmed)
    return null;
  const angled = trimmed.match(/^(.*)<([^<>]+)>\s*$/);
  const rawEmail = (angled?.[2] ?? trimmed).trim().toLowerCase();
  if (!isEmailish(rawEmail))
    return null;
  const rawName = angled?.[1]?.trim() ?? "";
  const name = rawName.replace(/^"(.*)"$/, "$1").trim();
  return { email: rawEmail, name: name || null };
}
function parseAddressList(header) {
  if (!header)
    return [];
  const parts = [];
  let current = "";
  let inQuotes = false;
  let inAngles = false;
  for (const char of header) {
    if (char === '"')
      inQuotes = !inQuotes;
    if (char === "<")
      inAngles = true;
    if (char === ">")
      inAngles = false;
    if (char === "," && !inQuotes && !inAngles) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  const seen = new Set;
  const participants = [];
  for (const part of parts) {
    const parsed = parseAddress(part);
    if (!parsed || seen.has(parsed.email))
      continue;
    seen.add(parsed.email);
    participants.push(parsed);
  }
  return participants;
}
function isAutomatedAddress(email) {
  const local = email.split("@")[0]?.toLowerCase() ?? "";
  if (!local)
    return true;
  return AUTOMATED_LOCAL_PARTS.some((pattern) => local === pattern || local.startsWith(`${pattern}-`) || local.startsWith(`${pattern}+`) || local.startsWith(`${pattern}_`));
}
var OPAQUE_LOCAL_PARTS = [
  /^(c_)?[0-9a-f]{24,}$/,
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
];
function isMachineAddress(email) {
  const at = email.lastIndexOf("@");
  if (at < 1)
    return true;
  if (isMachineDomain(email.slice(at + 1)))
    return true;
  const local = email.slice(0, at).toLowerCase();
  return OPAQUE_LOCAL_PARTS.some((pattern) => pattern.test(local));
}
function isDerivedName(email, firstName, lastName) {
  const derived = splitName(null, email);
  return derived.firstName === firstName && (derived.lastName ?? null) === lastName;
}
function workDomain(email) {
  return domainFromEmail(email);
}
function externalParticipants(participants, options) {
  return participants.filter((participant) => {
    if (options.ourAddresses.has(participant.email))
      return false;
    if (options.suppressedEmails.has(participant.email))
      return false;
    if (isMachineAddress(participant.email))
      return false;
    const domain = workDomain(participant.email);
    if (!domain)
      return false;
    if (options.ourDomains.has(domain))
      return false;
    if (options.suppressedDomains.has(domain))
      return false;
    if (isAutomatedAddress(participant.email))
      return false;
    return true;
  });
}
function dominantDomain(participants, preferKnown = new Set) {
  const counts = new Map;
  for (const participant of participants) {
    const domain = workDomain(participant.email);
    if (!domain)
      continue;
    counts.set(domain, (counts.get(domain) ?? 0) + 1);
  }
  if (counts.size === 0)
    return null;
  let best = null;
  let bestScore = -1;
  for (const [domain, count] of counts) {
    const score = count * 2 + (preferKnown.has(domain) ? 1 : 0);
    if (score > bestScore) {
      best = domain;
      bestScore = score;
    }
  }
  return best;
}
function splitName(name, email) {
  const cleaned = name?.trim().replace(/\s+/g, " ") ?? "";
  if (cleaned && !cleaned.includes("@")) {
    const comma = cleaned.match(/^([^,]+),\s*(.+)$/);
    if (comma?.[1] && comma[2]) {
      return { firstName: comma[2].trim(), lastName: comma[1].trim() };
    }
    const [first, ...rest] = cleaned.split(" ");
    if (first) {
      return {
        firstName: first,
        lastName: rest.length > 0 ? rest.join(" ") : null
      };
    }
  }
  const local = email.split("@")[0] ?? email;
  const words = local.split(/[._-]+/).filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1));
  if (words.length === 0)
    return { firstName: email, lastName: null };
  return {
    firstName: words[0],
    lastName: words.length > 1 ? words.slice(1).join(" ") : null
  };
}
function isEmailish(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// src/mailbox/mailbox-match.service.ts
class MailboxMatchService {
  db;
  companies;
  agent;
  log;
  logger = new Logger27(MailboxMatchService.name);
  constructor(db2, companies, agent, log) {
    this.db = db2;
    this.companies = companies;
    this.agent = agent;
    this.log = log;
  }
  async internalIdentity() {
    const users = await this.db.user.findMany({ select: { email: true } });
    const addresses = new Set;
    const domains = new Set(workspaceDomains());
    for (const user of users) {
      const email = user.email.toLowerCase();
      addresses.add(email);
      const domain = workDomain(email);
      if (domain)
        domains.add(domain);
    }
    return { addresses, domains };
  }
  async suppressedDomains() {
    const rows = await this.db.suppressedDomain.findMany({
      select: { domain: true }
    });
    return new Set(rows.map((row) => row.domain));
  }
  async suppressedEmails() {
    const rows = await this.db.suppressedContact.findMany({
      select: { email: true }
    });
    return new Set(rows.map((row) => row.email.toLowerCase()));
  }
  async resolve(request, context) {
    const external = externalParticipants(request.participants, {
      ourDomains: context.ourDomains,
      ourAddresses: context.ourAddresses,
      suppressedDomains: context.suppressedDomains,
      suppressedEmails: context.suppressedEmails
    });
    if (external.length === 0) {
      return { companyId: null, contactId: null, external };
    }
    const contact = await this.db.contact.findFirst({
      where: { email: { in: external.map((person) => person.email) } },
      select: { id: true, companyId: true }
    });
    if (contact) {
      return {
        companyId: contact.companyId,
        contactId: contact.id,
        external
      };
    }
    const domains = [
      ...new Set(external.map((person) => workDomain(person.email)).filter((domain2) => domain2 !== null))
    ];
    const known = await this.db.company.findMany({
      where: { domain: { in: domains } },
      select: { id: true, domain: true }
    });
    const knownDomains = new Set(known.map((company) => company.domain).filter((domain2) => domain2 !== null));
    const domain = dominantDomain(external, knownDomains);
    if (!domain)
      return { companyId: null, contactId: null, external };
    const existing = known.find((company) => company.domain === domain);
    if (existing) {
      return {
        companyId: existing.id,
        contactId: request.allowCreate ? await this.createContact(external, domain, existing.id, request) : null,
        external
      };
    }
    if (!request.allowCreate) {
      return { companyId: null, contactId: null, external };
    }
    return this.create(external, domain, request);
  }
  async create(external, domain, request) {
    const lead = external.find((person) => workDomain(person.email) === domain) ?? external[0];
    if (!lead)
      return { companyId: null, contactId: null, external };
    const companyId = await this.companies.companyForEmail(lead.email, {
      ownerId: request.ownerId
    });
    if (!companyId) {
      return { companyId: null, contactId: null, external };
    }
    await this.db.company.update({
      where: { id: companyId },
      data: { source: request.source }
    });
    const contactId = await this.createContact(external, domain, companyId, request);
    await this.log.record({
      companyId,
      subject: "Company added from your inbox",
      body: `Created because you ${request.source === "CALENDAR" ? "met" : "emailed"} ` + `someone at ${domain}.`,
      meta: { source: request.source, domain }
    });
    this.logger.log({
      message: "Company auto-created from mailbox sync",
      companyId,
      domain,
      source: request.source
    });
    return { companyId, contactId, external };
  }
  async createContact(external, domain, companyId, request) {
    const person = external.find((candidate) => workDomain(candidate.email) === domain);
    if (!person)
      return null;
    const { firstName, lastName } = splitName(person.name, person.email);
    const outcome = await this.agent.withCrmEvents(async (tx, emit) => {
      await lockIdempotencyKey4(tx, `mailbox-contact:${person.email}`);
      const existing = await tx.contact.findUnique({
        where: { email: person.email },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          companyId: true,
          createdAt: true
        }
      });
      if (existing)
        return { contact: existing, created: false };
      const contact2 = await tx.contact.create({
        data: {
          firstName,
          lastName,
          email: person.email,
          companyId,
          source: request.source,
          ownerId: request.ownerId
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          companyId: true,
          createdAt: true
        }
      });
      await emit({
        type: "contact.created",
        record: { kind: "contact", id: contact2.id },
        occurredAt: contact2.createdAt,
        data: {
          firstName: contact2.firstName,
          lastName: contact2.lastName,
          email: contact2.email,
          companyId: contact2.companyId,
          source: request.source
        }
      });
      return { contact: contact2, created: true };
    });
    const { contact } = outcome;
    if (outcome.created) {
      await this.log.record({
        contactId: contact.id,
        companyId,
        subject: "Contact added from your inbox",
        body: `${person.email} appeared in a ${request.source === "CALENDAR" ? "meeting" : "thread"}.`,
        meta: { source: request.source }
      });
    }
    const hasRealName = Boolean(person.name?.trim());
    const isPlaceholder = isDerivedName(person.email, contact.firstName, contact.lastName);
    if (hasRealName && isPlaceholder) {
      await this.db.contact.update({
        where: { id: contact.id },
        data: { firstName, lastName }
      });
      return contact.id;
    }
    if (isPlaceholder && !hasRealName) {
      await this.agent.contactCreated(contact.id, "Created by the sync from an address, with no name on it");
    }
    return contact.id;
  }
}
MailboxMatchService = __legacyDecorateClassTS([
  Injectable37(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof CompanyDirectoryService === "undefined" ? Object : CompanyDirectoryService,
    typeof AgentTriggerService === "undefined" ? Object : AgentTriggerService,
    typeof EnrichmentLogService === "undefined" ? Object : EnrichmentLogService
  ])
], MailboxMatchService);

// src/mailbox/mailbox-token.service.ts
import {
  auth as auth3,
  parseScopes
} from "@crm/auth";
import { Injectable as Injectable38, Logger as Logger28 } from "@nestjs/common";

// src/mailbox/mailbox.constants.ts
import {
  CALENDAR_SCOPE,
  GMAIL_SCOPE,
  GOOGLE_PROVIDER_ID,
  MICROSOFT_PROVIDER_ID,
  OUTLOOK_MAIL_SCOPE
} from "@crm/auth";
import {
  CALENDAR_SCOPE as CALENDAR_SCOPE2,
  GMAIL_SCOPE as GMAIL_SCOPE2,
  GOOGLE_PROVIDER_ID as GOOGLE_PROVIDER_ID2,
  MICROSOFT_PROVIDER_ID as MICROSOFT_PROVIDER_ID2,
  MICROSOFT_SYNC_SCOPES,
  OUTLOOK_MAIL_SCOPE as OUTLOOK_MAIL_SCOPE2,
  SYNC_SCOPES
} from "@crm/auth";
var GOOGLE_SYNC_SOURCES = ["calendar", "gmail"];
var MICROSOFT_SYNC_SOURCES = ["outlook"];
function isGoogleSyncSource(source) {
  return GOOGLE_SYNC_SOURCES.includes(source);
}
function isMicrosoftSyncSource(source) {
  return MICROSOFT_SYNC_SOURCES.includes(source);
}
var SCOPE_FOR_SOURCE = {
  calendar: CALENDAR_SCOPE,
  gmail: GMAIL_SCOPE,
  outlook: OUTLOOK_MAIL_SCOPE
};
var PROVIDER_FOR_SOURCE = {
  calendar: GOOGLE_PROVIDER_ID,
  gmail: GOOGLE_PROVIDER_ID,
  outlook: MICROSOFT_PROVIDER_ID
};

// src/mailbox/mailbox-token.service.ts
var GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";

class MailboxTokenService {
  db;
  logger = new Logger28(MailboxTokenService.name);
  constructor(db2) {
    this.db = db2;
  }
  async grantedScopes(userId, providerId) {
    const account = await this.db.account.findFirst({
      where: { userId, providerId },
      select: { scope: true }
    });
    return parseScopes(account?.scope);
  }
  async isConnected(userId, source) {
    const scopes = await this.grantedScopes(userId, PROVIDER_FOR_SOURCE[source]);
    return scopes.has(SCOPE_FOR_SOURCE[source]);
  }
  async signInAccounts(userId) {
    return this.db.account.findMany({
      where: { userId },
      select: { providerId: true, scope: true }
    });
  }
  async hasRefreshToken(userId, providerId) {
    const account = await this.db.account.findFirst({
      where: { userId, providerId },
      select: { refreshToken: true }
    });
    return Boolean(account?.refreshToken);
  }
  async accessTokenFor(userId, source) {
    const providerId = PROVIDER_FOR_SOURCE[source];
    if (!await this.isConnected(userId, source)) {
      return {
        outcome: "not-connected",
        reason: `The ${source} scope has not been granted.`
      };
    }
    try {
      const { accessToken } = await auth3.api.getAccessToken({
        body: { providerId, userId }
      });
      if (!accessToken) {
        return {
          outcome: "needs-reconnect",
          reason: `${label(providerId)} returned no access token.`
        };
      }
      return { outcome: "ok", accessToken };
    } catch (error) {
      this.logger.warn({
        message: "Mailbox token refresh failed",
        userId,
        providerId,
        source,
        reason: error instanceof Error ? error.message : String(error)
      });
      return {
        outcome: "needs-reconnect",
        reason: `${label(providerId)} would not refresh the access token.`
      };
    }
  }
  async revoke(userId, providerId) {
    if (providerId === GOOGLE_PROVIDER_ID2 && !await this.revokeWithGoogle(userId)) {
      return false;
    }
    const cleared = await this.db.account.updateMany({
      where: { userId, providerId },
      data: {
        accessToken: null,
        refreshToken: null,
        scope: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null
      }
    });
    if (cleared.count === 0)
      return false;
    this.logger.log({ message: "Mailbox access revoked", userId, providerId });
    return true;
  }
  async revokeWithGoogle(userId) {
    const account = await this.db.account.findFirst({
      where: { userId, providerId: GOOGLE_PROVIDER_ID2 },
      select: { refreshToken: true, accessToken: true }
    });
    const token = account?.refreshToken ?? account?.accessToken;
    if (!token)
      return true;
    const response = await fetch(GOOGLE_REVOKE_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token })
    });
    if (response.ok)
      return true;
    this.logger.warn({
      message: "Google token revocation failed",
      userId,
      status: response.status
    });
    return false;
  }
}
MailboxTokenService = __legacyDecorateClassTS([
  Injectable38(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], MailboxTokenService);
function label(providerId) {
  return providerId === GOOGLE_PROVIDER_ID2 ? "Google" : "Microsoft";
}

// src/mailbox/sync-state.service.ts
import {
  GoogleSyncStatus
} from "@crm/db";
import { Injectable as Injectable39, Logger as Logger29 } from "@nestjs/common";
var SYNC_LEASE_MS = 300000;

class SyncStateService {
  db;
  logger = new Logger29(SyncStateService.name);
  constructor(db2) {
    this.db = db2;
  }
  async get(userId, source) {
    return this.db.mailboxSync.findUnique({
      where: { userId_source: { userId, source } }
    });
  }
  async listForUser(userId, sources) {
    const where = { userId };
    if (sources)
      where.source = { in: [...sources] };
    return this.db.mailboxSync.findMany({ where });
  }
  async due(now) {
    return this.db.mailboxSync.findMany({
      where: dueWhere(now),
      orderBy: [{ lastSyncedAt: { sort: "asc", nulls: "first" } }]
    });
  }
  async claim(row, now) {
    const { count } = await this.db.mailboxSync.updateMany({
      where: { id: row.id, updatedAt: row.updatedAt, ...dueWhere(now) },
      data: {
        status: GoogleSyncStatus.RUNNING,
        retryAfter: new Date(now.getTime() + SYNC_LEASE_MS)
      }
    });
    return count === 1;
  }
  async release(id) {
    await this.db.mailboxSync.updateMany({
      where: { id },
      data: { retryAfter: null }
    });
  }
  async ensure(userId, source, options) {
    return this.db.mailboxSync.upsert({
      where: { userId_source: { userId, source } },
      create: {
        userId,
        source,
        status: GoogleSyncStatus.IDLE,
        autoCreate: options.autoCreate
      },
      update: {
        status: GoogleSyncStatus.IDLE,
        lastError: null,
        retryAfter: null
      }
    });
  }
  async markRunning(id) {
    await this.db.mailboxSync.update({
      where: { id },
      data: { status: GoogleSyncStatus.RUNNING, lastError: null }
    });
  }
  async settle(id, update) {
    await this.db.mailboxSync.update({
      where: { id },
      data: {
        ...update,
        lastSyncedAt: new Date,
        lastError: null,
        retryAfter: null
      }
    });
  }
  async clearCursor(id, reason) {
    this.logger.warn({
      message: "Sync cursor invalidated — resuming from now",
      syncId: id,
      reason
    });
    await this.db.mailboxSync.update({
      where: { id },
      data: {
        cursor: null,
        status: GoogleSyncStatus.IDLE,
        lastError: null,
        retryAfter: null
      }
    });
  }
  async markNeedsReconnect(id, reason) {
    await this.db.mailboxSync.update({
      where: { id },
      data: {
        status: GoogleSyncStatus.NEEDS_RECONNECT,
        lastError: reason,
        retryAfter: null
      }
    });
  }
  async markRateLimited(id, retryAfterMs) {
    await this.db.mailboxSync.update({
      where: { id },
      data: {
        status: GoogleSyncStatus.IDLE,
        retryAfter: new Date(Date.now() + retryAfterMs)
      }
    });
  }
  async markFailed(id, reason) {
    await this.db.mailboxSync.update({
      where: { id },
      data: {
        status: GoogleSyncStatus.FAILED,
        lastError: reason,
        retryAfter: null
      }
    });
  }
  async setAutoCreate(userId, source, enabled) {
    await this.db.mailboxSync.updateMany({
      where: { userId, source },
      data: { autoCreate: enabled }
    });
  }
  async remove(userId, source) {
    const where = { userId };
    if (source)
      where.source = source;
    await this.db.mailboxSync.deleteMany({ where });
  }
}
SyncStateService = __legacyDecorateClassTS([
  Injectable39(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], SyncStateService);
function dueWhere(now) {
  return {
    status: { notIn: [GoogleSyncStatus.NEEDS_RECONNECT] },
    OR: [{ retryAfter: null }, { retryAfter: { lte: now } }]
  };
}

// src/mailbox/thread-writer.service.ts
import {
  ActivityType as ActivityType7,
  EmailDirection,
  Prisma as PrismaNamespace8,
  RecordSource as RecordSource3
} from "@crm/db";
import { Injectable as Injectable40, Logger as Logger30 } from "@nestjs/common";

// src/mailbox/message-text.ts
function decodeBase64Url(data) {
  const normalised = data.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalised.padEnd(normalised.length + (4 - normalised.length % 4) % 4, "=");
  try {
    return Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return "";
  }
}
function stripHtml(html) {
  return html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<br\s*\/?>/gi, `
`).replace(/<\/(p|div|tr|li|h[1-6])>/gi, `
`).replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n{3,}/g, `

`).trim();
}
var QUOTE_MARKERS = [
  /^\s*On .+ wrote:\s*$/m,
  /^\s*-{2,}\s*Original Message\s*-{2,}\s*$/im,
  /^\s*_{5,}\s*$/m,
  /^\s*From:\s.+$/m,
  /^\s*Begin forwarded message:\s*$/im,
  /^\s*-{3,}\s*Forwarded message\s*-{3,}\s*$/im
];
function stripQuotedHistory(body) {
  let cut = body.length;
  for (const marker of QUOTE_MARKERS) {
    const match = marker.exec(body);
    if (match && match.index < cut)
      cut = match.index;
  }
  let trimmed = body.slice(0, cut);
  const lines = trimmed.split(`
`);
  while (lines.length > 0 && /^\s*>/.test(lines[lines.length - 1] ?? "")) {
    lines.pop();
  }
  trimmed = lines.join(`
`);
  return trimmed.replace(/\n{3,}/g, `

`).trim();
}
function rootMessageIdFrom(headers) {
  if (headers.references) {
    const first = firstMessageId(headers.references);
    if (first)
      return first;
  }
  if (headers.inReplyTo) {
    const first = firstMessageId(headers.inReplyTo);
    if (first)
      return first;
  }
  return headers.messageId ? normaliseMessageId(headers.messageId) : null;
}
function firstMessageId(value) {
  const found = value.match(/<[^<>]+>|[^\s<>]+/);
  return found ? normaliseMessageId(found[0]) : null;
}
function normaliseMessageId(value) {
  return value.trim().replace(/^</, "").replace(/>$/, "").toLowerCase();
}
function snippetOf(body, limit = 200) {
  const flat = body.replace(/\s+/g, " ").trim();
  if (!flat)
    return null;
  return flat.length > limit ? `${flat.slice(0, limit - 1)}…` : flat;
}

// src/mailbox/thread-writer.service.ts
class ThreadWriterService {
  db;
  match;
  stamp;
  logger = new Logger30(ThreadWriterService.name);
  constructor(db2, match, stamp) {
    this.db = db2;
    this.match = match;
    this.stamp = stamp;
  }
  async context() {
    const [internal, suppressedDomains, suppressedEmails] = await Promise.all([
      this.match.internalIdentity(),
      this.match.suppressedDomains(),
      this.match.suppressedEmails()
    ]);
    return {
      ourAddresses: internal.addresses,
      ourDomains: internal.domains,
      suppressedDomains,
      suppressedEmails
    };
  }
  async store(row, options, parsed, context) {
    const existing = await this.db.emailMessage.findUnique({
      where: { rfcMessageId: parsed.rfcMessageId },
      select: {
        threadId: true,
        thread: {
          select: {
            companyId: true,
            contactId: true,
            activity: { select: { id: true } }
          }
        }
      }
    });
    if (existing?.thread.activity)
      return false;
    const repair = existing !== null;
    const participants = [parsed.from, ...parsed.recipients];
    const outbound = parsed.from.email === options.mailbox;
    const thread = existing ? {
      id: existing.threadId,
      companyId: existing.thread.companyId,
      contactId: existing.thread.contactId
    } : await this.db.emailThread.findUnique({
      where: { rootMessageId: parsed.rootId },
      select: { id: true, companyId: true, contactId: true }
    });
    let companyId = thread?.companyId ?? null;
    let contactId = thread?.contactId ?? null;
    if (!thread) {
      const repliedTo = outbound || await this.hasOutboundInThread(parsed.rootId, options.mailbox);
      const match = await this.match.resolve({
        participants,
        allowCreate: row.autoCreate && repliedTo,
        source: RecordSource3.EMAIL,
        ownerId: row.userId
      }, context);
      companyId = match.companyId;
      contactId = match.contactId;
      if (!companyId && !contactId) {
        return false;
      }
    }
    let occurredAt;
    try {
      occurredAt = await this.db.$transaction(async (tx) => {
        const record = existing ? { id: existing.threadId } : await tx.emailThread.upsert({
          where: { rootMessageId: parsed.rootId },
          create: {
            rootMessageId: parsed.rootId,
            subject: parsed.subject,
            companyId,
            contactId,
            firstMessageAt: parsed.sentAt,
            lastMessageAt: parsed.sentAt,
            messageCount: 0
          },
          update: {},
          select: { id: true }
        });
        if (!repair) {
          await tx.emailMessage.create({
            data: {
              threadId: record.id,
              rfcMessageId: parsed.rfcMessageId,
              syncedByUserId: row.userId,
              gmailMessageId: parsed.gmailMessageId ?? null,
              outlookMessageId: parsed.outlookMessageId ?? null,
              outlookWebLink: parsed.outlookWebLink ?? null,
              direction: outbound ? EmailDirection.OUTBOUND : EmailDirection.INBOUND,
              fromEmail: parsed.from.email,
              fromName: parsed.from.name,
              recipients: parsed.recipients,
              subject: parsed.subject,
              snippet: snippetOf(parsed.body),
              body: parsed.body || null,
              sentAt: parsed.sentAt
            }
          });
        }
        const stats = await tx.emailMessage.aggregate({
          where: { threadId: record.id },
          _count: { _all: true },
          _min: { sentAt: true },
          _max: { sentAt: true }
        });
        const firstMessageAt = stats._min.sentAt ?? parsed.sentAt;
        const lastMessageAt = stats._max.sentAt ?? parsed.sentAt;
        const data = {
          messageCount: stats._count._all,
          firstMessageAt,
          lastMessageAt
        };
        if (parsed.sentAt <= firstMessageAt)
          data.subject = parsed.subject;
        await tx.emailThread.update({ where: { id: record.id }, data });
        return this.project(tx, record.id, row.userId, {
          subject: parsed.subject ?? "(no subject)",
          snippet: snippetOf(parsed.body),
          lastMessageAt,
          companyId,
          contactId,
          origin: options.origin
        });
      });
    } catch (error) {
      if (await this.storedElsewhere(error, parsed.rfcMessageId))
        return false;
      throw error;
    }
    await this.touch({ companyId, contactId }, occurredAt, parsed.rfcMessageId);
    return !repair;
  }
  async storedElsewhere(cause, rfcMessageId) {
    const duplicate = cause instanceof PrismaNamespace8.PrismaClientKnownRequestError && cause.code === "P2002";
    if (!duplicate)
      return false;
    const winner = await this.db.emailMessage.findFirst({
      where: { rfcMessageId, thread: { activity: { isNot: null } } },
      select: { id: true }
    });
    return winner !== null;
  }
  async touch(target, at, rfcMessageId) {
    try {
      await this.stamp.touch(target, at);
    } catch (error) {
      this.logger.error({
        message: "An email was stored but its activity stamps were not moved",
        rfcMessageId,
        ...target
      }, error instanceof Error ? error.stack : String(error));
    }
  }
  async hasOutboundInThread(rootMessageId, mailbox) {
    const found = await this.db.emailMessage.findFirst({
      where: {
        thread: { rootMessageId },
        fromEmail: mailbox
      },
      select: { id: true }
    });
    return found !== null;
  }
  async project(tx, emailThreadId, userId, summary) {
    const activity = await tx.activity.upsert({
      where: { emailThreadId },
      create: {
        type: ActivityType7.EMAIL,
        subject: summary.subject,
        body: summary.snippet,
        occurredAt: summary.lastMessageAt,
        companyId: summary.companyId,
        contactId: summary.contactId,
        createdById: userId,
        emailThreadId,
        meta: { synced: true, source: summary.origin }
      },
      update: {
        body: summary.snippet,
        occurredAt: summary.lastMessageAt
      },
      select: { createdAt: true }
    });
    return activity.createdAt;
  }
}
ThreadWriterService = __legacyDecorateClassTS([
  Injectable40(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof MailboxMatchService === "undefined" ? Object : MailboxMatchService,
    typeof ActivityStampService === "undefined" ? Object : ActivityStampService
  ])
], ThreadWriterService);

// src/mailbox/mailbox.module.ts
class MailboxModule {
}
MailboxModule = __legacyDecorateClassTS([
  Module19({
    imports: [AgentModule, CompaniesModule],
    providers: [
      MailboxApiClient,
      MailboxTokenService,
      MailboxMatchService,
      SyncStateService,
      ThreadWriterService
    ],
    exports: [
      MailboxApiClient,
      MailboxTokenService,
      MailboxMatchService,
      SyncStateService,
      ThreadWriterService
    ]
  })
], MailboxModule);

// src/google/calendar.client.ts
import { Injectable as Injectable41 } from "@nestjs/common";
var EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

class CalendarClient {
  api;
  constructor(api) {
    this.api = api;
  }
  async listEvents(accessToken, query) {
    const window = query.syncToken ? {} : { timeMin: query.timeMin, timeMax: query.timeMax };
    return this.api.get(EVENTS_URL, accessToken, {
      singleEvents: true,
      showDeleted: true,
      maxResults: query.maxResults ?? 250,
      syncToken: query.syncToken,
      pageToken: query.pageToken,
      ...window
    });
  }
}
CalendarClient = __legacyDecorateClassTS([
  Injectable41(),
  __legacyMetadataTS("design:paramtypes", [
    typeof MailboxApiClient === "undefined" ? Object : MailboxApiClient
  ])
], CalendarClient);
function conferenceUrl(event) {
  if (event.hangoutLink)
    return event.hangoutLink;
  const entry = event.conferenceData?.entryPoints?.find((point) => point.entryPointType === "video" && point.uri);
  return entry?.uri ?? null;
}
function eventTime(time) {
  if (time?.dateTime) {
    const at = new Date(time.dateTime);
    return Number.isNaN(at.getTime()) ? null : { at, isAllDay: false };
  }
  if (time?.date) {
    const at = new Date(`${time.date}T00:00:00Z`);
    return Number.isNaN(at.getTime()) ? null : { at, isAllDay: true };
  }
  return null;
}

// src/google/calendar-sync.service.ts
import {
  ActivityType as ActivityType8,
  GoogleSyncStatus as GoogleSyncStatus2,
  RecordSource as RecordSource4
} from "@crm/db";
import { Injectable as Injectable42, Logger as Logger31 } from "@nestjs/common";
var MAX_PAGES_PER_TICK = 5;
var HORIZON_DAYS = 180;

class CalendarSyncService {
  db;
  calendar;
  tokens;
  match;
  state;
  stamp;
  agent;
  logger = new Logger31(CalendarSyncService.name);
  constructor(db2, calendar, tokens, match, state, stamp, agent) {
    this.db = db2;
    this.calendar = calendar;
    this.tokens = tokens;
    this.match = match;
    this.state = state;
    this.stamp = stamp;
    this.agent = agent;
  }
  async sync(row) {
    const token = await this.tokens.accessTokenFor(row.userId, "calendar");
    if (token.outcome === "not-connected") {
      return {
        source: "calendar",
        userId: row.userId,
        status: "skipped",
        reason: token.reason
      };
    }
    if (token.outcome === "needs-reconnect") {
      await this.state.markNeedsReconnect(row.id, token.reason);
      return {
        source: "calendar",
        userId: row.userId,
        status: "reconnect",
        reason: token.reason
      };
    }
    await this.state.markRunning(row.id);
    const [internal, suppressedDomains, suppressedEmails] = await Promise.all([
      this.match.internalIdentity(),
      this.match.suppressedDomains(),
      this.match.suppressedEmails()
    ]);
    const context = {
      ourAddresses: internal.addresses,
      ourDomains: internal.domains,
      suppressedDomains,
      suppressedEmails
    };
    let pageToken;
    let syncToken = row.cursor ?? undefined;
    let written = 0;
    let removed = 0;
    for (let page = 0;page < MAX_PAGES_PER_TICK; page += 1) {
      const result = await this.calendar.listEvents(token.accessToken, {
        syncToken,
        pageToken,
        timeMin: new Date().toISOString(),
        timeMax: this.horizon().toISOString()
      });
      if (result.outcome === "cursor-invalid") {
        await this.state.clearCursor(row.id, result.reason);
        return {
          source: "calendar",
          userId: row.userId,
          status: "synced",
          eventsWritten: written,
          eventsRemoved: removed,
          reason: "Cursor reset; the next tick re-runs the window."
        };
      }
      if (result.outcome === "unauthorized") {
        await this.state.markNeedsReconnect(row.id, result.reason);
        return {
          source: "calendar",
          userId: row.userId,
          status: "reconnect",
          reason: result.reason
        };
      }
      if (result.outcome === "rate-limited") {
        await this.state.markRateLimited(row.id, result.retryAfterMs);
        return {
          source: "calendar",
          userId: row.userId,
          status: "rate-limited",
          reason: result.reason
        };
      }
      if (result.outcome === "failed") {
        await this.state.markFailed(row.id, result.reason);
        return {
          source: "calendar",
          userId: row.userId,
          status: "failed",
          reason: result.reason
        };
      }
      for (const event of result.data.items ?? []) {
        const applied = await this.apply(event, row, context);
        if (applied === "written")
          written += 1;
        if (applied === "removed")
          removed += 1;
      }
      pageToken = result.data.nextPageToken;
      if (!pageToken) {
        syncToken = result.data.nextSyncToken ?? syncToken;
        await this.state.settle(row.id, {
          cursor: syncToken ?? null,
          status: GoogleSyncStatus2.RUNNING
        });
        this.logger.log({
          message: "Calendar sync complete",
          userId: row.userId,
          eventsWritten: written,
          eventsRemoved: removed
        });
        return {
          source: "calendar",
          userId: row.userId,
          status: "synced",
          eventsWritten: written,
          eventsRemoved: removed
        };
      }
    }
    await this.state.settle(row.id, {
      status: GoogleSyncStatus2.IDLE
    });
    return {
      source: "calendar",
      userId: row.userId,
      status: "synced",
      eventsWritten: written,
      eventsRemoved: removed,
      reason: "Page budget reached; continuing next tick."
    };
  }
  async apply(event, row, context) {
    const iCalUid = event.iCalUID;
    if (!iCalUid)
      return "ignored";
    const start = eventTime(event.start);
    const originalStart = eventTime(event.originalStartTime) ?? start;
    if (!originalStart)
      return "ignored";
    const key = {
      iCalUid_originalStartTime: {
        iCalUid,
        originalStartTime: originalStart.at
      }
    };
    if (event.status === "cancelled") {
      const deleted = await this.db.calendarEvent.deleteMany({
        where: {
          iCalUid,
          originalStartTime: originalStart.at
        }
      });
      return deleted.count > 0 ? "removed" : "ignored";
    }
    const end = eventTime(event.end);
    if (!start || !end)
      return "ignored";
    const participants = this.participantsOf(event);
    const declinedByUs = event.attendees?.some((attendee) => attendee.self && attendee.responseStatus === "declined");
    const match = await this.match.resolve({
      participants,
      allowCreate: row.autoCreate && !declinedByUs,
      source: RecordSource4.CALENDAR,
      ownerId: row.userId
    }, context);
    if (!match.companyId && !match.contactId) {
      return "ignored";
    }
    const organizer = event.organizer?.email?.toLowerCase() ?? null;
    const record = await this.db.calendarEvent.upsert({
      where: key,
      create: {
        iCalUid,
        originalStartTime: originalStart.at,
        recurringEventId: event.recurringEventId ?? null,
        title: event.summary ?? null,
        description: event.description ?? null,
        location: event.location ?? null,
        conferenceUrl: conferenceUrl(event),
        startsAt: start.at,
        endsAt: end.at,
        isAllDay: start.isAllDay,
        status: event.status ?? "confirmed",
        organizerEmail: organizer,
        companyId: match.companyId,
        contactId: match.contactId,
        syncedByUserId: row.userId,
        googleEventId: event.id ?? null
      },
      update: {
        title: event.summary ?? null,
        description: event.description ?? null,
        location: event.location ?? null,
        conferenceUrl: conferenceUrl(event),
        startsAt: start.at,
        endsAt: end.at,
        isAllDay: start.isAllDay,
        status: event.status ?? "confirmed",
        organizerEmail: organizer,
        companyId: match.companyId,
        contactId: match.contactId
      },
      select: { id: true }
    });
    await this.syncAttendees(record.id, event);
    await this.prepareForMeeting(record.id, start.at);
    await this.project(record.id, row.userId, {
      title: event.summary ?? "Meeting",
      startsAt: start.at,
      companyId: match.companyId,
      contactId: match.contactId,
      location: event.location ?? null
    });
    return "written";
  }
  async syncAttendees(eventId, event) {
    const attendees = (event.attendees ?? []).filter((attendee) => attendee.email && !attendee.resource && !isMachineAddress(attendee.email.toLowerCase()));
    if (attendees.length === 0)
      return;
    const emails = attendees.map((attendee) => attendee.email.toLowerCase());
    const contacts = await this.db.contact.findMany({
      where: { email: { in: emails } },
      select: { id: true, email: true }
    });
    const contactByEmail = new Map(contacts.map((contact) => [contact.email, contact.id]));
    for (const attendee of attendees) {
      const email = attendee.email.toLowerCase();
      await this.db.calendarAttendee.upsert({
        where: { eventId_email: { eventId, email } },
        create: {
          eventId,
          email,
          name: attendee.displayName ?? null,
          responseStatus: attendee.responseStatus ?? null,
          isOrganizer: attendee.organizer ?? false,
          contactId: contactByEmail.get(email) ?? null
        },
        update: {
          name: attendee.displayName ?? null,
          responseStatus: attendee.responseStatus ?? null,
          isOrganizer: attendee.organizer ?? false,
          contactId: contactByEmail.get(email) ?? null
        }
      });
    }
  }
  async prepareForMeeting(eventId, startsAt) {
    const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (startsAt <= new Date || startsAt > soon)
      return;
    const attendees = await this.db.calendarAttendee.findMany({
      where: {
        eventId,
        contactId: { not: null },
        contact: { brief: { is: null } }
      },
      select: { contactId: true }
    });
    for (const attendee of attendees) {
      if (attendee.contactId) {
        await this.agent.meetingSoon(attendee.contactId, startsAt);
      }
    }
  }
  async project(calendarEventId, userId, summary) {
    const body = summary.location ? `Location: ${summary.location}` : null;
    const activity = await this.db.activity.upsert({
      where: { calendarEventId },
      create: {
        type: ActivityType8.MEETING,
        subject: summary.title,
        body,
        occurredAt: summary.startsAt,
        companyId: summary.companyId,
        contactId: summary.contactId,
        createdById: userId,
        calendarEventId,
        meta: { synced: true, source: "calendar" }
      },
      update: {
        subject: summary.title,
        body,
        occurredAt: summary.startsAt,
        companyId: summary.companyId,
        contactId: summary.contactId
      },
      select: { createdAt: true }
    });
    await this.stamp.touch({ companyId: summary.companyId, contactId: summary.contactId }, activity.createdAt);
  }
  participantsOf(event) {
    const people = [];
    for (const attendee of event.attendees ?? []) {
      if (!attendee.email || attendee.resource)
        continue;
      people.push({
        email: attendee.email.toLowerCase(),
        name: attendee.displayName ?? null
      });
    }
    if (event.organizer?.email) {
      people.push({
        email: event.organizer.email.toLowerCase(),
        name: event.organizer.displayName ?? null
      });
    }
    return people;
  }
  horizon() {
    const to = new Date;
    to.setDate(to.getDate() + HORIZON_DAYS);
    return to;
  }
}
CalendarSyncService = __legacyDecorateClassTS([
  Injectable42(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof CalendarClient === "undefined" ? Object : CalendarClient,
    typeof MailboxTokenService === "undefined" ? Object : MailboxTokenService,
    typeof MailboxMatchService === "undefined" ? Object : MailboxMatchService,
    typeof SyncStateService === "undefined" ? Object : SyncStateService,
    typeof ActivityStampService === "undefined" ? Object : ActivityStampService,
    typeof AgentTriggerService === "undefined" ? Object : AgentTriggerService
  ])
], CalendarSyncService);

// src/google/conversation.service.ts
import { Injectable as Injectable43, NotFoundException as NotFoundException12 } from "@nestjs/common";
import { z as z20 } from "zod";
var storedRecipient = z20.object({
  email: z20.string(),
  name: z20.string().nullable().catch(null),
  kind: z20.string().catch("to")
});
var storedRecipients = z20.array(z20.json()).catch([]);

class ConversationService {
  db;
  constructor(db2) {
    this.db = db2;
  }
  async thread(threadId) {
    const thread = await this.db.emailThread.findUnique({
      where: { id: threadId },
      select: {
        id: true,
        subject: true,
        messageCount: true,
        firstMessageAt: true,
        lastMessageAt: true,
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        messages: {
          orderBy: { sentAt: "asc" },
          select: {
            id: true,
            direction: true,
            fromEmail: true,
            fromName: true,
            recipients: true,
            subject: true,
            body: true,
            snippet: true,
            sentAt: true,
            gmailMessageId: true,
            outlookWebLink: true
          }
        }
      }
    });
    if (!thread) {
      throw new NotFoundException12(`No email thread with id ${threadId}.`);
    }
    const faces = await this.facesFor(thread.messages.map((message) => message.fromEmail));
    return {
      ...thread,
      firstMessageAt: thread.firstMessageAt.toISOString(),
      lastMessageAt: thread.lastMessageAt.toISOString(),
      messages: thread.messages.map((message) => ({
        ...message,
        sentAt: message.sentAt.toISOString(),
        recipients: recipientsOf(message.recipients),
        fromImageUrl: faces.get(message.fromEmail.toLowerCase()) ?? null,
        mailboxUrl: message.gmailMessageId ? `https://mail.google.com/mail/u/0/#all/${message.gmailMessageId}` : message.outlookWebLink,
        mailboxName: message.gmailMessageId ? "Gmail" : message.outlookWebLink ? "Outlook" : null
      }))
    };
  }
  async facesFor(addresses) {
    const emails = [
      ...new Set(addresses.map((address) => address.toLowerCase()))
    ];
    if (emails.length === 0)
      return new Map;
    const [contacts, users] = await Promise.all([
      this.db.contact.findMany({
        where: { email: { in: emails, mode: "insensitive" } },
        select: { email: true, imageUrl: true }
      }),
      this.db.user.findMany({
        where: { email: { in: emails, mode: "insensitive" } },
        select: { email: true, image: true }
      })
    ]);
    const faces = new Map;
    for (const contact of contacts) {
      if (contact.email && contact.imageUrl) {
        faces.set(contact.email.toLowerCase(), contact.imageUrl);
      }
    }
    for (const user of users) {
      if (user.image)
        faces.set(user.email.toLowerCase(), user.image);
    }
    return faces;
  }
  async event(eventId) {
    const event = await this.db.calendarEvent.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        conferenceUrl: true,
        startsAt: true,
        endsAt: true,
        isAllDay: true,
        status: true,
        organizerEmail: true,
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        attendees: {
          orderBy: [{ isOrganizer: "desc" }, { email: "asc" }],
          select: {
            id: true,
            email: true,
            name: true,
            responseStatus: true,
            isOrganizer: true,
            contactId: true,
            contact: { select: { imageUrl: true } }
          }
        }
      }
    });
    if (!event) {
      throw new NotFoundException12(`No calendar event with id ${eventId}.`);
    }
    return {
      ...event,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
      attendees: event.attendees.map(({ contact, ...attendee }) => ({
        ...attendee,
        imageUrl: contact?.imageUrl ?? null
      }))
    };
  }
}
ConversationService = __legacyDecorateClassTS([
  Injectable43(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], ConversationService);
function recipientsOf(value) {
  return storedRecipients.parse(value).flatMap((entry) => {
    const parsed = storedRecipient.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
}

// src/google/gmail.client.ts
import { Injectable as Injectable44 } from "@nestjs/common";
var BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
var WORK_MAIL_QUERY = "-in:chats -category:promotions -category:social -category:forums";

class GmailClient {
  api;
  constructor(api) {
    this.api = api;
  }
  async profile(accessToken) {
    return this.api.get(`${BASE}/profile`, accessToken);
  }
  async listMessages(accessToken, options) {
    const after = Math.floor(options.after.getTime() / 1000);
    const before = Math.ceil(options.before.getTime() / 1000);
    return this.api.get(`${BASE}/messages`, accessToken, {
      q: `${WORK_MAIL_QUERY} after:${after} before:${before}`,
      maxResults: options.maxResults ?? 100,
      pageToken: options.pageToken
    });
  }
  async listHistory(accessToken, options) {
    return this.api.get(`${BASE}/history`, accessToken, {
      startHistoryId: options.startHistoryId,
      historyTypes: "messageAdded",
      maxResults: 500,
      pageToken: options.pageToken
    });
  }
  async getMessage(accessToken, id) {
    return this.api.get(`${BASE}/messages/${id}`, accessToken, {
      format: "full"
    });
  }
}
GmailClient = __legacyDecorateClassTS([
  Injectable44(),
  __legacyMetadataTS("design:paramtypes", [
    typeof MailboxApiClient === "undefined" ? Object : MailboxApiClient
  ])
], GmailClient);

// src/google/gmail-sync.service.ts
import {
  GoogleSyncStatus as GoogleSyncStatus3
} from "@crm/db";
import { Injectable as Injectable45, Logger as Logger32 } from "@nestjs/common";

// src/google/gmail-mime.ts
function header(headers, name) {
  const wanted = name.toLowerCase();
  const found = headers?.find((entry) => entry.name?.toLowerCase() === wanted);
  return found?.value?.trim() ?? null;
}
function plainTextBody(payload) {
  if (!payload)
    return "";
  const plain = findPart(payload, "text/plain");
  if (plain?.body?.data)
    return decodeBase64Url(plain.body.data);
  const html = findPart(payload, "text/html");
  if (html?.body?.data)
    return stripHtml(decodeBase64Url(html.body.data));
  if (payload.body?.data && !payload.filename) {
    return decodeBase64Url(payload.body.data);
  }
  return "";
}
function findPart(part, mimeType) {
  if (part.mimeType === mimeType && !part.filename && part.body?.data) {
    return part;
  }
  for (const child of part.parts ?? []) {
    if (isAttachment(child))
      continue;
    const found = findPart(child, mimeType);
    if (found)
      return found;
  }
  return null;
}
function isAttachment(part) {
  if (part.filename)
    return true;
  const disposition = header(part.headers, "content-disposition");
  return disposition?.toLowerCase().startsWith("attachment") ?? false;
}
function rootMessageId(headers) {
  return rootMessageIdFrom({
    references: header(headers, "references"),
    inReplyTo: header(headers, "in-reply-to"),
    messageId: header(headers, "message-id")
  });
}

// src/google/gmail-sync.service.ts
var MAX_MESSAGES_PER_TICK = 120;

class GmailSyncService {
  db;
  gmail;
  tokens;
  state;
  threads;
  logger = new Logger32(GmailSyncService.name);
  constructor(db2, gmail, tokens, state, threads) {
    this.db = db2;
    this.gmail = gmail;
    this.tokens = tokens;
    this.state = state;
    this.threads = threads;
  }
  async sync(row) {
    const token = await this.tokens.accessTokenFor(row.userId, "gmail");
    if (token.outcome === "not-connected") {
      return {
        source: "gmail",
        userId: row.userId,
        status: "skipped",
        reason: token.reason
      };
    }
    if (token.outcome === "needs-reconnect") {
      await this.state.markNeedsReconnect(row.id, token.reason);
      return {
        source: "gmail",
        userId: row.userId,
        status: "reconnect",
        reason: token.reason
      };
    }
    await this.state.markRunning(row.id);
    const profile = await this.gmail.profile(token.accessToken);
    if (profile.outcome !== "ok") {
      return this.handleFailure(row, profile);
    }
    const mailbox = profile.data.emailAddress?.toLowerCase() ?? null;
    if (!mailbox) {
      await this.state.markFailed(row.id, "Gmail returned no mailbox address.");
      return {
        source: "gmail",
        userId: row.userId,
        status: "failed",
        reason: "No mailbox address."
      };
    }
    if (!row.cursor) {
      return this.start(row, profile.data.historyId ?? null);
    }
    return this.incremental(row, token.accessToken, mailbox, row.cursor);
  }
  async start(row, historyId) {
    if (!historyId) {
      await this.state.markFailed(row.id, "Gmail returned no historyId.");
      return {
        source: "gmail",
        userId: row.userId,
        status: "failed",
        reason: "No historyId to start from."
      };
    }
    await this.state.settle(row.id, {
      cursor: historyId,
      status: GoogleSyncStatus3.RUNNING
    });
    this.logger.log({
      message: "Gmail sync started — watching for new mail",
      userId: row.userId
    });
    return { source: "gmail", userId: row.userId, status: "synced" };
  }
  async incremental(row, accessToken, mailbox, startHistoryId) {
    const history = await this.gmail.listHistory(accessToken, {
      startHistoryId
    });
    if (history.outcome === "cursor-invalid") {
      await this.state.clearCursor(row.id, history.reason);
      return {
        source: "gmail",
        userId: row.userId,
        status: "synced",
        reason: "History expired; resuming from now."
      };
    }
    if (history.outcome !== "ok") {
      return this.handleFailure(row, history);
    }
    const ids = new Set;
    for (const entry of history.data.history ?? []) {
      for (const added of entry.messagesAdded ?? []) {
        if (added.message?.id)
          ids.add(added.message.id);
      }
    }
    const { written, remaining } = await this.ingest(row, accessToken, mailbox, [...ids]);
    await this.state.settle(row.id, {
      cursor: remaining > 0 ? startHistoryId : history.data.historyId ?? startHistoryId,
      status: GoogleSyncStatus3.RUNNING
    });
    if (written > 0 || remaining > 0) {
      this.logger.log({
        message: "Gmail incremental sync",
        userId: row.userId,
        messagesWritten: written,
        remaining
      });
    }
    return {
      source: "gmail",
      userId: row.userId,
      status: "synced",
      messagesWritten: written
    };
  }
  async ingest(row, accessToken, mailbox, ids) {
    if (ids.length === 0)
      return { written: 0, remaining: 0 };
    const alreadyHave = await this.db.emailMessage.findMany({
      where: { gmailMessageId: { in: [...ids] } },
      select: { gmailMessageId: true }
    });
    const seen = new Set(alreadyHave.map((existing) => existing.gmailMessageId));
    const pending = ids.filter((id) => !seen.has(id));
    const batch = pending.slice(0, MAX_MESSAGES_PER_TICK);
    const remaining = pending.length - batch.length;
    if (batch.length === 0)
      return { written: 0, remaining };
    const context = await this.threads.context();
    let written = 0;
    for (const id of batch) {
      const message = await this.gmail.getMessage(accessToken, id);
      if (message.outcome !== "ok")
        continue;
      const parsed = this.parse(message.data);
      if (!parsed)
        continue;
      const stored = await this.threads.store(row, { mailbox, origin: "gmail" }, parsed, context);
      if (stored)
        written += 1;
    }
    return { written, remaining };
  }
  parse(message) {
    const headers = message.payload?.headers;
    const rawMessageId = header(headers, "message-id");
    if (!rawMessageId)
      return null;
    const from = parseAddress(header(headers, "from") ?? "");
    if (!from)
      return null;
    const sentAt = this.sentAt(message, headers);
    if (!sentAt)
      return null;
    const rootId = rootMessageId(headers) ?? normaliseMessageId(rawMessageId);
    const to = parseAddressList(header(headers, "to")).map((person) => ({
      email: person.email,
      name: person.name,
      kind: "to"
    }));
    const cc = parseAddressList(header(headers, "cc")).map((person) => ({
      email: person.email,
      name: person.name,
      kind: "cc"
    }));
    const body = stripQuotedHistory(plainTextBody(message.payload));
    return {
      rfcMessageId: normaliseMessageId(rawMessageId),
      rootId,
      subject: header(headers, "subject"),
      from,
      recipients: [...to, ...cc],
      body,
      sentAt,
      gmailMessageId: message.id ?? null
    };
  }
  sentAt(message, headers) {
    if (message.internalDate) {
      const at2 = new Date(Number(message.internalDate));
      if (!Number.isNaN(at2.getTime()))
        return at2;
    }
    const raw = header(headers, "date");
    if (!raw)
      return null;
    const at = new Date(raw);
    return Number.isNaN(at.getTime()) ? null : at;
  }
  async handleFailure(row, result) {
    if (result.outcome === "unauthorized") {
      await this.state.markNeedsReconnect(row.id, result.reason);
      return {
        source: "gmail",
        userId: row.userId,
        status: "reconnect",
        reason: result.reason
      };
    }
    if (result.outcome === "rate-limited") {
      await this.state.markRateLimited(row.id, result.retryAfterMs ?? 60000);
      return {
        source: "gmail",
        userId: row.userId,
        status: "rate-limited",
        reason: result.reason
      };
    }
    await this.state.markFailed(row.id, result.reason);
    return {
      source: "gmail",
      userId: row.userId,
      status: "failed",
      reason: result.reason
    };
  }
}
GmailSyncService = __legacyDecorateClassTS([
  Injectable45(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof GmailClient === "undefined" ? Object : GmailClient,
    typeof MailboxTokenService === "undefined" ? Object : MailboxTokenService,
    typeof SyncStateService === "undefined" ? Object : SyncStateService,
    typeof ThreadWriterService === "undefined" ? Object : ThreadWriterService
  ])
], GmailSyncService);

// src/google/google.router.ts
import { Inject as Inject15 } from "@nestjs/common";
import {
  Ctx as Ctx10,
  Input as Input12,
  Mutation as Mutation10,
  Query as Query13,
  Router as Router12,
  UseMiddlewares as UseMiddlewares12
} from "nestjs-trpc";

// src/google/google.contracts.ts
import { EmailDirection as EmailDirection2, GoogleSyncStatus as GoogleSyncStatus4 } from "@crm/db";
import { z as z21 } from "zod";
var setAutoCreateInput = z21.object({
  source: z21.enum(GOOGLE_SYNC_SOURCES),
  enabled: z21.boolean()
});
var suppressDomainInput = z21.object({
  domain: z21.string().trim().min(1),
  reason: z21.string().trim().max(200).optional(),
  purge: z21.boolean().default(true)
});
var threadInput = z21.object({
  threadId: z21.string()
});
var calendarEventInput = z21.object({
  eventId: z21.string()
});
var googleSyncStatusOutput = z21.enum(Object.values(GoogleSyncStatus4));
var googleSourceStatusOutput = z21.object({
  source: z21.enum(GOOGLE_SYNC_SOURCES),
  connected: z21.boolean(),
  status: googleSyncStatusOutput.nullable(),
  lastSyncedAt: z21.string().nullable(),
  lastError: z21.string().nullable(),
  autoCreate: z21.boolean()
});
var googleConnectionStatusOutput = z21.object({
  configured: z21.boolean(),
  linked: z21.boolean(),
  required: z21.boolean(),
  hasRefreshToken: z21.boolean(),
  sources: z21.array(googleSourceStatusOutput)
});
var purgeSyncedDataOutput = z21.object({
  purged: z21.number()
});
var revokeAccessOutput = z21.object({
  revoked: z21.boolean()
});
var suppressDomainOutput = z21.object({
  domain: z21.string(),
  purged: z21.number()
});
var emailThreadCompanyOutput = z21.object({
  id: z21.string(),
  name: z21.string()
});
var emailThreadContactOutput = z21.object({
  id: z21.string(),
  firstName: z21.string(),
  lastName: z21.string().nullable()
});
var emailThreadRecipientOutput = z21.object({
  email: z21.string(),
  name: z21.string().nullable(),
  kind: z21.string()
});
var emailDirectionOutput = z21.enum(Object.values(EmailDirection2));
var emailThreadMessageOutput = z21.object({
  id: z21.string(),
  direction: emailDirectionOutput,
  fromEmail: z21.string(),
  fromName: z21.string().nullable(),
  recipients: z21.array(emailThreadRecipientOutput),
  subject: z21.string().nullable(),
  body: z21.string().nullable(),
  snippet: z21.string().nullable(),
  sentAt: z21.string(),
  gmailMessageId: z21.string().nullable(),
  outlookWebLink: z21.string().nullable(),
  fromImageUrl: z21.string().nullable(),
  mailboxUrl: z21.string().nullable(),
  mailboxName: z21.string().nullable()
});
var emailThreadOutput = z21.object({
  id: z21.string(),
  subject: z21.string().nullable(),
  messageCount: z21.number(),
  firstMessageAt: z21.string(),
  lastMessageAt: z21.string(),
  company: emailThreadCompanyOutput.nullable(),
  contact: emailThreadContactOutput.nullable(),
  messages: z21.array(emailThreadMessageOutput)
});
var calendarEventCompanyOutput = z21.object({
  id: z21.string(),
  name: z21.string()
});
var calendarEventContactOutput = z21.object({
  id: z21.string(),
  firstName: z21.string(),
  lastName: z21.string().nullable()
});
var calendarAttendeeOutput = z21.object({
  id: z21.string(),
  email: z21.string(),
  name: z21.string().nullable(),
  responseStatus: z21.string().nullable(),
  isOrganizer: z21.boolean(),
  contactId: z21.string().nullable(),
  imageUrl: z21.string().nullable()
});
var calendarEventOutput = z21.object({
  id: z21.string(),
  title: z21.string().nullable(),
  description: z21.string().nullable(),
  location: z21.string().nullable(),
  conferenceUrl: z21.string().nullable(),
  startsAt: z21.string(),
  endsAt: z21.string(),
  isAllDay: z21.boolean(),
  status: z21.string(),
  organizerEmail: z21.string().nullable(),
  company: calendarEventCompanyOutput.nullable(),
  contact: calendarEventContactOutput.nullable(),
  attendees: z21.array(calendarAttendeeOutput)
});

// src/google/google-connection.service.ts
import { isGoogleConfigured, signsInWithGoogle } from "@crm/auth";
import { Injectable as Injectable46, Logger as Logger33, NotFoundException as NotFoundException13 } from "@nestjs/common";
var PURGE_TIMEOUT_MS = 60000;

class GoogleConnectionService {
  db;
  tokens;
  state;
  match;
  stamp;
  logger = new Logger33(GoogleConnectionService.name);
  constructor(db2, tokens, state, match, stamp) {
    this.db = db2;
    this.tokens = tokens;
    this.state = state;
    this.match = match;
    this.stamp = stamp;
  }
  async status(userId) {
    await this.onConnected(userId);
    const [granted, rows, hasRefreshToken, accounts] = await Promise.all([
      this.tokens.grantedScopes(userId, GOOGLE_PROVIDER_ID2),
      this.state.listForUser(userId, GOOGLE_SYNC_SOURCES),
      this.tokens.hasRefreshToken(userId, GOOGLE_PROVIDER_ID2),
      this.tokens.signInAccounts(userId)
    ]);
    const bySource = new Map(rows.map((row) => [row.source, row]));
    const sources = GOOGLE_SYNC_SOURCES.map((source) => {
      const row = bySource.get(source);
      const connected = granted.has(SCOPE_FOR_SOURCE[source]);
      return {
        source,
        connected,
        status: row?.status ?? null,
        lastSyncedAt: row?.lastSyncedAt?.toISOString() ?? null,
        lastError: row?.lastError ?? null,
        autoCreate: row?.autoCreate ?? false
      };
    });
    return {
      configured: isGoogleConfigured(),
      linked: accounts.some((account) => account.providerId === GOOGLE_PROVIDER_ID2) && sources.some((source) => source.connected),
      required: signsInWithGoogle(accounts),
      hasRefreshToken,
      sources
    };
  }
  async onConnected(userId) {
    const [granted, existing] = await Promise.all([
      this.tokens.grantedScopes(userId, GOOGLE_PROVIDER_ID2),
      this.state.listForUser(userId, GOOGLE_SYNC_SOURCES)
    ]);
    const known = new Set(existing.map((row) => row.source));
    const added = [];
    for (const source of GOOGLE_SYNC_SOURCES) {
      if (!granted.has(SCOPE_FOR_SOURCE[source]))
        continue;
      if (known.has(source))
        continue;
      await this.state.ensure(userId, source, {
        autoCreate: source === "calendar"
      });
      added.push(source);
    }
    if (added.length > 0) {
      this.logger.log({ message: "Google connected", userId, sources: added });
    }
  }
  async reconcileAll() {
    const accounts = await this.db.account.findMany({
      where: {
        providerId: GOOGLE_PROVIDER_ID2,
        OR: GOOGLE_SYNC_SOURCES.map((source) => ({
          scope: { contains: SCOPE_FOR_SOURCE[source] }
        }))
      },
      select: { userId: true }
    });
    for (const account of new Set(accounts.map((row) => row.userId))) {
      await this.onConnected(account);
    }
  }
  async purgeSyncedData(userId) {
    const mine = {
      syncedByUserId: userId,
      gmailMessageId: { not: null }
    };
    const purged = await this.db.$transaction(async (tx) => {
      const touched = await tx.emailMessage.findMany({
        where: mine,
        select: { threadId: true },
        distinct: ["threadId"]
      });
      const threadIds = touched.map((row) => row.threadId);
      const messages = await tx.emailMessage.deleteMany({ where: mine });
      await tx.emailThread.deleteMany({
        where: { id: { in: threadIds }, messages: { none: {} } }
      });
      await rebuildThreads(tx, threadIds);
      const events = await tx.calendarEvent.deleteMany({
        where: { syncedByUserId: userId }
      });
      return messages.count + events.count;
    }, { timeout: PURGE_TIMEOUT_MS });
    await this.stamp.recomputeAll();
    this.logger.log({ message: "Google data purged", userId, purged });
    return { purged };
  }
  async revoke(userId) {
    for (const source of GOOGLE_SYNC_SOURCES) {
      await this.state.remove(userId, source);
    }
    const revoked = await this.tokens.revoke(userId, GOOGLE_PROVIDER_ID2);
    return { revoked };
  }
  async setAutoCreate(userId, source, enabled) {
    const row = await this.state.get(userId, source);
    if (!row) {
      throw new NotFoundException13(`${source} is not connected.`);
    }
    await this.state.setAutoCreate(userId, source, enabled);
  }
  async suppressDomain(domain, options) {
    const normalised = normalizeDomain(domain);
    if (!normalised) {
      throw new NotFoundException13(`"${domain}" is not a domain.`);
    }
    const ours = await this.match.internalIdentity();
    if (ours.domains.has(normalised)) {
      throw new NotFoundException13("That is our own domain — it is already excluded.");
    }
    await this.db.suppressedDomain.upsert({
      where: { domain: normalised },
      create: { domain: normalised, reason: options.reason ?? null },
      update: { reason: options.reason ?? null }
    });
    if (!options.purge)
      return { domain: normalised, purged: 0 };
    const company = await this.db.company.findUnique({
      where: { domain: normalised },
      select: { id: true }
    });
    if (!company)
      return { domain: normalised, purged: 0 };
    const [threads, events] = await this.db.$transaction([
      this.db.emailThread.deleteMany({ where: { companyId: company.id } }),
      this.db.calendarEvent.deleteMany({ where: { companyId: company.id } })
    ]);
    await this.stamp.recomputeAll();
    this.logger.log({
      message: "Domain suppressed",
      domain: normalised,
      purged: threads.count + events.count
    });
    return { domain: normalised, purged: threads.count + events.count };
  }
}
GoogleConnectionService = __legacyDecorateClassTS([
  Injectable46(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof MailboxTokenService === "undefined" ? Object : MailboxTokenService,
    typeof SyncStateService === "undefined" ? Object : SyncStateService,
    typeof MailboxMatchService === "undefined" ? Object : MailboxMatchService,
    typeof ActivityStampService === "undefined" ? Object : ActivityStampService
  ])
], GoogleConnectionService);
async function rebuildThreads(tx, threadIds) {
  if (threadIds.length === 0)
    return;
  const remaining = await tx.emailMessage.findMany({
    where: { threadId: { in: threadIds } },
    select: { threadId: true, sentAt: true, subject: true, snippet: true },
    orderBy: { sentAt: "asc" }
  });
  const byThread = new Map;
  for (const message of remaining) {
    const group = byThread.get(message.threadId);
    if (group)
      group.push(message);
    else
      byThread.set(message.threadId, [message]);
  }
  for (const [threadId, messages] of byThread) {
    const first = messages.at(0);
    const last = messages.at(-1);
    if (!first || !last)
      continue;
    await tx.emailThread.update({
      where: { id: threadId },
      data: {
        messageCount: messages.length,
        firstMessageAt: first.sentAt,
        lastMessageAt: last.sentAt,
        subject: first.subject
      }
    });
    await tx.activity.updateMany({
      where: { emailThreadId: threadId },
      data: { body: last.snippet, occurredAt: last.sentAt }
    });
  }
}

// src/google/google-sync.service.ts
import { Injectable as Injectable47 } from "@nestjs/common";
class GoogleSyncService {
  state;
  calendar;
  gmail;
  constructor(state, calendar, gmail) {
    this.state = state;
    this.calendar = calendar;
    this.gmail = gmail;
  }
  async runOne(userId, source) {
    const row = await this.state.get(userId, source);
    if (!row)
      return null;
    return source === "calendar" ? this.calendar.sync(row) : this.gmail.sync(row);
  }
  async runForUser(userId) {
    for (const source of GOOGLE_SYNC_SOURCES) {
      await this.runOne(userId, source);
    }
  }
}
GoogleSyncService = __legacyDecorateClassTS([
  Injectable47(),
  __legacyMetadataTS("design:paramtypes", [
    typeof SyncStateService === "undefined" ? Object : SyncStateService,
    typeof CalendarSyncService === "undefined" ? Object : CalendarSyncService,
    typeof GmailSyncService === "undefined" ? Object : GmailSyncService
  ])
], GoogleSyncService);

// src/google/google.router.ts
class GoogleRouter {
  connection;
  sync;
  conversations;
  constructor(connection, sync, conversations) {
    this.connection = connection;
    this.sync = sync;
    this.conversations = conversations;
  }
  async status(ctx) {
    return this.connection.status(ctx.user.id);
  }
  async purgeSyncedData(ctx) {
    return this.connection.purgeSyncedData(ctx.user.id);
  }
  async revokeAccess(ctx) {
    return this.connection.revoke(ctx.user.id);
  }
  async syncNow(ctx) {
    await this.sync.runForUser(ctx.user.id);
    return this.connection.status(ctx.user.id);
  }
  async setAutoCreate(ctx, input) {
    await this.connection.setAutoCreate(ctx.user.id, input.source, input.enabled);
    return this.connection.status(ctx.user.id);
  }
  async suppressDomain(input) {
    return this.connection.suppressDomain(input.domain, {
      reason: input.reason,
      purge: input.purge
    });
  }
  async thread(threadId) {
    return this.conversations.thread(threadId);
  }
  async event(eventId) {
    return this.conversations.event(eventId);
  }
}
__legacyDecorateClassTS([
  Query13({
    output: googleConnectionStatusOutput,
    meta: restMeta("GET", "/google/status", ["Google"])
  }),
  __legacyDecorateParamTS(0, Ctx10()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], GoogleRouter.prototype, "status", null);
__legacyDecorateClassTS([
  Mutation10({
    output: purgeSyncedDataOutput,
    meta: restMeta("POST", "/google/purge-synced-data", ["Google"])
  }),
  __legacyDecorateParamTS(0, Ctx10()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], GoogleRouter.prototype, "purgeSyncedData", null);
__legacyDecorateClassTS([
  Mutation10({
    output: revokeAccessOutput,
    meta: restMeta("POST", "/google/revoke", ["Google"])
  }),
  __legacyDecorateParamTS(0, Ctx10()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], GoogleRouter.prototype, "revokeAccess", null);
__legacyDecorateClassTS([
  Mutation10({
    output: googleConnectionStatusOutput,
    meta: restMeta("POST", "/google/sync", ["Google"])
  }),
  __legacyDecorateParamTS(0, Ctx10()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], GoogleRouter.prototype, "syncNow", null);
__legacyDecorateClassTS([
  Mutation10({
    input: setAutoCreateInput,
    output: googleConnectionStatusOutput,
    meta: restMeta("PATCH", "/google/auto-create", ["Google"])
  }),
  __legacyDecorateParamTS(0, Ctx10()),
  __legacyDecorateParamTS(1, Input12()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], GoogleRouter.prototype, "setAutoCreate", null);
__legacyDecorateClassTS([
  Mutation10({
    input: suppressDomainInput,
    output: suppressDomainOutput,
    meta: restMeta("POST", "/google/suppress-domain", ["Google"])
  }),
  __legacyDecorateParamTS(0, Input12()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], GoogleRouter.prototype, "suppressDomain", null);
__legacyDecorateClassTS([
  Query13({
    input: threadInput,
    output: emailThreadOutput,
    meta: restMeta("GET", "/google/threads/{threadId}", ["Google"])
  }),
  __legacyDecorateParamTS(0, Input12("threadId")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], GoogleRouter.prototype, "thread", null);
__legacyDecorateClassTS([
  Query13({
    input: calendarEventInput,
    output: calendarEventOutput,
    meta: restMeta("GET", "/google/events/{eventId}", ["Google"])
  }),
  __legacyDecorateParamTS(0, Input12("eventId")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], GoogleRouter.prototype, "event", null);
GoogleRouter = __legacyDecorateClassTS([
  Router12({ alias: "google" }),
  UseMiddlewares12(AuthMiddleware),
  __legacyDecorateParamTS(0, Inject15(GoogleConnectionService)),
  __legacyDecorateParamTS(1, Inject15(GoogleSyncService)),
  __legacyDecorateParamTS(2, Inject15(ConversationService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof GoogleConnectionService === "undefined" ? Object : GoogleConnectionService,
    typeof GoogleSyncService === "undefined" ? Object : GoogleSyncService,
    typeof ConversationService === "undefined" ? Object : ConversationService
  ])
], GoogleRouter);

// src/google/google.module.ts
class GoogleModule {
}
GoogleModule = __legacyDecorateClassTS([
  Module20({
    imports: [TrpcModule, MailboxModule, AgentModule],
    providers: [
      CalendarClient,
      CalendarSyncService,
      GmailClient,
      GmailSyncService,
      GoogleSyncService,
      GoogleConnectionService,
      ConversationService,
      GoogleRouter
    ],
    exports: [GoogleSyncService, GoogleConnectionService]
  })
], GoogleModule);

// src/health/health.module.ts
import { Module as Module21 } from "@nestjs/common";

// src/health/health.controller.ts
import {
  Controller as Controller5,
  Get as Get5,
  Logger as Logger34,
  ServiceUnavailableException as ServiceUnavailableException3
} from "@nestjs/common";
import {
  ApiOkResponse as ApiOkResponse5,
  ApiOperation as ApiOperation5,
  ApiServiceUnavailableResponse as ApiServiceUnavailableResponse3,
  ApiTags as ApiTags5
} from "@nestjs/swagger";
import { AllowAnonymous as AllowAnonymous3 } from "@thallesp/nestjs-better-auth";
var SLOW_PROBE_MS = 250;

class HealthController {
  db;
  logger = new Logger34(HealthController.name);
  constructor(db2) {
    this.db = db2;
  }
  async check() {
    const startedAt = process.hrtime.bigint();
    try {
      await this.db.$queryRaw`SELECT 1`;
    } catch (error) {
      this.logger.error({ message: "Database health check failed" }, error instanceof Error ? error.stack : String(error));
      throw new ServiceUnavailableException3({
        status: "error",
        database: "down"
      });
    }
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    if (durationMs > SLOW_PROBE_MS) {
      this.logger.warn({
        message: "Database health check was slow",
        durationMs: Number(durationMs.toFixed(1)),
        thresholdMs: SLOW_PROBE_MS
      });
    }
    return { status: "ok", database: "up" };
  }
}
__legacyDecorateClassTS([
  Get5(),
  AllowAnonymous3(),
  ApiOperation5({ summary: "Report API and database liveness" }),
  ApiOkResponse5({
    description: "The API and its database are reachable.",
    schema: { example: { status: "ok", database: "up" } }
  }),
  ApiServiceUnavailableResponse3({
    description: "The database did not respond.",
    schema: { example: { status: "error", database: "down" } }
  }),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", []),
  __legacyMetadataTS("design:returntype", Promise)
], HealthController.prototype, "check", null);
HealthController = __legacyDecorateClassTS([
  ApiTags5("Health"),
  Controller5("health"),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], HealthController);

// src/health/health.module.ts
class HealthModule {
}
HealthModule = __legacyDecorateClassTS([
  Module21({
    controllers: [HealthController]
  })
], HealthModule);

// src/logging/logging.module.ts
import {
  Global as Global3,
  Module as Module22,
  RequestMethod
} from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";

// src/logging/all-exceptions.filter.ts
import { apiError as apiError2 } from "@crm/telemetry";
import {
  Catch,
  HttpException as HttpException3,
  HttpStatus,
  Logger as Logger35
} from "@nestjs/common";
class AllExceptionsFilter {
  logger = new Logger35("ExceptionsHandler");
  catch(exception, host) {
    if (host.getType() !== "http") {
      throw exception;
    }
    const http = host.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();
    const status = exception instanceof HttpException3 ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const requestId = getRequestContext()?.requestId;
    this.log(exception, status, request);
    if (response.headersSent) {
      return;
    }
    response.status(status).json(body(exception, status, requestId));
  }
  log(exception, status, request) {
    const payload = {
      message: describe(exception),
      method: request.method,
      path: request.originalUrl,
      statusCode: status,
      exception: exception?.constructor?.name
    };
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(payload, exception instanceof Error ? exception.stack : undefined);
      apiError2({ error: exception, route: routePattern(request), status });
      return;
    }
    this.logger.debug(payload);
  }
}
AllExceptionsFilter = __legacyDecorateClassTS([
  Catch()
], AllExceptionsFilter);
function routePattern(request) {
  const route = request.route;
  return typeof route?.path === "string" ? route.path : null;
}
function describe(exception) {
  if (exception instanceof Error) {
    return exception.message;
  }
  return typeof exception === "string" ? exception : "Unknown exception";
}
function body(exception, status, requestId) {
  const reported = exceptionBody(exception, status);
  return requestId ? { ...reported, requestId } : reported;
}
function exceptionBody(exception, status) {
  if (!(exception instanceof HttpException3)) {
    return { statusCode: status, message: "Internal server error" };
  }
  const original = exception.getResponse();
  return typeof original === "string" ? { statusCode: status, message: original } : { ...original };
}

// src/logging/prisma-log.bridge.ts
import { setPrismaLogSink } from "@crm/db";
import {
  Injectable as Injectable48,
  Logger as Logger36
} from "@nestjs/common";
class PrismaLogBridge {
  logger = new Logger36("Prisma");
  onModuleInit() {
    setPrismaLogSink(({ level, message, target, durationMs }) => {
      const payload = durationMs === undefined ? { message, target } : { message, target, durationMs };
      if (level === "error") {
        this.logger.error(payload);
        return;
      }
      if (level === "warn") {
        this.logger.warn(payload);
        return;
      }
      this.logger.debug(payload);
    });
  }
  onApplicationShutdown() {
    setPrismaLogSink(null);
  }
}
PrismaLogBridge = __legacyDecorateClassTS([
  Injectable48()
], PrismaLogBridge);

// src/logging/request-logger.middleware.ts
import { randomUUID as randomUUID2 } from "node:crypto";
import { Injectable as Injectable49, Logger as Logger37 } from "@nestjs/common";
var REQUEST_ID_HEADER = "x-request-id";
var QUIET_PATHS = new Set(["/health"]);

class RequestLoggerMiddleware {
  logger = new Logger37("HTTP");
  use(request, response, next) {
    const requestId = incomingRequestId(request) ?? randomUUID2();
    response.setHeader(REQUEST_ID_HEADER, requestId);
    const context = {
      requestId,
      method: request.method,
      path: request.originalUrl
    };
    const startedAt = process.hrtime.bigint();
    runInRequestContext(context, () => {
      response.on("finish", () => {
        runInRequestContext(context, () => {
          this.logCompleted(request, response, context, startedAt);
        });
      });
      next();
    });
  }
  logCompleted(request, response, context, startedAt) {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const { statusCode } = response;
    const userId = sessionUserId(request);
    if (userId) {
      context.userId = userId;
    }
    const payload = {
      message: `${context.method} ${context.path} ${statusCode} ${durationMs.toFixed(1)}ms`,
      method: context.method,
      path: context.path,
      statusCode,
      durationMs: Number(durationMs.toFixed(1)),
      ip: request.ip,
      userAgent: request.get("user-agent")
    };
    if (statusCode >= 500) {
      this.logger.error(payload);
      return;
    }
    if (statusCode >= 400) {
      this.logger.warn(payload);
      return;
    }
    if (QUIET_PATHS.has(request.path)) {
      this.logger.verbose(payload);
      return;
    }
    this.logger.log(payload);
  }
}
RequestLoggerMiddleware = __legacyDecorateClassTS([
  Injectable49()
], RequestLoggerMiddleware);
function incomingRequestId(request) {
  const header2 = request.get(REQUEST_ID_HEADER);
  if (!header2 || header2.length > 200 || !/^[\w.:-]+$/.test(header2)) {
    return;
  }
  return header2;
}
var sharedInstance = new RequestLoggerMiddleware;
function logAuthRoute(request, response, next) {
  sharedInstance.use(request, response, next);
}
function sessionUserId(request) {
  const { session } = request;
  return session?.user?.id;
}

// src/logging/user-context.interceptor.ts
import {
  Injectable as Injectable50
} from "@nestjs/common";
class UserContextInterceptor {
  intercept(context, next) {
    if (context.getType() !== "http") {
      return next.handle();
    }
    const request = context.switchToHttp().getRequest();
    const userId = request.session?.user?.id;
    if (userId) {
      setRequestUserId(userId);
    }
    return next.handle();
  }
}
UserContextInterceptor = __legacyDecorateClassTS([
  Injectable50()
], UserContextInterceptor);

// src/logging/logging.module.ts
class LoggingModule {
  configure(consumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes({ path: "{*splat}", method: RequestMethod.ALL });
  }
}
LoggingModule = __legacyDecorateClassTS([
  Global3(),
  Module22({
    providers: [
      ContextLogger,
      PrismaLogBridge,
      { provide: APP_FILTER, useClass: AllExceptionsFilter },
      { provide: APP_INTERCEPTOR, useClass: UserContextInterceptor }
    ],
    exports: [ContextLogger]
  })
], LoggingModule);

// src/microsoft/microsoft.module.ts
import { Module as Module23 } from "@nestjs/common";

// src/microsoft/graph.client.ts
import { Injectable as Injectable51 } from "@nestjs/common";
var BASE2 = "https://graph.microsoft.com/v1.0/me";
var MESSAGE_FIELDS = [
  "id",
  "internetMessageId",
  "conversationId",
  "subject",
  "from",
  "sender",
  "toRecipients",
  "ccRecipients",
  "receivedDateTime",
  "sentDateTime",
  "body",
  "bodyPreview",
  "internetMessageHeaders",
  "parentFolderId",
  "webLink"
].join(",");

class GraphClient {
  api;
  constructor(api) {
    this.api = api;
  }
  async me(accessToken) {
    return this.api.get(BASE2, accessToken, {
      $select: "mail,userPrincipalName"
    });
  }
  async folder(accessToken, wellKnownName) {
    return this.api.get(`${BASE2}/mailFolders/${wellKnownName}`, accessToken, { $select: "id" });
  }
  async listMessages(accessToken, options) {
    return this.api.get(`${BASE2}/messages`, accessToken, {
      $select: MESSAGE_FIELDS,
      $filter: `receivedDateTime gt ${options.after.toISOString()} and isDraft eq false`,
      $orderby: "receivedDateTime asc",
      $top: options.top
    });
  }
  async nextPage(accessToken, nextLink) {
    return this.api.get(nextLink, accessToken);
  }
}
GraphClient = __legacyDecorateClassTS([
  Injectable51(),
  __legacyMetadataTS("design:paramtypes", [
    typeof MailboxApiClient === "undefined" ? Object : MailboxApiClient
  ])
], GraphClient);

// src/microsoft/microsoft.router.ts
import { Inject as Inject16 } from "@nestjs/common";
import {
  Ctx as Ctx11,
  Input as Input13,
  Mutation as Mutation11,
  Query as Query14,
  Router as Router13,
  UseMiddlewares as UseMiddlewares13
} from "nestjs-trpc";

// src/microsoft/microsoft.contracts.ts
import { GoogleSyncStatus as GoogleSyncStatus5 } from "@crm/db";
import { z as z22 } from "zod";
var setOutlookAutoCreateInput = z22.object({
  source: z22.enum(MICROSOFT_SYNC_SOURCES),
  enabled: z22.boolean()
});
var microsoftSyncStatusOutput = z22.enum(Object.values(GoogleSyncStatus5));
var microsoftSourceStatusOutput = z22.object({
  source: z22.enum(MICROSOFT_SYNC_SOURCES),
  connected: z22.boolean(),
  status: microsoftSyncStatusOutput.nullable(),
  lastSyncedAt: z22.string().nullable(),
  lastError: z22.string().nullable(),
  autoCreate: z22.boolean()
});
var microsoftConnectionStatusOutput = z22.object({
  configured: z22.boolean(),
  linked: z22.boolean(),
  required: z22.boolean(),
  hasRefreshToken: z22.boolean(),
  sources: z22.array(microsoftSourceStatusOutput)
});
var purgeSyncedDataOutput2 = z22.object({
  purged: z22.number()
});
var revokeAccessOutput2 = z22.object({
  revoked: z22.boolean()
});

// src/microsoft/microsoft-connection.service.ts
import { isMicrosoftConfigured, signsInWithMicrosoft } from "@crm/auth";
import { Injectable as Injectable52, Logger as Logger38, NotFoundException as NotFoundException14 } from "@nestjs/common";
var PURGE_TIMEOUT_MS2 = 60000;

class MicrosoftConnectionService {
  db;
  tokens;
  state;
  stamp;
  logger = new Logger38(MicrosoftConnectionService.name);
  constructor(db2, tokens, state, stamp) {
    this.db = db2;
    this.tokens = tokens;
    this.state = state;
    this.stamp = stamp;
  }
  async status(userId) {
    await this.onConnected(userId);
    const [granted, rows, hasRefreshToken, accounts] = await Promise.all([
      this.tokens.grantedScopes(userId, MICROSOFT_PROVIDER_ID2),
      this.state.listForUser(userId, MICROSOFT_SYNC_SOURCES),
      this.tokens.hasRefreshToken(userId, MICROSOFT_PROVIDER_ID2),
      this.tokens.signInAccounts(userId)
    ]);
    const bySource = new Map(rows.map((row) => [row.source, row]));
    const sources = MICROSOFT_SYNC_SOURCES.map((source) => {
      const row = bySource.get(source);
      return {
        source,
        connected: granted.has(SCOPE_FOR_SOURCE[source]),
        status: row?.status ?? null,
        lastSyncedAt: row?.lastSyncedAt?.toISOString() ?? null,
        lastError: row?.lastError ?? null,
        autoCreate: row?.autoCreate ?? false
      };
    });
    return {
      configured: isMicrosoftConfigured(),
      linked: accounts.some((account) => account.providerId === MICROSOFT_PROVIDER_ID2) && sources.some((source) => source.connected),
      required: signsInWithMicrosoft(accounts),
      hasRefreshToken,
      sources
    };
  }
  async onConnected(userId) {
    const [granted, existing] = await Promise.all([
      this.tokens.grantedScopes(userId, MICROSOFT_PROVIDER_ID2),
      this.state.listForUser(userId, MICROSOFT_SYNC_SOURCES)
    ]);
    const known = new Set(existing.map((row) => row.source));
    const added = [];
    for (const source of MICROSOFT_SYNC_SOURCES) {
      if (!granted.has(SCOPE_FOR_SOURCE[source]))
        continue;
      if (known.has(source))
        continue;
      await this.state.ensure(userId, source, { autoCreate: false });
      added.push(source);
    }
    if (added.length > 0) {
      this.logger.log({
        message: "Microsoft connected",
        userId,
        sources: added
      });
    }
  }
  async reconcileAll() {
    const accounts = await this.db.account.findMany({
      where: {
        providerId: MICROSOFT_PROVIDER_ID2,
        OR: MICROSOFT_SYNC_SOURCES.map((source) => ({
          scope: { contains: SCOPE_FOR_SOURCE[source] }
        }))
      },
      select: { userId: true }
    });
    for (const userId of new Set(accounts.map((row) => row.userId))) {
      await this.onConnected(userId);
    }
  }
  async purgeSyncedData(userId) {
    const mine = {
      syncedByUserId: userId,
      outlookMessageId: { not: null }
    };
    const purged = await this.db.$transaction(async (tx) => {
      const touched = await tx.emailMessage.findMany({
        where: mine,
        select: { threadId: true },
        distinct: ["threadId"]
      });
      const threadIds = touched.map((row) => row.threadId);
      const messages = await tx.emailMessage.deleteMany({ where: mine });
      await tx.emailThread.deleteMany({
        where: { id: { in: threadIds }, messages: { none: {} } }
      });
      await rebuildThreads2(tx, threadIds);
      return messages.count;
    }, { timeout: PURGE_TIMEOUT_MS2 });
    await this.stamp.recomputeAll();
    this.logger.log({ message: "Outlook data purged", userId, purged });
    return { purged };
  }
  async revoke(userId) {
    for (const source of MICROSOFT_SYNC_SOURCES) {
      await this.state.remove(userId, source);
    }
    const revoked = await this.tokens.revoke(userId, MICROSOFT_PROVIDER_ID2);
    return { revoked };
  }
  async setAutoCreate(userId, source, enabled) {
    const row = await this.state.get(userId, source);
    if (!row) {
      throw new NotFoundException14(`${source} is not connected.`);
    }
    await this.state.setAutoCreate(userId, source, enabled);
  }
}
MicrosoftConnectionService = __legacyDecorateClassTS([
  Injectable52(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof MailboxTokenService === "undefined" ? Object : MailboxTokenService,
    typeof SyncStateService === "undefined" ? Object : SyncStateService,
    typeof ActivityStampService === "undefined" ? Object : ActivityStampService
  ])
], MicrosoftConnectionService);
async function rebuildThreads2(tx, threadIds) {
  if (threadIds.length === 0)
    return;
  const remaining = await tx.emailMessage.findMany({
    where: { threadId: { in: threadIds } },
    select: { threadId: true, sentAt: true, subject: true, snippet: true },
    orderBy: { sentAt: "asc" }
  });
  const byThread = new Map;
  for (const message of remaining) {
    const group = byThread.get(message.threadId);
    if (group)
      group.push(message);
    else
      byThread.set(message.threadId, [message]);
  }
  for (const [threadId, messages] of byThread) {
    const first = messages.at(0);
    const last = messages.at(-1);
    if (!first || !last)
      continue;
    await tx.emailThread.update({
      where: { id: threadId },
      data: {
        messageCount: messages.length,
        firstMessageAt: first.sentAt,
        lastMessageAt: last.sentAt,
        subject: first.subject
      }
    });
    await tx.activity.updateMany({
      where: { emailThreadId: threadId },
      data: { body: last.snippet, occurredAt: last.sentAt }
    });
  }
}

// src/microsoft/microsoft-sync.service.ts
import { Injectable as Injectable54 } from "@nestjs/common";

// src/microsoft/outlook-sync.service.ts
import {
  GoogleSyncStatus as GoogleSyncStatus6
} from "@crm/db";
import { Injectable as Injectable53, Logger as Logger39 } from "@nestjs/common";
var MAX_MESSAGES_PER_TICK2 = 120;
var PAGE_SIZE = 50;
var OVERLAP_MS = 1000;
var EXCLUDED_FOLDERS = ["junkemail", "deleteditems"];
var CONVERSATION_ROOT_PREFIX = "outlook-conversation:";

class OutlookSyncService {
  graph;
  tokens;
  state;
  threads;
  logger = new Logger39(OutlookSyncService.name);
  constructor(graph, tokens, state, threads) {
    this.graph = graph;
    this.tokens = tokens;
    this.state = state;
    this.threads = threads;
  }
  async sync(row) {
    const initializedAt = new Date;
    const token = await this.tokens.accessTokenFor(row.userId, "outlook");
    if (token.outcome === "not-connected") {
      return {
        source: "outlook",
        userId: row.userId,
        status: "skipped",
        reason: token.reason
      };
    }
    if (token.outcome === "needs-reconnect") {
      await this.state.markNeedsReconnect(row.id, token.reason);
      return {
        source: "outlook",
        userId: row.userId,
        status: "reconnect",
        reason: token.reason
      };
    }
    await this.state.markRunning(row.id);
    const me = await this.graph.me(token.accessToken);
    if (me.outcome !== "ok") {
      return this.handleFailure(row, me);
    }
    const mailbox = (me.data.mail ?? me.data.userPrincipalName ?? "").toLowerCase();
    if (!mailbox) {
      await this.state.markFailed(row.id, "Microsoft returned no mailbox address.");
      return {
        source: "outlook",
        userId: row.userId,
        status: "failed",
        reason: "No mailbox address."
      };
    }
    if (!row.cursor) {
      return this.start(row, initializedAt);
    }
    return this.incremental(row, token.accessToken, mailbox, row.cursor);
  }
  async start(row, initializedAt) {
    await this.state.settle(row.id, {
      cursor: initializedAt.toISOString(),
      status: GoogleSyncStatus6.RUNNING
    });
    this.logger.log({
      message: "Outlook sync started — watching for new mail",
      userId: row.userId
    });
    return { source: "outlook", userId: row.userId, status: "synced" };
  }
  async incremental(row, accessToken, mailbox, cursor) {
    const from = new Date(cursor);
    if (Number.isNaN(from.getTime())) {
      await this.state.clearCursor(row.id, "The stored cursor was not a date.");
      return {
        source: "outlook",
        userId: row.userId,
        status: "synced",
        reason: "Cursor reset; resuming from now."
      };
    }
    const folders = await this.excludedFolderIds(accessToken);
    if (folders.outcome !== "ok") {
      return this.handleFailure(row, folders.failure);
    }
    const excluded = folders.ids;
    let page = await this.graph.listMessages(accessToken, {
      after: new Date(from.getTime() - OVERLAP_MS),
      top: PAGE_SIZE
    });
    let context = null;
    let written = 0;
    let seen = 0;
    let furthest = from;
    while (page.outcome === "ok") {
      const remaining = MAX_MESSAGES_PER_TICK2 - seen;
      const messages = (page.data.value ?? []).slice(0, Math.max(remaining, 0));
      for (const message of messages) {
        seen += 1;
        const receivedAt = message.receivedDateTime ? new Date(message.receivedDateTime) : null;
        if (receivedAt && !Number.isNaN(receivedAt.getTime())) {
          if (receivedAt > furthest)
            furthest = receivedAt;
        }
        if (message.parentFolderId && excluded.has(message.parentFolderId)) {
          continue;
        }
        const parsed = this.parse(message);
        if (!parsed)
          continue;
        context ??= await this.threads.context();
        const stored = await this.threads.store(row, { mailbox, origin: "outlook" }, parsed, context);
        if (stored)
          written += 1;
      }
      const nextLink = page.data["@odata.nextLink"];
      if (!nextLink || seen >= MAX_MESSAGES_PER_TICK2)
        break;
      page = await this.graph.nextPage(accessToken, nextLink);
    }
    if (page.outcome !== "ok") {
      return this.handleFailure(row, page);
    }
    await this.state.settle(row.id, {
      cursor: furthest.toISOString(),
      status: GoogleSyncStatus6.RUNNING
    });
    if (written > 0) {
      this.logger.log({
        message: "Outlook incremental sync",
        userId: row.userId,
        messagesWritten: written,
        messagesSeen: seen
      });
    }
    return {
      source: "outlook",
      userId: row.userId,
      status: "synced",
      messagesWritten: written
    };
  }
  async excludedFolderIds(accessToken) {
    const ids = new Set;
    for (const name of EXCLUDED_FOLDERS) {
      const folder = await this.graph.folder(accessToken, name);
      if (folder.outcome === "ok") {
        if (folder.data.id)
          ids.add(folder.data.id);
        continue;
      }
      if (isMissingFolder(folder))
        continue;
      return { outcome: "lookup-failed", failure: folder };
    }
    return { outcome: "ok", ids };
  }
  parse(message) {
    const internetMessageId = message.internetMessageId?.trim();
    if (!internetMessageId)
      return null;
    const from = addressOf(message.from ?? message.sender);
    if (!from)
      return null;
    const sentAt = this.sentAt(message);
    if (!sentAt)
      return null;
    const rootId = this.rootIdOf(message, internetMessageId);
    const to = addressList(message.toRecipients, "to");
    const cc = addressList(message.ccRecipients, "cc");
    const raw = message.body?.content ?? message.bodyPreview ?? "";
    const text = message.body?.contentType?.toLowerCase() === "html" ? stripHtml(raw) : raw;
    return {
      rfcMessageId: normaliseMessageId(internetMessageId),
      rootId,
      subject: message.subject?.trim() || null,
      from,
      recipients: [...to, ...cc],
      body: stripQuotedHistory(text),
      sentAt,
      outlookMessageId: message.id ?? null,
      outlookWebLink: message.webLink ?? null
    };
  }
  rootIdOf(message, internetMessageId) {
    const headers = message.internetMessageHeaders ?? [];
    const value = (name) => {
      const wanted = name.toLowerCase();
      const found = headers.find((entry) => entry.name?.toLowerCase() === wanted);
      return found?.value?.trim() || null;
    };
    const references = value("references");
    const inReplyTo = value("in-reply-to");
    if (references || inReplyTo) {
      const root = rootMessageIdFrom({
        references,
        inReplyTo,
        messageId: internetMessageId
      });
      if (root)
        return root;
    }
    if (message.conversationId) {
      return `${CONVERSATION_ROOT_PREFIX}${message.conversationId}`;
    }
    return normaliseMessageId(internetMessageId);
  }
  sentAt(message) {
    for (const raw of [message.sentDateTime, message.receivedDateTime]) {
      if (!raw)
        continue;
      const at = new Date(raw);
      if (!Number.isNaN(at.getTime()))
        return at;
    }
    return null;
  }
  async handleFailure(row, result) {
    if (result.outcome === "unauthorized") {
      await this.state.markNeedsReconnect(row.id, result.reason);
      return {
        source: "outlook",
        userId: row.userId,
        status: "reconnect",
        reason: result.reason
      };
    }
    if (result.outcome === "rate-limited") {
      await this.state.markRateLimited(row.id, result.retryAfterMs ?? 60000);
      return {
        source: "outlook",
        userId: row.userId,
        status: "rate-limited",
        reason: result.reason
      };
    }
    await this.state.markFailed(row.id, result.reason);
    return {
      source: "outlook",
      userId: row.userId,
      status: "failed",
      reason: result.reason
    };
  }
}
OutlookSyncService = __legacyDecorateClassTS([
  Injectable53(),
  __legacyMetadataTS("design:paramtypes", [
    typeof GraphClient === "undefined" ? Object : GraphClient,
    typeof MailboxTokenService === "undefined" ? Object : MailboxTokenService,
    typeof SyncStateService === "undefined" ? Object : SyncStateService,
    typeof ThreadWriterService === "undefined" ? Object : ThreadWriterService
  ])
], OutlookSyncService);
function isMissingFolder(failure) {
  return failure.outcome === "cursor-invalid";
}
function addressOf(entry) {
  const address = entry?.emailAddress?.address?.trim();
  if (!address)
    return null;
  const name = entry?.emailAddress?.name?.trim();
  return parseAddress(name ? `${name} <${address}>` : address) ?? null;
}
function addressList(entries, kind) {
  const seen = new Set;
  const people = [];
  for (const entry of entries ?? []) {
    const person = addressOf(entry);
    if (!person || seen.has(person.email))
      continue;
    seen.add(person.email);
    people.push({ email: person.email, name: person.name, kind });
  }
  return people;
}

// src/microsoft/microsoft-sync.service.ts
class MicrosoftSyncService {
  state;
  outlook;
  constructor(state, outlook) {
    this.state = state;
    this.outlook = outlook;
  }
  async runOne(userId, source) {
    const row = await this.state.get(userId, source);
    if (!row)
      return null;
    return this.outlook.sync(row);
  }
  async runForUser(userId) {
    for (const source of MICROSOFT_SYNC_SOURCES) {
      await this.runOne(userId, source);
    }
  }
}
MicrosoftSyncService = __legacyDecorateClassTS([
  Injectable54(),
  __legacyMetadataTS("design:paramtypes", [
    typeof SyncStateService === "undefined" ? Object : SyncStateService,
    typeof OutlookSyncService === "undefined" ? Object : OutlookSyncService
  ])
], MicrosoftSyncService);

// src/microsoft/microsoft.router.ts
class MicrosoftRouter {
  connection;
  sync;
  constructor(connection, sync) {
    this.connection = connection;
    this.sync = sync;
  }
  async status(ctx) {
    return this.connection.status(ctx.user.id);
  }
  async purgeSyncedData(ctx) {
    return this.connection.purgeSyncedData(ctx.user.id);
  }
  async revokeAccess(ctx) {
    return this.connection.revoke(ctx.user.id);
  }
  async syncNow(ctx) {
    await this.sync.runForUser(ctx.user.id);
    return this.connection.status(ctx.user.id);
  }
  async setAutoCreate(ctx, input) {
    await this.connection.setAutoCreate(ctx.user.id, input.source, input.enabled);
    return this.connection.status(ctx.user.id);
  }
}
__legacyDecorateClassTS([
  Query14({
    output: microsoftConnectionStatusOutput,
    meta: restMeta("GET", "/microsoft/status", ["Microsoft"])
  }),
  __legacyDecorateParamTS(0, Ctx11()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], MicrosoftRouter.prototype, "status", null);
__legacyDecorateClassTS([
  Mutation11({
    output: purgeSyncedDataOutput2,
    meta: restMeta("POST", "/microsoft/purge-synced-data", ["Microsoft"])
  }),
  __legacyDecorateParamTS(0, Ctx11()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], MicrosoftRouter.prototype, "purgeSyncedData", null);
__legacyDecorateClassTS([
  Mutation11({
    output: revokeAccessOutput2,
    meta: restMeta("POST", "/microsoft/revoke", ["Microsoft"])
  }),
  __legacyDecorateParamTS(0, Ctx11()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], MicrosoftRouter.prototype, "revokeAccess", null);
__legacyDecorateClassTS([
  Mutation11({
    output: microsoftConnectionStatusOutput,
    meta: restMeta("POST", "/microsoft/sync", ["Microsoft"])
  }),
  __legacyDecorateParamTS(0, Ctx11()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], MicrosoftRouter.prototype, "syncNow", null);
__legacyDecorateClassTS([
  Mutation11({
    input: setOutlookAutoCreateInput,
    output: microsoftConnectionStatusOutput,
    meta: restMeta("PATCH", "/microsoft/auto-create", ["Microsoft"])
  }),
  __legacyDecorateParamTS(0, Ctx11()),
  __legacyDecorateParamTS(1, Input13()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], MicrosoftRouter.prototype, "setAutoCreate", null);
MicrosoftRouter = __legacyDecorateClassTS([
  Router13({ alias: "microsoft" }),
  UseMiddlewares13(AuthMiddleware),
  __legacyDecorateParamTS(0, Inject16(MicrosoftConnectionService)),
  __legacyDecorateParamTS(1, Inject16(MicrosoftSyncService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof MicrosoftConnectionService === "undefined" ? Object : MicrosoftConnectionService,
    typeof MicrosoftSyncService === "undefined" ? Object : MicrosoftSyncService
  ])
], MicrosoftRouter);

// src/microsoft/microsoft.module.ts
class MicrosoftModule {
}
MicrosoftModule = __legacyDecorateClassTS([
  Module23({
    imports: [TrpcModule, MailboxModule],
    providers: [
      GraphClient,
      OutlookSyncService,
      MicrosoftSyncService,
      MicrosoftConnectionService,
      MicrosoftRouter
    ],
    exports: [MicrosoftSyncService, MicrosoftConnectionService]
  })
], MicrosoftModule);

// src/saved-views/saved-views.module.ts
import { Module as Module24 } from "@nestjs/common";

// src/saved-views/saved-views.router.ts
import { Inject as Inject17 } from "@nestjs/common";
import {
  Ctx as Ctx12,
  Input as Input14,
  Mutation as Mutation12,
  Query as Query15,
  Router as Router14,
  UseMiddlewares as UseMiddlewares14
} from "nestjs-trpc";

// src/saved-views/saved-views.contracts.ts
import { FIELD_ENTITIES as FIELD_ENTITIES4 } from "@crm/db/fields";
import { savedViewFilters } from "@crm/validation/saved-view";
import { z as z23 } from "zod";
var savedViewEntity = z23.enum(FIELD_ENTITIES4);
var savedViewListInput = z23.object({
  entity: savedViewEntity
});
var savedViewCreateInput = z23.object({
  entity: savedViewEntity,
  name: z23.string().trim().min(1, "A view needs a name.").max(120),
  shared: z23.boolean().default(false),
  filters: savedViewFilters
});
var savedViewUpdateData = z23.object({
  name: z23.string().trim().min(1).max(120).optional(),
  shared: z23.boolean().optional(),
  filters: savedViewFilters.optional()
});
var savedViewUpdateArgs = z23.object({
  id: z23.string(),
  data: savedViewUpdateData
});
var savedViewIdInput = z23.object({ id: z23.string() });
var savedViewOutput = z23.object({
  id: z23.string(),
  entity: savedViewEntity,
  name: z23.string(),
  shared: z23.boolean(),
  filters: savedViewFilters,
  mine: z23.boolean(),
  createdAt: z23.string(),
  updatedAt: z23.string()
});
var savedViewListOutput = z23.array(savedViewOutput);
var savedViewDeleteOutput = z23.object({ id: z23.string() });

// src/saved-views/saved-views.service.ts
import { Prisma as PrismaNamespace9 } from "@crm/db";
import { parseSavedViewFilters } from "@crm/validation/saved-view";
import {
  ConflictException as ConflictException5,
  Injectable as Injectable55,
  NotFoundException as NotFoundException15
} from "@nestjs/common";
class SavedViewsService {
  db;
  constructor(db2) {
    this.db = db2;
  }
  async list(entity, userId) {
    const rows = await this.db.savedView.findMany({
      where: { entity, OR: [{ shared: true }, { ownerId: userId }] },
      orderBy: { name: "asc" }
    });
    return rows.map((row) => this.serialize(row, userId));
  }
  async create(input, userId) {
    try {
      const row = await this.db.savedView.create({
        data: {
          entity: input.entity,
          name: input.name,
          shared: input.shared,
          filters: input.filters,
          ownerId: userId
        }
      });
      return this.serialize(row, userId);
    } catch (error) {
      throw this.translate(error);
    }
  }
  async update(id, data, userId) {
    const existing = await this.db.savedView.findUnique({ where: { id } });
    if (!existing || existing.ownerId !== userId) {
      throw new NotFoundException15(`No saved view with id ${id}.`);
    }
    try {
      const row = await this.db.savedView.update({
        where: { id },
        data: {
          name: data.name,
          shared: data.shared,
          filters: data.filters
        }
      });
      return this.serialize(row, userId);
    } catch (error) {
      throw this.translate(error, id);
    }
  }
  async delete(id, userId) {
    const existing = await this.db.savedView.findUnique({ where: { id } });
    if (!existing || existing.ownerId !== userId) {
      throw new NotFoundException15(`No saved view with id ${id}.`);
    }
    try {
      await this.db.savedView.delete({ where: { id } });
    } catch (error) {
      throw this.translate(error, id);
    }
    return { id };
  }
  serialize(row, userId) {
    return {
      id: row.id,
      entity: row.entity,
      name: row.name,
      shared: row.shared,
      filters: parseSavedViewFilters(row.filters),
      mine: row.ownerId === userId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    };
  }
  translate(cause, id) {
    if (cause instanceof PrismaNamespace9.PrismaClientKnownRequestError) {
      if (cause.code === "P2002") {
        throw new ConflictException5("You already have a view with that name.");
      }
      if (cause.code === "P2025") {
        throw new NotFoundException15(`No saved view with id ${id}.`);
      }
    }
    throw cause;
  }
}
SavedViewsService = __legacyDecorateClassTS([
  Injectable55(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], SavedViewsService);

// src/saved-views/saved-views.router.ts
class SavedViewsRouter {
  savedViews;
  constructor(savedViews) {
    this.savedViews = savedViews;
  }
  async list(ctx, input) {
    return this.savedViews.list(input.entity, ctx.user.id);
  }
  async create(ctx, input) {
    return this.savedViews.create(input, ctx.user.id);
  }
  async update(ctx, input) {
    return this.savedViews.update(input.id, input.data, ctx.user.id);
  }
  async delete(ctx, id) {
    return this.savedViews.delete(id, ctx.user.id);
  }
}
__legacyDecorateClassTS([
  Query15({
    input: savedViewListInput,
    output: savedViewListOutput,
    meta: restMeta("GET", "/saved-views", ["Saved Views"])
  }),
  __legacyDecorateParamTS(0, Ctx12()),
  __legacyDecorateParamTS(1, Input14()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], SavedViewsRouter.prototype, "list", null);
__legacyDecorateClassTS([
  Mutation12({
    input: savedViewCreateInput,
    output: savedViewOutput,
    meta: restMeta("POST", "/saved-views", ["Saved Views"])
  }),
  __legacyDecorateParamTS(0, Ctx12()),
  __legacyDecorateParamTS(1, Input14()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], SavedViewsRouter.prototype, "create", null);
__legacyDecorateClassTS([
  Mutation12({
    input: savedViewUpdateArgs,
    output: savedViewOutput,
    meta: restMeta("PATCH", "/saved-views/{id}", ["Saved Views"])
  }),
  __legacyDecorateParamTS(0, Ctx12()),
  __legacyDecorateParamTS(1, Input14()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], SavedViewsRouter.prototype, "update", null);
__legacyDecorateClassTS([
  Mutation12({
    input: savedViewIdInput,
    output: savedViewDeleteOutput,
    meta: restMeta("DELETE", "/saved-views/{id}", ["Saved Views"])
  }),
  __legacyDecorateParamTS(0, Ctx12()),
  __legacyDecorateParamTS(1, Input14("id")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], SavedViewsRouter.prototype, "delete", null);
SavedViewsRouter = __legacyDecorateClassTS([
  Router14({ alias: "savedViews" }),
  UseMiddlewares14(AuthMiddleware),
  __legacyDecorateParamTS(0, Inject17(SavedViewsService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof SavedViewsService === "undefined" ? Object : SavedViewsService
  ])
], SavedViewsRouter);

// src/saved-views/saved-views.module.ts
class SavedViewsModule {
}
SavedViewsModule = __legacyDecorateClassTS([
  Module24({
    imports: [TrpcModule],
    providers: [SavedViewsService, SavedViewsRouter],
    exports: [SavedViewsService]
  })
], SavedViewsModule);

// src/search/search.module.ts
import { Module as Module25 } from "@nestjs/common";

// src/search/search.router.ts
import { Inject as Inject18 } from "@nestjs/common";
import { Input as Input15, Query as Query16, Router as Router15, UseMiddlewares as UseMiddlewares15 } from "nestjs-trpc";
import { z as z24 } from "zod";

// src/search/search.service.ts
import { Injectable as Injectable56 } from "@nestjs/common";
var PER_KIND = 5;

class SearchService {
  db;
  constructor(db2) {
    this.db = db2;
  }
  async quick(q) {
    const term = q.trim();
    if (term.length < 2)
      return { hits: [] };
    const [companies, contacts, deals] = await Promise.all([
      this.db.company.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { domain: { contains: term, mode: "insensitive" } }
          ]
        },
        take: PER_KIND,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          domain: true,
          iconUrl: true,
          iconDarkUrl: true,
          iconTone: true
        }
      }),
      this.db.contact.findMany({
        where: {
          OR: [
            { firstName: { contains: term, mode: "insensitive" } },
            { lastName: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } }
          ]
        },
        take: PER_KIND,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
          company: { select: { name: true } }
        }
      }),
      this.db.deal.findMany({
        where: { name: { contains: term, mode: "insensitive" } },
        take: PER_KIND,
        orderBy: [{ stage: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          company: {
            select: {
              name: true,
              iconUrl: true,
              iconDarkUrl: true,
              iconTone: true
            }
          }
        }
      })
    ]);
    return {
      hits: [
        ...companies.map((company) => ({
          kind: "company",
          id: company.id,
          label: company.name,
          detail: company.domain,
          iconUrl: company.iconUrl,
          iconDarkUrl: company.iconDarkUrl,
          iconTone: company.iconTone,
          imageUrl: null
        })),
        ...contacts.map((contact) => ({
          kind: "contact",
          id: contact.id,
          label: [contact.firstName, contact.lastName].filter(Boolean).join(" ") || (contact.email ?? "Unnamed"),
          detail: contact.company?.name ?? contact.email,
          iconUrl: null,
          iconDarkUrl: null,
          iconTone: null,
          imageUrl: contact.imageUrl
        })),
        ...deals.map((deal) => ({
          kind: "deal",
          id: deal.id,
          label: deal.name,
          detail: deal.company.name,
          iconUrl: deal.company.iconUrl,
          iconDarkUrl: deal.company.iconDarkUrl,
          iconTone: deal.company.iconTone,
          imageUrl: null
        }))
      ]
    };
  }
}
SearchService = __legacyDecorateClassTS([
  Injectable56(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], SearchService);

// src/search/search.router.ts
var quickInput = z24.object({ q: z24.string().default("") });
var searchHitOutput = z24.object({
  kind: z24.enum(["company", "contact", "deal"]),
  id: z24.string(),
  label: z24.string(),
  detail: z24.string().nullable(),
  iconUrl: z24.string().nullable(),
  iconDarkUrl: z24.string().nullable(),
  iconTone: z24.string().nullable(),
  imageUrl: z24.string().nullable()
});
var quickOutput = z24.object({ hits: z24.array(searchHitOutput) });

class SearchRouter {
  search;
  constructor(search) {
    this.search = search;
  }
  async quick(q) {
    return this.search.quick(q);
  }
}
__legacyDecorateClassTS([
  Query16({
    input: quickInput,
    output: quickOutput,
    meta: restMeta("GET", "/search", ["Search"])
  }),
  __legacyDecorateParamTS(0, Input15("q")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], SearchRouter.prototype, "quick", null);
SearchRouter = __legacyDecorateClassTS([
  Router15({ alias: "search" }),
  UseMiddlewares15(AuthMiddleware),
  __legacyDecorateParamTS(0, Inject18(SearchService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof SearchService === "undefined" ? Object : SearchService
  ])
], SearchRouter);

// src/search/search.module.ts
class SearchModule {
}
SearchModule = __legacyDecorateClassTS([
  Module25({
    imports: [TrpcModule],
    providers: [SearchService, SearchRouter]
  })
], SearchModule);

// src/settings/settings.module.ts
import { Module as Module26 } from "@nestjs/common";

// src/settings/model-catalog.service.ts
import { CACHE_MANAGER as CACHE_MANAGER3 } from "@nestjs/cache-manager";
import { Inject as Inject19, Injectable as Injectable57, Logger as Logger40 } from "@nestjs/common";
import { z as z25 } from "zod";
var CATALOG_URL = "https://ai-gateway.vercel.sh/v1/models";
var CATALOG_TTL_MS = 30 * 60000;
var CATALOG_KEY = "settings:model-catalog";
var CATALOG_TIMEOUT_MS = 5000;
var gatewayRate = z25.union([z25.number(), z25.string()]).transform((value) => Number(value)).refine((value) => Number.isFinite(value)).nullable().catch(null);
var gatewayModel = z25.object({
  id: z25.string(),
  name: z25.string().catch(""),
  owned_by: z25.string().catch(""),
  type: z25.string().catch(""),
  tags: z25.array(z25.json()).catch([]),
  context_window: z25.number(),
  pricing: z25.object({ input: gatewayRate, output: gatewayRate }).nullable().catch(null)
});
var gatewayCatalog = z25.object({ data: z25.array(z25.json()).catch([]) }).catch({ data: [] });
function usable(model) {
  return model.type === "language" && model.tags.includes("tool-use");
}
function toCatalogModel(model) {
  const input = model.pricing?.input ?? null;
  const output = model.pricing?.output ?? null;
  return {
    id: model.id,
    name: model.name || model.id,
    provider: model.owned_by || (model.id.split("/")[0] ?? model.id),
    contextWindowTokens: model.context_window,
    pricing: input !== null && output !== null ? { input, output } : null
  };
}

class ModelCatalogService {
  cache;
  logger = new Logger40(ModelCatalogService.name);
  constructor(cache) {
    this.cache = cache;
  }
  async models() {
    const cached = await this.cache.get(CATALOG_KEY);
    if (cached)
      return cached;
    const models = await this.fetchCatalog();
    if (!models)
      return null;
    await this.cache.set(CATALOG_KEY, models, CATALOG_TTL_MS);
    return models;
  }
  async find(id) {
    const models = await this.models();
    return models?.find((model) => model.id === id) ?? null;
  }
  async fetchCatalog() {
    try {
      const response = await fetch(CATALOG_URL, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(CATALOG_TIMEOUT_MS)
      });
      if (!response.ok) {
        this.logger.warn({
          message: "Model catalog request failed",
          status: response.status
        });
        return null;
      }
      const body2 = gatewayCatalog.parse(await response.json());
      const models = body2.data.flatMap((entry) => {
        const parsed = gatewayModel.safeParse(entry);
        return parsed.success && usable(parsed.data) ? [toCatalogModel(parsed.data)] : [];
      });
      models.sort((a, b) => a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name));
      this.logger.log({
        message: "Model catalog loaded",
        models: models.length
      });
      return models;
    } catch (error) {
      this.logger.warn({
        message: "Model catalog unavailable",
        reason: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
}
ModelCatalogService = __legacyDecorateClassTS([
  Injectable57(),
  __legacyDecorateParamTS(0, Inject19(CACHE_MANAGER3)),
  __legacyMetadataTS("design:paramtypes", [
    typeof Cache === "undefined" ? Object : Cache
  ])
], ModelCatalogService);

// src/settings/settings.router.ts
import { Inject as Inject20 } from "@nestjs/common";
import { Input as Input16, Mutation as Mutation13, Query as Query17, Router as Router16, UseMiddlewares as UseMiddlewares16 } from "nestjs-trpc";

// src/settings/settings.contracts.ts
import {
  MAX_ARCHIVE_RETENTION_DAYS,
  MIN_ARCHIVE_RETENTION_DAYS
} from "@crm/db/settings";
import { z as z26 } from "zod";
var catalogModelOutput = z26.object({
  id: z26.string(),
  name: z26.string(),
  provider: z26.string(),
  contextWindowTokens: z26.number(),
  pricing: z26.object({ input: z26.number(), output: z26.number() }).nullable()
});
var agentModelOutput = z26.object({
  selectedId: z26.string().nullable(),
  effectiveId: z26.string(),
  defaultId: z26.string(),
  effective: catalogModelOutput.nullable(),
  updatedAt: z26.string().nullable()
});
var modelCatalogOutput = z26.object({
  models: z26.array(catalogModelOutput),
  available: z26.boolean()
});
var researchKeyOutput = z26.object({
  configured: z26.boolean(),
  hint: z26.string().nullable()
});
var archiveRetentionOutput = z26.object({
  days: z26.number()
});
var setAgentModelInput = z26.object({
  modelId: z26.string().trim().min(1).max(200).nullable()
});
var setResearchKeyInput = z26.object({
  apiKey: z26.string().trim().min(8, "That does not look like a Context API key — it is too short.").max(500, "That does not look like a Context API key — it is too long.").refine((value) => !/\s/.test(value), "An API key has no spaces in it. Paste the whole key on its own.")
});
var setArchiveRetentionDaysInput = z26.object({
  days: z26.number().int().min(MIN_ARCHIVE_RETENTION_DAYS, `Retention has to be at least ${MIN_ARCHIVE_RETENTION_DAYS} day.`).max(MAX_ARCHIVE_RETENTION_DAYS, `Retention cannot be longer than ${MAX_ARCHIVE_RETENTION_DAYS} days.`)
});

// src/settings/settings.service.ts
import {
  DEFAULT_AGENT_MODEL,
  maskKey,
  readAgentModel,
  readArchiveRetentionDays as readArchiveRetentionDays2,
  readContextDevKey,
  writeAgentModel,
  writeArchiveRetentionDays,
  writeContextDevKey
} from "@crm/db/settings";
import { BadRequestException as BadRequestException10, Injectable as Injectable58, Logger as Logger41 } from "@nestjs/common";
class SettingsService {
  db;
  catalog;
  researchKeys;
  backfill;
  logger = new Logger41(SettingsService.name);
  constructor(db2, catalog, researchKeys, backfill) {
    this.db = db2;
    this.catalog = catalog;
    this.researchKeys = researchKeys;
    this.backfill = backfill;
  }
  async agentModel() {
    const [model, row] = await Promise.all([
      readAgentModel(this.db),
      this.db.appSetting.findFirst({ select: { updatedAt: true } })
    ]);
    return {
      selectedId: model.isDefault ? null : model.id,
      effectiveId: model.id,
      defaultId: DEFAULT_AGENT_MODEL.id,
      effective: await this.catalog.find(model.id),
      updatedAt: row?.updatedAt.toISOString() ?? null
    };
  }
  async setAgentModel(modelId) {
    if (modelId === null) {
      await writeAgentModel(this.db, null);
      this.logger.log({ message: "Agent model reset to the default" });
      return this.agentModel();
    }
    const models = await this.catalog.models();
    if (!models) {
      throw new BadRequestException10("Could not reach the AI Gateway to check that model. Try again in a moment.");
    }
    const chosen = models.find((model) => model.id === modelId);
    if (!chosen) {
      throw new BadRequestException10(`The AI Gateway does not serve a tool-using model called "${modelId}".`);
    }
    await writeAgentModel(this.db, {
      id: chosen.id,
      contextWindowTokens: chosen.contextWindowTokens
    });
    this.logger.log({ message: "Agent model changed", modelId: chosen.id });
    return this.agentModel();
  }
  async modelCatalog() {
    const models = await this.catalog.models();
    return { models: models ?? [], available: models !== null };
  }
  async researchKey() {
    const key = await readContextDevKey(this.db);
    return { configured: key !== null, hint: key ? maskKey(key) : null };
  }
  async setResearchKey(apiKey) {
    const check = await this.researchKeys.verify(apiKey);
    if (check.outcome === "invalid") {
      throw new BadRequestException10(check.reason);
    }
    await writeContextDevKey(this.db, apiKey);
    this.logger.log({
      message: "Context key saved",
      verified: check.outcome === "valid"
    });
    this.backfill.run("companies").then(({ queued, remaining }) => {
      if (queued > 0) {
        this.logger.log({
          message: "Queued the research that was waiting on a key",
          queued,
          remaining
        });
      }
    }).catch((cause) => {
      this.logger.warn({ message: "Could not queue the waiting research" }, cause instanceof Error ? cause.stack : String(cause));
    });
    return this.researchKey();
  }
  async archiveRetention() {
    return { days: await readArchiveRetentionDays2(this.db) };
  }
  async setArchiveRetention(days) {
    const saved = await writeArchiveRetentionDays(this.db, days);
    this.logger.log({
      message: "Archive retention changed",
      days: saved
    });
    return { days: saved };
  }
}
SettingsService = __legacyDecorateClassTS([
  Injectable58(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof ModelCatalogService === "undefined" ? Object : ModelCatalogService,
    typeof ResearchKeyService === "undefined" ? Object : ResearchKeyService,
    typeof BackfillService === "undefined" ? Object : BackfillService
  ])
], SettingsService);

// src/settings/settings.router.ts
class SettingsRouter {
  settings;
  constructor(settings) {
    this.settings = settings;
  }
  async agentModel() {
    return this.settings.agentModel();
  }
  async modelCatalog() {
    return this.settings.modelCatalog();
  }
  async setAgentModel(input) {
    return this.settings.setAgentModel(input.modelId);
  }
  async researchKey() {
    return this.settings.researchKey();
  }
  async setResearchKey(input) {
    return this.settings.setResearchKey(input.apiKey);
  }
  async archiveRetention() {
    return this.settings.archiveRetention();
  }
  async setArchiveRetention(input) {
    return this.settings.setArchiveRetention(input.days);
  }
}
__legacyDecorateClassTS([
  Query17({
    output: agentModelOutput,
    meta: restMeta("GET", "/settings/agent-model", ["Settings"])
  }),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", []),
  __legacyMetadataTS("design:returntype", Promise)
], SettingsRouter.prototype, "agentModel", null);
__legacyDecorateClassTS([
  Query17({
    output: modelCatalogOutput,
    meta: restMeta("GET", "/settings/model-catalog", ["Settings"])
  }),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", []),
  __legacyMetadataTS("design:returntype", Promise)
], SettingsRouter.prototype, "modelCatalog", null);
__legacyDecorateClassTS([
  Mutation13({
    input: setAgentModelInput,
    output: agentModelOutput,
    meta: restMeta("PATCH", "/settings/agent-model", ["Settings"])
  }),
  __legacyDecorateParamTS(0, Input16()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], SettingsRouter.prototype, "setAgentModel", null);
__legacyDecorateClassTS([
  Query17({
    output: researchKeyOutput,
    meta: restMeta("GET", "/settings/research-key", ["Settings"])
  }),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", []),
  __legacyMetadataTS("design:returntype", Promise)
], SettingsRouter.prototype, "researchKey", null);
__legacyDecorateClassTS([
  Mutation13({
    input: setResearchKeyInput,
    output: researchKeyOutput,
    meta: restMeta("PATCH", "/settings/research-key", ["Settings"])
  }),
  __legacyDecorateParamTS(0, Input16()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], SettingsRouter.prototype, "setResearchKey", null);
__legacyDecorateClassTS([
  Query17({
    output: archiveRetentionOutput,
    meta: restMeta("GET", "/settings/archive-retention", ["Settings"])
  }),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", []),
  __legacyMetadataTS("design:returntype", Promise)
], SettingsRouter.prototype, "archiveRetention", null);
__legacyDecorateClassTS([
  Mutation13({
    input: setArchiveRetentionDaysInput,
    output: archiveRetentionOutput,
    meta: restMeta("PATCH", "/settings/archive-retention", ["Settings"])
  }),
  __legacyDecorateParamTS(0, Input16()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], SettingsRouter.prototype, "setArchiveRetention", null);
SettingsRouter = __legacyDecorateClassTS([
  Router16({ alias: "settings" }),
  UseMiddlewares16(AuthMiddleware),
  __legacyDecorateParamTS(0, Inject20(SettingsService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof SettingsService === "undefined" ? Object : SettingsService
  ])
], SettingsRouter);

// src/settings/settings.module.ts
class SettingsModule {
}
SettingsModule = __legacyDecorateClassTS([
  Module26({
    imports: [TrpcModule, AgentModule, BackfillModule],
    providers: [ModelCatalogService, SettingsService, SettingsRouter],
    exports: [SettingsService]
  })
], SettingsModule);

// src/slack/slack.module.ts
import { Module as Module27 } from "@nestjs/common";

// src/slack/slack.router.ts
import { Inject as Inject21 } from "@nestjs/common";
import {
  Ctx as Ctx13,
  Input as Input17,
  Mutation as Mutation14,
  Query as Query18,
  Router as Router17,
  UseMiddlewares as UseMiddlewares17
} from "nestjs-trpc";

// src/slack/slack.contracts.ts
import { z as z27 } from "zod";

// src/slack/slack-config.ts
var SECOND_MS3 = 1000;
var MINUTE_MS2 = 60 * SECOND_MS3;
var SLACK = {
  sync: {
    activeMs: 30 * SECOND_MS3,
    stalledAfterMs: 3 * MINUTE_MS2
  },
  channels: {
    pageSize: 50,
    maxPageSize: 100
  }
};
var SLACK_SYNC_STATES = ["idle", "syncing", "stalled"];

// src/slack/slack.contracts.ts
var slackChannelsInput = z27.object({
  cursor: z27.string().trim().min(1).max(64).nullish(),
  limit: z27.number().int().min(1).max(SLACK.channels.maxPageSize).optional(),
  query: z27.string().trim().max(120).optional()
});
var slackJoinChannelInput = z27.object({
  channelId: z27.string().trim().min(1).max(64)
});
var slackCreateChannelInput = z27.object({
  name: z27.string().trim().min(1).max(80).regex(/^[a-z0-9-_]+$/, "Use lowercase letters, numbers and dashes."),
  isPrivate: z27.boolean().default(false)
});
var slackCreateChannelReply = z27.union([
  z27.object({
    channel: z27.object({
      id: z27.string().trim().min(1).max(64),
      name: z27.string().trim().min(1).max(120)
    })
  }),
  z27.object({ error: z27.string().trim().min(1).max(500) })
]);
var slackSyncStateOutput = z27.enum(SLACK_SYNC_STATES);
var slackAgentSummaryOutput = z27.object({
  id: z27.string(),
  name: z27.string(),
  description: z27.string().nullable(),
  status: z27.enum([
    "DRAFT",
    "DEPLOYING",
    "LIVE",
    "PAUSED",
    "ARCHIVED",
    "DELETED"
  ])
});
var slackStatusOutput = z27.object({
  configured: z27.boolean(),
  connected: z27.boolean(),
  workspace: z27.string().nullable(),
  lastConnectedAt: z27.string().nullable(),
  scopes: z27.array(z27.string()),
  canInviteItself: z27.boolean(),
  canManage: z27.boolean(),
  agents: z27.array(slackAgentSummaryOutput),
  people: z27.object({
    matched: z27.number(),
    reviewed: z27.number()
  })
});
var slackMemberMatchOutput = z27.object({
  slackUserId: z27.string().nullable(),
  slackHandle: z27.string().nullable(),
  slackEmail: z27.string().nullable()
});
var slackMatchesOutput = z27.object({
  rows: z27.array(z27.object({
    crmUserId: z27.string(),
    name: z27.string(),
    email: z27.string(),
    match: slackMemberMatchOutput.nullable()
  })),
  sync: slackSyncStateOutput
});
var slackChannelsOutput = z27.object({
  canInviteItself: z27.boolean(),
  sync: slackSyncStateOutput,
  nextCursor: z27.string().nullable(),
  rows: z27.array(z27.object({
    id: z27.string(),
    name: z27.string(),
    memberCount: z27.number().nullable(),
    isPrivate: z27.boolean(),
    isMember: z27.boolean(),
    classified: z27.boolean(),
    inviteRequestedAt: z27.string().nullable()
  }))
});
var slackJoinChannelOutput = z27.object({
  queued: z27.boolean(),
  alreadyJoined: z27.boolean()
});
var slackRefreshPeopleOutput = z27.object({
  requested: z27.boolean()
});
var slackCreateChannelOutput = z27.object({
  channel: z27.object({
    id: z27.string(),
    name: z27.string()
  })
});
var slackDisconnectOutput = z27.object({
  disconnected: z27.boolean()
});

// src/slack/slack-connection.service.ts
import {
  canManageConnections,
  isSlackConfigured,
  WORKSPACE_ID as WORKSPACE_ID4
} from "@crm/auth";
import { schemas as schemas3 } from "@crm/validation";
import {
  BadRequestException as BadRequestException12,
  ForbiddenException as ForbiddenException7,
  Injectable as Injectable60,
  NotFoundException as NotFoundException16
} from "@nestjs/common";

// src/slack/slack-channels.service.ts
import {
  BadRequestException as BadRequestException11,
  Injectable as Injectable59,
  Logger as Logger42,
  ServiceUnavailableException as ServiceUnavailableException4
} from "@nestjs/common";
var CREATE_TIMEOUT_MS = 20000;
var SERVER_ERROR_STATUS = 500;

class SlackChannelsService {
  logger = new Logger42(SlackChannelsService.name);
  async create(name, isPrivate) {
    const agent = bridge();
    if (!agent) {
      throw new ServiceUnavailableException4("This install has no AGENT_BRIDGE_SECRET, so nothing can reach Slack.");
    }
    let response;
    try {
      response = await fetch(agent.url("/internal/crm/slack/create-channel"), {
        method: "POST",
        headers: {
          authorization: `Bearer ${agent.secret}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          type: "slack.channel.create",
          channelName: name,
          isPrivate
        }),
        signal: AbortSignal.timeout(CREATE_TIMEOUT_MS)
      });
    } catch (error) {
      this.logger.error({ message: "Could not reach the agent to create a channel", name }, error instanceof Error ? error.stack : String(error));
      throw new ServiceUnavailableException4("The agent is not answering, so the channel was not created.");
    }
    if (response.status >= SERVER_ERROR_STATUS) {
      this.logger.error({
        message: "The agent failed while creating a channel",
        name,
        status: response.status
      });
      throw new ServiceUnavailableException4("The agent failed, so the channel was not created.");
    }
    const reply = slackCreateChannelReply.safeParse(await response.json().catch(() => null));
    if (!reply.success) {
      this.logger.error({
        message: "The agent returned an unreadable channel reply",
        name,
        status: response.status
      });
      throw new ServiceUnavailableException4("The agent answered with something unreadable, so the channel was not created.");
    }
    if ("error" in reply.data) {
      throw new BadRequestException11(reply.data.error);
    }
    if (!response.ok) {
      throw new BadRequestException11("Slack refused to create that channel.");
    }
    return { channel: reply.data.channel };
  }
}
SlackChannelsService = __legacyDecorateClassTS([
  Injectable59()
], SlackChannelsService);

// src/slack/slack-connection.service.ts
var SLACK_WORKSPACE_RESOURCE_ID = schemas3.agents.CAPABILITY_RESOURCE_IDS.slack;

class SlackConnectionService {
  db;
  agent;
  slackChannels;
  access;
  constructor(db2, agent, slackChannels, access) {
    this.db = db2;
    this.agent = agent;
    this.slackChannels = slackChannels;
    this.access = access;
  }
  async status(userId) {
    const role = await this.access.assertMember(userId);
    const [account, agents, matches, memberCount, grant] = await Promise.all([
      this.db.account.findFirst({
        where: { providerId: "slack", accessToken: { not: null } },
        orderBy: { updatedAt: "desc" },
        select: { accountId: true, updatedAt: true, scope: true }
      }),
      this.db.agentDefinition.findMany({
        where: {
          status: { in: ["LIVE", "PAUSED"] },
          deletedAt: null,
          currentVersionId: { not: null },
          currentVersion: {
            manifest: {
              path: ["dataScope", "resources"],
              array_contains: [{ id: SLACK_WORKSPACE_RESOURCE_ID }]
            }
          }
        },
        orderBy: { updatedAt: "desc" },
        take: 30,
        select: { id: true, name: true, description: true, status: true }
      }),
      this.db.slackMemberMatch.findMany({
        where: {
          crmUser: { members: { some: { organizationId: WORKSPACE_ID4 } } }
        },
        select: { slackUserId: true, updatedAt: true }
      }),
      this.db.member.count({ where: { organizationId: WORKSPACE_ID4 } }),
      this.db.slackWorkspaceGrant.findFirst({
        select: { id: true, teamName: true }
      })
    ]);
    const matched = matches.filter((match) => match.slackUserId).length;
    const reviewed = matches.length;
    const inventoryFresh = account && reviewed === memberCount && matches.every((match) => match.updatedAt >= account.updatedAt);
    if (account && !inventoryFresh) {
      await this.agent.slackPeopleRequested("Match workspace members to Slack accounts by exact email");
    }
    return {
      configured: isSlackConfigured(),
      connected: Boolean(account),
      workspace: account ? grant?.teamName ?? null : null,
      lastConnectedAt: account?.updatedAt.toISOString() ?? null,
      scopes: (account?.scope ?? "").split(",").map((scope) => scope.trim()).filter(Boolean),
      canInviteItself: Boolean(grant),
      canManage: canManageConnections(role),
      agents,
      people: { matched, reviewed }
    };
  }
  async matches(userId) {
    await this.access.assertMember(userId);
    const [members, syncing] = await Promise.all([
      this.db.member.findMany({
        where: { organizationId: WORKSPACE_ID4 },
        orderBy: { user: { name: "asc" } },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              slackMemberMatch: {
                select: {
                  slackUserId: true,
                  slackHandle: true,
                  slackEmail: true
                }
              }
            }
          }
        }
      }),
      this.peopleSyncState()
    ]);
    return {
      rows: members.map(({ user }) => ({
        crmUserId: user.id,
        name: user.name,
        email: user.email,
        match: user.slackMemberMatch
      })),
      sync: syncing
    };
  }
  async peopleSyncState() {
    const pending = await this.db.agentTask.findFirst({
      where: { kind: "slack-people-match", finishedAt: null },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, startedAt: true, leasedUntil: true }
    });
    if (!pending)
      return "idle";
    const now = Date.now();
    const leaseHeld = pending.leasedUntil ? pending.leasedUntil.getTime() > now : false;
    if (leaseHeld || pending.startedAt)
      return "syncing";
    return now - pending.createdAt.getTime() < SLACK.sync.stalledAfterMs ? "syncing" : "stalled";
  }
  async refreshPeople(userId) {
    await this.access.assertMember(userId);
    const account = await this.db.account.findFirst({
      where: { providerId: "slack", accessToken: { not: null } },
      orderBy: { updatedAt: "desc" },
      select: { id: true }
    });
    if (!account)
      throw new NotFoundException16("Slack is not connected.");
    await this.agent.slackPeopleRequested("Refresh Slack people and channels from the connection page", true);
    return { requested: true };
  }
  async channels(input, userId) {
    await this.access.assertMember(userId);
    const take = input.limit ?? SLACK.channels.pageSize;
    const needle = input.query?.trim() ?? "";
    const where = { available: true };
    if (needle)
      where.name = { contains: needle, mode: "insensitive" };
    const [rows, grant, sync] = await Promise.all([
      this.db.slackChannel.findMany({
        where,
        orderBy: [{ isMember: "desc" }, { name: "asc" }, { id: "asc" }],
        take: take + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        skip: input.cursor ? 1 : undefined,
        select: {
          id: true,
          name: true,
          memberCount: true,
          isPrivate: true,
          isMember: true,
          classifiedAt: true,
          inviteRequestedAt: true
        }
      }),
      this.db.slackWorkspaceGrant.findFirst({ select: { id: true } }),
      this.peopleSyncState()
    ]);
    const page = rows.slice(0, take);
    return {
      canInviteItself: Boolean(grant),
      sync,
      nextCursor: rows.length > take ? page.at(-1)?.id ?? null : null,
      rows: page.map(({ classifiedAt, ...row }) => ({
        ...row,
        classified: classifiedAt !== null,
        inviteRequestedAt: row.inviteRequestedAt?.toISOString() ?? null
      }))
    };
  }
  async joinChannel(input, userId) {
    await this.access.assertMember(userId);
    const channel = await this.db.slackChannel.findUnique({
      where: { id: input.channelId },
      select: { id: true, name: true, isMember: true, isPrivate: true }
    });
    if (!channel)
      throw new NotFoundException16("No such Slack channel.");
    if (channel.isMember)
      return { queued: false, alreadyJoined: true };
    const grant = await this.db.slackWorkspaceGrant.findFirst({
      select: { id: true }
    });
    if (channel.isPrivate && !grant) {
      await this.db.slackChannel.update({
        where: { id: channel.id },
        data: { inviteRequestedAt: new Date }
      });
      return { queued: false, alreadyJoined: false };
    }
    await this.agent.slackChannelJoinRequested(channel.id, channel.name);
    return { queued: true, alreadyJoined: false };
  }
  async createChannel(input, userId) {
    await this.access.assertMember(userId);
    const existing = await this.db.slackChannel.findFirst({
      where: { name: input.name },
      select: { id: true }
    });
    if (existing) {
      throw new BadRequestException12("A channel with that name already exists.");
    }
    return this.slackChannels.create(input.name, input.isPrivate);
  }
  async disconnect(userId) {
    const role = await this.access.assertMember(userId);
    if (!canManageConnections(role)) {
      throw new ForbiddenException7("Only an owner or an admin can disconnect Slack.");
    }
    const removed = await this.db.$transaction(async (tx) => {
      const accounts = await tx.account.deleteMany({
        where: { providerId: "slack" }
      });
      await tx.slackChannel.deleteMany({});
      await tx.slackWorkspaceGrant.deleteMany({});
      return accounts.count;
    });
    if (removed === 0)
      throw new NotFoundException16("Slack is not connected.");
    return { disconnected: true };
  }
}
SlackConnectionService = __legacyDecorateClassTS([
  Injectable60(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof AgentTriggerService === "undefined" ? Object : AgentTriggerService,
    typeof SlackChannelsService === "undefined" ? Object : SlackChannelsService,
    typeof AgentAccessService === "undefined" ? Object : AgentAccessService
  ])
], SlackConnectionService);

// src/slack/slack.router.ts
class SlackRouter {
  connection;
  constructor(connection) {
    this.connection = connection;
  }
  status(ctx) {
    return this.connection.status(ctx.user.id);
  }
  matches(ctx) {
    return this.connection.matches(ctx.user.id);
  }
  channels(ctx, input) {
    return this.connection.channels(input, ctx.user.id);
  }
  joinChannel(ctx, input) {
    return this.connection.joinChannel(input, ctx.user.id);
  }
  refreshPeople(ctx) {
    return this.connection.refreshPeople(ctx.user.id);
  }
  createChannel(ctx, input) {
    return this.connection.createChannel(input, ctx.user.id);
  }
  disconnect(ctx) {
    return this.connection.disconnect(ctx.user.id);
  }
}
__legacyDecorateClassTS([
  Query18({
    output: slackStatusOutput,
    meta: restMeta("GET", "/slack/status", ["Slack"])
  }),
  __legacyDecorateParamTS(0, Ctx13()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", undefined)
], SlackRouter.prototype, "status", null);
__legacyDecorateClassTS([
  Query18({
    output: slackMatchesOutput,
    meta: restMeta("GET", "/slack/matches", ["Slack"])
  }),
  __legacyDecorateParamTS(0, Ctx13()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", undefined)
], SlackRouter.prototype, "matches", null);
__legacyDecorateClassTS([
  Query18({
    input: slackChannelsInput,
    output: slackChannelsOutput,
    meta: restMeta("GET", "/slack/channels", ["Slack"])
  }),
  __legacyDecorateParamTS(0, Ctx13()),
  __legacyDecorateParamTS(1, Input17()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", undefined)
], SlackRouter.prototype, "channels", null);
__legacyDecorateClassTS([
  Mutation14({
    input: slackJoinChannelInput,
    output: slackJoinChannelOutput,
    meta: restMeta("POST", "/slack/channels/{channelId}/join", ["Slack"])
  }),
  __legacyDecorateParamTS(0, Ctx13()),
  __legacyDecorateParamTS(1, Input17()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", undefined)
], SlackRouter.prototype, "joinChannel", null);
__legacyDecorateClassTS([
  Mutation14({
    output: slackRefreshPeopleOutput,
    meta: restMeta("POST", "/slack/people/refresh", ["Slack"])
  }),
  __legacyDecorateParamTS(0, Ctx13()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", undefined)
], SlackRouter.prototype, "refreshPeople", null);
__legacyDecorateClassTS([
  Mutation14({
    input: slackCreateChannelInput,
    output: slackCreateChannelOutput,
    meta: restMeta("POST", "/slack/channels", ["Slack"])
  }),
  __legacyDecorateParamTS(0, Ctx13()),
  __legacyDecorateParamTS(1, Input17()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", undefined)
], SlackRouter.prototype, "createChannel", null);
__legacyDecorateClassTS([
  Mutation14({
    output: slackDisconnectOutput,
    meta: restMeta("DELETE", "/slack/connection", ["Slack"])
  }),
  __legacyDecorateParamTS(0, Ctx13()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", undefined)
], SlackRouter.prototype, "disconnect", null);
SlackRouter = __legacyDecorateClassTS([
  Router17({ alias: "slack" }),
  UseMiddlewares17(AuthMiddleware),
  __legacyDecorateParamTS(0, Inject21(SlackConnectionService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof SlackConnectionService === "undefined" ? Object : SlackConnectionService
  ])
], SlackRouter);

// src/slack/slack.module.ts
class SlackModule {
}
SlackModule = __legacyDecorateClassTS([
  Module27({
    imports: [TrpcModule, AgentModule],
    providers: [SlackChannelsService, SlackConnectionService, SlackRouter],
    exports: [SlackConnectionService]
  })
], SlackModule);

// src/sso/sso.module.ts
import { Module as Module28 } from "@nestjs/common";

// src/sso/sso.router.ts
import { Inject as Inject22 } from "@nestjs/common";
import { fromNodeHeaders as fromNodeHeaders3 } from "better-auth/node";
import {
  Ctx as Ctx14,
  Input as Input18,
  Mutation as Mutation15,
  Query as Query19,
  Router as Router18,
  UseMiddlewares as UseMiddlewares18
} from "nestjs-trpc";

// src/sso/sso.contracts.ts
import { z as z28 } from "zod";
var ssoProviderListInput = listInput;
var registerSsoProviderInput = z28.object({
  providerId: z28.string().trim().min(1).max(64).regex(/^[a-z0-9][a-z0-9-]*$/, "Use lower-case letters, numbers and hyphens."),
  issuer: z28.string().trim().url().max(512),
  domain: z28.string().trim().min(1).max(255),
  clientId: z28.string().trim().min(1).max(512),
  clientSecret: z28.string().trim().min(1).max(1024)
});
var deleteSsoProviderInput = z28.object({
  providerId: z28.string().trim().min(1).max(64)
});
var ssoPublicProviderOutput = z28.object({
  providerId: z28.string(),
  name: z28.string()
});
var ssoSignInOptionsOutput = z28.object({
  google: z28.boolean(),
  microsoft: z28.boolean(),
  providers: z28.array(ssoPublicProviderOutput)
});
var ssoSettingsOutput = z28.object({
  canConfigure: z28.boolean(),
  callbackBase: z28.string()
});
var ssoProviderOutput = z28.object({
  providerId: z28.string(),
  name: z28.string(),
  type: z28.enum(["oidc", "saml"]),
  issuer: z28.string(),
  domains: z28.array(z28.string()),
  clientIdLastFour: z28.string().nullable(),
  callbackURL: z28.string()
});
var ssoProviderListOutput = z28.object({
  rows: z28.array(ssoProviderOutput),
  total: z28.number(),
  facetCounts: z28.record(z28.string(), z28.record(z28.string(), z28.number()))
});
var deleteSsoProviderOutput = z28.object({
  providerId: z28.string()
});

// src/sso/sso.service.ts
import {
  auth as auth4,
  canConfigureSso,
  isGoogleConfigured as isGoogleConfigured2,
  isMicrosoftConfigured as isMicrosoftConfigured2,
  ssoCallbackBase,
  ssoCallbackURL,
  ssoProviderName,
  WORKSPACE_ID as WORKSPACE_ID5,
  workspaceRoleOf as workspaceRoleOf3
} from "@crm/auth";
import {
  BadRequestException as BadRequestException13,
  ForbiddenException as ForbiddenException8,
  HttpException as HttpException4,
  Injectable as Injectable61,
  InternalServerErrorException as InternalServerErrorException2,
  Logger as Logger43
} from "@nestjs/common";
import { APIError as APIError2 } from "better-auth/api";
import { z as z29 } from "zod";
var PROVIDER_SELECT = {
  providerId: true,
  issuer: true,
  domain: true,
  oidcConfig: true,
  samlConfig: true
};
var SORTABLE5 = {
  providerId: (dir) => ({ providerId: dir }),
  domain: (dir) => ({ domain: dir }),
  issuer: (dir) => ({ issuer: dir })
};
var STATUS_BY_CODE2 = new Map([
  ["BAD_REQUEST", 400],
  ["UNAUTHORIZED", 401],
  ["FORBIDDEN", 403],
  ["NOT_FOUND", 404],
  ["CONFLICT", 409],
  ["UNPROCESSABLE_ENTITY", 400]
]);
function splitDomains(value) {
  return value.split(",").map((part) => part.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "")).map((part) => part.toLowerCase()).filter(Boolean);
}
var oidcConfig = z29.object({ clientId: z29.string().catch("") }).catch({ clientId: "" });
function lastFour(clientId) {
  return clientId.length >= 4 ? clientId.slice(-4) : null;
}
function readOidcConfig(value) {
  if (!value)
    return null;
  try {
    return oidcConfig.parse(JSON.parse(value));
  } catch {
    return null;
  }
}
function toProvider(row) {
  const oidc = readOidcConfig(row.oidcConfig);
  return {
    providerId: row.providerId,
    name: ssoProviderName(row.providerId),
    type: row.samlConfig ? "saml" : "oidc",
    issuer: row.issuer,
    domains: splitDomains(row.domain),
    clientIdLastFour: oidc ? lastFour(oidc.clientId) : null,
    callbackURL: ssoCallbackURL(row.providerId)
  };
}

class SsoService {
  db;
  logger = new Logger43(SsoService.name);
  constructor(db2) {
    this.db = db2;
  }
  async signInOptions() {
    const rows = await this.db.ssoProvider.findMany({
      where: { organizationId: WORKSPACE_ID5 },
      select: { providerId: true },
      orderBy: { providerId: "asc" }
    });
    return {
      google: isGoogleConfigured2(),
      microsoft: isMicrosoftConfigured2(),
      providers: rows.map((row) => ({
        providerId: row.providerId,
        name: ssoProviderName(row.providerId)
      }))
    };
  }
  async settings(userId) {
    return {
      canConfigure: canConfigureSso(await workspaceRoleOf3(userId, this.db)),
      callbackBase: ssoCallbackBase()
    };
  }
  async list(input) {
    const where = this.searchWhere(input.q);
    const { skip, take } = paginate(input);
    const [rows, total] = await Promise.all([
      this.db.ssoProvider.findMany({
        where,
        skip,
        take,
        select: PROVIDER_SELECT,
        orderBy: resolveOrderBy(input, SORTABLE5, { providerId: "asc" })
      }),
      this.db.ssoProvider.count({ where })
    ]);
    return { rows: rows.map(toProvider), total, facetCounts: {} };
  }
  async register(userId, headers, input) {
    await this.requireConfigurer(userId);
    const domains = splitDomains(input.domain);
    if (domains.length === 0) {
      throw new BadRequestException13("Give the email domain your people sign in with, for example acme.com.");
    }
    await this.call(() => auth4.api.registerSSOProvider({
      headers,
      body: {
        providerId: input.providerId,
        issuer: input.issuer,
        domain: domains.join(","),
        organizationId: WORKSPACE_ID5,
        oidcConfig: {
          clientId: input.clientId,
          clientSecret: input.clientSecret,
          pkce: true
        }
      }
    }));
    this.logger.log({
      message: "SSO provider registered",
      userId,
      providerId: input.providerId,
      issuer: input.issuer
    });
    const row = await this.db.ssoProvider.findUniqueOrThrow({
      where: { providerId: input.providerId },
      select: PROVIDER_SELECT
    });
    return toProvider(row);
  }
  async remove(userId, headers, input) {
    await this.requireConfigurer(userId);
    await this.call(() => auth4.api.deleteSSOProvider({
      headers,
      body: { providerId: input.providerId }
    }));
    this.logger.log({
      message: "SSO provider removed",
      userId,
      providerId: input.providerId
    });
    return { providerId: input.providerId };
  }
  searchWhere(q) {
    const term = q.trim();
    const where = {
      organizationId: WORKSPACE_ID5
    };
    if (term) {
      where.OR = [
        { providerId: { contains: term, mode: "insensitive" } },
        { domain: { contains: term, mode: "insensitive" } },
        { issuer: { contains: term, mode: "insensitive" } }
      ];
    }
    return where;
  }
  async call(run) {
    try {
      return await run();
    } catch (error) {
      if (error instanceof APIError2) {
        const status = STATUS_BY_CODE2.get(error.body?.code ?? "") ?? error.statusCode;
        throw new HttpException4(error.body?.message ?? "The identity provider could not be saved.", status);
      }
      this.logger.error({ message: "SSO provider call failed" }, error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException2("Could not reach the identity provider.");
    }
  }
  async requireConfigurer(userId) {
    if (!canConfigureSso(await workspaceRoleOf3(userId, this.db))) {
      throw new ForbiddenException8("Only an owner or an admin can change how people sign in.");
    }
  }
}
SsoService = __legacyDecorateClassTS([
  Injectable61(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], SsoService);

// src/sso/sso.router.ts
function headersOf2(ctx) {
  return fromNodeHeaders3(ctx.req?.headers ?? {});
}

class SsoRouter {
  sso;
  constructor(sso) {
    this.sso = sso;
  }
  async signInOptions() {
    return this.sso.signInOptions();
  }
  async settings(ctx) {
    return this.sso.settings(ctx.user.id);
  }
  async list(input) {
    return this.sso.list(input);
  }
  async register(ctx, input) {
    return this.sso.register(ctx.user.id, headersOf2(ctx), input);
  }
  async remove(ctx, input) {
    return this.sso.remove(ctx.user.id, headersOf2(ctx), input);
  }
}
__legacyDecorateClassTS([
  Query19({
    output: ssoSignInOptionsOutput,
    meta: restMeta("GET", "/sso/sign-in-options", ["SSO"], {
      protect: false
    })
  }),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", []),
  __legacyMetadataTS("design:returntype", Promise)
], SsoRouter.prototype, "signInOptions", null);
__legacyDecorateClassTS([
  Query19({
    output: ssoSettingsOutput,
    meta: restMeta("GET", "/sso/settings", ["SSO"])
  }),
  UseMiddlewares18(AuthMiddleware),
  __legacyDecorateParamTS(0, Ctx14()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], SsoRouter.prototype, "settings", null);
__legacyDecorateClassTS([
  Query19({
    input: ssoProviderListInput,
    output: ssoProviderListOutput,
    meta: restMeta("GET", "/sso", ["SSO"])
  }),
  UseMiddlewares18(AuthMiddleware),
  __legacyDecorateParamTS(0, Input18()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], SsoRouter.prototype, "list", null);
__legacyDecorateClassTS([
  Mutation15({
    input: registerSsoProviderInput,
    output: ssoProviderOutput,
    meta: restMeta("POST", "/sso", ["SSO"])
  }),
  UseMiddlewares18(AuthMiddleware),
  __legacyDecorateParamTS(0, Ctx14()),
  __legacyDecorateParamTS(1, Input18()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], SsoRouter.prototype, "register", null);
__legacyDecorateClassTS([
  Mutation15({
    input: deleteSsoProviderInput,
    output: deleteSsoProviderOutput,
    meta: restMeta("DELETE", "/sso/{providerId}", ["SSO"])
  }),
  UseMiddlewares18(AuthMiddleware),
  __legacyDecorateParamTS(0, Ctx14()),
  __legacyDecorateParamTS(1, Input18()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], SsoRouter.prototype, "remove", null);
SsoRouter = __legacyDecorateClassTS([
  Router18({ alias: "sso" }),
  __legacyDecorateParamTS(0, Inject22(SsoService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof SsoService === "undefined" ? Object : SsoService
  ])
], SsoRouter);

// src/sso/sso.module.ts
class SsoModule {
}
SsoModule = __legacyDecorateClassTS([
  Module28({
    imports: [TrpcModule],
    providers: [SsoService, SsoRouter],
    exports: [SsoService]
  })
], SsoModule);

// src/sync/sync.module.ts
import { Module as Module29 } from "@nestjs/common";

// src/sync/mailbox-sync.service.ts
import { syncError } from "@crm/telemetry";
import { Injectable as Injectable62, Logger as Logger44 } from "@nestjs/common";
var TICK_BUDGET_MS = 60000;

class MailboxSyncService {
  state;
  google;
  microsoft;
  googleConnections;
  microsoftConnections;
  logger = new Logger44(MailboxSyncService.name);
  constructor(state, google, microsoft, googleConnections, microsoftConnections) {
    this.state = state;
    this.google = google;
    this.microsoft = microsoft;
    this.googleConnections = googleConnections;
    this.microsoftConnections = microsoftConnections;
  }
  async runDue() {
    const startedAt = Date.now();
    const summary = {
      attempted: 0,
      synced: 0,
      skipped: 0,
      rateLimited: 0,
      failed: 0,
      durationMs: 0
    };
    await this.googleConnections.reconcileAll();
    await this.microsoftConnections.reconcileAll();
    const due = await this.state.due(new Date);
    for (const [index, row] of due.entries()) {
      if (Date.now() - startedAt > TICK_BUDGET_MS) {
        this.logger.log({
          message: "Sync tick budget reached",
          remaining: due.length - index
        });
        break;
      }
      if (!await this.state.claim(row, new Date))
        continue;
      summary.attempted += 1;
      try {
        const outcome = await this.runOne(row.userId, row.source);
        if (outcome === null || outcome.status === "skipped") {
          summary.skipped += 1;
          await this.state.release(row.id);
        } else if (outcome.status === "rate-limited") {
          summary.rateLimited += 1;
        } else if (outcome.status === "failed" || outcome.status === "reconnect") {
          summary.failed += 1;
        } else {
          summary.synced += 1;
        }
      } catch (error) {
        summary.failed += 1;
        await this.state.markFailed(row.id, error instanceof Error ? error.message : String(error));
        this.logger.error({
          message: "Sync threw",
          userId: row.userId,
          source: row.source
        }, error instanceof Error ? error.stack : String(error));
        syncError({ error, source: row.source });
      }
    }
    summary.durationMs = Date.now() - startedAt;
    this.logger.log({
      message: "Mailbox sync tick",
      attempted: summary.attempted,
      synced: summary.synced,
      skipped: summary.skipped,
      rateLimited: summary.rateLimited,
      failed: summary.failed,
      durationMs: summary.durationMs
    });
    return summary;
  }
  async runOne(userId, source) {
    if (isGoogleSyncSource(source))
      return this.google.runOne(userId, source);
    if (isMicrosoftSyncSource(source)) {
      return this.microsoft.runOne(userId, source);
    }
    return null;
  }
}
MailboxSyncService = __legacyDecorateClassTS([
  Injectable62(),
  __legacyMetadataTS("design:paramtypes", [
    typeof SyncStateService === "undefined" ? Object : SyncStateService,
    typeof GoogleSyncService === "undefined" ? Object : GoogleSyncService,
    typeof MicrosoftSyncService === "undefined" ? Object : MicrosoftSyncService,
    typeof GoogleConnectionService === "undefined" ? Object : GoogleConnectionService,
    typeof MicrosoftConnectionService === "undefined" ? Object : MicrosoftConnectionService
  ])
], MailboxSyncService);

// src/sync/sync.controller.ts
import {
  Controller as Controller6,
  ForbiddenException as ForbiddenException9,
  Get as Get6,
  Headers as Headers4,
  Logger as Logger45,
  Post as Post3,
  ServiceUnavailableException as ServiceUnavailableException5
} from "@nestjs/common";
import { ConfigService as ConfigService4 } from "@nestjs/config";
import {
  ApiExcludeEndpoint as ApiExcludeEndpoint3,
  ApiForbiddenResponse as ApiForbiddenResponse3,
  ApiHeader as ApiHeader3,
  ApiOkResponse as ApiOkResponse6,
  ApiOperation as ApiOperation6,
  ApiServiceUnavailableResponse as ApiServiceUnavailableResponse4,
  ApiTags as ApiTags6
} from "@nestjs/swagger";
import { AllowAnonymous as AllowAnonymous4 } from "@thallesp/nestjs-better-auth";
class SyncController {
  sync;
  logger = new Logger45(SyncController.name);
  secret;
  constructor(sync, config) {
    this.sync = sync;
    this.secret = config.get("CRON_SECRET", { infer: true });
  }
  async mailboxesViaGet(authorization) {
    return this.run(authorization);
  }
  async mailboxesViaPost(authorization) {
    return this.run(authorization);
  }
  async googleViaGet(authorization) {
    return this.run(authorization);
  }
  async googleViaPost(authorization) {
    return this.run(authorization);
  }
  async run(authorization) {
    if (!this.secret) {
      this.logger.error({
        message: "CRON_SECRET is not set — refusing to run the sync route."
      });
      throw new ServiceUnavailableException5("Sync is not configured.");
    }
    if (!timingSafeEquals3(authorization ?? "", `Bearer ${this.secret}`)) {
      throw new ForbiddenException9;
    }
    return this.sync.runDue();
  }
}
__legacyDecorateClassTS([
  Get6("mailboxes"),
  AllowAnonymous4(),
  ApiOperation6({ summary: "Run any due Gmail, Outlook or calendar sync" }),
  ApiOkResponse6({ description: "The sync ran; per-mailbox results." }),
  __legacyDecorateParamTS(0, Headers4("authorization")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], SyncController.prototype, "mailboxesViaGet", null);
__legacyDecorateClassTS([
  Post3("mailboxes"),
  AllowAnonymous4(),
  ApiExcludeEndpoint3(),
  __legacyDecorateParamTS(0, Headers4("authorization")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], SyncController.prototype, "mailboxesViaPost", null);
__legacyDecorateClassTS([
  Get6("google"),
  AllowAnonymous4(),
  ApiOperation6({
    summary: "Alias of `mailboxes`, kept for existing cron deployments"
  }),
  ApiOkResponse6({ description: "The sync ran; per-mailbox results." }),
  __legacyDecorateParamTS(0, Headers4("authorization")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], SyncController.prototype, "googleViaGet", null);
__legacyDecorateClassTS([
  Post3("google"),
  AllowAnonymous4(),
  ApiExcludeEndpoint3(),
  __legacyDecorateParamTS(0, Headers4("authorization")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], SyncController.prototype, "googleViaPost", null);
SyncController = __legacyDecorateClassTS([
  ApiTags6("Internal — Cron"),
  ApiHeader3({
    name: "authorization",
    description: "`Bearer <CRON_SECRET>`",
    required: true
  }),
  ApiForbiddenResponse3({ description: "CRON_SECRET did not match." }),
  ApiServiceUnavailableResponse4({ description: "CRON_SECRET is not set." }),
  Controller6("internal/sync"),
  __legacyMetadataTS("design:paramtypes", [
    typeof MailboxSyncService === "undefined" ? Object : MailboxSyncService,
    typeof ConfigService4 === "undefined" ? Object : ConfigService4
  ])
], SyncController);
function timingSafeEquals3(a, b) {
  if (a.length !== b.length)
    return false;
  let mismatch = 0;
  for (let index = 0;index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

// src/sync/sync.module.ts
class SyncModule {
}
SyncModule = __legacyDecorateClassTS([
  Module29({
    imports: [MailboxModule, GoogleModule, MicrosoftModule],
    controllers: [SyncController],
    providers: [MailboxSyncService],
    exports: [MailboxSyncService]
  })
], SyncModule);

// src/telemetry/telemetry.module.ts
import { Module as Module30 } from "@nestjs/common";

// src/telemetry/funnel.service.ts
import { FactStatus as FactStatus3 } from "@crm/db";
import {
  MILESTONES,
  milestone,
  reachedMilestones,
  readInstall
} from "@crm/telemetry";
import { Injectable as Injectable63, Logger as Logger46 } from "@nestjs/common";

// src/telemetry/seed.ts
var SEED_OWNER_PREFIX = "seed-";

// src/telemetry/funnel.service.ts
class FunnelService {
  db;
  logger = new Logger46(FunnelService.name);
  constructor(db2) {
    this.db = db2;
  }
  async sweep() {
    const reached = new Set(await reachedMilestones());
    const outstanding = MILESTONES.filter((step) => !reached.has(step));
    if (outstanding.length === 0)
      return [];
    const sent = [];
    for (const step of outstanding) {
      try {
        const at = await this.when(step);
        if (!at)
          continue;
        if (await milestone(step, at))
          sent.push(step);
      } catch (error) {
        this.logger.debug({
          message: "Could not settle a telemetry milestone",
          step,
          reason: error instanceof Error ? error.message : String(error)
        });
      }
    }
    return sent;
  }
  async when(step) {
    switch (step) {
      case "migrations_applied":
        return (await readInstall())?.createdAt ?? null;
      case "first_sign_in":
        return this.earliest(this.db.session.findFirst({
          orderBy: { createdAt: "asc" },
          select: { createdAt: true }
        }), (row) => row.createdAt);
      case "google_oauth_configured": {
        const configured = process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim();
        if (!configured)
          return null;
        const linked = await this.earliest(this.db.account.findFirst({
          where: { providerId: GOOGLE_PROVIDER_ID2 },
          orderBy: { createdAt: "asc" },
          select: { createdAt: true }
        }), (row) => row.createdAt);
        return linked ?? new Date;
      }
      case "first_mailbox_sync":
        return this.earliest(this.db.mailboxSync.findFirst({
          where: { lastSyncedAt: { not: null } },
          orderBy: { lastSyncedAt: "asc" },
          select: { lastSyncedAt: true }
        }), (row) => row.lastSyncedAt);
      case "first_non_seed_contact":
        return this.earliest(this.db.contact.findFirst({
          where: {
            OR: [
              { ownerId: null },
              { ownerId: { not: { startsWith: SEED_OWNER_PREFIX } } }
            ]
          },
          orderBy: { createdAt: "asc" },
          select: { createdAt: true }
        }), (row) => row.createdAt);
      case "first_agent_task_claimed":
        return this.earliest(this.db.agentTask.findFirst({
          where: { startedAt: { not: null } },
          orderBy: { startedAt: "asc" },
          select: { startedAt: true }
        }), (row) => row.startedAt);
      case "first_agent_task_completed":
        return this.earliest(this.db.agentTask.findFirst({
          where: { finishedAt: { not: null } },
          orderBy: { finishedAt: "asc" },
          select: { finishedAt: true }
        }), (row) => row.finishedAt);
      case "first_fact_applied":
        return this.firstApplied();
    }
  }
  async firstApplied() {
    const everApplied = {
      status: { in: [FactStatus3.APPLIED, FactStatus3.SUPERSEDED] }
    };
    const [decided, undecided] = await Promise.all([
      this.db.contactFact.findFirst({
        where: { ...everApplied, decidedAt: { not: null } },
        orderBy: { decidedAt: "asc" },
        select: { decidedAt: true }
      }),
      this.db.contactFact.findFirst({
        where: { ...everApplied, decidedAt: null },
        orderBy: { observedAt: "asc" },
        select: { observedAt: true }
      })
    ]);
    const applied = [decided?.decidedAt, undecided?.observedAt].filter((at) => at instanceof Date);
    if (applied.length === 0)
      return null;
    return new Date(Math.min(...applied.map((at) => at.getTime())));
  }
  async earliest(query, pick) {
    const row = await query;
    return row ? pick(row) : null;
  }
}
FunnelService = __legacyDecorateClassTS([
  Injectable63(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], FunnelService);

// src/telemetry/rollup.service.ts
import {
  ActivityType as ActivityType9,
  DealStage as DealStage6,
  EnrichmentStatus as EnrichmentStatus5,
  FactBand as FactBand2,
  FactStatus as FactStatus4,
  RecordSource as RecordSource5
} from "@crm/db";
import { RETIRED_OUTCOME } from "@crm/db/agent-tasks";
import { readAgentModel as readAgentModel2 } from "@crm/db/settings";
import { CONTACT_CAP_REASON } from "@crm/db/tracking";
import { WORKSPACE_ID as WORKSPACE_ID6 } from "@crm/db/workspace";
import {
  bucket,
  claimRollup,
  dayBucket,
  drainCounters,
  installDaily,
  permittedEvidenceKind,
  permittedMethod,
  permittedTaskKind,
  permittedTool,
  releaseRollup,
  restoreCounters,
  telemetryDisabled
} from "@crm/telemetry";
import { Injectable as Injectable64, Logger as Logger47 } from "@nestjs/common";
var WINDOW_HOURS = 24;
var HOUR_MS = 60 * 60 * 1000;
var SUPERSEDE_WINDOW_DAYS = 7;
var SANDBOX_TOOLS = new Set([
  "bash",
  "glob",
  "grep",
  "read_file",
  "write_file"
]);

class RollupService {
  db;
  funnel;
  logger = new Logger47(RollupService.name);
  constructor(db2, funnel) {
    this.db = db2;
    this.funnel = funnel;
  }
  async run(force = false) {
    if (telemetryDisabled()) {
      return { sent: false, reason: "telemetry is off", milestones: [] };
    }
    const milestones = await this.funnel.sweep();
    const now = new Date;
    const claim = await claimRollup(now, force);
    if (!claim.claimed) {
      return { sent: false, reason: claim.reason, milestones };
    }
    const since = new Date(now.getTime() - WINDOW_HOURS * HOUR_MS);
    let counters = {};
    try {
      const gathered = await this.gather(since);
      counters = gathered.counters;
      if (!await installDaily(gathered.properties, now)) {
        await this.giveBack(claim.previous, counters);
        return { sent: false, reason: "not delivered", milestones };
      }
      this.logger.log({
        message: "Telemetry rollup sent",
        windowHours: WINDOW_HOURS,
        milestones: milestones.length
      });
      return { sent: true, milestones };
    } catch (error) {
      await this.giveBack(claim.previous, counters);
      this.logger.debug({
        message: "Telemetry rollup could not be built",
        reason: error instanceof Error ? error.message : String(error)
      });
      return { sent: false, reason: "failed", milestones };
    }
  }
  async giveBack(previous, counters) {
    await releaseRollup(previous);
    await restoreCounters(counters);
  }
  async gather(since) {
    const counters = await drainCounters();
    const [shape, agent, ledger, crm] = await Promise.all([
      this.shape(),
      this.agent(since, counters),
      this.ledger(),
      this.crm(since)
    ]);
    return {
      properties: { ...shape, ...agent, ...ledger, ...crm },
      counters
    };
  }
  async shape() {
    const [model, members, ssoProviders, postgres, contextKey] = await Promise.all([
      readAgentModel2(this.db).catch(() => null),
      this.db.member.count({ where: { organizationId: WORKSPACE_ID6 } }),
      this.db.ssoProvider.count(),
      this.postgresMajor(),
      this.db.appSetting.findFirst({ select: { contextDevApiKey: true } })
    ]);
    return {
      node_version: process.versions.node.split(".")[0] ?? null,
      postgres_version: postgres,
      members_bucket: bucket(members),
      cap_perplexity: isSet("PERPLEXITY_API_KEY"),
      cap_context_dev: Boolean(contextKey?.contextDevApiKey?.trim()),
      cap_blob: isSet("BLOB_READ_WRITE_TOKEN"),
      cap_github: isSet("GITHUB_TOKEN"),
      cap_redis: isSet("REDIS_URL"),
      cap_agent_bridge: isSet("AGENT_BRIDGE_SECRET"),
      cap_cron_secret: isSet("CRON_SECRET"),
      cap_ai_gateway: isSet("AI_GATEWAY_API_KEY"),
      cap_google_oauth: isSet("GOOGLE_CLIENT_ID") && isSet("GOOGLE_CLIENT_SECRET"),
      cap_sso_provider: ssoProviders > 0,
      is_marketing: process.env.IS_MARKETING === "true",
      agent_model_id: model?.id ?? null,
      agent_model_context_window: model?.contextWindowTokens ?? null
    };
  }
  async postgresMajor() {
    try {
      const rows = await this.db.$queryRaw`
				SELECT current_setting('server_version_num') AS version;
			`;
      const raw = Number(rows[0]?.version);
      if (!Number.isFinite(raw))
        return null;
      return String(Math.floor(raw / 1e4));
    } catch {
      return null;
    }
  }
  async agent(since, counters) {
    const [tools, sessions, tasks, attempts, rechecks, conversations] = await Promise.all([
      this.toolCalls(since),
      this.sessions(since),
      this.tasks(since),
      this.attempts(since),
      this.rechecks(since),
      this.db.agentConversation.count()
    ]);
    const total = Object.values(tools.calls).reduce((sum, n) => sum + n, 0);
    return {
      tool_calls: tools.calls,
      tool_calls_total: total,
      tool_errors: tools.errors,
      sandbox_used: tools.sandbox,
      sessions_started: sessions.started,
      sessions_completed: sessions.completed,
      sessions_failed: sessions.failed,
      tools_per_session_mean: sessions.withTools ? round(total / sessions.withTools) : 0,
      tasks_claimed: tasks.claimed,
      tasks_completed: tasks.completed,
      tasks_retired: tasks.retired,
      task_attempts_mean: attempts.mean,
      task_attempts_max: attempts.max,
      budget_exhausted: counters.budget_exhausted ?? 0,
      recheck_scheduled: rechecks.total,
      recheck_interval_days: rechecks.buckets,
      agent_conversations: conversations
    };
  }
  async toolCalls(since) {
    const rows = await this.db.$queryRaw`
			SELECT
				"data"->'result'->>'toolName' AS tool,
				COALESCE("data"->>'status', 'completed') <> 'completed' AS failed,
				COUNT(*) AS count
			FROM "agentEvent"
			WHERE "type" = 'action.result' AND "emittedAt" >= ${since}
			GROUP BY 1, 2;
		`;
    const calls = {};
    const errors = {};
    let sandbox = false;
    for (const row of rows) {
      const tool = permittedTool(row.tool);
      const count = Number(row.count);
      calls[tool] = (calls[tool] ?? 0) + count;
      if (row.failed)
        errors[tool] = (errors[tool] ?? 0) + count;
      if (SANDBOX_TOOLS.has(tool))
        sandbox = true;
    }
    return { calls, errors, sandbox };
  }
  async sessions(since) {
    const rows = await this.db.$queryRaw`
			SELECT "type", COUNT(DISTINCT "sessionId") AS sessions
			FROM "agentEvent"
			WHERE "emittedAt" >= ${since}
				AND "type" IN ('session.started', 'session.waiting', 'session.failed', 'action.result')
			GROUP BY 1;
		`;
    const of = (type) => Number(rows.find((row) => row.type === type)?.sessions ?? 0);
    return {
      started: of("session.started"),
      completed: of("session.waiting"),
      failed: of("session.failed"),
      withTools: of("action.result")
    };
  }
  async tasks(since) {
    const [claimed, finished] = await Promise.all([
      this.db.agentTask.groupBy({
        by: ["kind"],
        where: { startedAt: { gte: since } },
        _count: { _all: true }
      }),
      this.db.agentTask.groupBy({
        by: ["kind", "outcome"],
        where: { finishedAt: { gte: since } },
        _count: { _all: true }
      })
    ]);
    const completed = {};
    const retired = {};
    for (const row of finished) {
      const kind = permittedTaskKind(row.kind);
      const into = row.outcome === RETIRED_OUTCOME ? retired : completed;
      into[kind] = (into[kind] ?? 0) + row._count._all;
    }
    return {
      claimed: byKind(claimed.map((row) => ({ key: row.kind, count: row._count._all }))),
      completed,
      retired
    };
  }
  async attempts(since) {
    const rows = await this.db.agentTask.groupBy({
      by: ["kind"],
      where: { finishedAt: { gte: since } },
      _avg: { attempts: true },
      _max: { attempts: true }
    });
    const mean = {};
    const max = {};
    for (const row of rows) {
      const kind = permittedTaskKind(row.kind);
      mean[kind] = round(row._avg.attempts ?? 0);
      max[kind] = row._max.attempts ?? 0;
    }
    return { mean, max };
  }
  async rechecks(since) {
    const rows = await this.db.agentTask.findMany({
      where: { kind: "recheck", createdAt: { gte: since } },
      select: { createdAt: true, dueAt: true }
    });
    const buckets = {};
    for (const row of rows) {
      const days = Math.max(0, (row.dueAt.getTime() - row.createdAt.getTime()) / (24 * HOUR_MS));
      const label2 = dayBucket(days);
      buckets[label2] = (buckets[label2] ?? 0) + 1;
    }
    return { total: rows.length, buckets };
  }
  async ledger() {
    const [byStatus, byBand, methods, kinds, decided, superseded] = await Promise.all([
      this.db.contactFact.groupBy({
        by: ["status"],
        _count: { _all: true }
      }),
      this.db.contactFact.groupBy({ by: ["band"], _count: { _all: true } }),
      this.db.contactFact.groupBy({
        by: ["method"],
        _count: { _all: true }
      }),
      this.evidenceKinds(),
      this.decisionHours(),
      this.supersededWithin(SUPERSEDE_WINDOW_DAYS)
    ]);
    const statuses = countsOf(byStatus.map((row) => ({ key: row.status, count: row._count._all })), Object.values(FactStatus4));
    const dismissed = statuses[FactStatus4.DISMISSED] ?? 0;
    const proposed = statuses[FactStatus4.PROPOSED] ?? 0;
    const judged = dismissed + (statuses[FactStatus4.APPLIED] ?? 0) + proposed;
    return {
      facts_by_status: statuses,
      facts_by_band: countsOf(byBand.map((row) => ({ key: row.band, count: row._count._all })), Object.values(FactBand2)),
      facts_by_method: merge(methods.map((row) => ({
        key: permittedMethod(row.method),
        count: row._count._all
      }))),
      facts_by_evidence_kind: kinds,
      fact_dismissal_rate: judged ? round(dismissed / judged) : 0,
      fact_decision_median_hours: decided,
      facts_superseded_within_7_days: superseded
    };
  }
  async evidenceKinds() {
    const rows = await this.db.$queryRaw`
			SELECT item->>'kind' AS kind, COUNT(*) AS count
			FROM "contactFact", jsonb_array_elements("evidence") AS item
			WHERE jsonb_typeof("evidence") = 'array'
			GROUP BY 1;
		`;
    return merge(rows.map((row) => ({
      key: permittedEvidenceKind(row.kind),
      count: Number(row.count)
    })));
  }
  async decisionHours() {
    const rows = await this.db.$queryRaw`
			SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (
				ORDER BY EXTRACT(EPOCH FROM ("decidedAt" - "observedAt")) / 3600
			) AS median
			FROM "contactFact"
			WHERE "decidedAt" IS NOT NULL;
		`;
    const median = rows[0]?.median;
    return median === null || median === undefined ? null : round(median);
  }
  async supersededWithin(days) {
    const rows = await this.db.$queryRaw`
			SELECT COUNT(*) AS count
			FROM "contactFact"
			WHERE "supersededAt" IS NOT NULL
				AND "supersededAt" - "observedAt" < make_interval(days => ${days});
		`;
    return Number(rows[0]?.count ?? 0);
  }
  async crm(since) {
    const [
      contacts,
      companies,
      deals,
      activities,
      contactSources,
      companySources,
      stages,
      types,
      syncs,
      threads,
      messages,
      enrichment,
      suppressedDomains,
      suppressedContacts,
      workspaceProfile,
      nonSeedContacts
    ] = await Promise.all([
      this.db.contact.count(),
      this.db.company.count(),
      this.db.deal.count(),
      this.db.activity.count(),
      this.db.contact.groupBy({ by: ["source"], _count: { _all: true } }),
      this.db.company.groupBy({ by: ["source"], _count: { _all: true } }),
      this.db.deal.groupBy({ by: ["stage"], _count: { _all: true } }),
      this.db.activity.groupBy({ by: ["type"], _count: { _all: true } }),
      this.db.mailboxSync.groupBy({ by: ["status"], _count: { _all: true } }),
      this.db.emailThread.count({ where: { createdAt: { gte: since } } }),
      this.db.emailMessage.count({ where: { createdAt: { gte: since } } }),
      this.db.company.groupBy({
        by: ["enrichmentStatus"],
        _count: { _all: true }
      }),
      this.db.suppressedDomain.count(),
      this.db.suppressedContact.count(),
      this.db.workspaceProfile.count(),
      this.db.contact.count({
        where: {
          OR: [
            { ownerId: null },
            { ownerId: { not: { startsWith: SEED_OWNER_PREFIX } } }
          ]
        }
      })
    ]);
    const [
      trackingSite,
      trackingDomains,
      trackingViews,
      trackingForms,
      trackingContacts,
      trackingCapped,
      trackingPaused
    ] = await Promise.all([
      this.db.appSetting.count({ where: { trackingSiteId: { not: null } } }),
      this.db.trackedDomain.count(),
      this.db.trackedEvent.count({
        where: { type: "page_view", occurredAt: { gte: since } }
      }),
      this.db.formSubmission.count({ where: { createdAt: { gte: since } } }),
      this.db.contact.count({
        where: { createdAt: { gte: since }, source: RecordSource5.TRACKING }
      }),
      this.db.formSubmission.count({
        where: { createdAt: { gte: since }, skipReason: CONTACT_CAP_REASON }
      }),
      this.db.appSetting.count({ where: { trackingPaused: true } })
    ]);
    const configured = syncs.reduce((sum, row) => sum + row._count._all, 0);
    return {
      seed_only: contacts > 0 && nonSeedContacts === 0,
      contacts_bucket: bucket(contacts),
      companies_bucket: bucket(companies),
      deals_bucket: bucket(deals),
      activities_bucket: bucket(activities),
      contacts_by_source: countsOf(contactSources.map((row) => ({
        key: row.source,
        count: row._count._all
      })), Object.values(RecordSource5)),
      companies_by_source: countsOf(companySources.map((row) => ({
        key: row.source,
        count: row._count._all
      })), Object.values(RecordSource5)),
      deals_by_stage: countsOf(stages.map((row) => ({ key: row.stage, count: row._count._all })), Object.values(DealStage6)),
      activities_by_type: countsOf(types.map((row) => ({ key: row.type, count: row._count._all })), Object.values(ActivityType9)),
      cap_tracking: trackingSite > 0,
      tracking_domains: bucket(trackingDomains),
      tracking_page_views: trackingViews,
      tracking_forms: trackingForms,
      tracking_contacts_created: trackingContacts,
      tracking_capped: trackingCapped,
      tracking_paused: trackingPaused > 0,
      mailbox_sync_configured: configured > 0,
      mailbox_sync_status: merge(syncs.map((row) => ({ key: row.status, count: row._count._all }))),
      threads_ingested: threads,
      messages_ingested: messages,
      enrichment_by_status: countsOf(enrichment.map((row) => ({
        key: row.enrichmentStatus,
        count: row._count._all
      })), Object.values(EnrichmentStatus5)),
      suppressed_domains: suppressedDomains,
      suppressed_contacts: suppressedContacts,
      workspace_profile_written: workspaceProfile > 0
    };
  }
}
RollupService = __legacyDecorateClassTS([
  Injectable64(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof FunnelService === "undefined" ? Object : FunnelService
  ])
], RollupService);
function isSet(name) {
  return Boolean(process.env[name]?.trim());
}
function byKind(rows) {
  return merge(rows.map((row) => ({ ...row, key: permittedTaskKind(row.key) })));
}
function merge(rows) {
  const counts = {};
  for (const row of rows) {
    counts[row.key] = (counts[row.key] ?? 0) + row.count;
  }
  return counts;
}
function countsOf(rows, keys) {
  const merged = merge(rows);
  const complete = {};
  for (const key of keys)
    complete[key] = merged[key] ?? 0;
  return complete;
}
function round(value) {
  return Math.round(value * 100) / 100;
}

// src/telemetry/telemetry.controller.ts
import {
  Controller as Controller7,
  ForbiddenException as ForbiddenException10,
  Get as Get7,
  Headers as Headers5,
  Logger as Logger48,
  Post as Post4,
  ServiceUnavailableException as ServiceUnavailableException6
} from "@nestjs/common";
import { ConfigService as ConfigService5 } from "@nestjs/config";
import {
  ApiExcludeEndpoint as ApiExcludeEndpoint4,
  ApiForbiddenResponse as ApiForbiddenResponse4,
  ApiHeader as ApiHeader4,
  ApiOkResponse as ApiOkResponse7,
  ApiOperation as ApiOperation7,
  ApiServiceUnavailableResponse as ApiServiceUnavailableResponse5,
  ApiTags as ApiTags7
} from "@nestjs/swagger";
import { AllowAnonymous as AllowAnonymous5 } from "@thallesp/nestjs-better-auth";
class TelemetryController {
  rollup;
  logger = new Logger48(TelemetryController.name);
  secret;
  constructor(rollup, config) {
    this.rollup = rollup;
    this.secret = config.get("CRON_SECRET", { infer: true });
  }
  async rollupViaGet(authorization) {
    return this.run(authorization);
  }
  async rollupViaPost(authorization) {
    return this.run(authorization);
  }
  async run(authorization) {
    if (!this.secret) {
      this.logger.error({
        message: "CRON_SECRET is not set — refusing to run the rollup route."
      });
      throw new ServiceUnavailableException6("Telemetry is not configured.");
    }
    if (!timingSafeEquals4(authorization ?? "", `Bearer ${this.secret}`)) {
      throw new ForbiddenException10;
    }
    return this.rollup.run();
  }
}
__legacyDecorateClassTS([
  Get7("rollup"),
  AllowAnonymous5(),
  ApiOperation7({ summary: "Roll up raw telemetry events into daily counts" }),
  ApiOkResponse7({ description: "The rollup ran." }),
  __legacyDecorateParamTS(0, Headers5("authorization")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], TelemetryController.prototype, "rollupViaGet", null);
__legacyDecorateClassTS([
  Post4("rollup"),
  AllowAnonymous5(),
  ApiExcludeEndpoint4(),
  __legacyDecorateParamTS(0, Headers5("authorization")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], TelemetryController.prototype, "rollupViaPost", null);
TelemetryController = __legacyDecorateClassTS([
  ApiTags7("Internal — Cron"),
  ApiHeader4({
    name: "authorization",
    description: "`Bearer <CRON_SECRET>`",
    required: true
  }),
  ApiForbiddenResponse4({ description: "CRON_SECRET did not match." }),
  ApiServiceUnavailableResponse5({ description: "CRON_SECRET is not set." }),
  Controller7("internal/telemetry"),
  __legacyMetadataTS("design:paramtypes", [
    typeof RollupService === "undefined" ? Object : RollupService,
    typeof ConfigService5 === "undefined" ? Object : ConfigService5
  ])
], TelemetryController);
function timingSafeEquals4(a, b) {
  if (a.length !== b.length)
    return false;
  let mismatch = 0;
  for (let index = 0;index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

// src/telemetry/telemetry.service.ts
import {
  flushTelemetry,
  onTelemetryProblem,
  shutdownTelemetry,
  syncVersion,
  telemetryDisabled as telemetryDisabled2
} from "@crm/telemetry";
import {
  Injectable as Injectable65,
  Logger as Logger49
} from "@nestjs/common";
var ROLLUP_INTERVAL_MS = 60 * 60 * 1000;

class TelemetryService {
  rollup;
  logger = new Logger49(TelemetryService.name);
  timer = null;
  constructor(rollup) {
    this.rollup = rollup;
  }
  async onModuleInit() {
    onTelemetryProblem((message) => this.logger.debug({ message }));
    if (telemetryDisabled2()) {
      this.logger.log({
        message: "Anonymous usage telemetry is off for this install."
      });
      return;
    }
    const install = await syncVersion();
    this.logger.log({
      message: "Anonymous usage telemetry is on. See docs/telemetry.md.",
      crmVersion: install?.version
    });
    this.rollup.run().catch(() => {});
    this.timer = setInterval(() => {
      this.rollup.run().catch(() => {});
    }, ROLLUP_INTERVAL_MS);
    this.timer.unref?.();
  }
  async onApplicationShutdown() {
    if (this.timer)
      clearInterval(this.timer);
    this.timer = null;
    await flushTelemetry();
    await shutdownTelemetry();
  }
}
TelemetryService = __legacyDecorateClassTS([
  Injectable65(),
  __legacyMetadataTS("design:paramtypes", [
    typeof RollupService === "undefined" ? Object : RollupService
  ])
], TelemetryService);

// src/telemetry/telemetry.module.ts
class TelemetryModule {
}
TelemetryModule = __legacyDecorateClassTS([
  Module30({
    controllers: [TelemetryController],
    providers: [FunnelService, RollupService, TelemetryService],
    exports: [TelemetryService]
  })
], TelemetryModule);

// src/tracking/tracking.module.ts
import { Module as Module31 } from "@nestjs/common";

// src/tracking/tracking.controller.ts
import {
  EVENT_RETENTION_DAYS,
  isSiteId,
  MAX_BODY_BYTES
} from "@crm/db/tracking";
import {
  Controller as Controller8,
  ForbiddenException as ForbiddenException11,
  Get as Get8,
  Headers as Headers6,
  HttpCode,
  Logger as Logger54,
  Param as Param2,
  Post as Post5,
  Req,
  Res as Res2,
  ServiceUnavailableException as ServiceUnavailableException7
} from "@nestjs/common";
import { ConfigService as ConfigService6 } from "@nestjs/config";
import {
  ApiExcludeEndpoint as ApiExcludeEndpoint5,
  ApiForbiddenResponse as ApiForbiddenResponse5,
  ApiHeader as ApiHeader5,
  ApiNoContentResponse,
  ApiOkResponse as ApiOkResponse8,
  ApiOperation as ApiOperation8,
  ApiParam as ApiParam2,
  ApiServiceUnavailableResponse as ApiServiceUnavailableResponse6,
  ApiTags as ApiTags8
} from "@nestjs/swagger";
import { AllowAnonymous as AllowAnonymous6 } from "@thallesp/nestjs-better-auth";
import { z as z31 } from "zod";

// src/tracking/tracking-config.service.ts
import { SETTINGS_ID } from "@crm/db/settings";
import {
  configHash,
  mintSiteId,
  readTrackingConfig
} from "@crm/db/tracking";
import { CACHE_MANAGER as CACHE_MANAGER4 } from "@nestjs/cache-manager";
import { Inject as Inject23, Injectable as Injectable66, Logger as Logger50 } from "@nestjs/common";
var CONFIG_TTL_MS = 5 * 60000;
var CONFIG_KEY = "tracking:config";

class TrackingConfigService {
  db;
  cache;
  logger = new Logger50(TrackingConfigService.name);
  generation = 0;
  constructor(db2, cache) {
    this.db = db2;
    this.cache = cache;
  }
  async compiled() {
    const cached = await this.cache.get(CONFIG_KEY);
    if (cached)
      return cached;
    const read = this.generation;
    const config = await readTrackingConfig(this.db);
    if (!config)
      return null;
    const compiled = { config, hash: configHash(config) };
    if (read === this.generation && await this.current(compiled.hash)) {
      await this.cache.set(CONFIG_KEY, compiled, CONFIG_TTL_MS);
    }
    return compiled;
  }
  async current(hash) {
    const row = await this.db.appSetting.findUnique({
      where: { id: SETTINGS_ID },
      select: { trackingConfigHash: true }
    });
    return row?.trackingConfigHash === hash;
  }
  async forSite(siteId) {
    const compiled = await this.compiled();
    return compiled?.config.siteId === siteId ? compiled : null;
  }
  async invalidate() {
    this.generation += 1;
    const written = this.generation;
    await this.cache.del(CONFIG_KEY);
    const config = await readTrackingConfig(this.db);
    if (!config) {
      await this.db.appSetting.updateMany({
        where: { id: SETTINGS_ID },
        data: { trackingConfigHash: null }
      });
      return;
    }
    const hash = configHash(config);
    await this.db.appSetting.update({
      where: { id: SETTINGS_ID },
      data: { trackingConfigHash: hash }
    });
    if (written !== this.generation)
      return;
    if (!await this.current(hash))
      return;
    await this.cache.set(CONFIG_KEY, { config, hash }, CONFIG_TTL_MS);
  }
  async ensureSiteId() {
    const existing = await this.db.appSetting.findUnique({
      where: { id: SETTINGS_ID },
      select: { trackingSiteId: true }
    });
    if (existing?.trackingSiteId)
      return existing.trackingSiteId;
    const trackingSiteId = mintSiteId();
    await this.db.appSetting.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, trackingSiteId },
      update: { trackingSiteId }
    });
    await this.invalidate();
    this.logger.log({ message: "Tracking site id minted" });
    return trackingSiteId;
  }
  async rotateSiteId() {
    const trackingSiteId = mintSiteId();
    await this.db.appSetting.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, trackingSiteId },
      update: { trackingSiteId }
    });
    await this.invalidate();
    this.logger.warn({ message: "Tracking site id rotated" });
    return trackingSiteId;
  }
}
TrackingConfigService = __legacyDecorateClassTS([
  Injectable66(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyDecorateParamTS(1, Inject23(CACHE_MANAGER4)),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof Cache === "undefined" ? Object : Cache
  ])
], TrackingConfigService);

// src/tracking/tracking-counter.service.ts
import { windowExpiry } from "@crm/db/tracking";
import { Injectable as Injectable67, Logger as Logger51 } from "@nestjs/common";
class TrackingCounterService {
  db;
  logger = new Logger51(TrackingCounterService.name);
  constructor(db2) {
    this.db = db2;
  }
  async take(key, limit, amount = 1) {
    if (amount <= 0)
      return true;
    if (amount > limit)
      return false;
    try {
      const charged = await this.db.$queryRaw`
				INSERT INTO "trackingCounter" ("key", "value", "expiresAt")
				VALUES (${key}, ${amount}, ${windowExpiry(key)})
				ON CONFLICT ("key") DO UPDATE
					SET "value" = "trackingCounter"."value" + ${amount}
					WHERE "trackingCounter"."value" + ${amount} <= ${limit}
				RETURNING "value";
			`;
      return charged.length > 0;
    } catch (error) {
      this.logger.error({ message: "Tracking counter could not be read — refusing the write" }, error instanceof Error ? error.stack : String(error));
      return false;
    }
  }
  async release(key, amount = 1) {
    try {
      await this.db.$executeRaw`
				UPDATE "trackingCounter"
				SET "value" = GREATEST("value" - ${amount}, 0)
				WHERE "key" = ${key};
			`;
    } catch (error) {
      this.logger.error({ message: "Tracking counter could not be released" }, error instanceof Error ? error.stack : String(error));
    }
  }
  async sweep() {
    const removed = await this.db.trackingCounter.deleteMany({
      where: { expiresAt: { lt: new Date } }
    });
    return removed.count;
  }
}
TrackingCounterService = __legacyDecorateClassTS([
  Injectable67(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], TrackingCounterService);

// src/tracking/tracking-ingest.service.ts
import { classifyTouch } from "@crm/db/attribution";
import {
  dedupeKey,
  EVENTS_PER_MINUTE,
  hostAllowed,
  MAX_EVENTS_PER_BATCH,
  matchedHost,
  normalizePath,
  originAllowed,
  rateWindowKey,
  stripQuery
} from "@crm/db/tracking";
import { Injectable as Injectable69, Logger as Logger53 } from "@nestjs/common";
import { z as z30 } from "zod";

// src/tracking/tracking-filing.service.ts
import { workspaceDomains as workspaceDomains2 } from "@crm/auth";
import { ActivityType as ActivityType10, Prisma as Prisma5, RecordSource as RecordSource6 } from "@crm/db";
import {
  CONTACT_CAP_REASON as CONTACT_CAP_REASON2,
  CONTACTS_PER_HOUR,
  contactWindowKey
} from "@crm/db/tracking";
import { Injectable as Injectable68, Logger as Logger52 } from "@nestjs/common";
function columns(touch, prefix) {
  if (!touch)
    return {};
  return {
    [`${prefix}Source`]: touch.source,
    [`${prefix}Medium`]: touch.medium,
    [`${prefix}Campaign`]: touch.campaign,
    [`${prefix}Term`]: touch.term,
    [`${prefix}Content`]: touch.content,
    [`${prefix}Referrer`]: touch.referrer,
    [`${prefix}Landing`]: touch.landing,
    [`${prefix}TouchAt`]: touch.at
  };
}

class TrackingFilingService {
  db;
  counters;
  companies;
  agent;
  stamp;
  logger = new Logger52(TrackingFilingService.name);
  constructor(db2, counters, companies, agent, stamp) {
    this.db = db2;
    this.counters = counters;
    this.companies = companies;
    this.agent = agent;
    this.stamp = stamp;
  }
  async file(submission) {
    const email = normalizeEmail(submission.email ?? "");
    if (!email)
      return this.skip(submission.id, "No email address");
    if (isMachineAddress(email) || isAutomatedAddress(email)) {
      return this.skip(submission.id, "Not an address a human reads");
    }
    const domain = email.split("@")[1] ?? null;
    if (!domain)
      return this.skip(submission.id, "No usable domain");
    if (isMachineDomain(domain)) {
      return this.skip(submission.id, "Not a domain a human reads");
    }
    if (workspaceDomains2().includes(domain)) {
      return this.skip(submission.id, "One of our own addresses");
    }
    const suppressed = await this.suppressed(email, domain);
    if (suppressed)
      return this.skip(submission.id, suppressed);
    const existing = await this.db.contact.findFirst({
      where: { email, archivedAt: null },
      select: { id: true }
    });
    if (existing) {
      await this.attach(submission.id, existing.id, submission);
      return { filed: true, contactId: existing.id };
    }
    const window = contactWindowKey();
    if (!await this.counters.take(window, CONTACTS_PER_HOUR)) {
      return this.skip(submission.id, CONTACT_CAP_REASON2);
    }
    const companyId = await this.companies.companyForEmail(email);
    const { firstName, lastName } = splitName(submission.name, email);
    let contact;
    try {
      contact = await this.db.contact.create({
        data: {
          firstName,
          lastName,
          email,
          companyId,
          source: RecordSource6.TRACKING,
          lastActivityAt: new Date
        },
        select: { id: true }
      });
    } catch (error) {
      await this.counters.release(window);
      const raced = await this.raced(error, email);
      if (!raced)
        throw error;
      await this.attach(submission.id, raced.id, submission);
      return { filed: true, contactId: raced.id };
    }
    await this.attach(submission.id, contact.id, submission);
    await this.agent.contactCreated(contact.id, `Submitted a form on ${submission.host}`);
    this.logger.log({
      message: "Contact filed from a form submission",
      contactId: contact.id,
      host: submission.host
    });
    return { filed: true, contactId: contact.id };
  }
  async raced(cause, email) {
    if (!(cause instanceof Prisma5.PrismaClientKnownRequestError) || cause.code !== "P2002") {
      return null;
    }
    return this.db.contact.findFirst({
      where: { email, archivedAt: null },
      select: { id: true }
    });
  }
  async attach(submissionId, contactId, context) {
    const { visitorId } = context;
    const claimed = await this.db.formSubmission.updateMany({
      where: { id: submissionId, filedAt: null },
      data: { contactId, filedAt: new Date, skipReason: null }
    });
    if (claimed.count === 0)
      return;
    const submission = await this.db.formSubmission.findUniqueOrThrow({
      where: { id: submissionId },
      select: { host: true, path: true }
    });
    const author = await this.author(contactId);
    if (author) {
      const activity = await this.db.activity.create({
        data: {
          type: ActivityType10.NOTE,
          subject: `Submitted a form on ${submission.host}`,
          body: `${submission.host}${submission.path}`,
          contactId,
          occurredAt: new Date,
          createdById: author,
          meta: { automated: true, source: "tracking" }
        },
        select: { createdAt: true }
      });
      await this.stamp.touch({ contactId }, activity.createdAt);
    }
    if (!visitorId)
      return;
    const first = columns(context.firstTouch, "first");
    const last = columns(context.lastTouch, "last");
    await this.db.trackedVisitor.upsert({
      where: { id: visitorId },
      create: { id: visitorId, contactId, ...first, ...last },
      update: { contactId, ...last }
    });
  }
  async author(contactId) {
    const contact = await this.db.contact.findUnique({
      where: { id: contactId },
      select: { ownerId: true }
    });
    if (contact?.ownerId)
      return contact.ownerId;
    const anyUser = await this.db.user.findFirst({ select: { id: true } });
    return anyUser?.id ?? null;
  }
  async skip(submissionId, reason) {
    await this.db.formSubmission.update({
      where: { id: submissionId },
      data: { skipReason: reason }
    });
    return { filed: false, reason };
  }
  async suppressed(email, domain) {
    const [contact, host] = await Promise.all([
      this.db.suppressedContact.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { email: true }
      }),
      this.db.suppressedDomain.findUnique({
        where: { domain },
        select: { domain: true }
      })
    ]);
    if (contact)
      return "This address was deleted by a rep";
    if (host)
      return "This domain is suppressed";
    return null;
  }
}
TrackingFilingService = __legacyDecorateClassTS([
  Injectable68(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof TrackingCounterService === "undefined" ? Object : TrackingCounterService,
    typeof CompanyDirectoryService === "undefined" ? Object : CompanyDirectoryService,
    typeof AgentTriggerService === "undefined" ? Object : AgentTriggerService,
    typeof ActivityStampService === "undefined" ? Object : ActivityStampService
  ])
], TrackingFilingService);

// src/tracking/tracking-ingest.service.ts
var MAX_LABEL = 80;
var MAX_PATH = 512;
var MAX_HOST = 253;
var KEPT = new Set(["page_view", "click", "form_submit"]);
var BOT = /bot|crawler|spider|crawling|headlesschrome|lighthouse|preview/i;
var SENSITIVE = /pass|secret|token|card|cvv|cvc|ssn|iban|routing/i;
var CARD = /^[0-9 -]{12,25}$/;
var ADDRESS = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;
var fieldText = z30.string().nullable().catch(null);

class TrackingIngestService {
  db;
  config;
  counters;
  filing;
  logger = new Logger53(TrackingIngestService.name);
  constructor(db2, config, counters, filing) {
    this.db = db2;
    this.config = config;
    this.counters = counters;
    this.filing = filing;
  }
  async accept(batch, request) {
    if (request.userAgent && BOT.test(request.userAgent))
      return;
    const compiled = await this.config.forSite(batch.siteId);
    if (!compiled)
      return;
    if (!originAllowed(request.origin, compiled.config))
      return;
    const visitorId = sanitizeId(batch.visitorId);
    if (!visitorId)
      return;
    const events = batch.events.slice(0, MAX_EVENTS_PER_BATCH);
    if (scripted(events))
      return;
    const accepted = events.flatMap((event) => {
      if (!KEPT.has(event.type))
        return [];
      const host = event.host?.toLowerCase().trim().slice(0, MAX_HOST);
      return host && hostAllowed(host, compiled.config) ? [{ event, host }] : [];
    });
    if (accepted.length === 0)
      return;
    if (!await this.withinRate(accepted.length))
      return;
    const pageViews = accepted.filter(({ event }) => event.type === "page_view" || event.type === "click");
    const forms = accepted.filter(({ event }) => event.type === "form_submit");
    if (pageViews.length > 0) {
      await this.events(visitorId, pageViews, compiled.config);
    }
    for (const form of forms) {
      await this.submission(visitorId, form);
    }
  }
  async events(visitorId, accepted, config) {
    const rows = accepted.map(({ event, host }) => {
      const touch = event.type === "page_view" && event.touch ? classifyTouch(arriving(event.touch)) : null;
      const referrer = stripQuery(event.referrer);
      return {
        visitorId,
        type: event.type,
        host,
        path: trim(normalizePath(event.path), MAX_PATH),
        referrer: referrer ? trim(referrer, MAX_PATH) : null,
        label: event.label ? trim(event.label, MAX_LABEL) : null,
        source: touch?.source ?? null,
        medium: touch?.medium ?? null,
        campaign: touch?.campaign ?? null,
        occurredAt: occurredAt(event.at)
      };
    });
    await this.db.trackedEvent.createMany({ data: rows });
    await this.countViews(rows, config);
  }
  async countViews(rows, config) {
    const tallies = new Map;
    for (const row of rows) {
      const entry = matchedHost(row.host, config);
      if (!entry)
        continue;
      const views = tallies.get(entry.host) ?? 0;
      tallies.set(entry.host, views + (row.type === "page_view" ? 1 : 0));
    }
    const lastSeenAt = new Date;
    await Promise.all([...tallies].map(([host, views]) => this.db.trackedDomain.updateMany({
      where: { host },
      data: { pageViews: { increment: views }, lastSeenAt }
    })));
  }
  async submission(visitorId, { event, host }) {
    const fields = clean(event.fields ?? {});
    const email = emailFrom(fields);
    const path = trim(normalizePath(event.path), MAX_PATH);
    const at = occurredAt(event.at);
    const lastTouch = classifyTouch(arriving(event.touch ?? {}), at);
    const firstTouch = event.firstTouch ? classifyTouch(arriving(event.firstTouch), at) : lastTouch;
    const key = dedupeKey({ host, path, email, at });
    const created = await this.db.formSubmission.createMany({
      data: [
        {
          visitorId,
          host,
          path,
          email,
          fields,
          firstTouch: stored(firstTouch),
          lastTouch: stored(lastTouch),
          dedupeKey: key
        }
      ],
      skipDuplicates: true
    });
    const submission = await this.db.formSubmission.findUnique({
      where: { dedupeKey: key },
      select: { id: true, filedAt: true, skipReason: true }
    });
    if (!submission)
      return;
    if (created.count === 0 && !unfiled(submission))
      return;
    const outcome = await this.filing.file({
      id: submission.id,
      email,
      host,
      visitorId,
      name: nameFrom(fields),
      firstTouch,
      lastTouch
    });
    if (!outcome.filed) {
      this.logger.log({
        message: "Form submission stored but not filed",
        host,
        reason: outcome.reason
      });
    }
  }
  async withinRate(events) {
    return this.counters.take(rateWindowKey(), EVENTS_PER_MINUTE, events);
  }
}
TrackingIngestService = __legacyDecorateClassTS([
  Injectable69(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof TrackingConfigService === "undefined" ? Object : TrackingConfigService,
    typeof TrackingCounterService === "undefined" ? Object : TrackingCounterService,
    typeof TrackingFilingService === "undefined" ? Object : TrackingFilingService
  ])
], TrackingIngestService);
function unfiled(submission) {
  return submission.filedAt === null && submission.skipReason === null;
}
function arriving(touch) {
  return {
    ...touch,
    referrer: stripQuery(touch.referrer) ?? undefined,
    landing: stripQuery(touch.landing) ?? undefined
  };
}
function stored(touch) {
  return {
    source: touch.source,
    medium: touch.medium,
    campaign: touch.campaign,
    term: touch.term,
    content: touch.content,
    referrer: touch.referrer,
    landing: touch.landing,
    at: touch.at.toISOString()
  };
}
function scripted(events) {
  if (events.length < 3)
    return false;
  const stamps = events.flatMap((event) => event.at !== undefined && Number.isFinite(event.at) ? [event.at] : []);
  if (stamps.length !== events.length)
    return false;
  return new Set(stamps).size === 1;
}
function occurredAt(at) {
  const now = Date.now();
  if (at === undefined || !Number.isFinite(at))
    return new Date(now);
  const bounded = Math.min(Math.max(at, now - 86400000), now);
  return new Date(bounded);
}
function trim(value, max) {
  return value.length > max ? value.slice(0, max) : value;
}
function sanitizeId(value) {
  const trimmed = fieldText.parse(value)?.trim() ?? "";
  return /^[a-zA-Z0-9_-]{8,64}$/.test(trimmed) ? trimmed : null;
}
function clean(fields) {
  const kept = {};
  for (const [key, value] of Object.entries(fields).slice(0, 40)) {
    const text = fieldText.parse(value);
    if (text === null)
      continue;
    if (SENSITIVE.test(key))
      continue;
    if (CARD.test(text.trim()))
      continue;
    kept[trim(key, 64)] = trim(text, 512);
  }
  return kept;
}
function emailFrom(fields) {
  for (const [key, value] of Object.entries(fields)) {
    if (!/mail/i.test(key))
      continue;
    const email = address(value);
    if (email)
      return email;
  }
  for (const value of Object.values(fields)) {
    const email = address(value);
    if (email)
      return email;
  }
  return null;
}
function address(value) {
  const email = normalizeEmail(value);
  return email && ADDRESS.test(email) ? email : null;
}
function nameFrom(fields) {
  const first = pick(fields, /^(first[\s_-]?name|fname|given)/i);
  const last = pick(fields, /^(last[\s_-]?name|lname|surname|family)/i);
  if (first)
    return last ? `${first} ${last}` : first;
  return pick(fields, /^(full[\s_-]?name|name)$/i) ?? pick(fields, /name/i);
}
function pick(fields, pattern) {
  for (const [key, value] of Object.entries(fields)) {
    if (pattern.test(key) && value.trim())
      return value.trim();
  }
  return null;
}

// src/tracking/tracking-rollup.service.ts
import { Injectable as Injectable70 } from "@nestjs/common";
class TrackingRollupService {
  db;
  constructor(db2) {
    this.db = db2;
  }
  async run(before) {
    const rolled = await this.db.$executeRaw`
			INSERT INTO "trackedPageDaily" ("day", "host", "path", "views", "visitors")
			SELECT
				date_trunc('day', "occurredAt") AS "day",
				"host",
				"path",
				count(*)::int AS "views",
				count(DISTINCT "visitorId")::int AS "visitors"
			FROM "trackedEvent"
			WHERE "occurredAt" < ${before} AND "type" = 'page_view'
			GROUP BY 1, 2, 3
			ON CONFLICT ("day", "host", "path") DO UPDATE
			SET "views" = GREATEST("trackedPageDaily"."views", EXCLUDED."views"),
				"visitors" = GREATEST("trackedPageDaily"."visitors", EXCLUDED."visitors");
		`;
    return rolled;
  }
}
TrackingRollupService = __legacyDecorateClassTS([
  Injectable70(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], TrackingRollupService);

// src/tracking/tracking.controller.ts
var SWEEP_BATCH = 1e4;
var MAX_SWEEP_PASSES = 50;
var parsedBody = z31.union([
  z31.string().transform((text) => ({ text, json: null })),
  z31.union([z31.array(z31.json()), z31.looseObject({})]).transform((json) => ({ text: null, json }))
]).nullable().catch(null);
var trackingRequest = z31.object({ body: parsedBody }).catch({ body: null });

class TrackingController {
  config;
  ingest;
  logger = new Logger54(TrackingController.name);
  constructor(config, ingest) {
    this.config = config;
    this.ingest = ingest;
  }
  async publicConfig(siteId) {
    if (!isSiteId(siteId))
      return { config: null };
    const compiled = await this.config.forSite(siteId);
    return compiled ? { config: compiled.config, hash: compiled.hash } : { config: null };
  }
  async collect(request, response, origin, userAgent) {
    response.setHeader("cross-origin-resource-policy", "cross-origin");
    const raw = await read(request, MAX_BODY_BYTES);
    if (!raw)
      return;
    let batch;
    try {
      batch = JSON.parse(raw);
    } catch {
      return;
    }
    if (!isSiteId(batch?.siteId) || !Array.isArray(batch?.events))
      return;
    try {
      await this.ingest.accept(batch, {
        origin: origin ?? null,
        userAgent: userAgent ?? null
      });
    } catch (error) {
      this.logger.error({ message: "Tracking event was not stored" }, error instanceof Error ? error.stack : String(error));
    }
  }
}
__legacyDecorateClassTS([
  Get8("config/:siteId"),
  AllowAnonymous6(),
  ApiOperation8({
    summary: "Fetch a site's compiled tracking config, for the tracking script"
  }),
  ApiParam2({ name: "siteId", description: "Public site identifier." }),
  ApiOkResponse8({
    description: "The compiled config, or null if the site is unknown."
  }),
  __legacyDecorateParamTS(0, Param2("siteId")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], TrackingController.prototype, "publicConfig", null);
__legacyDecorateClassTS([
  Post5("e"),
  AllowAnonymous6(),
  HttpCode(204),
  ApiOperation8({
    summary: "Ingest a batch of events from the tracking script"
  }),
  ApiNoContentResponse({
    description: "Always returned, even when the batch was rejected or unreadable."
  }),
  __legacyDecorateParamTS(0, Req()),
  __legacyDecorateParamTS(1, Res2({ passthrough: true })),
  __legacyDecorateParamTS(2, Headers6("origin")),
  __legacyDecorateParamTS(3, Headers6("user-agent")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof IncomingMessage === "undefined" ? Object : IncomingMessage,
    typeof Response === "undefined" ? Object : Response,
    String,
    String
  ]),
  __legacyMetadataTS("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], TrackingController.prototype, "collect", null);
TrackingController = __legacyDecorateClassTS([
  ApiTags8("Tracking"),
  Controller8("api/t"),
  __legacyMetadataTS("design:paramtypes", [
    typeof TrackingConfigService === "undefined" ? Object : TrackingConfigService,
    typeof TrackingIngestService === "undefined" ? Object : TrackingIngestService
  ])
], TrackingController);

class TrackingRetentionController {
  db;
  rollups;
  counters;
  logger = new Logger54(TrackingRetentionController.name);
  secret;
  constructor(db2, rollups, counters, config) {
    this.db = db2;
    this.rollups = rollups;
    this.counters = counters;
    this.secret = config.get("CRON_SECRET", { infer: true });
  }
  async viaGet(authorization) {
    return this.run(authorization);
  }
  async viaPost(authorization) {
    return this.run(authorization);
  }
  async run(authorization) {
    if (!this.secret) {
      this.logger.error({
        message: "CRON_SECRET is not set — refusing to run tracking retention."
      });
      throw new ServiceUnavailableException7("Retention is not configured.");
    }
    if (!timingSafeEquals5(authorization ?? "", `Bearer ${this.secret}`)) {
      throw new ForbiddenException11;
    }
    const before = startOfDay(new Date(Date.now() - EVENT_RETENTION_DAYS * 24 * 60 * 60000));
    const rolled = await this.rollups.run(before);
    const { removed, complete } = await this.sweepEvents(before);
    const visitors = await this.sweepVisitors(before);
    const counters = await this.counters.sweep();
    if (!complete) {
      this.logger.warn({
        message: "Tracking retention hit its pass limit — events older than the window remain",
        removed,
        retentionDays: EVENT_RETENTION_DAYS
      });
    }
    this.logger.log({
      message: "Tracking retention swept",
      rolled,
      removed,
      complete,
      visitors,
      counters,
      retentionDays: EVENT_RETENTION_DAYS
    });
    return { rolled, removed, complete, visitors, counters };
  }
  async sweepEvents(before) {
    let removed = 0;
    for (let pass = 0;pass < MAX_SWEEP_PASSES; pass += 1) {
      const deleted = await this.db.$executeRaw`
				DELETE FROM "trackedEvent"
				WHERE "id" IN (
					SELECT "id" FROM "trackedEvent"
					WHERE "occurredAt" < ${before}
					LIMIT ${SWEEP_BATCH}
				);
			`;
      removed += deleted;
      if (deleted < SWEEP_BATCH)
        return { removed, complete: true };
    }
    return { removed, complete: false };
  }
  async sweepVisitors(before) {
    const orphaned = await this.db.$executeRaw`
			DELETE FROM "trackedVisitor"
			WHERE "contactId" IS NULL
				AND "lastSeen" < ${before}
				AND NOT EXISTS (
					SELECT 1 FROM "trackedEvent"
					WHERE "trackedEvent"."visitorId" = "trackedVisitor"."id"
				);
		`;
    return orphaned;
  }
}
__legacyDecorateClassTS([
  Get8("retention"),
  AllowAnonymous6(),
  ApiOperation8({
    summary: "Roll up and sweep tracking data older than the retention window"
  }),
  ApiOkResponse8({ description: "The sweep ran; removed and rolled counts." }),
  __legacyDecorateParamTS(0, Headers6("authorization")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], TrackingRetentionController.prototype, "viaGet", null);
__legacyDecorateClassTS([
  Post5("retention"),
  AllowAnonymous6(),
  ApiExcludeEndpoint5(),
  __legacyDecorateParamTS(0, Headers6("authorization")),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    String
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], TrackingRetentionController.prototype, "viaPost", null);
TrackingRetentionController = __legacyDecorateClassTS([
  ApiTags8("Internal — Cron"),
  ApiHeader5({
    name: "authorization",
    description: "`Bearer <CRON_SECRET>`",
    required: true
  }),
  ApiForbiddenResponse5({ description: "CRON_SECRET did not match." }),
  ApiServiceUnavailableResponse6({ description: "CRON_SECRET is not set." }),
  Controller8("internal/tracking"),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof TrackingRollupService === "undefined" ? Object : TrackingRollupService,
    typeof TrackingCounterService === "undefined" ? Object : TrackingCounterService,
    typeof ConfigService6 === "undefined" ? Object : ConfigService6
  ])
], TrackingRetentionController);
async function read(request, limit) {
  const existing = trackingRequest.parse(request).body;
  if (existing !== null) {
    if (existing.text !== null) {
      return existing.text.length > limit ? null : existing.text;
    }
    return JSON.stringify(existing.json);
  }
  return new Promise((resolve) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    const finish = (value) => {
      if (settled)
        return;
      settled = true;
      resolve(value);
    };
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        request.destroy();
        finish(null);
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => finish(Buffer.concat(chunks).toString("utf8")));
    request.on("error", () => finish(null));
  });
}
function startOfDay(at) {
  const day = new Date(at);
  day.setUTCHours(0, 0, 0, 0);
  return day;
}
function timingSafeEquals5(a, b) {
  if (a.length !== b.length)
    return false;
  let mismatch = 0;
  for (let index = 0;index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

// src/tracking/tracking.router.ts
import { Inject as Inject24 } from "@nestjs/common";
import {
  Ctx as Ctx15,
  Input as Input19,
  Mutation as Mutation16,
  Query as Query20,
  Router as Router19,
  UseMiddlewares as UseMiddlewares19
} from "nestjs-trpc";
import { z as z33 } from "zod";

// src/tracking/tracking.contracts.ts
import { z as z32 } from "zod";
var trackingFlagInput = z32.object({
  flag: z32.enum([
    "crossDomain",
    "limitToDomains",
    "cookieSubdomains",
    "secureCookies",
    "honourDnt",
    "paused"
  ]),
  enabled: z32.boolean()
});
var cookieLifetimeInput = z32.object({
  days: z32.number().int().min(0).max(400)
});
var addDomainInput = z32.object({
  host: z32.string().min(1).max(253),
  scope: z32.enum(["SITE_AND_SUBDOMAINS", "EXACT_HOST"]).default("EXACT_HOST")
});
var removeDomainInput = z32.object({
  id: z32.string().min(1)
});
var verifyInput = z32.object({
  url: z32.string().min(1).max(2048)
});
var companyActivityInput = z32.object({
  companyId: z32.string().min(1)
});
var contactActivityInput = z32.object({
  contactId: z32.string().min(1)
});
var domainScopeOutput = z32.enum(["SITE_AND_SUBDOMAINS", "EXACT_HOST"]);
var trackedDomainOutput = z32.object({
  id: z32.string(),
  host: z32.string(),
  scope: domainScopeOutput,
  pageViews: z32.number(),
  lastSeenAt: z32.string().nullable()
});
var trackingSettingsOutput = z32.object({
  siteId: z32.string().nullable(),
  ready: z32.boolean(),
  scriptUrl: z32.string(),
  snippet: z32.string().nullable(),
  tagManagerSnippet: z32.string().nullable(),
  crossDomain: z32.boolean(),
  limitToDomains: z32.boolean(),
  cookieSubdomains: z32.boolean(),
  secureCookies: z32.boolean(),
  honourDnt: z32.boolean(),
  cookieDays: z32.number(),
  paused: z32.boolean(),
  cookieLifetimes: z32.array(z32.object({ days: z32.number(), label: z32.string() })),
  domains: z32.array(trackedDomainOutput),
  receivingSince: z32.string().nullable(),
  pageViews: z32.number(),
  submissions: z32.number(),
  canManage: z32.boolean()
});
var rotateSiteIdOutput = z32.object({
  siteId: z32.string()
});
var foundInContainerOutput = z32.object({
  id: z32.string(),
  carriesSiteId: z32.boolean()
});
var verifyOutput = z32.discriminatedUnion("status", [
  z32.object({
    status: z32.literal("found"),
    host: z32.string(),
    responseMs: z32.number(),
    allowed: z32.boolean(),
    pageView: z32.boolean(),
    container: foundInContainerOutput.nullable()
  }),
  z32.object({
    status: z32.literal("missing"),
    host: z32.string(),
    responseMs: z32.number(),
    containers: z32.array(z32.string())
  }),
  z32.object({
    status: z32.literal("unreachable"),
    host: z32.string(),
    detail: z32.string()
  })
]);
var sourceRowOutput = z32.object({
  source: z32.string(),
  medium: z32.string().nullable(),
  views: z32.number(),
  contacts: z32.number()
});
var sourcesOutput = z32.array(sourceRowOutput);
var touchSummaryOutput = z32.object({
  label: z32.string(),
  source: z32.string(),
  medium: z32.string().nullable(),
  campaign: z32.string().nullable(),
  landing: z32.string().nullable(),
  referrer: z32.string().nullable(),
  at: z32.string().nullable()
});
var visitedPageOutput = z32.object({
  host: z32.string(),
  path: z32.string(),
  views: z32.number(),
  lastSeenAt: z32.string()
});
var websiteActivityOutput = z32.object({
  identified: z32.boolean(),
  visitors: z32.number(),
  views: z32.number(),
  lastSeenAt: z32.string().nullable(),
  pages: z32.array(visitedPageOutput),
  firstTouch: touchSummaryOutput.nullable(),
  lastTouch: touchSummaryOutput.nullable()
});

// src/tracking/tracking.service.ts
import {
  appUrl,
  canManageTracking,
  isWorkspaceRole,
  WORKSPACE_ID as WORKSPACE_ID7
} from "@crm/auth";
import { Prisma as Prisma6 } from "@crm/db";
import { describeTouch } from "@crm/db/attribution";
import { safeFetch } from "@crm/db/safe-fetch";
import { SETTINGS_ID as SETTINGS_ID2 } from "@crm/db/settings";
import {
  COOKIE_LIFETIMES,
  gtmContainers,
  gtmContainerUrl,
  gtmSnippet,
  gtmTag,
  hostAllowed as hostAllowed2,
  loaderUrl,
  MAX_VERIFY_BYTES,
  normalizeHost,
  trackingReady,
  trackingSnippet,
  VERIFY_WINDOW_MS
} from "@crm/db/tracking";
import {
  BadRequestException as BadRequestException14,
  ForbiddenException as ForbiddenException12,
  Injectable as Injectable71,
  NotFoundException as NotFoundException17
} from "@nestjs/common";
class TrackingService {
  db;
  config;
  constructor(db2, config) {
    this.db = db2;
    this.config = config;
  }
  async settings(userId) {
    const [row, domains, latest, pageViews, submissions] = await Promise.all([
      this.db.appSetting.findUnique({
        where: { id: SETTINGS_ID2 },
        select: {
          trackingSiteId: true,
          trackingCrossDomain: true,
          trackingLimitToDomains: true,
          trackingCookieSubdomains: true,
          trackingSecureCookies: true,
          trackingHonourDnt: true,
          trackingCookieDays: true,
          trackingPaused: true
        }
      }),
      this.db.trackedDomain.findMany({ orderBy: { createdAt: "asc" } }),
      this.db.trackedEvent.findFirst({
        orderBy: { occurredAt: "desc" },
        select: { occurredAt: true }
      }),
      this.db.trackedEvent.count({ where: { type: "page_view" } }),
      this.db.formSubmission.count()
    ]);
    const ready = trackingReady(row?.trackingLimitToDomains ?? true, domains.length);
    const siteId = ready ? await this.config.ensureSiteId() : row?.trackingSiteId ?? null;
    return {
      siteId,
      ready,
      scriptUrl: scriptUrl(),
      snippet: siteId ? snippet(siteId) : null,
      tagManagerSnippet: siteId ? gtmSnippet(appUrl, siteId) : null,
      crossDomain: row?.trackingCrossDomain ?? true,
      limitToDomains: row?.trackingLimitToDomains ?? true,
      cookieSubdomains: row?.trackingCookieSubdomains ?? false,
      secureCookies: row?.trackingSecureCookies ?? true,
      honourDnt: row?.trackingHonourDnt ?? true,
      cookieDays: row?.trackingCookieDays ?? 395,
      paused: row?.trackingPaused ?? false,
      cookieLifetimes: [...COOKIE_LIFETIMES],
      domains: domains.map((domain) => ({
        id: domain.id,
        host: domain.host,
        scope: domain.scope,
        pageViews: domain.pageViews,
        lastSeenAt: domain.lastSeenAt?.toISOString() ?? null
      })),
      receivingSince: latest?.occurredAt.toISOString() ?? null,
      pageViews,
      submissions,
      canManage: canManageTracking(await this.roleOf(userId))
    };
  }
  async setFlag(userId, flag, enabled) {
    await this.assertCanManage(userId);
    const column = {
      crossDomain: "trackingCrossDomain",
      limitToDomains: "trackingLimitToDomains",
      cookieSubdomains: "trackingCookieSubdomains",
      secureCookies: "trackingSecureCookies",
      honourDnt: "trackingHonourDnt",
      paused: "trackingPaused"
    }[flag];
    await this.db.appSetting.upsert({
      where: { id: SETTINGS_ID2 },
      create: { id: SETTINGS_ID2, [column]: enabled },
      update: { [column]: enabled }
    });
    await this.config.invalidate();
  }
  async setCookieDays(userId, days) {
    await this.assertCanManage(userId);
    if (!COOKIE_LIFETIMES.some((entry) => entry.days === days)) {
      throw new BadRequestException14("That is not a cookie lifetime we offer.");
    }
    await this.db.appSetting.upsert({
      where: { id: SETTINGS_ID2 },
      create: { id: SETTINGS_ID2, trackingCookieDays: days },
      update: { trackingCookieDays: days }
    });
    await this.config.invalidate();
  }
  async addDomain(userId, input) {
    await this.assertCanManage(userId);
    const host = normalizeHost(input.host);
    if (!host) {
      throw new BadRequestException14("That is not a domain. Try something like acme.com.");
    }
    try {
      const domain = await this.db.trackedDomain.create({
        data: { host, scope: input.scope }
      });
      await this.config.invalidate();
      return {
        id: domain.id,
        host: domain.host,
        scope: domain.scope,
        pageViews: domain.pageViews,
        lastSeenAt: null
      };
    } catch (error) {
      if (error instanceof Prisma6.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new BadRequestException14(`${host} is already on the list.`);
      }
      throw error;
    }
  }
  async removeDomain(userId, id) {
    await this.assertCanManage(userId);
    try {
      await this.db.trackedDomain.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma6.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new NotFoundException17("That domain is already gone.");
      }
      throw error;
    }
    await this.config.invalidate();
  }
  async rotateSiteId(userId) {
    await this.assertCanManage(userId);
    return { siteId: await this.config.rotateSiteId() };
  }
  async verify(userId, url) {
    await this.assertCanManage(userId);
    const domains = await this.db.trackedDomain.count();
    const row = await this.db.appSetting.findUnique({
      where: { id: SETTINGS_ID2 },
      select: { trackingLimitToDomains: true }
    });
    if (!trackingReady(row?.trackingLimitToDomains ?? true, domains)) {
      throw new BadRequestException14("Add the domain your website runs on first — there is no script to find yet.");
    }
    const target = absolute(url);
    if (!target) {
      throw new BadRequestException14("That is not a URL. Try something like acme.com/pricing.");
    }
    const compiled = await this.config.compiled();
    const started = Date.now();
    const fetched = await safeFetch(target.toString(), { timeoutMs: 8000 });
    const responseMs = Date.now() - started;
    const host = (fetched?.url ?? target).hostname.toLowerCase();
    if (!fetched?.response.ok) {
      return {
        status: "unreachable",
        host,
        detail: fetched ? `The page answered ${fetched.response.status}.` : "We could not reach that page."
      };
    }
    const body2 = (await fetched.response.text()).slice(0, MAX_VERIFY_BYTES);
    const siteId = compiled?.config.siteId;
    if (!siteId) {
      return { status: "missing", host, responseMs, containers: [] };
    }
    const inHtml = mentions(body2, siteId);
    const containers = inHtml ? [] : gtmContainers(body2);
    const container = inHtml ? null : await this.inContainers(containers, siteId);
    if (!inHtml && !container) {
      return { status: "missing", host, responseMs, containers };
    }
    const since = new Date(Date.now() - VERIFY_WINDOW_MS);
    const seen = await this.db.trackedEvent.findFirst({
      where: { host, occurredAt: { gte: since } },
      select: { id: true }
    });
    return {
      status: "found",
      host,
      responseMs,
      allowed: compiled ? hostAllowed2(host, compiled.config) : false,
      pageView: seen !== null,
      container
    };
  }
  async inContainers(containers, siteId) {
    let attribute = null;
    for (const id of containers) {
      const fetched = await safeFetch(gtmContainerUrl(id), {
        timeoutMs: 8000
      });
      if (!fetched?.response.ok)
        continue;
      const source = (await fetched.response.text()).slice(0, MAX_VERIFY_BYTES);
      const state = gtmTag(source, siteId);
      if (state === "url")
        return { id, carriesSiteId: true };
      if (state === "attribute" && !attribute) {
        attribute = { id, carriesSiteId: false };
      }
    }
    return attribute;
  }
  async activityForCompany(companyId) {
    const visitors = await this.db.trackedVisitor.findMany({
      where: { contact: { companyId } },
      select: { id: true }
    });
    return this.activityFor(visitors.map((visitor) => visitor.id));
  }
  async activityForContact(contactId) {
    const visitors = await this.db.trackedVisitor.findMany({
      where: { contactId },
      select: { id: true }
    });
    return this.activityFor(visitors.map((visitor) => visitor.id));
  }
  async activityFor(visitorIds) {
    if (visitorIds.length === 0) {
      return {
        identified: false,
        visitors: 0,
        views: 0,
        lastSeenAt: null,
        pages: [],
        firstTouch: null,
        lastTouch: null
      };
    }
    const [first, last] = await Promise.all([
      this.db.trackedVisitor.findFirst({
        where: { id: { in: visitorIds }, firstSource: { not: null } },
        orderBy: { firstTouchAt: "asc" }
      }),
      this.db.trackedVisitor.findFirst({
        where: { id: { in: visitorIds }, lastSource: { not: null } },
        orderBy: { lastTouchAt: "desc" }
      })
    ]);
    const [grouped, latest, views] = await Promise.all([
      this.db.trackedEvent.groupBy({
        by: ["host", "path"],
        where: { visitorId: { in: visitorIds }, type: "page_view" },
        _count: { _all: true },
        _max: { occurredAt: true },
        orderBy: { _count: { path: "desc" } },
        take: 10
      }),
      this.db.trackedEvent.findFirst({
        where: { visitorId: { in: visitorIds } },
        orderBy: { occurredAt: "desc" },
        select: { occurredAt: true }
      }),
      this.db.trackedEvent.count({
        where: { visitorId: { in: visitorIds }, type: "page_view" }
      })
    ]);
    return {
      identified: true,
      visitors: visitorIds.length,
      views,
      lastSeenAt: latest?.occurredAt.toISOString() ?? null,
      pages: grouped.flatMap((row) => row._max.occurredAt ? [
        {
          host: row.host,
          path: row.path,
          views: row._count._all,
          lastSeenAt: row._max.occurredAt.toISOString()
        }
      ] : []),
      firstTouch: first ? summarise({
        source: first.firstSource,
        medium: first.firstMedium,
        campaign: first.firstCampaign,
        landing: first.firstLanding,
        referrer: first.firstReferrer,
        at: first.firstTouchAt
      }) : null,
      lastTouch: last ? summarise({
        source: last.lastSource,
        medium: last.lastMedium,
        campaign: last.lastCampaign,
        landing: last.lastLanding,
        referrer: last.lastReferrer,
        at: last.lastTouchAt
      }) : null
    };
  }
  async sources(userId) {
    await this.assertCanManage(userId);
    const [views, contacts] = await Promise.all([
      this.db.trackedEvent.groupBy({
        by: ["source", "medium"],
        where: { type: "page_view", source: { not: null } },
        _count: { _all: true }
      }),
      this.db.$queryRaw`
				SELECT "firstSource", "firstMedium", count(DISTINCT "contactId") AS contacts
				FROM "trackedVisitor"
				WHERE "contactId" IS NOT NULL AND "firstSource" IS NOT NULL
				GROUP BY 1, 2;
			`
    ]);
    const rows = new Map;
    for (const row of views) {
      if (!row.source)
        continue;
      const key = `${row.source}|${row.medium ?? ""}`;
      rows.set(key, {
        source: row.source,
        medium: row.medium,
        views: row._count._all,
        contacts: 0
      });
    }
    for (const row of contacts) {
      if (!row.firstSource)
        continue;
      const key = `${row.firstSource}|${row.firstMedium ?? ""}`;
      const existing = rows.get(key);
      const count = Number(row.contacts);
      if (existing) {
        existing.contacts = count;
        continue;
      }
      rows.set(key, {
        source: row.firstSource,
        medium: row.firstMedium,
        views: 0,
        contacts: count
      });
    }
    return [...rows.values()].sort((a, b) => b.contacts - a.contacts || b.views - a.views).slice(0, 20);
  }
  async assertCanManage(userId) {
    if (!canManageTracking(await this.roleOf(userId))) {
      throw new ForbiddenException12("Only an owner or an admin can change tracking.");
    }
  }
  async roleOf(userId) {
    const member = await this.db.member.findFirst({
      where: { organizationId: WORKSPACE_ID7, userId },
      select: { role: true }
    });
    return member && isWorkspaceRole(member.role) ? member.role : null;
  }
}
TrackingService = __legacyDecorateClassTS([
  Injectable71(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof TrackingConfigService === "undefined" ? Object : TrackingConfigService
  ])
], TrackingService);
function summarise(touch) {
  if (!touch.source)
    return null;
  return {
    label: describeTouch(touch),
    source: touch.source,
    medium: touch.medium,
    campaign: touch.campaign,
    landing: touch.landing,
    referrer: touch.referrer,
    at: touch.at?.toISOString() ?? null
  };
}
function scriptUrl() {
  return loaderUrl(appUrl);
}
function snippet(siteId) {
  return trackingSnippet(appUrl, siteId);
}
function absolute(input) {
  const trimmed = input.trim();
  if (!trimmed)
    return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    return url.hostname.includes(".") ? url : null;
  } catch {
    return null;
  }
}
function mentions(body2, siteId) {
  return body2.includes(siteId) && /\/t\/crm\.js/.test(body2);
}

// src/tracking/tracking.router.ts
class TrackingRouter {
  tracking;
  constructor(tracking) {
    this.tracking = tracking;
  }
  async settings(ctx) {
    return this.tracking.settings(ctx.user.id);
  }
  async setFlag(ctx, input) {
    return this.tracking.setFlag(ctx.user.id, input.flag, input.enabled);
  }
  async setCookieLifetime(ctx, input) {
    return this.tracking.setCookieDays(ctx.user.id, input.days);
  }
  async addDomain(ctx, input) {
    return this.tracking.addDomain(ctx.user.id, input);
  }
  async removeDomain(ctx, input) {
    return this.tracking.removeDomain(ctx.user.id, input.id);
  }
  async rotateSiteId(ctx) {
    return this.tracking.rotateSiteId(ctx.user.id);
  }
  async verify(ctx, input) {
    return this.tracking.verify(ctx.user.id, input.url);
  }
  async sources(ctx) {
    return this.tracking.sources(ctx.user.id);
  }
  async companyActivity(input) {
    return this.tracking.activityForCompany(input.companyId);
  }
  async contactActivity(input) {
    return this.tracking.activityForContact(input.contactId);
  }
}
__legacyDecorateClassTS([
  Query20({
    output: trackingSettingsOutput,
    meta: restMeta("GET", "/tracking/settings", ["Tracking"])
  }),
  __legacyDecorateParamTS(0, Ctx15()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], TrackingRouter.prototype, "settings", null);
__legacyDecorateClassTS([
  Mutation16({
    input: trackingFlagInput,
    output: z33.void(),
    meta: restMeta("PATCH", "/tracking/flags", ["Tracking"])
  }),
  __legacyDecorateParamTS(0, Ctx15()),
  __legacyDecorateParamTS(1, Input19()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z33 === "undefined" || typeof z33.infer === "undefined" ? Object : z33.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], TrackingRouter.prototype, "setFlag", null);
__legacyDecorateClassTS([
  Mutation16({
    input: cookieLifetimeInput,
    output: z33.void(),
    meta: restMeta("PATCH", "/tracking/cookie-lifetime", ["Tracking"])
  }),
  __legacyDecorateParamTS(0, Ctx15()),
  __legacyDecorateParamTS(1, Input19()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z33 === "undefined" || typeof z33.infer === "undefined" ? Object : z33.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], TrackingRouter.prototype, "setCookieLifetime", null);
__legacyDecorateClassTS([
  Mutation16({
    input: addDomainInput,
    output: trackedDomainOutput,
    meta: restMeta("POST", "/tracking/domains", ["Tracking"])
  }),
  __legacyDecorateParamTS(0, Ctx15()),
  __legacyDecorateParamTS(1, Input19()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z33 === "undefined" || typeof z33.infer === "undefined" ? Object : z33.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], TrackingRouter.prototype, "addDomain", null);
__legacyDecorateClassTS([
  Mutation16({
    input: removeDomainInput,
    output: z33.void(),
    meta: restMeta("DELETE", "/tracking/domains/{id}", ["Tracking"])
  }),
  __legacyDecorateParamTS(0, Ctx15()),
  __legacyDecorateParamTS(1, Input19()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z33 === "undefined" || typeof z33.infer === "undefined" ? Object : z33.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], TrackingRouter.prototype, "removeDomain", null);
__legacyDecorateClassTS([
  Mutation16({
    output: rotateSiteIdOutput,
    meta: restMeta("POST", "/tracking/site-id/rotate", ["Tracking"])
  }),
  __legacyDecorateParamTS(0, Ctx15()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], TrackingRouter.prototype, "rotateSiteId", null);
__legacyDecorateClassTS([
  Mutation16({
    input: verifyInput,
    output: verifyOutput,
    meta: restMeta("POST", "/tracking/verify", ["Tracking"])
  }),
  __legacyDecorateParamTS(0, Ctx15()),
  __legacyDecorateParamTS(1, Input19()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z33 === "undefined" || typeof z33.infer === "undefined" ? Object : z33.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], TrackingRouter.prototype, "verify", null);
__legacyDecorateClassTS([
  Query20({
    output: sourcesOutput,
    meta: restMeta("GET", "/tracking/sources", ["Tracking"])
  }),
  __legacyDecorateParamTS(0, Ctx15()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], TrackingRouter.prototype, "sources", null);
__legacyDecorateClassTS([
  Query20({
    input: companyActivityInput,
    output: websiteActivityOutput,
    meta: restMeta("GET", "/tracking/companies/{companyId}/activity", [
      "Tracking"
    ])
  }),
  __legacyDecorateParamTS(0, Input19()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z33 === "undefined" || typeof z33.infer === "undefined" ? Object : z33.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], TrackingRouter.prototype, "companyActivity", null);
__legacyDecorateClassTS([
  Query20({
    input: contactActivityInput,
    output: websiteActivityOutput,
    meta: restMeta("GET", "/tracking/contacts/{contactId}/activity", [
      "Tracking"
    ])
  }),
  __legacyDecorateParamTS(0, Input19()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof z33 === "undefined" || typeof z33.infer === "undefined" ? Object : z33.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], TrackingRouter.prototype, "contactActivity", null);
TrackingRouter = __legacyDecorateClassTS([
  Router19({ alias: "tracking" }),
  UseMiddlewares19(AuthMiddleware),
  __legacyDecorateParamTS(0, Inject24(TrackingService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof TrackingService === "undefined" ? Object : TrackingService
  ])
], TrackingRouter);

// src/tracking/tracking.module.ts
class TrackingModule {
}
TrackingModule = __legacyDecorateClassTS([
  Module31({
    imports: [TrpcModule, AgentModule, CompaniesModule],
    controllers: [TrackingController, TrackingRetentionController],
    providers: [
      TrackingConfigService,
      TrackingCounterService,
      TrackingFilingService,
      TrackingIngestService,
      TrackingRollupService,
      TrackingService,
      TrackingRouter
    ],
    exports: [TrackingConfigService]
  })
], TrackingModule);

// src/users/users.module.ts
import { Module as Module32 } from "@nestjs/common";

// src/users/users.router.ts
import { Inject as Inject25 } from "@nestjs/common";
import { Ctx as Ctx16, Query as Query21, Router as Router20, UseMiddlewares as UseMiddlewares20 } from "nestjs-trpc";
import { z as z34 } from "zod";

// src/users/users.service.ts
import { Injectable as Injectable72 } from "@nestjs/common";
class UsersService {
  db;
  constructor(db2) {
    this.db = db2;
  }
  async list() {
    return this.db.user.findMany({
      select: { id: true, name: true, email: true, image: true },
      orderBy: [{ name: "asc" }, { email: "asc" }]
    });
  }
}
UsersService = __legacyDecorateClassTS([
  Injectable72(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db
  ])
], UsersService);

// src/users/users.router.ts
var usersListOutput = z34.array(z34.object({
  id: z34.string(),
  name: z34.string(),
  email: z34.string(),
  image: z34.string().nullable()
}));

class UsersRouter {
  users;
  auth;
  constructor(users, auth5) {
    this.users = users;
    this.auth = auth5;
  }
  async me(ctx) {
    return this.auth.getProfile(ctx.user.id);
  }
  async list() {
    return this.users.list();
  }
}
__legacyDecorateClassTS([
  Query21(),
  __legacyDecorateParamTS(0, Ctx16()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], UsersRouter.prototype, "me", null);
__legacyDecorateClassTS([
  Query21({
    output: usersListOutput,
    meta: restMeta("GET", "/users", ["Users"])
  }),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", []),
  __legacyMetadataTS("design:returntype", Promise)
], UsersRouter.prototype, "list", null);
UsersRouter = __legacyDecorateClassTS([
  Router20({ alias: "users" }),
  UseMiddlewares20(AuthMiddleware),
  __legacyDecorateParamTS(0, Inject25(UsersService)),
  __legacyDecorateParamTS(1, Inject25(AuthService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof UsersService === "undefined" ? Object : UsersService,
    typeof AuthService === "undefined" ? Object : AuthService
  ])
], UsersRouter);

// src/users/users.module.ts
class UsersModule {
}
UsersModule = __legacyDecorateClassTS([
  Module32({
    imports: [AuthModule, TrpcModule],
    providers: [UsersService, UsersRouter],
    exports: [UsersService]
  })
], UsersModule);

// src/workspace/workspace.module.ts
import { Module as Module33 } from "@nestjs/common";

// src/workspace/workspace.router.ts
import { Inject as Inject26 } from "@nestjs/common";
import {
  Ctx as Ctx17,
  Input as Input20,
  Mutation as Mutation17,
  Query as Query22,
  Router as Router21,
  UseMiddlewares as UseMiddlewares21
} from "nestjs-trpc";

// src/workspace/workspace.contracts.ts
import { WORKSPACE_ROLES } from "@crm/auth";
import { MAX_SLUG } from "@crm/db/workspace";
import { z as z35 } from "zod";
var memberListInput = listInput.extend({
  role: z35.array(z35.string()).default([])
});
var updateWorkspaceInput = z35.object({
  name: z35.string().trim().min(1).max(120),
  website: z35.string().trim().min(1).max(255),
  slug: z35.string().trim().min(1).max(MAX_SLUG).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional()
});
var setMemberRoleInput = z35.object({
  memberId: z35.string().min(1),
  role: z35.enum(WORKSPACE_ROLES)
});
var workspaceOutput = z35.object({
  id: z35.string(),
  slug: z35.string(),
  name: z35.string(),
  website: z35.string().nullable(),
  onboarded: z35.boolean(),
  viewerRole: z35.enum(WORKSPACE_ROLES).nullable(),
  canRename: z35.boolean(),
  canChangeRoles: z35.boolean()
});
var workspaceMemberOutput = z35.object({
  id: z35.string(),
  userId: z35.string(),
  name: z35.string(),
  email: z35.string(),
  image: z35.string().nullable(),
  role: z35.enum(WORKSPACE_ROLES),
  joinedAt: z35.string(),
  isViewer: z35.boolean()
});
var memberListOutput = z35.object({
  rows: z35.array(workspaceMemberOutput),
  total: z35.number(),
  facetCounts: z35.record(z35.string(), z35.record(z35.string(), z35.number()))
});

// src/workspace/workspace.service.ts
import {
  canChangeRole,
  canRenameWorkspace,
  ensureWorkspaceMembership,
  isWorkspaceRole as isWorkspaceRole2,
  WORKSPACE_ID as WORKSPACE_ID8,
  workspaceRoleOf as workspaceRoleOf4
} from "@crm/auth";
import { isOnboarded, markOnboarded, workspaceSlug } from "@crm/db/workspace";
import {
  BadRequestException as BadRequestException15,
  ForbiddenException as ForbiddenException13,
  Injectable as Injectable73,
  Logger as Logger55,
  NotFoundException as NotFoundException18,
  ServiceUnavailableException as ServiceUnavailableException8
} from "@nestjs/common";
var MEMBER_SELECT = {
  id: true,
  role: true,
  createdAt: true,
  userId: true,
  user: { select: { name: true, email: true, image: true } }
};
var SORTABLE6 = {
  name: (dir) => ({ user: { name: dir } }),
  email: (dir) => ({ user: { email: dir } }),
  role: (dir) => ({ role: dir }),
  joinedAt: (dir) => ({ createdAt: dir })
};
function toRole(value) {
  return isWorkspaceRole2(value) ? value : "member";
}

class WorkspaceService {
  db;
  agent;
  logger = new Logger55(WorkspaceService.name);
  constructor(db2, agent) {
    this.db = db2;
    this.agent = agent;
  }
  async get(userId) {
    let row = await this.readWorkspace();
    if (!row) {
      await ensureWorkspaceMembership(userId);
      row = await this.readWorkspace();
    }
    if (!row) {
      throw new ServiceUnavailableException8("The workspace could not be read. Sign in again in a moment.");
    }
    const role = await workspaceRoleOf4(userId);
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      website: row.website,
      onboarded: isOnboarded(row.metadata),
      viewerRole: role,
      canRename: canRenameWorkspace(role),
      canChangeRoles: canChangeRole(role)
    };
  }
  async update(userId, input) {
    const role = await workspaceRoleOf4(userId);
    if (!canRenameWorkspace(role)) {
      throw new ForbiddenException13("Only an owner or an admin can change the workspace.");
    }
    const before = await this.db.organization.findUnique({
      where: { id: WORKSPACE_ID8 },
      select: { website: true, metadata: true }
    });
    const website = normalizeDomain(input.website);
    if (!website) {
      throw new BadRequestException15("That is not a website. Enter the domain, like acme.com.");
    }
    await this.db.organization.update({
      where: { id: WORKSPACE_ID8 },
      data: {
        name: input.name,
        slug: workspaceSlug(input.slug ?? input.name),
        website,
        metadata: markOnboarded(before?.metadata ?? null, new Date)
      }
    });
    this.logger.log({ message: "Workspace updated", userId });
    if (website !== before?.website) {
      await this.agent.workspaceChanged(website, before?.website ? "The company using this CRM changed its website" : "The company using this CRM said what its website is");
    }
    return this.get(userId);
  }
  async members(userId, input) {
    const where = this.buildWhere(input);
    const { skip, take } = paginate(input);
    const [rows, total, roles] = await Promise.all([
      this.db.member.findMany({
        where,
        skip,
        take,
        select: MEMBER_SELECT,
        orderBy: resolveOrderBy(input, SORTABLE6, { createdAt: "asc" })
      }),
      this.db.member.count({ where }),
      this.db.member.groupBy({
        by: ["role"],
        where: this.searchWhere(input.q),
        _count: { _all: true }
      })
    ]);
    return {
      rows: rows.map((row) => this.toMember(row, userId)),
      total,
      facetCounts: { role: countsByKey(roles, "role") }
    };
  }
  async setMemberRole(userId, input) {
    const role = await workspaceRoleOf4(userId);
    if (!canChangeRole(role)) {
      throw new ForbiddenException13("Only an owner or an admin can change a member's role.");
    }
    const updated = await this.db.$transaction(async (tx) => {
      const target = await tx.member.findFirst({
        where: { id: input.memberId, organizationId: WORKSPACE_ID8 },
        select: { id: true, role: true }
      });
      if (!target) {
        throw new NotFoundException18("That person is not in this workspace.");
      }
      if (target.role === "owner" && input.role !== "owner") {
        const owners = await tx.$queryRaw`
					SELECT id FROM "member"
					WHERE "organizationId" = ${WORKSPACE_ID8} AND role = 'owner'
					FOR UPDATE
				`;
        if (owners.length <= 1) {
          throw new ForbiddenException13("The workspace needs an owner. Make someone else an owner first.");
        }
      }
      return tx.member.update({
        where: { id: target.id },
        data: { role: input.role },
        select: MEMBER_SELECT
      });
    });
    this.logger.log({
      message: "Workspace role changed",
      userId,
      memberId: updated.id,
      role: input.role
    });
    return this.toMember(updated, userId);
  }
  toMember(row, userId) {
    return {
      id: row.id,
      userId: row.userId,
      name: row.user.name,
      email: row.user.email,
      image: row.user.image,
      role: toRole(row.role),
      joinedAt: row.createdAt.toISOString(),
      isViewer: row.userId === userId
    };
  }
  searchWhere(q) {
    const term = q.trim();
    const where = { organizationId: WORKSPACE_ID8 };
    if (term) {
      where.user = {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } }
        ]
      };
    }
    return where;
  }
  buildWhere(input) {
    const where = this.searchWhere(input.q);
    if (input.role.length > 0) {
      where.role = { in: input.role };
    }
    return where;
  }
  async readWorkspace() {
    return this.db.organization.findUnique({
      where: { id: WORKSPACE_ID8 },
      select: {
        id: true,
        slug: true,
        name: true,
        website: true,
        metadata: true
      }
    });
  }
}
WorkspaceService = __legacyDecorateClassTS([
  Injectable73(),
  __legacyDecorateParamTS(0, InjectDatabase()),
  __legacyMetadataTS("design:paramtypes", [
    typeof Db === "undefined" ? Object : Db,
    typeof AgentTriggerService === "undefined" ? Object : AgentTriggerService
  ])
], WorkspaceService);

// src/workspace/workspace.router.ts
class WorkspaceRouter {
  workspace;
  constructor(workspace) {
    this.workspace = workspace;
  }
  async get(ctx) {
    return this.workspace.get(ctx.user.id);
  }
  async members(ctx, input) {
    return this.workspace.members(ctx.user.id, input);
  }
  async update(ctx, input) {
    return this.workspace.update(ctx.user.id, input);
  }
  async setMemberRole(ctx, input) {
    return this.workspace.setMemberRole(ctx.user.id, input);
  }
}
__legacyDecorateClassTS([
  Query22({
    output: workspaceOutput,
    meta: restMeta("GET", "/workspace", ["Workspace"])
  }),
  __legacyDecorateParamTS(0, Ctx17()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], WorkspaceRouter.prototype, "get", null);
__legacyDecorateClassTS([
  Query22({
    input: memberListInput,
    output: memberListOutput,
    meta: restMeta("POST", "/workspace/members/search", ["Workspace"])
  }),
  __legacyDecorateParamTS(0, Ctx17()),
  __legacyDecorateParamTS(1, Input20()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], WorkspaceRouter.prototype, "members", null);
__legacyDecorateClassTS([
  Mutation17({
    input: updateWorkspaceInput,
    output: workspaceOutput,
    meta: restMeta("PATCH", "/workspace", ["Workspace"])
  }),
  __legacyDecorateParamTS(0, Ctx17()),
  __legacyDecorateParamTS(1, Input20()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], WorkspaceRouter.prototype, "update", null);
__legacyDecorateClassTS([
  Mutation17({
    input: setMemberRoleInput,
    output: workspaceMemberOutput,
    meta: restMeta("PATCH", "/workspace/members/{memberId}/role", [
      "Workspace"
    ])
  }),
  __legacyDecorateParamTS(0, Ctx17()),
  __legacyDecorateParamTS(1, Input20()),
  __legacyMetadataTS("design:type", Function),
  __legacyMetadataTS("design:paramtypes", [
    typeof AuthedTrpcContext === "undefined" ? Object : AuthedTrpcContext,
    typeof z === "undefined" || typeof z.infer === "undefined" ? Object : z.infer
  ]),
  __legacyMetadataTS("design:returntype", Promise)
], WorkspaceRouter.prototype, "setMemberRole", null);
WorkspaceRouter = __legacyDecorateClassTS([
  Router21({ alias: "workspace" }),
  UseMiddlewares21(AuthMiddleware),
  __legacyDecorateParamTS(0, Inject26(WorkspaceService)),
  __legacyMetadataTS("design:paramtypes", [
    typeof WorkspaceService === "undefined" ? Object : WorkspaceService
  ])
], WorkspaceRouter);

// src/workspace/workspace.module.ts
class WorkspaceModule {
}
WorkspaceModule = __legacyDecorateClassTS([
  Module33({
    imports: [AgentModule, TrpcModule],
    providers: [WorkspaceService, WorkspaceRouter],
    exports: [WorkspaceService]
  })
], WorkspaceModule);

// src/app.module.ts
class AppModule {
}
AppModule = __legacyDecorateClassTS([
  Module34({
    imports: [
      LoggingModule,
      ConfigModule.forRoot({
        isGlobal: true,
        cache: true,
        validate: validateEnv
      }),
      AppCacheModule,
      DatabaseModule,
      CrmModule,
      BetterAuthModule.forRoot({ auth: auth5, middleware: logAuthRoute }),
      AuthModule,
      HealthModule,
      TrpcModule,
      UsersModule,
      ApiKeysModule,
      CompaniesModule,
      ContactsModule,
      ConversationsModule,
      CurrencyModule,
      DealsModule,
      FieldsModule,
      ActivitiesModule,
      AgentModule,
      EnrichmentModule,
      DashboardModule,
      SearchModule,
      MailboxModule,
      GoogleModule,
      MicrosoftModule,
      SyncModule,
      SettingsModule,
      WorkspaceModule,
      SsoModule,
      SlackModule,
      BackfillModule,
      TelemetryModule,
      TrackingModule,
      ArchiveModule,
      SavedViewsModule
    ]
  })
], AppModule);

// src/create-app.ts
async function createApp() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter, { bodyParser: false, logger: new ContextLogger });
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true }
  }));
  let restBridge;
  app.use(REST_BRIDGE_PATH, (req, res, next) => {
    if (!restBridge) {
      next();
      return;
    }
    restBridge(req, res);
  });
  const apiKeySecurityScheme = {
    type: "apiKey",
    in: "header",
    name: API_KEY_HEADER2
  };
  SwaggerModule.setup("", app, () => {
    const { appRouter: appRouter2 } = app.get(AppRouterHost);
    const trpcDocument = generateOpenApiDocument(appRouter2, {
      title: "CRM API — tRPC bridge",
      description: "Every tRPC procedure, reachable over REST for tooling that cannot speak tRPC. Same validation, same middlewares, same services as the tRPC transport — this only translates the wire format.",
      version: "1.0",
      baseUrl: `${apiUrl}${REST_BRIDGE_PATH}`,
      securitySchemes: { apiKey: apiKeySecurityScheme }
    });
    const swaggerConfig = new DocumentBuilder().setTitle("CRM API").setDescription(`REST surface of the CRM API — auth, health, the internal cron routes, and a generated REST bridge (under ${REST_BRIDGE_PATH}) for every tRPC procedure.`).setVersion("1.0").addCookieAuth(SESSION_COOKIE_NAME3).addApiKey(apiKeySecurityScheme, "apiKey").build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    swaggerDocument.paths = {
      ...swaggerDocument.paths,
      ...trpcDocument.paths
    };
    swaggerDocument.components = {
      ...swaggerDocument.components,
      schemas: {
        ...swaggerDocument.components?.schemas,
        ...trpcDocument.components?.schemas
      }
    };
    return swaggerDocument;
  }, { jsonDocumentUrl: "openapi.json" });
  await app.init();
  const { appRouter } = app.get(AppRouterHost);
  restBridge = createOpenApiExpressMiddleware({
    router: appRouter,
    createContext: ({ req }) => createBaseTrpcContext(req)
  });
  return app;
}

// api/index.ts
var instancePromise = null;
function getInstance() {
  if (!instancePromise) {
    instancePromise = (async () => {
      const app = await createApp();
      await app.init();
      return app.getHttpAdapter().getInstance();
    })();
  }
  return instancePromise;
}
async function handler(req, res) {
  const instance = await getInstance();
  instance(req, res);
}
export {
  handler as default
};
