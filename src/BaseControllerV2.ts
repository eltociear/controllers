import { produce } from 'immer';

// Imported separately because only the type is used
// eslint-disable-next-line no-duplicate-imports
import type { Draft } from 'immer';

/**
 * State change callbacks
 */
export type Listener<T> = (state: T) => void;

/**
 * Controller class that provides state management and subscriptions
 */
export class BaseController<S extends Record<string, any>> {
  private internalState: S;

  private internalListeners: Set<Listener<S>> = new Set();

  /**
   * Creates a BaseController instance.
   *
   * @param state - Initial controller state
   */
  constructor(state: S) {
    this.internalState = state;
  }

  /**
   * Retrieves current controller state
   *
   * @returns - Current state
   */
  get state() {
    return this.internalState;
  }

  set state(_) {
    throw new Error(`Controller state cannot be directly mutated; use 'update' method instead.`);
  }

  /**
   * Adds new listener to be notified of state changes
   *
   * @param listener - Callback triggered when state changes
   */
  subscribe(listener: Listener<S>) {
    this.internalListeners.add(listener);
  }

  /**
   * Removes existing listener from receiving state changes
   *
   * @param listener - Callback to remove
   */
  unsubscribe(listener: Listener<S>) {
    this.internalListeners.delete(listener);
  }

  /**
   * Updates controller state. Accepts a callback that is passed a draft copy
   * of the controller state. If a value is returned, it is set as the new
   * state. Otherwise, any changes made within that callback to the draft are
   * applied to the controller state.
   *
   * @param callback - Callback for updating state, passed a draft state
   *   object. Return a new state object or mutate the draft to update state.
   */
  protected update(callback: (state: Draft<S>) => void | S) {
    const nextState = produce(this.internalState, callback) as S;
    this.internalState = nextState;
    for (const listener of this.internalListeners) {
      listener(nextState);
    }
  }

  /**
   * Prepares the controller for garbage collection. This should be extended
   * by any subclasses to clean up any additional connections or events.
   *
   * The only cleanup performed here is to remove listeners. While technically
   * this is not required to ensure this instance is garbage collected, it at
   * least ensures this instance won't be responsible for preventing the
   * listeners from being garbage collected.
   */
  protected destroy() {
    this.internalListeners.clear();
  }
}