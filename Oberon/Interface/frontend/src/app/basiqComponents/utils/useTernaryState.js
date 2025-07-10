import { useState } from 'react';

/**
 * Custom hook for managing ternary state (true, false, loading/pending)
 * Returns [state, openFunction, closeFunction]
 */
export function useTernaryState(initialState = false) {
  const [state, setState] = useState(initialState);

  const open = () => setState(true);
  const close = () => setState(false);

  return [state, open, close];
}
