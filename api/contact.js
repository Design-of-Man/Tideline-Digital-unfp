/**
 * designofman.com enquiry endpoint: stores every submission, then emails it.
 *
 * Replaces FormSubmit, which went down on 2026-10-28 (Cloudflare 521) and took
 * this site's two forms (home and /contact) with it. Same pattern as the
 * client sites' /api/lead (see Design-of-Man/elite api/lead.js):
 *
 *   1. Store the enquiry through the shared `contact-lead` Supabase Edge
 *      Function (portal project, table public.leads, site "designofman.com").
 *      It needs no secret here, so an enquiry is kept even if email fails.
 *   2. Email it through Resend (LEAD_TO, optional LEAD_CC, from LEAD_FROM),
 *      with reply-to set to the sender so a reply goes straight back.
 *   3. If CONFIRM_FROM is set, send the sender a short "we got it" note: their
 *      first name and fixed text only, never what they wrote.
 *
 * Success means stored OR emailed. JSON callers get {"success":"true"|"false"}
 * (the shape site.js already checks). A plain no-JS form post is redirected to
 * its `_next` (same site only) on success, or shown a short error page.
 *
 * Zero dependencies, CommonJS: the site deploys with no install step.
 *
 * Environment (Vercel project tideline-digital-unfp):
 *   RESEND_API_KEY  enables email. Without it enquiries are stored only.
 *   LEAD_TO         comma-separated recipients (hello@designofman.com)
 *   LEAD_CC         optional comma-separated copies
 *   LEAD_FROM       verified Resend sender, "Name <addr@designofman.com>"
 *   CONFIRM_FROM    optional sender for the confirmation to the visitor
 */

"use strict";

const { officeEmail, confirmEmail } = require("./_email.js");

const SITE = "designofman.com";
const PHONE = "(561) 324-1658";
const STUDIO = "Design of Man";
const BRAND = { name: STUDIO, color: "#10242b", accent: "#e5623a", accentInk: "#ffffff", who: "sender" };

const TIMEOUT_MS = 8000;
const FN_URL = "https://iiabylugbnmcdzqjenus.supabase.co/functions/v1/contact-lead";
// Publishable key: public by design. The leads table has RLS with no policies;
// every write goes through the Edge Function, which holds the real key.
const ANON_KEY = "sb_publishable_i5weJFCr68SAOsBaErXaFw_A3HrshPP";

const OK = { success: "true" };
const NOT_OK = { success: "false" };

// Form controls and the consent tick are not part of the enquiry itself.
const SKIP = new Set(["source", "consent", "kind"]);

function clean(v, max) {
  if (typeof v === "number") v = String(v);
  return typeof v === "string" ? v.replace(/[\r\n]+/g, " ").trim().slice(0, max) : "";
}
function cleanBlock(v, max) {
  return typeof v === "string" ? v.replace(/\r\n?/g, "\n").trim().slice(0, max) : "";
}
function list(v) {
  return String(v || "").split(",").map((a) => a.trim()).filter(Boolean);
}
function emailOk(e) {
  return /^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(e);
}

function finish(req, res, body, ok) {
  const wantsJson = /json/i.test(String(req.headers["content-type"] || "")) ||
    /json/i.test(String(req.headers.accept || ""));
  if (!wantsJson) {
    let next = "/contact?sent=1";
    try {
      const u = new URL(String(body._next || next), "https://www." + SITE);
      if (u.hostname.replace(/^www\./, "") === SITE) next = u.pathname + u.search;
    } catch (e) { /* keep the default */ }
    if (ok) {
      res.statusCode = 303;
      res.setHeader("Location", next);
      return res.end();
    }
    res.statusCode = 502;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>That did not go through</title><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:3rem auto;padding:0 1rem;line-height:1.5"><h1>That did not go through</h1><p>Please email <a href="mailto:hello@designofman.com">hello@designofman.com</a> or call <a href="tel:+15613241658">${PHONE}</a>.</p><p><a href="javascript:history.back()">Go back</a></p></body>`);
  }
  res.statusCode = ok ? 200 : 502;
  res.setHeader("Content-Type", "application/json");
  return res.end(JSON.stringify(ok ? OK : NOT_OK));
}

