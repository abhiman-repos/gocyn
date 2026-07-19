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
  FiCheckCircle
} from "react-icons/fi";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 🔥 Backend API yahan connect karo (jab ready ho)
      // const res = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });

      // Simulate API call (real API lagaane ke baad hata dena)
      await new Promise(resolve => setTimeout(resolve, 1400));

      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* HERO SECTION - Premium Animation */}
      <section className="pt-28 pb-20 bg-gradient-to-br from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-6 py-3 bg-white shadow rounded-3xl text-blue-700 text-sm font-medium">
              <FiMail size={20} />
              LET’S CONNECT
            </span>
            <h1 className="text-6xl md:text-7xl font-semibold text-gray-900 mt-8 leading-none tracking-tighter">
              We’d Love to Hear From You
            </h1>
            <p className="mt-8 text-2xl text-gray-600">
              Questions, collaborations, or just a hello — we’re here for it all.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28">
        <div className="grid md:grid-cols-12 gap-16">

          {/* CONTACT INFO - Animated Cards */}
          <div className="md:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="group bg-white border border-gray-100 hover:border-blue-200 hover:shadow-2xl rounded-3xl p-8 transition-all duration-500"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-100 group-hover:bg-blue-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-colors">
                  <FiMail size={28} />
                </div>
                <div>
                  <p className="text-lg font-semibold">Email Us</p>
                  <a href="mailto:hello@Gocyn.com" className="text-blue-600 hover:underline text-xl">
                    hello@Gocyn.com
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="group bg-white border border-gray-100 hover:border-blue-200 hover:shadow-2xl rounded-3xl p-8 transition-all duration-500"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-100 group-hover:bg-blue-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-colors">
                  <FiPhone size={28} />
                </div>
                <div>
                  <p className="text-lg font-semibold">Call Us</p>
                  <a href="tel:+918000000000" className="text-blue-600 hover:underline text-xl">
                    +91 80000 00000
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="group bg-white border border-gray-100 hover:border-blue-200 hover:shadow-2xl rounded-3xl p-8 transition-all duration-500"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-100 group-hover:bg-blue-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-colors">
                  <FiMapPin size={28} />
                </div>
                <div>
                  <p className="text-lg font-semibold">Visit Our Office</p>
                  <p className="text-gray-600 text-xl">Indore, Madhya Pradesh, India</p>
                </div>
              </div>
            </motion.div>

            {/* Office Hours */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex items-center gap-5 bg-white border border-gray-100 rounded-3xl p-8"
            >
              <FiClock size={28} className="text-blue-600" />
              <div>
                <p className="text-lg font-semibold">Office Hours</p>
                <p className="text-gray-600">Monday – Friday | 9:00 AM – 6:00 PM</p>
              </div>
            </motion.div>
          </div>

          {/* FORM - Premium & Animated */}
          <div className="md:col-span-7">
            <motion.form
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onSubmit={handleSubmit}
              className="bg-white border border-gray-100 rounded-3xl p-10 shadow-xl"
            >
              {submitted ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-16"
                >
                  <FiCheckCircle size={80} className="mx-auto text-green-500 mb-6" />
                  <h3 className="text-3xl font-semibold text-gray-900">Message Sent Successfully!</h3>
                  <p className="text-gray-600 mt-4 text-lg">Thank you! We’ll get back to you within 24 hours.</p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-10 text-blue-600 hover:underline font-medium"
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Full Name</label>
                      <div className="relative">
                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full pl-11 pr-6 py-4 border border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Email Address</label>
                      <div className="relative">
                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full pl-11 pr-6 py-4 border border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 transition-all"
                          placeholder="you@email.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium mb-2 text-gray-700">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 transition-all"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium mb-2 text-gray-700">Your Message</label>
                    <div className="relative">
                      <FiMessageSquare className="absolute left-4 top-4 text-gray-400" size={20} />
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={7}
                        className="w-full pl-11 pr-6 py-4 border border-gray-200 rounded-3xl focus:border-blue-500 focus:ring-0 transition-all resize-none"
                        placeholder="Write your message here..."
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-10 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-6 rounded-3xl font-semibold text-xl flex items-center justify-center gap-3 transition-all"
                  >
                    {loading ? (
                      "Sending your message..."
                    ) : (
                      <>
                        <FiSend size={24} />
                        Send Message
                      </>
                    )}
                  </button>
                </>
              )}
            </motion.form>
          </div>
        </div>
      </div>
    </>
  );
}