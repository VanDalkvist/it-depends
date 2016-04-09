'use strict';

import { IHasValue } from './subscriptionList';
import { doChange } from './change';

interface IChange<T> {
    value: IHasValue<T>;
    oldValue: T;
    newValue?: T;
    notify(from: T, to: T): void;
}

interface IHasChanges {
    [id: number]: boolean;
}

var bulkLevels: number = 0;
var changes: IChange<any>[];
var hasChange: IHasChanges;

export function valueChanged<T>(id: number, value: IHasValue<T>, oldValue: T, notify: (from: T, to: T) => void): void {
    if (bulkLevels === 0) {
        notify(oldValue, value());
    } else if (hasChange[id] === undefined) {
        changes.push({
            notify: notify,
            value: value,
            oldValue: oldValue
        });

        hasChange[id] = true;
    }
}

export default function(changeAction: () => void): void {
    var isFirstBulk = bulkLevels === 0;

    if (isFirstBulk) {
        changes = [];
        hasChange = {};
    }

    bulkLevels++;

    try {
        doChange(changeAction);
    } finally {
        if (isFirstBulk) {
            for (var change of changes) {
                change.newValue = change.value();
            }
        }

        bulkLevels--;

        if (isFirstBulk) {
            for (var change of changes) {
                if (change.oldValue !== change.newValue) {
                    change.notify(change.oldValue, change.newValue);
                }
            }

            changes = undefined;
            hasChange = undefined;
        }
    }
}
