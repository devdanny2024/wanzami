"use client";

/* There used to be two toasters: this next-themes one and ./toaster. The Call
   Sheet toaster in ./toaster is the canonical one, so this module now just
   re-exports it and nothing renders a second, differently-styled toaster.
   Nothing imports this file today — it is kept only so any stale import path
   still resolves to the Call Sheet toaster. */

export { Toaster } from "./toaster";
export type { ToasterProps } from "sonner";
