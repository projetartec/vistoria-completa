import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

type AppEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// Extend EventEmitter to type events
declare interface TypedEventEmitter<T> {
  on<E extends keyof T>(event: E, listener: T[E]): this;
  emit<E extends keyof T>(event: E, ...args: Parameters<T[E]>): boolean;
}

class TypedEventEmitter<T> extends EventEmitter {}

export const errorEmitter = new TypedEventEmitter<AppEvents>();
