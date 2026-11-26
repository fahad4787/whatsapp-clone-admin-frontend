import { STORAGE_KEYS } from "@/config/constants";

/**
 * Inline script for <head>: applies the saved theme before first paint so there is no flash.
 * Light is the default. Dark only applies when the admin picks it (or picks "system" on a dark OS).
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var p=localStorage.getItem(${JSON.stringify(STORAGE_KEYS.theme)})||"light";var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.dataset.theme="dark";}catch(e){}})();`;
