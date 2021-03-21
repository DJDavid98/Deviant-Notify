/* eslint-disable no-restricted-imports */
import type { ComponentClass, h as pH, render as pRender } from 'preact';
import type {
  useCallback as pUseCallback,
  useEffect as pUseEffect,
  useRef as pUseRef,
  useState as pUseState,
  useMemo as pUseMemo,
} from 'preact/hooks';

/* eslint-enable no-restricted-imports */

export interface PreactUmdGlobal {
  h: typeof pH;
  Fragment: ComponentClass<{ key?: unknown }>;
  render: typeof pRender;
}

export interface PreactHooksUmdGlobal {
  useCallback: typeof pUseCallback;
  useEffect: typeof pUseEffect;
  useRef: typeof pUseRef;
  useState: typeof pUseState;
  useMemo: typeof pUseMemo;
}

declare global {
  interface Window {
    preact: PreactUmdGlobal;
    preactHooks: PreactHooksUmdGlobal;
  }
}

export const { Fragment, render, h } = window.preact;
export const {
  useState, useEffect, useCallback, useRef, useMemo,
} = window.preactHooks;
