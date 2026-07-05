"use client";

import React from "react";
import { Modal, Button, Glyph } from "@/ds";
import { useI18n } from "./I18nProvider";
import { useAuth } from "./AuthProvider";

export function FavoritePrompt() {
  const { t } = useI18n();
  const { isFavoritePromptOpen, closeFavoritePrompt, openLoginFromFavoritePrompt } = useAuth();

  if (!isFavoritePromptOpen) return null;

  return (
    <Modal open onClose={closeFavoritePrompt} width={420}>
      <div
        style={{
          padding: "clamp(28px, 5vw, 38px) clamp(24px, 5vw, 34px) clamp(22px, 4vw, 28px)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "var(--rz-coral-050)",
            color: "var(--rz-coral)",
            marginBottom: 18,
          }}
        >
          <Glyph name="heart" size={28} filled />
        </div>
        <h2
          style={{
            fontSize: 23,
            fontWeight: 700,
            color: "var(--rz-navy)",
            letterSpacing: "-0.3px",
          }}
        >
          {t("favoritePromptTitle")}
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--rz-gray-500)",
            marginTop: 10,
            lineHeight: 1.55,
            maxWidth: 320,
            margin: "10px auto 0",
          }}
        >
          {t("favoritePromptBody")}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 26 }}>
          <Button variant="primary" size="lg" fullWidth onClick={openLoginFromFavoritePrompt}>
            {t("favoritePromptLogin")}
          </Button>
          <Button variant="outline" size="lg" fullWidth onClick={openLoginFromFavoritePrompt}>
            {t("favoritePromptSignup")}
          </Button>
        </div>
        <button
          type="button"
          onClick={closeFavoritePrompt}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--rz-gray-500)",
            marginTop: 16,
          }}
        >
          {t("favoritePromptDismiss")}
        </button>
      </div>
    </Modal>
  );
}
