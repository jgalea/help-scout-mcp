/**
 * Dependency Injection Container
 *
 * Provides centralized service management and dependency injection
 * for improved testability and loose coupling.
 */
import { config } from './config.js';
import { logger } from './logger.js';
import { cache } from './cache.js';
import { helpScoutClient } from './helpscout-client.js';
import { helpScoutDocsClient } from './helpscout-docs-client.js';
import { ReportsApiClient } from './reports-api-client.js';
/**
 * Service container for dependency injection
 */
export class ServiceContainer {
    constructor() {
        this.services = {};
        this.singletons = new Set();
        // Private constructor for singleton pattern
    }
    /**
     * Get the singleton instance of the service container
     */
    static getInstance() {
        if (!ServiceContainer.instance) {
            ServiceContainer.instance = new ServiceContainer();
            ServiceContainer.instance.registerDefaultServices();
        }
        return ServiceContainer.instance;
    }
    /**
     * Register a service in the container
     */
    register(key, service, asSingleton = true) {
        this.services[key] = service;
        if (asSingleton) {
            this.singletons.add(key);
        }
    }
    /**
     * Register a service factory for lazy initialization
     */
    registerFactory(key, factory, asSingleton = true) {
        let cachedService;
        // Store the factory function
        Object.defineProperty(this.services, key, {
            get: () => {
                if (asSingleton && cachedService) {
                    return cachedService;
                }
                const service = factory();
                if (asSingleton) {
                    cachedService = service;
                }
                return service;
            },
            configurable: true,
            enumerable: true
        });
        if (asSingleton) {
            this.singletons.add(key);
        }
    }
    /**
     * Get a service from the container
     */
    get(key) {
        const service = this.services[key];
        if (!service) {
            throw new Error(`Service '${String(key)}' not found in container`);
        }
        return service;
    }
    /**
     * Check if a service is registered
     */
    has(key) {
        return key in this.services;
    }
    /**
     * Remove a service from the container
     */
    remove(key) {
        delete this.services[key];
        this.singletons.delete(key);
    }
    /**
     * Clear all services (useful for testing)
     */
    clear() {
        this.services = {};
        this.singletons.clear();
    }
    /**
     * Create a new isolated container (useful for testing)
     */
    static createTestContainer() {
        const container = new ServiceContainer();
        return container;
    }
    /**
     * Register default production services
     */
    registerDefaultServices() {
        // Register core services
        this.register('config', config, true);
        this.register('logger', logger, true);
        this.register('cache', cache, true);
        this.register('helpScoutClient', helpScoutClient, true);
        this.register('helpScoutDocsClient', helpScoutDocsClient, true);
        // Register Reports API client
        this.registerFactory('reportsApiClient', () => new ReportsApiClient(helpScoutClient), true);
    }
    /**
     * Get all registered service names
     */
    getRegisteredServices() {
        return Object.keys(this.services);
    }
    /**
     * Check if a service is registered as singleton
     */
    isSingleton(key) {
        return this.singletons.has(key);
    }
    /**
     * Create a service resolver for dependency injection
     */
    createResolver() {
        return new ServiceResolver(this);
    }
}
/**
 * Service resolver for easier dependency injection
 */
export class ServiceResolver {
    constructor(container) {
        this.container = container;
    }
    /**
     * Resolve multiple services at once
     */
    resolve(keys) {
        const result = {};
        for (const key of keys) {
            result[key] = this.container.get(key);
        }
        return result;
    }
    /**
     * Resolve all services
     */
    resolveAll() {
        const keys = this.container.getRegisteredServices();
        return this.resolve(keys);
    }
}
/**
 * Decorator for automatic dependency injection
 */
export function inject(serviceName) {
    return function (target, propertyKey) {
        Object.defineProperty(target, propertyKey, {
            get() {
                return ServiceContainer.getInstance().get(serviceName);
            },
            configurable: true,
            enumerable: true
        });
    };
}
/**
 * Base class with dependency injection support
 */
export class Injectable {
    constructor(container) {
        this.services = (container || ServiceContainer.getInstance()).createResolver();
    }
    /**
     * Get a specific service
     */
    getService(key) {
        return ServiceContainer.getInstance().get(key);
    }
}
/**
 * Factory function for creating services with dependencies
 */
export function createServiceFactory(factory) {
    return () => {
        const container = ServiceContainer.getInstance();
        const resolver = container.createResolver();
        const services = resolver.resolveAll();
        return factory(services);
    };
}
// Export singleton instance for convenience
export const serviceContainer = ServiceContainer.getInstance();
//# sourceMappingURL=service-container.js.map