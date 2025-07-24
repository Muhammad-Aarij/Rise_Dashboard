import React from 'react';
import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
  const sections = [
    {
      title: '1. Introduction',
      content: `We value your privacy and are committed to safeguarding your personal information. This Privacy Policy outlines how we collect, use, store, and protect data when you engage with our website or services.`
    },
    {
      title: '2. Information We Collect',
      content: `We may collect personal details such as your name, email address, phone number, project requirements, billing information, and any correspondence you send us. Non-personal data like IP addresses, browser type, and usage patterns may also be collected for analytics.`
    },
    {
      title: '3. How We Use Your Information',
      content: `We use your information to communicate, fulfill service requests, issue invoices, and improve our offerings. Your data may also be used for internal analysis, legal compliance, and security enhancements.`
    },
    {
      title: '4. Data Sharing & Disclosure',
      content: `We do not sell or rent your personal data. Information may be shared with trusted partners for the purpose of project execution, payment processing, and hosting. All partners are obligated to maintain the confidentiality and security of your data.`
    },
    {
      title: '5. Cookies & Tracking',
      content: `Our website may use cookies to enhance your browsing experience, remember preferences, and gather analytics. You can control or disable cookies through your browser settings, but this may impact site functionality.`
    },
    {
      title: '6. Data Security',
      content: `We implement appropriate technical and organizational measures to secure your data against unauthorized access, alteration, or disclosure. However, no digital transmission or storage is 100% secure, and we cannot guarantee absolute protection.`
    },
    {
      title: '7. Data Retention',
      content: `We retain your information for as long as necessary to provide our services, fulfill legal obligations, or resolve disputes. Once data is no longer needed, we securely delete or anonymize it.`
    },
    {
      title: '8. Your Rights',
      content: `You have the right to access, correct, or delete your personal data held by us. Requests can be sent to our support team and will be processed within a reasonable timeframe.`
    },
    {
      title: '9. Policy Updates',
      content: `This Privacy Policy may be revised occasionally to reflect changes in our practices or legal obligations. Updated versions will be posted on our website with a revised “Last Updated” date.`
    },
    {
      title: '10. Contact Us',
      content: `If you have any questions, concerns, or requests regarding our privacy practices, please email us at privacy@example.com or use the contact form on our website.`
    }
  ];

  return (
    <div className="privacy-bg bg-white px-12 sm:px-12 lg:px-8 py-12">
      <div className="privacy-container max-w-5xl mx-auto flex flex-col justify-center">
        <motion.h1
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-800 mb-10 border-b-1 pb-12 border-gray-200"
        >
          Privacy Policy
        </motion.h1>

        {sections.map((section, idx) => (
          <motion.section
            key={idx}
            className="mb-10"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: idx * 0.15 }}
            viewport={{ once: true }}
          >
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3">
              {section.title}
            </h2>
            <p className="text-base sm:text-lg text-gray-600 leading-tight">
              {section.content}
            </p>
          </motion.section>
        ))}
      </div>
    </div>
  );
}