async function resend(payload) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!r.ok) throw new Error(`resend ${r.status} ${await r.text()}`);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.statusCode = 405;
    return res.end();
  }
  const body = req.body && typeof req.body === "object" ? req.body : {};

  // Honeypot: a bot gets a cheerful success and nothing is kept.
  if (clean(body._honey, 100)) return finish(req, res, body, true);

  const name = clean(body.name, 200);
  const email = clean(body.email, 200);
  const source = clean(body.source, 60) || "contact-form";
  if (!name || !emailOk(email)) return finish(req, res, body, false);

  // A no-JS post still carries the "kind" radio; fold it in the way site.js does.
  if (clean(body.kind, 20) === "question" && !clean(body.project, 120)) body.project = "Just a question";

  const fields = [];
  for (const [k, v] of Object.entries(body)) {
    if (k.startsWith("_") || SKIP.has(k)) continue;
    const val = k === "message" ? cleanBlock(v, 5000) : clean(Array.isArray(v) ? v.join(", ") : v, 400);
    if (val) fields.push([k, val]);
  }
  const project = clean(body.project, 120);
  const text = fields.map(([k, v]) => `${k}: ${v}`).join("\n");

  const fwd = req.headers["x-forwarded-for"];
  let stored = false;
  try {
    const r = await fetch(FN_URL, {
      method: "POST",
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        // The store requires a phone; this form asks for email instead.
        name, phone: "(none given)", email, reason: project || null,
        message: text.slice(0, 4000), site: SITE, source,
        user_agent: clean(req.headers["user-agent"], 500) || null,
        ip: (typeof fwd === "string" ? fwd.split(",")[0].trim() : "") || null,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    stored = r.ok && await r.json().then((d) => String(d && d.success) === "true").catch(() => false);
    if (!stored) console.error("contact: store failed", r.status);
  } catch (err) {
    console.error("contact: store threw", err && err.message);
  }

  let emailed = false;
  const to = list(process.env.LEAD_TO);
  const isQuestion = project === "Just a question";
  if (process.env.RESEND_API_KEY && to.length && process.env.LEAD_FROM) {
    const payload = {
      from: process.env.LEAD_FROM,
      to,
      reply_to: email,
      subject: `${isQuestion ? "Website question" : "New enquiry"} from designofman.com — ${name}`,
      html: officeEmail({
        brand: BRAND,
        title: isQuestion ? "New website question" : "New project enquiry",
        fields,
        meta: { site: SITE, source: source.replace(/-/g, " ") },
      }),
      text: text + `\n\n-- Sent from ${SITE} (${source}). Saved: ${stored ? "yes" : "NO, keep this email"}.`,
    };
    const cc = list(process.env.LEAD_CC);
    if (cc.length) payload.cc = cc;
    try {
      await resend(payload);
      emailed = true;
    } catch (err) {
      console.error("contact: email failed", err && err.message);
    }
  } else {
    console.warn("contact: stored only, email not configured (RESEND_API_KEY / LEAD_TO / LEAD_FROM)");
  }

  if ((stored || emailed) && process.env.RESEND_API_KEY && process.env.CONFIRM_FROM) {
    const first = /https?:|www\.|[<>]/i.test(name) ? "there" : name.split(/\s+/)[0];
    const promise = "Your message came through, and a real person will reply within one business day.";
    try {
      await resend({
        from: process.env.CONFIRM_FROM,
        to: [email],
        reply_to: to[0] || "hello@designofman.com",
        subject: `We got your message: ${STUDIO}`,
        html: confirmEmail({ brand: BRAND, first, phone: PHONE, site: "www." + SITE, ref: "", promise }),
        text: [`Hi ${first},`, "", `Thanks for getting in touch with ${STUDIO}. ${promise}`, "",
          `If it can't wait, call us at ${PHONE}.`, "", STUDIO, `https://www.${SITE}`].join("\n"),
      });
    } catch (err) {
      console.error("contact: confirmation failed", err && err.message);
    }
  }

  return finish(req, res, body, stored || emailed);
};
