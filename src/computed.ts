'use strict';

import * as tracking from './tracking';
import { default as subscriptionList, ISubscription, ISubscriptions, IHasValue } from './subscriptionList';
import { valueChanged } from './bulkChange';
import { onChangeFinished } from './change';

export interface ICalculator<T> {
    (params: any[]): T;
}

export interface IWriteCallback<T> {
    (newValue: T, args: any[], changedValue: IWritableComputedValue<T>): void;
}

export interface IComputedValueChangeHandler<T> {
    (changed: IComputedValue<T>, from: T, to: T, args: any[]): void;
}

export interface IComputedValue<T> extends IHasValue<T> {
    onChange(handler: IComputedValueChangeHandler<T>): ISubscription;
}

export interface IWritableComputedValue<T> extends IComputedValue<T> {
    write(newValue: T): void;
}

export type IComputed<T> = IComputedValue<T> | IWritableComputedValue<T>

export default function<T>(calculator: ICalculator<T>, args: any[]): IComputedValue<T>;
export default function<T>(calculator: ICalculator<T>, args: any[], writeCallback: IWriteCallback<T>): IWritableComputedValue<T>;
export default function<T>(calculator: ICalculator<T>, args: any[], writeCallback?: IWriteCallback<T>): IComputed<T> {
    var currentValue: T;
    var oldValue: T;

    interface IDependency {
        capturedValue: any;
        dependencyId: number;
        observableValue: IHasValue<any>;
        subscription?: ISubscription;
    }

    var dependencies: IDependency[];
    var id = tracking.takeNextObservableId();
    var lastReadVersion;
    var subscriptions: ISubscriptions<T>;
    var subscriptionsActive: boolean;
    var self: IComputed<T>;

    var atLeastOneDependencyChanged = function(): boolean {
        return tracking.executeWithTracker(() => {
            for (var dependency of dependencies) {
                if (dependency.observableValue() !== dependency.capturedValue) {
                    return true;
                }
            }

            return false;
        });
    };

    var unsubscribeDependencies = function(): void {
        for (var dependency of dependencies) {
            dependency.subscription.disable();
            dependency.subscription = undefined;
        }
    };

    var subscribeDependencies = function(): void {
        for (var dependency of dependencies) {
            dependency.subscription = dependency.observableValue.onChange(self);
        }
    };

    var notifySubscribers = function(oldValue: T, newValue: T): void {
        subscriptions.notify(self, oldValue, newValue, args);
    };

    self = <IComputedValue<T>>function(): T {
        if (lastReadVersion !== tracking.lastWriteVersion) {
            lastReadVersion = tracking.lastWriteVersion;

            if (!dependencies || atLeastOneDependencyChanged()) {
                interface IDependencyHash {
                    [id: number]: IDependency;
                }

                var dependenciesById: IDependencyHash = {};

                var oldDependencies = dependencies;
                dependencies = [];

                if (subscriptionsActive) {
                    oldValue = currentValue;
                }

                var tracker = function(dependencyId: number, observableValue: any, capturedValue: any): void {
                    if (dependenciesById[dependencyId] !== undefined) {
                        return;
                    }

                    var dependency = {
                        capturedValue: capturedValue,
                        dependencyId: dependencyId,
                        observableValue: observableValue
                    };

                    dependenciesById[dependencyId] = dependency;
                    dependencies.push(dependency);
                };

                currentValue = tracking.executeWithTracker(() => calculator.apply(undefined, args), tracker);

                if (subscriptionsActive) {
                    if (oldDependencies) {
                        for (var oldDependency of oldDependencies) {
                            var newDependency = dependenciesById[oldDependency.dependencyId];

                            if (newDependency !== undefined) {
                                newDependency.subscription = oldDependency.subscription;
                            }
                        }
                    }

                    for (var dependency of dependencies) {
                        dependency.subscription = dependency.subscription || dependency.observableValue.onChange(self);
                    }

                    if (oldDependencies) {
                        onChangeFinished(() => {
                            for (var oldDependency of oldDependencies) {
                                var newDependency = dependenciesById[oldDependency.dependencyId];

                                if (newDependency === undefined) {
                                    oldDependency.subscription.disable();
                                }
                            }
                        });
                    }

                    if (oldValue !== currentValue) {
                        valueChanged(id, self, oldValue, notifySubscribers);
                    }
                }
            }
        }

        tracking.recordUsage(id, self, currentValue);

        return currentValue;
    };

    self.onChange = function(handler: IComputedValueChangeHandler<T>): ISubscription {
        subscriptions = subscriptions || subscriptionList<T>({
            activated: function(): void {
                oldValue = self();

                if (dependencies) {
                    subscribeDependencies();
                }

                subscriptionsActive = true;
            },
            deactivated: function(): void {
                oldValue = undefined;

                if (dependencies) {
                    unsubscribeDependencies();
                }

                subscriptionsActive = false;
            }
        });

        return subscriptions.subscribe(handler);
    };

    type writable = IWritableComputedValue<T>;
    if (writeCallback !== undefined) {
        (<writable>self).write = (newValue) => {
            writeCallback(newValue, args, <writable>self);
        };

        return <writable>self;
    }

    return self;
}
