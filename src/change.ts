'use strict';

var changeLevels: number = 0;
var actions: (() => void)[];

export function onChangeFinished(action: () => void): void {
    if (changeLevels === 0) {
        action();
    } else {
        actions.push(action);
    }
}

export function doChange(changeAction: () => void): void {
    var isFirstChange = changeLevels === 0;

    if (isFirstChange) {
        actions = [];
    }

    changeLevels++;

    try {
        changeAction();
    } finally {
        changeLevels--;

        if (isFirstChange) {
            for (var action of actions) {
                action();
            }

            actions = undefined;
        }
    }
}
