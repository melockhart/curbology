"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import "@fontsource-variable/archivo/wdth.css";
import { A } from "../link";
import { ITEMS, type Item } from "../../lib/quote/pricing";
import { MAX_PHOTOS, MAX_PHOTO_BYTES, TEXT_CONSENT_WORDING } from "../../lib/quote/rules";
import "./quote.css";

type Step = "address" | "size" | "photos" | "details" | "working" | "price" | "review" | "outside";
type Service = { slug: string; name: string };
type Photo = { key: string; url: string; state: "uploading" | "saved" | "failed" };
type Line = { label: string; quantity: number; unit: string; totalCents: number };
type Shown = {
  status: string;
  priceCents?: number;
  depositCents?: number | null;
  lines?: Line[];
  note?: string | null;
  seen?: string | null;
};

/** What each service is measured in. Pressure washing covers two rate-card items. */
const SERVICE_ITEMS: Record<string, Item[]> = {
  "pressure-washing": ["flatwork", "curb"],
  "house-siding-washing": ["siding"],
  "gutter-cleaning": ["gutters"],
  "roof-cleaning": ["roof"],
};

const STEPS: Step[] = ["address", "size", "photos", "details", "price"];
const STEP_NAMES = ["Address", "Size", "Photos", "Details", "Quote"];
const STORE = "curbology-quote";

const money = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;

/** Storage can throw in a private window, and a quote must still work there. */
function remember(value: unknown) {
  try {
    if (value) localStorage.setItem(STORE, JSON.stringify(value));
    else localStorage.removeItem(STORE);
  } catch {
    // Only resuming is lost.
  }
}
function recall(): Saved | null {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}
type Saved = {
  id: string; token: string; step: Step; address: string; matched: string | null;
  selected: string[]; sizes: Record<string, string>; savedPhotos: number;
};

/** Phone photos are often far past the upload limit. Shrinking here also turns HEIC into JPEG where the browser can read it. */
async function shrink(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/jpeg", 0.82));
    if (blob && blob.size <= MAX_PHOTO_BYTES) return blob;
  } catch {
    // Fall through to the original file.
  }
  return file.size <= MAX_PHOTO_BYTES && /^image\/(jpeg|png|webp)$/.test(file.type) ? file : null;
}

const Check = () => (
  <svg className="qf-i" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7" /></svg>
);
const PhoneIcon = () => (
  <svg className="qf-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>
);

