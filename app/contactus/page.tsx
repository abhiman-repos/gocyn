"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiSend,
  FiUser,
  FiMessageSquare,
  FiClock,
  FiCheckCircle,
  FiArrowUpRight,
  FiShield,
  FiBriefcase,
  FiUsers,
} from "react-icons/fi";

/* =========================================================
   TYPES
========================================================= */

type FormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

/* =========================================================
   INITIAL FORM DATA
========================================================= */

const initialFormData: FormData = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

/* =========================================================
   API CONFIGURATION

   .env.local

   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api

   Request:
   POST http://127.0.0.1:8000/api/contact/
========================================================= */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* =========================================================
   CONTACT PAGE
========================================================= */

export default function ContactPage() {
  const [formData, setFormData] =
    useState<FormData>(initialFormData);

  const [loading, setLoading] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     HANDLE INPUT CHANGE
  ======================================================= */

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  /* =======================================================
     HANDLE FORM SUBMIT
  ======================================================= */

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading) return;

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
    };

    /* Basic validation */

    if (
      !payload.name ||
      !payload.email ||
      !payload.subject ||
      !payload.message
    ) {
      setError("Please complete all required fields.");
      return;
    }

    /* Check API URL */

    if (!API_URL) {
      setError(
        "Contact service is currently unavailable. Please try again later."
      );

      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/contact/`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        }
      );

      let data: {
        message?: string;
        detail?: string;
      } = {};

      /*
        Some APIs may return an empty response,
        so JSON parsing is handled safely.
      */

      try {
        data = await response.json();
      } catch {
        // Empty response body
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.detail ||
            "Unable to send your message. Please try again."
        );
      }

      /* Success */

      setSubmitted(true);

      setFormData(initialFormData);
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Unable to connect to the server. Please check your connection and try again."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     CONTACT INFORMATION
  ======================================================= */

  const contactCards = [
    {
      title: "Email Us",

      description:
        "Questions about internships, opportunities, or the platform?",

      value: "hello@Gocyn.com",

      href: "mailto:hello@Gocyn.com",

      icon: FiMail,
    },

    {
      title: "Call Us",

      description:
        "Reach out to us during our working hours.",

      value: "+917266992591",

      href: "tel:+917266992591",

      icon: FiPhone,
    },

    {
      title: "Our Location",

      description:
        "Connect with us from anywhere or reach us in Madhya Pradesh.",

      value: "Indore, Madhya Pradesh, India",

      href: null,

      icon: FiMapPin,
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-white">

      {/* ================================================= */}
      {/* HERO SECTION */}
      {/* ================================================= */}

      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-blue-50/80 via-white to-white pb-24 pt-28 sm:pb-28 sm:pt-32">

        {/* Background Decorations */}

        <div className="pointer-events-none absolute -left-40 top-10 h-80 w-80 rounded-full bg-blue-100/60 blur-3xl" />

        <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
            }}
            className="mx-auto max-w-4xl text-center"
          >

            {/* Badge */}

            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur">

              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50">

                <FiMail size={14} />

              </span>

              LET&apos;S CONNECT

            </div>

            {/* Main Heading */}

            <h1 className="mt-7 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl md:text-6xl lg:text-7xl">

              We&apos;d love to hear

              <span className="block text-blue-600">
                from you.
              </span>

            </h1>

            {/* Hero Description */}

            <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg md:text-xl">

              Have questions about internships,
              opportunities, partnerships, or Gocyn?
              Get in touch and we&apos;ll be happy to
              help.

            </p>

            {/* Hero Highlights */}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-500">

              <span className="flex items-center gap-2">

                <FiBriefcase className="text-blue-600" />

                Internship Opportunities

              </span>

              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

              <span className="flex items-center gap-2">

                <FiUsers className="text-blue-600" />

                Students & Organizations

              </span>

              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

              <span className="flex items-center gap-2">

                <FiClock className="text-blue-600" />

                Quick Support

              </span>

            </div>

          </motion.div>

        </div>

      </section>

      {/* ================================================= */}
      {/* MAIN CONTACT SECTION */}
      {/* ================================================= */}

      <section className="relative py-16 sm:py-20 lg:py-24">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">

            {/* ================================================= */}
            {/* LEFT SIDE - CONTACT INFORMATION */}
            {/* ================================================= */}

            <motion.div
              initial={{
                opacity: 0,
                x: -30,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
                amount: 0.2,
              }}
              transition={{
                duration: 0.6,
              }}
              className="order-2 lg:order-1 lg:col-span-5"
            >

              {/* Section Heading */}

              <div className="mb-8">

                <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">

                  Contact Information

                </span>

                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">

                  Let&apos;s start a conversation

                </h2>

                <p className="mt-4 max-w-lg leading-7 text-slate-600">

                  Whether you&apos;re a student looking
                  for internship opportunities, an
                  organization interested in connecting
                  with talent, or simply have a question
                  about Gocyn, we&apos;d be happy to
                  hear from you.

                </p>

              </div>

              {/* ================================================= */}
              {/* CONTACT CARDS */}
              {/* ================================================= */}

              <div className="space-y-4">

                {contactCards.map(
                  (item, index) => {

                    const Icon = item.icon;

                    return (

                      <motion.div
                        key={item.title}
                        initial={{
                          opacity: 0,
                          y: 20,
                        }}
                        whileInView={{
                          opacity: 1,
                          y: 0,
                        }}
                        viewport={{
                          once: true,
                        }}
                        transition={{
                          duration: 0.5,
                          delay: index * 0.08,
                        }}
                        whileHover={{
                          y: -4,
                        }}
                        className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-lg sm:p-6"
                      >

                        <div className="flex items-start gap-4">

                          {/* Icon */}

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white">

                            <Icon size={22} />

                          </div>

                          {/* Card Content */}

                          <div className="min-w-0 flex-1">

                            <p className="font-semibold text-slate-900">

                              {item.title}

                            </p>

                            <p className="mt-1 text-sm leading-6 text-slate-500">

                              {item.description}

                            </p>

                            {item.href ? (

                              <a
                                href={item.href}
                                className="mt-2 inline-flex items-center gap-1.5 break-all font-medium text-blue-600 transition hover:text-blue-700"
                              >

                                {item.value}

                                <FiArrowUpRight
                                  size={16}
                                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                />

                              </a>

                            ) : (

                              <p className="mt-2 font-medium text-slate-700">

                                {item.value}

                              </p>

                            )}

                          </div>

                        </div>

                      </motion.div>

                    );
                  }
                )}

              </div>

              {/* ================================================= */}
              {/* WORKING HOURS */}
              {/* ================================================= */}

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">

                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">

                    <FiClock size={21} />

                  </div>

                  <div>

                    <p className="font-semibold text-slate-900">

                      Working Hours

                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">

                      Monday – Friday

                      <br />

                      9:00 AM – 6:00 PM

                    </p>

                  </div>

                </div>

              </div>

              {/* ================================================= */}
              {/* PLATFORM INFO CARD */}
              {/* ================================================= */}

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">

                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">

                    <FiBriefcase size={20} />

                  </div>

                </div>

              </div>

            </motion.div>

            {/* ================================================= */}
            {/* RIGHT SIDE - CONTACT FORM */}
            {/* ================================================= */}

            <motion.div
              initial={{
                opacity: 0,
                y: 35,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
                amount: 0.15,
              }}
              transition={{
                duration: 0.65,
              }}
              className="order-1 lg:order-2 lg:col-span-7"
            >

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.15)] sm:p-8 lg:p-10">

                {/* ================================================= */}
                {/* SUCCESS STATE */}
                {/* ================================================= */}

                {submitted ? (

                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.95,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    className="flex min-h-[540px] flex-col items-center justify-center px-4 text-center"
                    aria-live="polite"
                  >

                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">

                      <FiCheckCircle
                        size={42}
                        className="text-emerald-500"
                      />

                    </div>

                    <h3 className="mt-7 text-2xl font-bold text-slate-950 sm:text-3xl">

                      Message sent successfully!

                    </h3>

                    <p className="mt-3 max-w-md leading-7 text-slate-600">

                      Thank you for reaching out to
                      Gocyn. We&apos;ve received your
                      message and will get back to you
                      as soon as possible.

                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setError("");
                      }}
                      className="mt-8 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >

                      Send another message

                    </button>

                  </motion.div>

                ) : (

                  <>

                    {/* ================================================= */}
                    {/* FORM HEADER */}
                    {/* ================================================= */}

                    <div className="mb-8 border-b border-slate-100 pb-7">

                      <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">

                        Send a message

                      </span>

                      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">

                        How can we help?

                      </h2>

                      <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">

                        Have a question about an
                        internship, the platform, a
                        partnership, or something else?
                        Send us a message.

                      </p>

                    </div>

                    {/* ================================================= */}
                    {/* FORM */}
                    {/* ================================================= */}

                    <form onSubmit={handleSubmit}>

                      {/* NAME + EMAIL */}

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                        {/* NAME */}

                        <div>

                          <label
                            htmlFor="name"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                          >

                            Full Name

                          </label>

                          <div className="relative">

                            <FiUser
                              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                              size={18}
                            />

                            <input
                              id="name"
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              required
                              minLength={2}
                              maxLength={100}
                              autoComplete="name"
                              placeholder="Enter your full name"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                            />

                          </div>

                        </div>

                        {/* EMAIL */}

                        <div>

                          <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                          >

                            Email Address

                          </label>

                          <div className="relative">

                            <FiMail
                              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                              size={18}
                            />

                            <input
                              id="email"
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              required
                              maxLength={254}
                              autoComplete="email"
                              placeholder="you@example.com"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                            />

                          </div>

                        </div>

                      </div>

                      {/* ================================================= */}
                      {/* SUBJECT */}
                      {/* ================================================= */}

                      <div className="mt-5">

                        <label
                          htmlFor="subject"
                          className="mb-2 block text-sm font-semibold text-slate-700"
                        >

                          Subject

                        </label>

                        <input
                          id="subject"
                          type="text"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          minLength={3}
                          maxLength={150}
                          placeholder="Internship enquiry, partnership, support..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />

                      </div>

                      {/* ================================================= */}
                      {/* MESSAGE */}
                      {/* ================================================= */}

                      <div className="mt-5">

                        <div className="mb-2 flex items-center justify-between gap-4">

                          <label
                            htmlFor="message"
                            className="text-sm font-semibold text-slate-700"
                          >

                            Your Message

                          </label>

                          <span className="shrink-0 text-xs text-slate-400">

                            {formData.message.length}
                            /1000

                          </span>

                        </div>

                        <div className="relative">

                          <FiMessageSquare
                            className="pointer-events-none absolute left-4 top-4 text-slate-400"
                            size={18}
                          />

                          <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            minLength={10}
                            maxLength={1000}
                            rows={7}
                            placeholder="Tell us how we can help with internships, opportunities, partnerships, or your enquiry..."
                            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                          />

                        </div>

                      </div>

                      {/* ================================================= */}
                      {/* ERROR MESSAGE */}
                      {/* ================================================= */}

                      {error && (

                        <div
                          role="alert"
                          aria-live="assertive"
                          className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
                        >

                          {error}

                        </div>

                      )}

                      {/* ================================================= */}
                      {/* SUBMIT BUTTON */}
                      {/* ================================================= */}

                      <button
                        type="submit"
                        disabled={loading}
                        className="group mt-7 flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-blue-400"
                      >

                        {loading ? (

                          <>

                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                            Sending message...

                          </>

                        ) : (

                          <>

                            Send Message

                            <FiSend
                              size={18}
                              className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5"
                            />

                          </>

                        )}

                      </button>

                      {/* ================================================= */}
                      {/* PRIVACY NOTE */}
                      {/* ================================================= */}

                      <div className="mt-5 flex items-center justify-center gap-2 text-center text-xs leading-5 text-slate-400 sm:text-sm">

                        <FiShield
                          className="shrink-0"
                          size={15}
                        />

                        <span>

                          Your information will only be
                          used to respond to your
                          enquiry.

                        </span>

                      </div>

                    </form>

                  </>

                )}

              </div>

            </motion.div>

          </div>

        </div>

      </section>

    </main>
  );
}