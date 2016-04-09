'use strict';

export type Tracker = (id: number, observableValue: any, currentValue: any) => void;
var activeTracker: Tracker;
var nextObservableId = 0;

export var lastWriteVersion = 0;

export function recordUsage(id: number, observableValue: any, currentValue: any): void {
    if (!activeTracker) { return; }
    activeTracker(id, observableValue, currentValue);
}

export function takeNextObservableId(): number {
    return ++nextObservableId;
}

export function executeWithTracker<T>(action: () => T, tracker?: Tracker): T {
    var currentTracker = activeTracker;
    activeTracker = tracker;

    try {
        return action();
    } finally {
        activeTracker = currentTracker;
    }
}
