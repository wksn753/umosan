'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type FormContent = {
  title: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  attendeeType: string;
  occasion: string;
  rating: string;
  lookingForwardTo: string;
  futureEventSuggestion: string;
};

type RegistrationApiResponse = {
  success: boolean;
  data?: string;
  requestId?: string;
  error?: string;
};

const visualImage = "/images/umosan-community.jpg";
const umosanLogo ="/images/umosan-logo.png";
const mustLogo = "/images/must-logo.png";

const initialFormContent: FormContent = {
  title: "",
  email: "",
  fullName: "",
  phoneNumber: "",
  attendeeType: "",
  occasion: "",
  rating: "",
  lookingForwardTo: "",
  futureEventSuggestion: "",
};

export default function RegistrationPage() {
  const [formContent, setFormContent] =
    useState<FormContent>(initialFormContent);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionRequestId, setSubmissionRequestId] = useState<string | null>(null);
  const [introPhase, setIntroPhase] = useState<"showing" | "leaving" | "done">("showing");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const fadeTimer = window.setTimeout(() => {
      setIntroPhase("leaving");
    }, 2400);

    const finishTimer = window.setTimeout(() => {
      setIntroPhase("done");
      document.body.style.overflow = previousOverflow;
    }, 3000);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(finishTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    setFormContent((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (submitError) setSubmitError(null);
    if (submitted) setSubmitted(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    const startedAt = performance.now();
    let requestIdForLog: string | undefined;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20_000);

    setIsSubmitting(true);
    setSubmitted(false);
    setSubmitError(null);
    setSubmissionRequestId(null);

    const payload = {
      Name: [formContent.title.trim(), formContent.fullName.trim()]
        .filter(Boolean)
        .join(" "),
      Email: formContent.email.trim(),
      Phone: formContent.phoneNumber.trim(),
      Type: formContent.attendeeType,
      EventName: formContent.occasion.trim().toUpperCase(),
      Rating: formContent.rating,
      LookingForwardTo: formContent.lookingForwardTo.trim(),
      Suggestion: formContent.futureEventSuggestion.trim(),
    };

    // Keep UI logs useful without printing personal data such as name,
    // email or phone number into the browser console.
    console.info("[registration-ui] submit_started", {
      attendeeType: payload.Type,
      eventName: payload.EventName,
      hasRating: Boolean(payload.Rating),
    });

    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      let result: RegistrationApiResponse | null = null;

      try {
        result = (await response.json()) as RegistrationApiResponse;
      } catch {
        // The route should always return JSON, but handle malformed responses
        // gracefully so the user still gets a useful error state.
      }

      if (!response.ok || !result?.success) {
        const requestId = result?.requestId;
        const message =
          result?.error ||
          (response.status >= 500
            ? "The registration service is temporarily unavailable. Please try again shortly."
            : "We could not submit your registration. Please check your details and try again.");

        requestIdForLog = requestId;
        setSubmissionRequestId(requestId ?? null);
        throw new Error(message);
      }

      requestIdForLog = result.requestId;
      setSubmissionRequestId(result.requestId ?? null);
      setSubmitted(true);
      setFormContent(initialFormContent);

      console.info("[registration-ui] submit_succeeded", {
        requestId: result.requestId,
        durationMs: Math.round(performance.now() - startedAt),
      });
    } catch (error) {
      const isAbortError =
        error instanceof DOMException && error.name === "AbortError";

      const message = isAbortError
        ? "The request took too long. Please check your connection and try again."
        : error instanceof Error
          ? error.message
          : "Something went wrong while submitting your registration. Please try again.";

      setSubmitError(message);

      console.error("[registration-ui] submit_failed", {
        requestId: requestIdForLog,
        durationMs: Math.round(performance.now() - startedAt),
        reason: isAbortError ? "timeout" : message,
      });
    } finally {
      window.clearTimeout(timeoutId);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {introPhase !== "done" && (
        <div
          className={`introLoader ${introPhase === "leaving" ? "introLoaderLeaving" : ""}`}
          role="status"
          aria-live="polite"
          aria-label="Loading UMOSAN MUST Chapter"
        >
          <div className="introInner">
            <div className="introLogos" aria-hidden="true">
              <div className="introLogo introLogoUmosan">
                <img src={umosanLogo} alt="" />
              </div>

              <div className="introJoin" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>

              <div className="introLogo introLogoMust">
                <img src={mustLogo} alt="" />
              </div>
            </div>

            <div className="introCopy">
              <strong>UMOSAN — MUST CHAPTER</strong>
              <span>Connection • Community • Impact</span>
            </div>

            <div className="introProgress" aria-hidden="true">
              <span />
            </div>
          </div>
        </div>
      )}

      <div
        className={`siteContent ${introPhase === "showing" ? "siteContentWaiting" : "siteContentReady"}`}
      >
      <main className="page">
        {/* Navigation */}
        <nav className="nav">
          <a className="navLogo" href="#" aria-label="UMOSAN MUST Chapter home">
            <span className="logoPlaceholder">
              <img
                src={umosanLogo}
                alt="UMOSAN logo"
              />
            </span>
            <span className="logoPlaceholder">
              <img
                src={mustLogo}
                alt="Mbarara University of Science and Technology logo"
              />
            </span>
            <span className="srOnly">UMOSAN — MUST Chapter</span>
          </a>

          <div className="navlinks" aria-label="Primary navigation">
            <a href="#">Home</a>
            <a href="#">About</a>
            <a href="#">Events</a>
            <a href="#">Alumni</a>
          </div>

          <a className="registerNavBtn" href="#registration-form">
            Register now
            <span aria-hidden="true">↗</span>
          </a>
        </nav>

        {/* Hero */}
        <section className="hero">
          <h1>
            Welcome
            <br />
            to <span className="green">UMOSAN</span>
            <br />
            MUST Chapter
          </h1>

          <div className="heroBurst" aria-hidden="true">
            <svg viewBox="0 0 520 520">
              <defs>
                <path
                  id="heroBurstBlade"
                  d="M 248 196 L 214 112 L 228 52 L 292 52 L 306 112 L 272 196 Z"
                />

                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
                  <clipPath key={angle} id={`heroBladeClip${angle}`}>
                    <use href="#heroBurstBlade" transform={`rotate(${angle} 260 260)`} />
                  </clipPath>
                ))}

                <clipPath id="heroBladeCore">
                  <circle cx="260" cy="260" r="80" />
                </clipPath>
              </defs>

              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
                <g key={angle} clipPath={`url(#heroBladeClip${angle})`}>
                  <image
                    href={visualImage}
                    x="0"
                    y="0"
                    width="520"
                    height="520"
                    preserveAspectRatio="xMidYMid slice"
                  />
                </g>
              ))}

              <g clipPath="url(#heroBladeCore)">
                <image
                  href={visualImage}
                  x="0"
                  y="0"
                  width="520"
                  height="520"
                  preserveAspectRatio="xMidYMid slice"
                />
              </g>
            </svg>
          </div>

          <div className="heroSide">
            <div className="kicker">
              REGISTER TODAY{" "}
              <span className="green">// open to all members</span>
            </div>

            <p>
              Fill in the nine quick fields below to reserve a seat at this
              occasion and tell us what you&apos;d like the chapter to build
              next.
            </p>
          </div>
        </section>

        {/* Chapter marketing */}
        <section className="chapterPitch" aria-labelledby="chapter-pitch-title">
          <div className="chapterPitchIntro">
            <div className="eyebrow">BUILT FOR THE MUST COMMUNITY</div>
            <h2 id="chapter-pitch-title">
              STAY CONNECTED.
              <br />
              <span>SHOW UP. SHAPE WHAT&apos;S NEXT.</span>
            </h2>
          </div>

          <div className="chapterPitchCopy">
            <p>
              UMOSAN — MUST Chapter brings members, alumni and invited guests
              together around meaningful occasions, professional connections
              and ideas that keep the chapter moving forward.
            </p>
            <a href="#registration-form" className="textLink">
              Join the next occasion <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="pitchPoints">
            <article>
              <span className="pitchNumber">01</span>
              <div>
                <h3>Connect</h3>
                <p>Meet fellow MUST members and alumni across careers, industries and generations.</p>
              </div>
            </article>

            <article>
              <span className="pitchNumber">02</span>
              <div>
                <h3>Participate</h3>
                <p>Register for chapter occasions, reconnect with the community and take part in what matters.</p>
              </div>
            </article>

            <article>
              <span className="pitchNumber">03</span>
              <div>
                <h3>Build</h3>
                <p>Share feedback and suggest future events so the chapter grows around what members value.</p>
              </div>
            </article>
          </div>
        </section>

        {/* Visual */}
        <section className="visualRow">
          <div className="photoBlock">
            <div className="burstVisual">
              <svg
                viewBox="0 0 520 520"
                role="img"
                aria-label="UMOSAN community image displayed in a flat-edged radial image frame"
              >
                <defs>
                  {/* Flat-edged blade shape, closer to the supplied sample. */}
                  <path
                    id="burstBlade"
                    d="M 248 196 L 214 112 L 228 52 L 292 52 L 306 112 L 272 196 Z"
                  />

                  <radialGradient id="frameGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#8DFF4F" stopOpacity="0.12" />
                    <stop offset="70%" stopColor="#0B5C8E" stopOpacity="0.06" />
                    <stop offset="100%" stopColor="#031827" stopOpacity="0" />
                  </radialGradient>

                  {/* Individual clip paths let every blade reveal the same
                      underlying photo position, so the burst reads as one
                      normal image instead of a repeated/kaleidoscope pattern. */}
                  <clipPath id="bladeClip0"><use href="#burstBlade" transform="rotate(0 260 260)" /></clipPath>
                  <clipPath id="bladeClip30"><use href="#burstBlade" transform="rotate(30 260 260)" /></clipPath>
                  <clipPath id="bladeClip60"><use href="#burstBlade" transform="rotate(60 260 260)" /></clipPath>
                  <clipPath id="bladeClip90"><use href="#burstBlade" transform="rotate(90 260 260)" /></clipPath>
                  <clipPath id="bladeClip120"><use href="#burstBlade" transform="rotate(120 260 260)" /></clipPath>
                  <clipPath id="bladeClip150"><use href="#burstBlade" transform="rotate(150 260 260)" /></clipPath>
                  <clipPath id="bladeClip180"><use href="#burstBlade" transform="rotate(180 260 260)" /></clipPath>
                  <clipPath id="bladeClip210"><use href="#burstBlade" transform="rotate(210 260 260)" /></clipPath>
                  <clipPath id="bladeClip240"><use href="#burstBlade" transform="rotate(240 260 260)" /></clipPath>
                  <clipPath id="bladeClip270"><use href="#burstBlade" transform="rotate(270 260 260)" /></clipPath>
                  <clipPath id="bladeClip300"><use href="#burstBlade" transform="rotate(300 260 260)" /></clipPath>
                  <clipPath id="bladeClip330"><use href="#burstBlade" transform="rotate(330 260 260)" /></clipPath>
                  <clipPath id="bladeCore">
                    <circle cx="260" cy="260" r="80" />
                  </clipPath>
                </defs>

                <circle cx="260" cy="260" r="236" fill="url(#frameGlow)" />

                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
                  <g key={angle} clipPath={`url(#bladeClip${angle})`}>
                    <image
                      href={visualImage}
                      x="0"
                      y="0"
                      width="520"
                      height="520"
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </g>
                ))}

                <g clipPath="url(#bladeCore)">
                  <image
                    href={visualImage}
                    x="0"
                    y="0"
                    width="520"
                    height="520"
                    preserveAspectRatio="xMidYMid slice"
                  />
                </g>
              </svg>
            </div>
          </div>

          <div className="sideStack">
            <div className="infoCard">
              <div className="infoHead">
                <strong>This occasion</strong>
                <span>›</span>
              </div>

              <div className="infoRow">
                <span>Type</span>
                <b>Chapter meetup</b>
              </div>

              <div className="infoRow">
                <span>Status</span>
                <em>Registration open</em>
              </div>

              <div className="infoRow">
                <span>Seats left</span>
                <b>Limited</b>
              </div>
            </div>

            <div className="infoCard blueCard">
              <div className="infoHead">
                <strong>Rate last occasion</strong>
                <span>›</span>
              </div>

              <div className="infoRow">
                <span>Average score</span>
                <b>4.6 / 5</b>
              </div>
            </div>
          </div>
        </section>

        {/* Form */}
        <form id="registration-form" onSubmit={handleSubmit}>
          <div className="formList">
            <Field number="01" label="Title" hint="Mr / Mrs / Ms / Dr">
              <select
                name="title"
                value={formContent.title}
                onChange={handleChange}
                required
              >
                <option value="">Select title</option>
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Ms">Ms</option>
                <option value="Dr">Dr</option>
                <option value="Prof">Prof</option>
              </select>
            </Field>

            <Field
              number="02"
              label="Email address"
              hint="you@example.com"
            >
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formContent.email}
                onChange={handleChange}
                required
              />
            </Field>

            <Field
              number="03"
              label="Full name"
              hint="First and last name"
            >
              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formContent.fullName}
                onChange={handleChange}
                required
              />
            </Field>

            <Field
              number="04"
              label="Phone number"
              hint="+256 7XX XXX XXX"
            >
              <input
                type="tel"
                name="phoneNumber"
                placeholder="+256 7XX XXX XXX"
                value={formContent.phoneNumber}
                onChange={handleChange}
                required
              />
            </Field>

            <Field
              number="05"
              label="Member or invited guest"
              hint="Choose one"
              accent
            >
              <select
                name="attendeeType"
                value={formContent.attendeeType}
                onChange={handleChange}
                required
              >
                <option value="">Choose one</option>
                <option value="member">UMOSAN Member</option>
                <option value="guest">Invited Guest</option>
              </select>
            </Field>

            <Field
              number="06"
              label="Occasion attending"
              hint="Name of the occasion"
            >
              <input
                type="text"
                name="occasion"
                placeholder="Enter occasion"
                value={formContent.occasion}
                onChange={handleChange}
                required
              />
            </Field>

            <Field
              number="07"
              label="Rate the occasion"
              hint="1 to 5 stars"
              blue
            >
              <select
                name="rating"
                value={formContent.rating}
                onChange={handleChange}
              >
                <option value="">Select rating</option>
                <option value="1">1 — Poor</option>
                <option value="2">2 — Fair</option>
                <option value="3">3 — Good</option>
                <option value="4">4 — Very good</option>
                <option value="5">5 — Excellent</option>
              </select>
            </Field>

            <Field
              number="08"
              label="Looking forward to"
              hint="What are you most keen on?"
              textarea
            >
              <textarea
                name="lookingForwardTo"
                placeholder="Tell us what you're looking forward to..."
                value={formContent.lookingForwardTo}
                onChange={handleChange}
                rows={3}
              />
            </Field>

            <Field
              number="09"
              label="Suggest a future event"
              hint="What should the association organize next?"
              textarea
            >
              <textarea
                name="futureEventSuggestion"
                placeholder="Suggest an event..."
                value={formContent.futureEventSuggestion}
                onChange={handleChange}
                rows={3}
              />
            </Field>
          </div>

          <div className="submitBar">
            <div>
              <strong>Submit registration</strong>
              <p>Confirmation is sent to your email once received.</p>
            </div>

            <button
              type="submit"
              className="submitBtn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending registration..." : "Register now"}
            </button>
          </div>

          <div className="submissionFeedback" aria-live="polite" aria-atomic="true">
            {submitError && (
              <div className="errorMessage" role="alert">
                <strong>Registration not sent</strong>
                <span>{submitError}</span>
                {submissionRequestId && (
                  <small>Reference: {submissionRequestId}</small>
                )}
              </div>
            )}

            {submitted && (
              <div className="successMessage" role="status">
                <strong>Registration received</strong>
                <span>Your details were submitted successfully.</span>
                {submissionRequestId && (
                  <small>Reference: {submissionRequestId}</small>
                )}
              </div>
            )}
          </div>
        </form>

        <footer className="foot">
          <div className="footMain">
            <div className="footBrand">
              <strong>UMOSAN — MUST CHAPTER</strong>
              <span>Mbarara University of Science and Technology</span>
            </div>

            <div className="footContact">
              <span>Chapter contact</span>
              <a href="mailto:umosanmustchapter@gmail.com">umosanmustchapter@gmail.com</a>
            </div>

            <div className="footPowered">
              <span>Powered by</span>
              <a
                href="https://www.baseight.com/"
                target="_blank"
                rel="noreferrer"
              >
                Base Eight Limited ↗
              </a>
            </div>
          </div>

          <div className="footBottom">
            <span>UMOSAN-MUST Chapter</span>
            <span>Connection • Community • Impact</span>
          </div>
        </footer>
      </main>
      </div>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700;800&display=swap");

        :root {
          --ink: #071821;
          --navy: #031827;
          --navy-2: #08263a;
          --ocean: #0b5c8e;
          --ocean-2: #0d7aa7;
          --green: #8dff4f;
          --green-deep: #35d07f;
          --green-tint: #efffe7;
          --sky-tint: #eaf7fb;
          --white: #ffffff;
          --soft: #f5f9fb;
          --gray: #667783;
          --line: #cfe0e7;
          --line-strong: #a8c7d4;
        }

        .introLoader {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          min-height: 100dvh;
          padding: 24px;
          background:
            radial-gradient(circle at 50% 42%, rgba(13, 122, 167, 0.22), transparent 30%),
            linear-gradient(145deg, #02131f 0%, #031827 55%, #073750 100%);
          opacity: 1;
          visibility: visible;
          transition: opacity 600ms cubic-bezier(0.22, 1, 0.36, 1), visibility 600ms ease;
        }

        .introLoader::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: radial-gradient(circle at center, black 10%, transparent 72%);
          pointer-events: none;
        }

        .introLoaderLeaving {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }

        .introInner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: min(92vw, 520px);
          text-align: center;
        }

        .introLogos {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(16px, 4vw, 34px);
        }

        .introLogo {
          width: clamp(92px, 18vw, 138px);
          aspect-ratio: 1 / 1;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 50%;
          background: #ffffff;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.12),
            0 22px 60px rgba(0,0,0,0.32);
          animation: introLogoReveal 800ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .introLogoMust {
          animation-delay: 120ms;
        }

        .introLogo img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .introJoin {
          width: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          animation: introJoinReveal 500ms ease 520ms both;
        }

        .introJoin span {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 16px rgba(141,255,79,0.65);
        }

        .introCopy {
          margin-top: 26px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          animation: introCopyReveal 650ms ease 520ms both;
        }

        .introCopy strong {
          color: #ffffff;
          font-family: "Archivo Black", sans-serif;
          font-size: clamp(16px, 3vw, 21px);
          letter-spacing: -0.02em;
        }

        .introCopy span {
          color: #8fb2c2;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .introProgress {
          width: min(260px, 64vw);
          height: 2px;
          margin-top: 28px;
          overflow: hidden;
          background: rgba(255,255,255,0.12);
        }

        .introProgress span {
          display: block;
          width: 100%;
          height: 100%;
          transform-origin: left center;
          background: linear-gradient(90deg, var(--green-deep), var(--green));
          animation: introProgress 2.75s cubic-bezier(0.2, 0.7, 0.2, 1) both;
        }

        .siteContent {
          opacity: 0;
          transform: translateY(12px) scale(0.995);
          transition:
            opacity 650ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 650ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .siteContentWaiting {
          pointer-events: none;
        }

        .siteContentReady {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        @keyframes introLogoReveal {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.82);
            filter: blur(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes introJoinReveal {
          from { opacity: 0; transform: scaleX(0.3); }
          to { opacity: 1; transform: scaleX(1); }
        }

        @keyframes introCopyReveal {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes introProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .introLogo,
          .introJoin,
          .introCopy,
          .introProgress span {
            animation: none !important;
          }

          .introLoader,
          .siteContent {
            transition-duration: 1ms !important;
          }
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          min-height: 100%;
          background:
            radial-gradient(circle at 92% 8%, rgba(141, 255, 79, 0.18), transparent 20%),
            radial-gradient(circle at 7% 36%, rgba(13, 122, 167, 0.28), transparent 24%),
            var(--navy);
          color: var(--ink);
          font-family: "Inter", sans-serif;
        }

        button,
        input,
        select,
        textarea {
          font: inherit;
        }

        button {
          border: 0;
        }

        .page {
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }

        .nav {
          width: 100%;
          min-height: 72px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 24px;
          padding: 0 clamp(20px, 3vw, 48px);
          margin: 0;
          background: var(--navy);
          border: 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.10);
          position: relative;
          z-index: 20;
        }

        .navLogo {
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          gap: 9px;
          text-decoration: none;
          justify-self: start;
        }

        .logoPlaceholder {
          width: 44px;
          min-width: 44px;
          height: 44px;
          flex: 0 0 44px;
          aspect-ratio: 1 / 1;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 50%;
          background: #ffffff;
          overflow: hidden;
          color: rgba(255, 255, 255, 0.72);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .logoPlaceholder img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .navLogo:hover .logoPlaceholder {
          border-color: var(--green);
          color: var(--green);
        }

        .srOnly {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .navlinks {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 4px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          backdrop-filter: blur(10px);
        }

        .navlinks a {
          padding: 8px 16px;
          color: rgba(255, 255, 255, 0.82);
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;
          transition: background 150ms ease, color 150ms ease;
        }

        .navlinks a:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .registerNavBtn {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          justify-self: end;
          padding: 0 18px;
          background: var(--green);
          color: #062820;
          text-decoration: none;
          border-radius: 2px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.035em;
          box-shadow: 0 8px 22px rgba(141, 255, 79, 0.12);
          transition: transform 150ms ease, filter 150ms ease;
        }

        .registerNavBtn:hover {
          transform: translateY(-1px);
          filter: brightness(1.04);
        }

        .registerNavBtn span {
          font-size: 15px;
          line-height: 1;
        }

        .hero {
          width: 100%;
          min-height: 500px;
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
          gap: clamp(36px, 6vw, 92px);
          align-items: end;
          margin: 0;
          padding: clamp(54px, 7vw, 96px) clamp(28px, 7vw, 108px);
          position: relative;
          overflow: hidden;
          background:
            linear-gradient(90deg, rgba(3, 24, 39, 0.98) 0%, rgba(3, 24, 39, 0.92) 48%, rgba(11, 92, 142, 0.62) 100%),
            radial-gradient(circle at 84% 35%, rgba(141, 255, 79, 0.28), transparent 26%),
            linear-gradient(135deg, var(--navy-2), var(--ocean));
          border-radius: 0;
          border: 0;
          border-bottom: 1px solid rgba(141, 255, 79, 0.18);
        }

        .hero h1,
        .heroSide {
          position: relative;
          z-index: 3;
        }

        .heroBurst {
          position: absolute;
          top: clamp(24px, 4vw, 54px);
          right: clamp(28px, 6vw, 92px);
          width: clamp(220px, 24vw, 340px);
          aspect-ratio: 1;
          z-index: 1;
          pointer-events: none;
          filter: drop-shadow(0 22px 34px rgba(0, 0, 0, 0.24));
        }

        .heroBurst svg {
          width: 100%;
          height: 100%;
          display: block;
          overflow: visible;
        }

        .hero h1 {
          font-family: "Archivo Black", sans-serif;
          font-size: clamp(48px, 6.8vw, 82px);
          line-height: 0.88;
          margin: 0;
          color: var(--white);
          text-transform: uppercase;
          letter-spacing: -0.04em;
        }

        .green {
          color: var(--green);
        }

        .heroSide {
          align-self: end;
          max-width: 360px;
          padding: 22px;
          background: rgba(2, 21, 34, 0.7);
          border: 1px solid rgba(141, 255, 79, 0.25);
          border-radius: 2px;
          backdrop-filter: blur(8px);
        }

        .kicker {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.045em;
          text-transform: uppercase;
          margin-bottom: 10px;
          color: var(--white);
        }

        .heroSide p {
          font-size: 14px;
          color: #c8d9e2;
          line-height: 1.65;
          margin: 0;
        }

        .chapterPitch {
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(300px, 0.95fr);
          gap: 34px 72px;
          padding: 46px clamp(28px, 7vw, 108px) 42px;
          background: #ffffff;
          border-top: 1px solid #d7e3e8;
          border-bottom: 1px solid #d7e3e8;
        }

        .chapterPitchIntro .eyebrow {
          margin-bottom: 12px;
          color: var(--ocean);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.14em;
        }

        .chapterPitchIntro h2 {
          margin: 0;
          max-width: 720px;
          font-family: "Archivo Black", sans-serif;
          font-size: clamp(32px, 4.2vw, 58px);
          line-height: 0.94;
          letter-spacing: -0.035em;
          color: var(--navy);
        }

        .chapterPitchIntro h2 span {
          color: var(--green-deep);
        }

        .chapterPitchCopy {
          align-self: end;
          max-width: 520px;
          padding-bottom: 3px;
        }

        .chapterPitchCopy p {
          margin: 0 0 18px;
          color: #4f6672;
          font-size: 14px;
          line-height: 1.75;
        }

        .textLink {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--navy);
          text-decoration: none;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.045em;
          border-bottom: 2px solid var(--green);
          padding-bottom: 5px;
        }

        .pitchPoints {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          border-top: 1px solid #cfe0e7;
          border-bottom: 1px solid #cfe0e7;
        }

        .pitchPoints article {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 15px;
          min-height: 138px;
          padding: 24px 26px 24px 0;
        }

        .pitchPoints article + article {
          border-left: 1px solid #cfe0e7;
          padding-left: 26px;
        }

        .pitchNumber {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          background: var(--green);
          color: var(--navy);
          font-family: "Archivo Black", sans-serif;
          font-size: 11px;
        }

        .pitchPoints h3 {
          margin: 1px 0 7px;
          color: var(--navy);
          font-family: "Archivo Black", sans-serif;
          font-size: 16px;
          text-transform: uppercase;
        }

        .pitchPoints p {
          margin: 0;
          color: #60747f;
          font-size: 12px;
          line-height: 1.6;
        }

        .visualRow {
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.8fr);
          gap: 8px;
          margin: 0;
          padding: 8px;
          background: var(--green);
        }

        .photoBlock {
          min-height: 420px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 65% 30%, rgba(141,255,79,0.16), transparent 20%),
            linear-gradient(145deg, #0a3b59, #031827 66%);
          border: 1px solid rgba(141, 255, 79, 0.18);
          border-radius: 0;
        }

        .photoBlock::before {
          content: "CHAPTER / CONNECTION / IMPACT";
          position: absolute;
          left: 20px;
          top: 18px;
          color: rgba(255,255,255,0.52);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .burstVisual {
          width: min(82vw, 600px);
          aspect-ratio: 1;
          display: grid;
          place-items: center;
          position: relative;
          z-index: 2;
        }

        .burstVisual svg {
          display: block;
          width: 100%;
          height: 100%;
          overflow: visible;
          filter: drop-shadow(0 28px 46px rgba(0, 0, 0, 0.30));
        }

        .sideStack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .infoCard {
          background: var(--navy-2);
          color: var(--white);
          border-radius: 0;
          padding: 22px;
          flex: 1;
          border: 1px solid rgba(141, 255, 79, 0.16);
        }

        .blueCard {
          background: linear-gradient(135deg, var(--ocean), #083f64);
          border-color: rgba(255,255,255,0.12);
        }

        .infoHead {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .infoHead strong {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .infoHead span {
          color: var(--green);
          font-size: 22px;
        }

        .blueCard .infoHead span {
          color: var(--green);
        }

        .infoRow {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          font-size: 12px;
          padding: 11px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.11);
          color: #a9c1cd;
        }

        .blueCard .infoRow {
          border-top-color: rgba(255, 255, 255, 0.14);
          color: #c7e7f1;
        }

        .infoRow b {
          color: var(--white);
          font-weight: 700;
        }

        .infoRow em {
          color: var(--green);
          font-style: normal;
          font-weight: 800;
        }

        form {
          width: calc(100% - 48px);
          max-width: 1180px;
          margin: 32px auto 0;
          padding: 30px;
          background: var(--soft);
          border: 1px solid rgba(255,255,255,0.8);
          border-radius: 2px;
          box-shadow: 0 24px 60px rgba(0, 13, 24, 0.25);
        }

        .formList {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .fieldRow {
          display: grid;
          grid-template-columns: minmax(220px, 0.72fr) minmax(300px, 1.28fr);
          gap: 28px;
          align-items: center;
          padding: 16px 18px;
          background: #ffffff;
          border: 1px solid var(--line);
          border-radius: 2px;
          transition:
            border-color 160ms ease,
            box-shadow 160ms ease,
            transform 160ms ease;
        }

        .fieldRow:hover {
          border-color: var(--line-strong);
        }

        .fieldRow:focus-within {
          border-color: var(--ocean-2);
          box-shadow: 0 0 0 3px rgba(13, 122, 167, 0.12);
        }

        .fieldRow.accent {
          background: linear-gradient(90deg, var(--green-tint), #ffffff 45%);
          border-color: rgba(53, 208, 127, 0.48);
        }

        .fieldRow.blue {
          background: linear-gradient(90deg, var(--sky-tint), #ffffff 45%);
          border-color: rgba(11, 92, 142, 0.36);
        }

        .fieldLeft {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .fieldNumber {
          min-width: 42px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: "Archivo Black", sans-serif;
          font-size: 12px;
          color: var(--navy);
          background: var(--green);
          border-radius: 1px;
        }

        .blue .fieldNumber {
          color: var(--white);
          background: var(--ocean);
        }

        .fieldTitle {
          padding-top: 1px;
          font-size: 14px;
          font-weight: 800;
          color: var(--navy);
        }

        .fieldHint {
          font-size: 12px;
          color: var(--gray);
          margin-top: 4px;
          line-height: 1.4;
        }

        .fieldControl {
          width: 100%;
        }

        /* Inputs intentionally look like real form controls rather than text rows */
        .fieldControl input,
        .fieldControl select,
        .fieldControl textarea {
          display: block;
          width: 100%;
          min-height: 50px;
          border: 1.5px solid #9fb9c5;
          outline: none;
          background: #ffffff;
          color: #0b2330;
          padding: 13px 14px;
          border-radius: 2px;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.35;
          box-shadow: inset 0 1px 2px rgba(3, 24, 39, 0.04);
          transition:
            border-color 150ms ease,
            box-shadow 150ms ease,
            background 150ms ease;
        }

        .fieldControl input:hover,
        .fieldControl select:hover,
        .fieldControl textarea:hover {
          border-color: #6d9eb2;
        }

        .fieldControl input:focus,
        .fieldControl select:focus,
        .fieldControl textarea:focus {
          border-color: var(--ocean-2);
          box-shadow: 0 0 0 3px rgba(13, 122, 167, 0.15);
          background: #fbfeff;
        }

        .fieldControl input::placeholder,
        .fieldControl textarea::placeholder {
          color: #8ca0aa;
          font-weight: 500;
        }

        .fieldControl select {
          cursor: pointer;
          appearance: auto;
        }

        .fieldControl textarea {
          min-height: 92px;
          resize: vertical;
        }

        .submitBar {
          margin-top: 24px;
          padding: 22px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          background: linear-gradient(100deg, var(--navy) 0%, #06334b 100%);
          border-radius: 2px;
          border: 1px solid rgba(141, 255, 79, 0.18);
        }

        .submitBar strong {
          color: var(--white);
          font-size: 18px;
          font-family: "Archivo Black", sans-serif;
          text-transform: uppercase;
          letter-spacing: -0.02em;
        }

        .submitBar p {
          margin: 5px 0 0;
          color: #a8c2ce;
          font-size: 12px;
        }

        .submitBtn {
          min-height: 48px;
          background: var(--green);
          color: var(--navy);
          font-weight: 900;
          font-size: 12px;
          padding: 13px 24px;
          border-radius: 2px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 140ms ease, filter 140ms ease;
        }

        .submitBtn:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(0.96);
        }

        .submitBtn:disabled {
          opacity: 0.58;
          cursor: not-allowed;
        }

        .submissionFeedback {
          margin-top: 12px;
        }

        .successMessage,
        .errorMessage {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 14px 16px;
          border-radius: 2px;
          font-size: 13px;
        }

        .successMessage {
          background: #eaffdf;
          border: 1px solid #7dda49;
          color: #165b32;
        }

        .errorMessage {
          background: #fff1ef;
          border: 1px solid #d94a3a;
          color: #7f2017;
        }

        .successMessage strong,
        .errorMessage strong {
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .successMessage span,
        .errorMessage span {
          line-height: 1.5;
          font-weight: 600;
        }

        .successMessage small,
        .errorMessage small {
          margin-top: 2px;
          opacity: 0.72;
          font-size: 10px;
          font-weight: 700;
        }

        .foot {
          width: 100%;
          margin: 40px 0 0;
          padding: 0;
          color: #d7e6ec;
          background: #061f30;
          border-top: 5px solid var(--green);
        }

        .footMain {
          width: calc(100% - 48px);
          max-width: 1180px;
          margin: 0 auto;
          padding: 34px 0 30px;
          display: grid;
          grid-template-columns: 1.4fr 0.8fr 0.8fr;
          gap: 36px;
          align-items: start;
        }

        .footBrand,
        .footContact,
        .footPowered {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .footBrand strong {
          color: #ffffff;
          font-family: "Archivo Black", sans-serif;
          font-size: 17px;
          letter-spacing: -0.02em;
        }

        .footBrand span {
          max-width: 440px;
          color: #9fb7c2;
          font-size: 12px;
          line-height: 1.6;
        }

        .footContact > span,
        .footPowered > span {
          color: #7898a6;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .footContact a,
        .footPowered a {
          color: #ffffff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          width: fit-content;
        }

        .footContact a:hover,
        .footPowered a:hover {
          color: var(--green);
        }

        .footPowered a {
          padding-bottom: 3px;
          border-bottom: 1px solid rgba(141, 255, 79, 0.45);
        }

        .footBottom {
          width: calc(100% - 48px);
          max-width: 1180px;
          margin: 0 auto;
          padding: 16px 0 22px;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          color: #7898a6;
          border-top: 1px solid rgba(255, 255, 255, 0.10);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        @media (max-width: 860px) {
          .chapterPitch {
            grid-template-columns: 1fr;
            gap: 20px;
            padding: 34px 22px 30px;
          }

          .chapterPitchCopy {
            max-width: none;
          }

          .pitchPoints {
            grid-template-columns: 1fr;
          }

          .pitchPoints article {
            min-height: auto;
            padding: 20px 0;
          }

          .pitchPoints article + article {
            border-left: 0;
            border-top: 1px solid #cfe0e7;
            padding-left: 0;
          }

          .page {
            padding: 0;
          }

          .navlinks {
            display: none;
          }

          .nav {
            grid-template-columns: 1fr auto;
          }

          .hero {
            grid-template-columns: 1fr;
            min-height: auto;
            padding: 46px 24px;
            gap: 34px;
          }

          .heroSide {
            max-width: none;
          }

          .heroBurst {
            width: min(48vw, 260px);
            right: 18px;
            top: 22px;
            opacity: 0.7;
          }

          .visualRow {
            grid-template-columns: 1fr;
            padding: 6px;
            gap: 6px;
          }

          form {
            width: calc(100% - 28px);
            padding: 20px;
          }

          .fieldRow {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .submitBar {
            flex-direction: column;
            align-items: stretch;
          }

          .submitBtn {
            width: 100%;
          }

          .footMain {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .footBottom {
            flex-direction: column;
            gap: 8px;
          }
        }

        @media (max-width: 520px) {
          .page {
            padding-left: 0;
            padding-right: 0;
          }

          .nav {
            min-height: 66px;
            padding: 0 14px;
          }

          .navLogo {
            gap: 7px;
            flex-shrink: 0;
          }

          .logoPlaceholder {
            width: 38px;
            min-width: 38px;
            height: 38px;
            flex: 0 0 38px;
            aspect-ratio: 1 / 1;
            border-radius: 50%;
            font-size: 8px;
          }

          .registerNavBtn {
            min-height: 38px;
            padding: 0 14px;
            font-size: 10px;
          }

          .hero {
            padding: 36px 18px;
          }

          .hero h1 {
            font-size: clamp(42px, 14vw, 62px);
          }

          .heroBurst {
            width: 180px;
            right: -34px;
            top: 24px;
            opacity: 0.42;
          }

          .photoBlock {
            min-height: 320px;
          }

          form {
            width: calc(100% - 20px);
            padding: 14px;
          }

          .fieldRow {
            padding: 14px;
          }

          .fieldNumber {
            min-width: 38px;
            height: 30px;
          }

          .fieldControl input,
          .fieldControl select,
          .fieldControl textarea {
            min-height: 48px;
            font-size: 16px;
          }
        }
      `}</style>
    </>
  );
}

type FieldProps = {
  number: string;
  label: string;
  hint: string;
  children: React.ReactNode;
  accent?: boolean;
  blue?: boolean;
  textarea?: boolean;
};

function Field({
  number,
  label,
  hint,
  children,
  accent,
  blue,
}: FieldProps) {
  const classNames = [
    "fieldRow",
    accent ? "accent" : "",
    blue ? "blue" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames}>
      <div className="fieldLeft">
        <div className="fieldNumber">{number}</div>

        <div>
          <div className="fieldTitle">{label}</div>
          <div className="fieldHint">{hint}</div>
        </div>
      </div>

      <div className="fieldControl">{children}</div>
    </div>
  );
}
