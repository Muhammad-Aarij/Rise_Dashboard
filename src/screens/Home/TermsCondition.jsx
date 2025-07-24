import React from 'react';
import { motion } from 'framer-motion';

export default function TermsCondition() {
  const sections = [
    {
      title: '1. Introduction',
      content: `These Terms and Conditions govern your access to and use of our software house's services and website. By engaging with us—whether browsing, requesting a quote, or entering into a service agreement—you agree to be legally bound by these terms. If you do not agree, you may not use our services.`
    },
    {
      title: '2. Scope of Services',
      content: `We specialize in delivering full-cycle software development services, including but not limited to web design, mobile application development, backend systems, DevOps, IT consultancy, UI/UX prototyping, and cloud solutions. Services may evolve based on technological advancement and market demand.`
    },
    {
      title: '3. Client Responsibilities',
      content: `Clients are expected to provide accurate specifications, timely feedback, and necessary resources to ensure the successful completion of a project. Delays in feedback or approvals may result in revised timelines or additional charges. Any changes to the project scope must be formally agreed upon by both parties.`
    },
    {
      title: '4. Intellectual Property Rights',
      content: `Unless stated otherwise in the service contract, all code, content, wireframes, mockups, and assets developed during the project shall remain the intellectual property of the software house. Upon full payment, specific deliverables may be transferred or licensed to the client as agreed upon.`
    },
    {
      title: '5. Confidentiality',
      content: `Both parties agree to maintain confidentiality regarding any non-public business, technical, or financial information disclosed during the course of a project. This obligation survives the termination of any service agreement. Our team signs NDAs where required.`
    },
    {
      title: '6. Payment Terms',
      content: `Payment terms are defined in the service agreement and typically follow a milestone-based or hourly billing model. Late payments may incur additional fees or suspension of service delivery. All quoted prices are exclusive of applicable taxes unless explicitly stated.`
    },
    {
      title: '7. Quality Assurance & Warranty',
      content: `We ensure our deliverables meet mutually agreed-upon acceptance criteria. Bugs or functional errors reported within 30 days of delivery (warranty period) will be resolved at no additional cost. Post-warranty support and maintenance can be contracted separately.`
    },
    {
      title: '8. Limitation of Liability',
      content: `Our liability is strictly limited to the fees paid by the client for the specific service in question. We are not responsible for loss of data, revenue, or third-party claims resulting from use or misuse of any deliverables, especially if altered after delivery without our consent.`
    },
    {
      title: '9. Governing Law & Jurisdiction',
      content: `These Terms shall be governed in accordance with the laws of the Islamic Republic of Pakistan. Any disputes shall fall under the exclusive jurisdiction of the courts of Rawalpindi.`
    },
    {
      title: '10. Revisions to Terms',
      content: `We reserve the right to revise these Terms at any time without prior notice. Clients will be informed of material changes via email or website notifications. Continued use of our services after revisions constitutes acceptance of the updated Terms.`
    }
  ];

  return (
    <div className="terms-bg bg-white px-12 sm:px-12 lg:px-8 py-12 ">
      <div className="terms-container max-w-5xl mx-auto flex flex-col justify-center">
        <motion.h1
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-800 mb-10 border-b-1 pb-12 border-gray-200"
        >
          Terms and Conditions
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
