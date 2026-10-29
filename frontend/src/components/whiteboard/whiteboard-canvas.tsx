"use client";

import React, { useEffect, useState, useRef } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { STEM_LIBRARY_ITEMS } from "@/lib/whiteboard/stem-libraries";

type ExcalidrawImperativeAPI = {
  updateLibrary: (opts: { libraryItems: unknown[]; merge?: boolean; openLibraryMenu?: boolean }) => void;
  getSceneElements: () => unknown[];
  updateScene: (sceneData: { elements?: unknown[]; appState?: Record<string, unknown> }) => void;
};

interface WhiteboardCanvasProps {
  initialElements?: Record<string, unknown>[];
  initialAppState?: Record<string, unknown>;
  isPro?: boolean;
  onChange?: (elements: readonly Record<string, unknown>[], appState: Record<string, unknown>) => void;
  onApiReady?: (api: ExcalidrawImperativeAPI) => void;
}

export default function WhiteboardCanvas({
  initialElements = [],
  initialAppState = {},
  isPro = false,
  onChange,
  onApiReady,
}: WhiteboardCanvasProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const isLibraryLoadedRef = useRef(false);

  useEffect(() => {
    if (excalidrawAPI) {
      if (onApiReady) {
        onApiReady(excalidrawAPI);
      }

      // Nếu là gói Pro, tự động load thư viện STEM giáo dục vào kho Excalidraw Library
      if (isPro && !isLibraryLoadedRef.current) {
        try {
          excalidrawAPI.updateLibrary({
            libraryItems: STEM_LIBRARY_ITEMS,
            merge: true,
            openLibraryMenu: false,
          });
          isLibraryLoadedRef.current = true;
        } catch (e) {
          console.error("Lỗi khi nạp STEM Library vào Excalidraw:", e);
        }
      }
    }
  }, [excalidrawAPI, isPro, onApiReady]);

  return (
    <div className="w-full h-full relative" style={{ height: "calc(100vh - 65px)" }}>
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api as unknown as ExcalidrawImperativeAPI)}
        initialData={{
          elements: (initialElements || []) as unknown as readonly Record<string, unknown>[] as any,
          appState: {
            viewBackgroundColor: (initialAppState?.viewBackgroundColor as string) || "#ffffff",
            currentItemStrokeColor: (initialAppState?.currentItemStrokeColor as string) || "#1e1e1e",
            gridSize: (initialAppState?.gridSize as number) ?? 20,
            ...initialAppState,
          } as any,
          scrollToContent: true,
        }}
        onChange={(elements, appState) => {
          if (onChange) {
            onChange(
              elements as unknown as readonly Record<string, unknown>[],
              appState as unknown as Record<string, unknown>
            );
          }
        }}
        UIOptions={{
          canvasActions: {
            export: {
              saveFileToDisk: true,
            },
            saveToActiveFile: false,
            loadScene: true,
            toggleTheme: true,
          },
        }}
      />
    </div>
  );
}