export function QuoteFlow({ phone, services }: { phone: { display: string; href: string }; services: Service[] }) {
  const [step, setStep] = useState<Step>("address");
  const [quote, setQuote] = useState<{ id: string; token: string } | null>(null);
  const [preview, setPreview] = useState(false);
  const [address, setAddress] = useState("");
  const [matched, setMatched] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [savedPhotos, setSavedPhotos] = useState(0);
  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [shown, setShown] = useState<Shown | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  const go = (next: Step) => {
    setError("");
    setStep(next);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  // Query string and saved quote can only be read in the browser.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const service = params.get("service");
    const fromLink = params.get("address");
    const saved = recall();
    let cancelled = false;

    const restore = async (entry: Saved) => {
      const response = await fetch(`/api/quote?id=${entry.id}`, { headers: { "x-quote-token": entry.token } }).catch(() => null);
      const body = response?.ok ? ((await response.json()) as Shown & { photoCount?: number }) : null;
      if (cancelled) return;
      if (!body || !body.status || body.status === "preview") return remember(null);
      setQuote({ id: entry.id, token: entry.token });
      setAddress(entry.address);
      setMatched(entry.matched);
      setSelected(entry.selected);
      setSizes(entry.sizes);
      setSavedPhotos(body.photoCount ?? entry.savedPhotos);
      if (body.status === "draft") return setStep(entry.step);
      setShown(body);
      setStep(body.priceCents !== undefined ? "price" : "review");
    };

    if (saved && !service && !fromLink) {
      void restore(saved);
    } else {
      /* eslint-disable react-hooks/set-state-in-effect -- browser-only values, read once on arrival */
      if (service && SERVICE_ITEMS[service]) setSelected([service]);
      if (fromLink) setAddress(fromLink.slice(0, 300));
      /* eslint-enable react-hooks/set-state-in-effect */
      // The link has done its job. Left in the URL, it would stop a reload resuming this quote.
      if (service || fromLink) window.history.replaceState(null, "", "/quote");
    }
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [step]);

  useEffect(() => {
    if (quote && ["size", "photos", "details"].includes(step)) {
      remember({ ...quote, step, address, matched, selected, sizes, savedPhotos: savedPhotos + photos.filter((p) => p.state === "saved").length });
    }
  }, [quote, step, address, matched, selected, sizes, savedPhotos, photos]);

  const toggle = (slug: string) =>
    setSelected((now) => (now.includes(slug) ? now.filter((s) => s !== slug) : [...now, slug]));

  const unavailable = `Online quotes are not switched on yet. Please call ${phone.display}.`;

  async function startQuote(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (address.trim().length < 5) return setError("Please add your full address.");
    if (selected.length === 0) return setError("Please choose at least one service.");
    setBusy(true);
    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, service: selected.join(",") }),
      });
      const body = (await response.json()) as {
        status?: string; error?: string; id?: string; token?: string; area?: string; matchedAddress?: string | null;
      };
      if (body.status === "preview") {
        setPreview(true);
        go("size");
      } else if (body.status === "unconfigured") {
        setError(unavailable);
      } else if (!response.ok || !body.id || !body.token) {
        setError(body.error ?? "That did not save. Please try again.");
      } else if (body.area === "outside") {
        go("outside");
      } else {
        setQuote({ id: body.id, token: body.token });
        setMatched(body.matchedAddress ?? null);
        go("size");
      }
    } catch {
      setError("That did not reach us. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    setError("");
    const room = MAX_PHOTOS - savedPhotos - photos.filter((p) => p.state !== "failed").length;
    if (files.length > room) setError(`We can take ${MAX_PHOTOS} photos on one quote.`);

    for (const file of files.slice(0, Math.max(room, 0))) {
      const key = crypto.randomUUID();
      const update = (state: Photo["state"]) =>
        setPhotos((now) => now.map((photo) => (photo.key === key ? { ...photo, state } : photo)));
      setPhotos((now) => [...now, { key, url: URL.createObjectURL(file), state: "uploading" }]);

      const blob = await shrink(file);
      if (!blob) {
        update("failed");
        setError("One photo could not be read. Please send a JPEG, PNG or WebP photo.");
        continue;
      }
      if (preview || !quote) {
        update("saved");
        continue;
      }
      const response = await fetch(`/api/quote/photos?id=${quote.id}`, {
        method: "POST",
        headers: { "x-quote-token": quote.token, "Content-Type": blob.type || "application/octet-stream" },
        body: blob,
      }).catch(() => null);
      if (response?.ok) {
        update("saved");
      } else {
        update("failed");
        const body = (await response?.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "One photo did not save. Please try again.");
      }
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please add your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Please check your email address.");
    if (consent && !mobile.trim()) return setError("Please add a mobile number so we can text you.");

    if (preview || !quote) {
      setShown({ status: "review" });
      return go("review");
    }
    go("working");
    const items = selected.flatMap((slug) =>
      (SERVICE_ITEMS[slug] ?? []).map((item) => ({ item, quantity: sizes[item]?.trim() ?? "" })),
    );
    // Pressure washing has two sizes. An untouched curb line is not part of the job.
    const asked = items.filter((line) => line.item !== "curb" || line.quantity !== "");
    try {
      const response = await fetch(`/api/quote/submit?id=${quote.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-quote-token": quote.token },
        body: JSON.stringify({ name, email, phone: mobile, message: note, textConsent: consent, items: asked }),
      });
      const body = (await response.json()) as Shown & { error?: string };
      if (!response.ok || body.error) {
        setError(body.error ?? "That did not save. Please try again.");
        return go("details");
      }
      setShown(body);
      remember({ ...quote, step: "details", address, matched, selected, sizes, savedPhotos: 0 });
      go(body.priceCents !== undefined ? "price" : "review");
    } catch {
      setError("That did not reach us. Your details are safe to send again.");
      setStep("details");
    }
  }

  function startOver() {
    remember(null);
    window.location.href = "/quote";
  }

  const stepIndex = step === "outside" ? 0 : step === "working" || step === "review" ? 4 : STEPS.indexOf(step);
  const percent = Math.round(((stepIndex + 1) / STEPS.length) * 100);
  const uploading = photos.some((photo) => photo.state === "uploading");
  const photoTotal = savedPhotos + photos.filter((photo) => photo.state === "saved").length;
  const chosen = services.filter((service) => selected.includes(service.slug));

  const head = (title: string, sub?: string) => (
    <div className="qf-stack qf-g8">
      <h1 ref={heading} tabIndex={-1} style={{ outline: "none" }}>{title}</h1>
      {sub && <p className="qf-lead qf-mut">{sub}</p>}
    </div>
  );
  const problem = error && <p className="qf-err" role="alert">{error}</p>;
  const previewNote = preview && (
    <p className="qf-note" role="status">Preview: nothing here is saved, and no photos leave this device.</p>
  );

  let body: ReactNode = null;

  if (step === "address") {
    body = (
      <>
        {head("Get your price", "Add your address and photos. We price the job, or Tristen checks it and gets back to you.")}
        <form className="qf-card qf-pad qf-stack qf-g16" onSubmit={startQuote} noValidate>
          <div className="qf-f">
            <label htmlFor="q-address">Property address</label>
            <span className="qf-hint">Street, town and ZIP.</span>
            <input id="q-address" autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="qf-stack qf-g8">
            <span className="qf-lb">What needs washing?</span>
            <div className="qf-opts">
              {services.map((service) => {
                const on = selected.includes(service.slug);
                return (
                  <button key={service.slug} type="button" className={`qf-opt ${on ? "on" : ""}`} aria-pressed={on} onClick={() => toggle(service.slug)}>
                    <strong>{service.name}</strong>
                    <span className="qf-hint">{on ? "Selected" : "Add to this quote"}</span>
                  </button>
                );
              })}
            </div>
            <span className="qf-hint">Pick more than one to quote them together.</span>
          </div>
          {problem}
          <button className="qf-btn full" disabled={busy}>{busy ? "Checking your address" : "Continue"}</button>
        </form>
        <p className="qf-hint">No account needed. Outside Oakland County? We will tell you on the next step.</p>
      </>
    );
  }

  if (step === "outside") {
    body = (
      <>
        {head("That address looks outside our area", "We serve Oakland County, Michigan. If you think we got this wrong, tell us.")}
        <div className="qf-card qf-pad qf-stack qf-g16">
          <div className="qf-f">
            <label htmlFor="q-address-out">Property address</label>
            <input id="q-address-out" readOnly value={address} />
          </div>
          <button type="button" className="qf-btn alt full" onClick={() => go("address")}>Try a different address</button>
          <A className="qf-btn full" href="/contact">Ask us anyway</A>
        </div>
      </>
    );
  }

  if (step === "size") {
    const items = selected.flatMap((slug) => SERVICE_ITEMS[slug] ?? []);
    body = (
      <>
        {previewNote}
        {head("How big is the job?", "A rough size is fine. Not sure? Leave it blank and Tristen will measure it.")}
        <div className="qf-card qf-pad qf-stack qf-g16">
          {items.map((item) => (
            <div className="qf-f" key={item}>
              <label htmlFor={`q-size-${item}`}>{ITEMS[item].label} ({ITEMS[item].unit})</label>
              <input id={`q-size-${item}`} inputMode="numeric" className="qf-num" value={sizes[item] ?? ""}
                onChange={(e) => setSizes((now) => ({ ...now, [item]: e.target.value.replace(/[^\d.]/g, "") }))} />
            </div>
          ))}
        </div>
        <div className="qf-row qf-btw qf-wr qf-g12">
          <button type="button" className="qf-lk" onClick={() => go("address")}>Back</button>
          <button type="button" className="qf-btn" onClick={() => go("photos")}>Continue</button>
        </div>
      </>
    );
  }

  if (step === "photos") {
    body = (
      <>
        {previewNote}
        {head("Add photos of the job", "Photos show condition, so the price fits your job. Three or four is plenty.")}
        <label className="qf-drop">
          <svg className="qf-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13.5" r="3.5" /></svg>
          <span className="qf-stack">
            <strong>Take or add photos</strong>
            <span className="qf-hint">Up to {MAX_PHOTOS} photos</span>
          </span>
          <input type="file" accept="image/*" multiple onChange={addPhotos} aria-label="Take or add photos" />
        </label>
        {savedPhotos > 0 && <p className="qf-sm qf-mut">{savedPhotos} photo{savedPhotos === 1 ? "" : "s"} already saved on this quote.</p>}
        {photos.length > 0 && (
          <div className="qf-shots">
            {photos.map((photo) => (
              <div key={photo.key} className={`qf-shot ${photo.state === "uploading" ? "up" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- a local preview of the customer's own file */}
                <img src={photo.url} alt="Your photo" />
                {photo.state !== "saved" && <span>{photo.state === "uploading" ? "Saving" : "Not saved"}</span>}
              </div>
            ))}
          </div>
        )}
        {problem}
        <div className="qf-card qf-pad18 qf-stack qf-g8">
          <p className="qf-lb">What helps most</p>
          {["The whole area, from far back", "The dirtiest spot, close up", "Anything fragile nearby", "Stains you want gone"].map((tip) => (
            <div className="qf-chk qf-sm" key={tip}><Check /><span>{tip}</span></div>
          ))}
        </div>
        <div className="qf-f">
          <label htmlFor="q-note">Anything we should know?</label>
          <textarea id="q-note" placeholder="Gate code, oil stains, areas to avoid" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="qf-row qf-btw qf-wr qf-g12">
          <button type="button" className="qf-lk" onClick={() => go("size")}>Back</button>
          <button type="button" className="qf-btn" disabled={uploading} onClick={() => go("details")}>{uploading ? "Saving photos" : "Continue"}</button>
        </div>
      </>
    );
  }

  if (step === "details") {
    body = (
      <>
        {previewNote}
        {head("Where should we send your price?", "If we can price it now, your price appears on the next screen.")}
        <form className="qf-card qf-pad qf-stack qf-g16" onSubmit={submit} noValidate>
          <div className="qf-two">
            <div className="qf-f">
              <label htmlFor="q-name">Full name</label>
              <input id="q-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="qf-f">
              <label htmlFor="q-mobile">Mobile number</label>
              <input id="q-mobile" type="tel" autoComplete="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} />
            </div>
          </div>
          <div className="qf-f">
            <label htmlFor="q-email">Email</label>
            <input id="q-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <label className="qf-chk qf-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>{TEXT_CONSENT_WORDING}</span>
          </label>
          {problem}
          <button className="qf-btn full">See my price</button>
        </form>
        <button type="button" className="qf-lk" style={{ alignSelf: "flex-start" }} onClick={() => go("photos")}>Back</button>
      </>
    );
  }

  if (step === "working") {
    body = (
      <>
        {head("Working out your price", "This usually takes a few moments. You can stay here.")}
        <div className="qf-card qf-stack" style={{ padding: "6px 20px" }} role="status">
          <div className="qf-row qf-g12" style={{ padding: "15px 0" }}>
            <span className="qf-spin" aria-hidden="true" />
            <span>{photoTotal ? `Reading your ${photoTotal} photo${photoTotal === 1 ? "" : "s"}` : "Checking your job"}</span>
          </div>
          <div className="qf-row qf-g12 qf-hair qf-mut" style={{ padding: "15px 0" }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--line)", flex: "none" }} />
            <span>Applying Curbology rates</span>
          </div>
        </div>
      </>
    );
  }

  if (step === "price" && shown?.priceCents !== undefined) {
    body = (
      <>
        {head("Your price", matched ?? address)}
        <section className="qf-card">
          <div className="qf-deep qf-stack qf-g4">
            <span className="qf-price">{money(shown.priceCents)}</span>
            {shown.depositCents ? <span className="qf-sm" style={{ color: "#c6d2e0" }}>Deposit to hold a date: {money(shown.depositCents)}</span> : null}
          </div>
          {(shown.lines?.length ?? 0) > 0 && (
            <div style={{ padding: "6px 22px" }}>
              {shown.lines?.map((line, index) => (
                <div key={line.label} className={`qf-row qf-btw qf-g12 ${index ? "qf-hair" : ""}`} style={{ padding: "14px 0" }}>
                  <span className="qf-stack">
                    <strong>{line.label}</strong>
                    <span className="qf-hint qf-num">{line.quantity.toLocaleString("en-US")} {line.unit}</span>
                  </span>
                  <strong className="qf-num">{money(line.totalCents)}</strong>
                </div>
              ))}
            </div>
          )}
        </section>
        {shown.seen && (
          <div className="qf-card qf-pad18 qf-stack qf-g8">
            <p className="qf-lb">What we saw in your photos</p>
            <p>{shown.seen}</p>
          </div>
        )}
        {shown.note && (
          <div className="qf-card qf-pad18 qf-stack qf-g8">
            <p className="qf-lb">A note from Tristen</p>
            <p>{shown.note}</p>
          </div>
        )}
        <div className="qf-stack qf-g12">
          <a className="qf-btn full" href={phone.href}><PhoneIcon />Call to pick a date</a>
          <button type="button" className="qf-lk qf-sm" style={{ alignSelf: "flex-start" }} onClick={startOver}>Start a new quote</button>
        </div>
        <p className="qf-hint">Price assumes the area and photos match what is on site.</p>
      </>
    );
  }

  if (step === "review") {
    body = (
      <>
        {previewNote}
        {head("Tristen will check this one", "Your job needs a closer look before we can give you a fair price.")}
        <div className="qf-card qf-pad qf-stack qf-g12">
          <p className="qf-mut qf-sm">We have your details and will contact you with your price.</p>
          <a className="qf-btn alt full" href={phone.href}><PhoneIcon />Call instead</a>
        </div>
        <button type="button" className="qf-lk qf-sm" style={{ alignSelf: "flex-start" }} onClick={startOver}>Start a new quote</button>
      </>
    );
  }

  const showSummary = address && step !== "address" && step !== "outside";

  return (
    <div className="qf">
      <header className="qf-head qf-wrap">
        <A href="/" aria-label="Curbology home">
          {/* eslint-disable-next-line @next/next/no-img-element -- matches the site's logo, no resizing wanted */}
          <img src="/brand/curbology-logo.png" alt="Curbology Exterior Services" />
        </A>
        <div className="qf-row qf-g12">
          <a className="qf-tel" href={phone.href}>{phone.display}</a>
        </div>
      </header>
      <div className="qf-prog">
        <div className="qf-wrap qf-progrow">
          <strong>Step {stepIndex + 1} of {STEPS.length}: {STEP_NAMES[stepIndex]}</strong>
          <span className="qf-mut qf-num">{percent}%</span>
        </div>
        <div className="qf-bar"><div style={{ width: `${percent}%` }} /></div>
      </div>
      <main className="qf-main qf-wrap">
        <div className="qf-cols">
          <div className="qf-stack qf-g24" style={{ minWidth: 0 }}>{body}</div>
          {showSummary && (
            <div className="qf-aside">
              <aside className="qf-card qf-stack qf-g8 qf-pad18">
                <p className="qf-lb">Your job so far</p>
                <div className="qf-row qf-btw qf-g12 qf-sm"><span className="qf-mut">Address</span><strong className="qf-right">{matched ?? address}</strong></div>
                {chosen.length > 0 && (
                  <div className="qf-row qf-btw qf-g12 qf-sm"><span className="qf-mut">Service</span><strong className="qf-right">{chosen.map((s) => s.name).join(", ")}</strong></div>
                )}
                {photoTotal > 0 && (
                  <div className="qf-row qf-btw qf-g12 qf-sm"><span className="qf-mut">Photos</span><strong className="qf-right">{photoTotal} added</strong></div>
                )}
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
