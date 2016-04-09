'use strict';

import changeNotification from './changeNotification';
import { valueChanged } from './bulkChange';
import { doChange } from './change';
import * as tracking from './tracking';
import { default as subscriptionList, ISubscription, IChangeHandler, ISubscriptions, IHasValue } from './subscriptionList';

export interface IValue<T> extends IHasValue<T> {
    write(value: T): void;
}

export default function<T>(initialValue: T): IValue<T> {
    var currentValue = initialValue;
    var id = tracking.takeNextObservableId();
    var subscriptions: ISubscriptions<T>;

    var self = <IValue<T>>function(): T {
        tracking.recordUsage(id, self, currentValue);
        return currentValue;
    };

    var notifySubscribers = function(from: T, to: T): void {
        if (subscriptions) {
            subscriptions.notify(self, from, to);
        }

        changeNotification.notify(self, from, to);
    };

    self.write = function(newValue: T): void {
        if (currentValue === newValue) {
            return;
        }

        var oldValue = currentValue;
        currentValue = newValue;
        tracking.lastWriteVersion++;

        doChange(() => {
            valueChanged(id, self, oldValue, notifySubscribers);
        });
    };

    self.onChange = function(handler: IChangeHandler<T>): ISubscription {
        subscriptions = subscriptions || subscriptionList<T>();

        return subscriptions.subscribe(handler);
    };

    return self;
}
