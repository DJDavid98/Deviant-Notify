/**
 * @fileOverview This file is used to consume the preact umd bundle in a type-safe way. All files that need preact
 *               must import it from here to avoid runtime errors.
 */

/* eslint-disable no-restricted-imports */
import type * as PreactUmdGlobal from 'preact';
import type * as PreactHooksUmdGlobal from 'preact/hooks';
/* eslint-enable no-restricted-imports */

declare global {
  interface Window {
    preact: typeof PreactUmdGlobal;
    preactHooks: typeof PreactHooksUmdGlobal;
  }
}

export const { Fragment, render, h } = window.preact;
export const {
  useState, useEffect, useCallback, useRef, useMemo,
} = window.preactHooks;
