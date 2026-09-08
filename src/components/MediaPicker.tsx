"use client";

import { useMedia } from "@/lib/mediaStore";
import { useLanguage } from "@/lib/i18n";

export default function MediaPicker({
  onSelect,
  onClose,
}: {
  onSelect: (url: string, name: string) => void;
  onClose: () => void;
}) {
  const { items } = useMedia();
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl bg-surface shadow-xl border border-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold">{t("medialibrary.pickTitle")}</p>
          <button onClick={onClose} className="text-xs text-muted hover:text-brand-pink">
            {t("medialibrary.cancel")}
          </button>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted italic p-6 text-center">{t("medialibrary.empty")}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.url, item.name)}
                className="rounded-xl border border-border overflow-hidden text-left hover:border-brand-pink transition"
              >
                <div className="h-20 bg-background flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.name} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  <p className="text-[10px] text-muted truncate">{item.tags.join(", ")}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
