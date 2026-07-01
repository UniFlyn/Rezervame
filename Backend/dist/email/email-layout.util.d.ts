export declare function escapeHtml(value: unknown): string;
export declare function emailParagraph(text: string): string;
export declare function emailMuted(text: string): string;
export declare function emailCodeBox(code: string, label?: string): string;
export declare function emailDetailsTable(rows: Array<{
    label: string;
    value: string;
}>): string;
export declare function emailCtaButton(label: string, url: string): string;
export type EmailLayoutOptions = {
    preheader?: string;
    headline: string;
    intro?: string;
    bodyHtml: string;
    cta?: {
        label: string;
        url: string;
    };
    footerNote?: string;
    platformName?: string;
};
export declare function wrapEmailLayout(opts: EmailLayoutOptions): string;
export declare function stripHtml(html: string): string;
