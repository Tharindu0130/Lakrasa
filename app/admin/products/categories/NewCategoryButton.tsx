"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function NewCategoryButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const canSave = useMemo(() => {
    return name.trim().length > 0 && slugify(slug || name).length > 0 && !saving;
  }, [name, saving, slug]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setErrorText(null);
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2.5 text-sm font-semibold text-white"
      >
        <span aria-hidden="true">＋</span> New category
      </button>

      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/35"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div className="absolute inset-0 overflow-y-auto">
            <div className="min-h-full px-4 py-8 sm:px-10">
              <div className="mx-auto w-full max-w-lg rounded-[28px] bg-[#f1f5ef] shadow-[0_60px_120px_rgba(0,37,33,0.25)]">
                <div className="flex items-center justify-between px-6 py-5">
                  <div>
                    <div className="text-lg font-semibold tracking-tight">
                      New category
                    </div>
                    <div className="mt-1 text-xs opacity-70">
                      Adds a row to the <span className="font-semibold">categories</span>{" "}
                      table
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-2xl bg-white/60 px-4 py-2 text-sm font-semibold hover:bg-white/80"
                  >
                    Close
                  </button>
                </div>

                <div className="px-6 pb-6">
                  <label className="block">
                    <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                      Name
                    </div>
                    <input
                      value={name}
                      onChange={(e) => {
                        const v = e.target.value;
                        setName(v);
                        setSlug((s) => (s.trim().length ? s : slugify(v)));
                      }}
                      className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      placeholder="e.g. Tea"
                      autoFocus
                    />
                  </label>

                  <label className="mt-4 block">
                    <div className="text-[10px] tracking-[0.2em] uppercase opacity-70">
                      Slug
                    </div>
                    <input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="mt-2 w-full rounded-2xl bg-white/70 px-4 py-3 text-sm outline-none"
                      placeholder="e.g. tea"
                    />
                    <div className="mt-2 text-xs opacity-60">
                      Final slug:{" "}
                      <span className="font-semibold">
                        {slugify(slug || name) || "—"}
                      </span>
                    </div>
                  </label>

                  {errorText ? (
                    <div className="mt-4 rounded-2xl bg-white/60 px-4 py-3 text-sm">
                      <div className="font-semibold text-[#7a1c1c]">
                        Couldn’t create category
                      </div>
                      <div className="mt-1 opacity-70">{errorText}</div>
                    </div>
                  ) : null}

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-2xl bg-white/60 px-4 py-3 text-sm font-semibold hover:bg-white/80"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!canSave}
                      onClick={async () => {
                        setErrorText(null);
                        const finalSlug = slugify(slug || name);
                        if (!finalSlug) return;
                        setSaving(true);
                        try {
                          // Pre-check for nicer duplicate message
                          const existing = await supabase
                            .from("categories")
                            .select("id")
                            .eq("slug", finalSlug)
                            .maybeSingle();
                          if (existing.error) {
                            setErrorText(existing.error.message);
                            return;
                          }
                          if (existing.data) {
                            setErrorText(
                              `Slug "${finalSlug}" already exists. Please choose a different slug.`
                            );
                            return;
                          }

                          const res = await supabase
                            .from("categories")
                            .insert({ name: name.trim(), slug: finalSlug })
                            .select("id")
                            .single();

                          if (res.error) {
                            const msg = res.error.message.includes("categories_slug_key")
                              ? `Slug "${finalSlug}" already exists. Please choose a different slug.`
                              : res.error.message;
                            setErrorText(msg);
                            return;
                          }

                          setOpen(false);
                          setName("");
                          setSlug("");
                          router.refresh();
                        } finally {
                          setSaving(false);
                        }
                      }}
                      className={[
                        "rounded-2xl bg-[#033c37] px-5 py-3 text-sm font-semibold text-white hover:bg-[#002521]",
                        !canSave ? "opacity-60 pointer-events-none" : "",
                      ].join(" ")}
                    >
                      {saving ? "Creating…" : "Create"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

