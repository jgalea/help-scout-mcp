/**
 * Dependency Injection Container
 *
 * Provides centralized service management and dependency injection
 * for improved testability and loose coupling.
 */
import { Config } from './config.js';
import { Logger } from './logger.js';
import { Cache } from './cache.js';
import { HelpScoutClient } from './helpscout-client.js';
import { HelpScoutDocsClient } from './helpscout-docs-client.js';
import { ReportsApiClient } from './reports-api-client.js';
/**
 * Service registry interface for type safety
 */
export interface ServiceRegistry {
    config: Config;
    logger: Logger;
    cache: Cache;
    helpScoutClient: HelpScoutClient;
    helpScoutDocsClient: HelpScoutDocsClient;
    reportsApiClient: ReportsApiClient;
}
/**
 * Service container for dependency injection
 */
export declare class ServiceContainer {
    private static instance;
    private services;
    private singletons;
    private constructor();
    /**
     * Get the singleton instance of the service container
     */
    static getInstance(): ServiceContainer;
    /**
     * Register a service in the container
     */
    register<K extends keyof ServiceRegistry>(key: K, service: ServiceRegistry[K], asSingleton?: boolean): void;
    /**
     * Register a service factory for lazy initialization
     */
    registerFactory<K extends keyof ServiceRegistry>(key: K, factory: () => ServiceRegistry[K], asSingleton?: boolean): void;
    /**
     * Get a service from the container
     */
    get<K extends keyof ServiceRegistry>(key: K): ServiceRegistry[K];
    /**
     * Check if a service is registered
     */
    has<K extends keyof ServiceRegistry>(key: K): boolean;
    /**
     * Remove a service from the container
     */
    remove<K extends keyof ServiceRegistry>(key: K): void;
    /**
     * Clear all services (useful for testing)
     */
    clear(): void;
    /**
     * Create a new isolated container (useful for testing)
     */
    static createTestContainer(): ServiceContainer;
    /**
     * Register default production services
     */
    private registerDefaultServices;
    /**
     * Get all registered service names
     */
    getRegisteredServices(): Array<keyof ServiceRegistry>;
    /**
     * Check if a service is registered as singleton
     */
    isSingleton<K extends keyof ServiceRegistry>(key: K): boolean;
    /**
     * Create a service resolver for dependency injection
     */
    createResolver(): ServiceResolver;
}
/**
 * Service resolver for easier dependency injection
 */
export declare class ServiceResolver {
    private container;
    constructor(container: ServiceContainer);
    /**
     * Resolve multiple services at once
     */
    resolve<K extends keyof ServiceRegistry>(keys: Array<K>): {
        [P in K]: ServiceRegistry[P];
    };
    /**
     * Resolve all services
     */
    resolveAll(): ServiceRegistry;
}
/**
 * Decorator for automatic dependency injection
 */
export declare function inject<T extends keyof ServiceRegistry>(serviceName: T): (target: any, propertyKey: string | symbol) => void;
/**
 * Base class with dependency injection support
 */
export declare abstract class Injectable {
    protected services: ServiceResolver;
    constructor(container?: ServiceContainer);
    /**
     * Get a specific service
     */
    protected getService<K extends keyof ServiceRegistry>(key: K): ServiceRegistry[K];
}
/**
 * Factory function for creating services with dependencies
 */
export declare function createServiceFactory<T>(factory: (services: ServiceRegistry) => T): () => T;
export declare const serviceContainer: ServiceContainer;
//# sourceMappingURL=service-container.d.ts.map