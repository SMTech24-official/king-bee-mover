type AnyObject = Record<string, any>;

function removeObjectProperty<T extends AnyObject, K extends keyof T>(obj: T, propToRemove: K): Omit<T, K> {
    const { [propToRemove]: removedProp, ...rest } = obj;
    return rest;
}

export { removeObjectProperty };
