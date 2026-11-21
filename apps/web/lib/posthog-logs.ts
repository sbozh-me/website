import type { Logger } from "@opentelemetry/api-logs";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { Resource } from "@opentelemetry/resources";

let loggerProvider: LoggerProvider | undefined;
let shutdownHooksRegistered = false;

function warnMissingConfiguration(variableName: string) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `${variableName} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${variableName} is configured`,
    );
  }
}

function getLoggerProvider() {
  if (loggerProvider) return loggerProvider;

  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!token) {
    warnMissingConfiguration("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN");
    return undefined;
  }
  if (!host) {
    warnMissingConfiguration("NEXT_PUBLIC_POSTHOG_HOST");
    return undefined;
  }

  try {
    loggerProvider = new LoggerProvider({
      resource: new Resource({ "service.name": "@sbozh/web" }),
    });
    loggerProvider.addLogRecordProcessor(
      new BatchLogRecordProcessor(
        new OTLPLogExporter({
          url: new URL("/i/v1/logs", host).toString(),
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ),
    );
  } catch {
    warnMissingConfiguration("NEXT_PUBLIC_POSTHOG_HOST");
    return undefined;
  }

  if (!shutdownHooksRegistered) {
    shutdownHooksRegistered = true;
    const shutdown = () => {
      void loggerProvider?.shutdown().catch(() => {});
    };

    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
  }

  return loggerProvider;
}

export function registerPostHogLogs() {
  getLoggerProvider();
}

export function getPostHogLogger(): Logger | undefined {
  return getLoggerProvider()?.getLogger("posthog-donation-reveal");
}
