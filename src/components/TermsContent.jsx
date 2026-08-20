import React from 'react';

// Shared body used by both the dedicated /terms page and the in-modal
// preview opened from the registration form, so the two never drift out
// of sync with each other.
const TermsContent = () => (
  <div className="terms-content">
    <p className="terms-updated">Last updated: {new Date().toISOString().slice(0, 10)}</p>

    <h2>1. Acceptance of Terms</h2>
    <p>
      By registering for, accessing, or using GravySyncro ("the Service") at gravysyncro.org,
      you agree to be bound by these Terms of Service. If you do not agree, you may not create
      an account or use the platform.
    </p>

    <h2>2. User Accounts &amp; Registration</h2>
    <p>
      You must provide accurate, current, and complete information during registration. You are
      responsible for safeguarding your account credentials and for all activities that occur
      under your account.
    </p>

    <h2>3. User Data &amp; Intellectual Property</h2>
    <ul>
      <li>
        <strong>Your Data:</strong> You retain full ownership of all documents, files, audio
        recordings, and text you upload, create, or archive within GravySyncro ("User Content").
        You grant us a limited license to host, back up, and process this data solely to provide
        the collaboration and archiving services to your team.
      </li>
      <li>
        <strong>Our Platform:</strong> GravySyncro, its code, design, logos, and features remain
        the exclusive property of GravySyncro.
      </li>
    </ul>

    <h2>4. Acceptable Use Policy</h2>
    <p>
      You agree not to misuse the platform. Prohibited actions include uploading malicious
      software, attempting unauthorized access to other team vaults, violating copyright laws, or
      using real-time collaboration features for unlawful activities.
    </p>

    <h2>5. Limitation of Liability</h2>
    <p>
      GravySyncro is provided on an "as-is" and "as-available" basis. To the maximum extent
      permitted by law, GravySyncro shall not be liable for any indirect, incidental, or
      consequential damages, or any loss of data resulting from service interruptions or system
      failures. Users are always encouraged to maintain secondary local backups of critical
      archives.
    </p>

    <h2>6. Termination</h2>
    <p>
      We reserve the right to suspend or terminate your account at any time if you violate these
      terms. You may also cancel your account at any time through your dashboard settings.
    </p>
  </div>
);

export default TermsContent;
