"use client";

import { Component, type ReactNode } from "react";

/** Keeps a failing map or 3D view from taking the rest of the page down; shows `fallback` instead. */
export class SafeBoundary extends Component<{ fallback?: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("A view failed and was replaced by its fallback:", error);
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
