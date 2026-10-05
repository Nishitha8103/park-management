const nodemailer = require('nodemailer');

const createTransporter = async () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = process.env.EMAIL_PORT || 587;
  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : '';

  if (!user || !pass) {
    // Generate automated Ethereal test email credentials so emails are actually dispatched
    const testAccount = await nodemailer.createTestAccount();
    console.log(`[Ethereal Test Mailer Initialized]: ${testAccount.user}`);
    return {
      transporter: nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      }),
      fromEmail: testAccount.user,
      isTest: true
    };
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass }
    }),
    fromEmail: user,
    isTest: false
  };
};

const sendContractorCredentialsEmail = async (toEmail, name, username, password) => {
  try {
    const { transporter, fromEmail, isTest } = await createTransporter();
    const mailOptions = {
      from: `"Parks Monitoring System" <${fromEmail}>`,
      to: toEmail,
      subject: 'Parks Monitoring System - Account Registration',
      text: `Hello ${name},\n\nYour contractor account has been successfully registered by the System Administrator.\n\nAccount Details:\nUser ID: ${username}\nAccess Code: ${password}\n\nPlease log in to your contractor portal to view your assigned parks and manage maintenance tasks.\n\nThis is an automated notification.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
          <h2 style="color: #16a34a; margin-top: 0;">Welcome to Parks Monitoring System</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your contractor account has been successfully registered by the System Administrator.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #16a34a; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>System Access Details:</strong></p>
            <p style="margin: 0 0 5px 0;"><strong>User ID:</strong> ${username}</p>
            <p style="margin: 0;"><strong>Access Code:</strong> ${password}</p>
          </div>

          <p>Please log in to your contractor portal to view your assigned parks and manage maintenance tasks.</p>
          <p style="color: #64748b; font-size: 0.85rem; margin-top: 30px;">This is an automated notification.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Sent Successfully] MessageId: ${info.messageId} to ${toEmail}`);
    if (isTest) {
      console.log('--- [TEST EMAIL SENT] ---');
      console.log('Recipient:', toEmail);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      console.log('--------------------------');
    }
    return info;
  } catch (error) {
    console.error('CRITICAL: Error sending email to contractor:', error.message || error);
  }
};

const sendContractorUpdateEmail = async (toEmail, name, username, password, assignedParks) => {
  try {
    const { transporter, fromEmail, isTest } = await createTransporter();
    
    let passwordSection = password ? `<p style="margin: 0;"><strong>New Access Code:</strong> ${password}</p>` : `<p style="margin: 0; color: #64748b; font-size: 0.9em;">(Access code unchanged)</p>`;
    
    let parksList = (assignedParks && assignedParks.length > 0) 
      ? `<ul style="margin: 5px 0 0 0; padding-left: 20px;">${assignedParks.map(p => `<li>${p}</li>`).join('')}</ul>`
      : `<p style="margin: 5px 0 0 0; color: #64748b;">No parks assigned currently.</p>`;

    const mailOptions = {
      from: `"Parks Monitoring System" <${fromEmail}>`,
      to: toEmail,
      subject: 'Parks Monitoring System - Profile Update',
      text: `Hello ${name},\n\nYour profile has been updated.\n\nUser ID: ${username}\n\nPlease log in to view changes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
          <h2 style="color: #16a34a; margin-top: 0;">System Profile Update</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your profile or assigned parks have been updated.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #16a34a; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>System Access Details:</strong></p>
            <p style="margin: 0 0 5px 0;"><strong>User ID:</strong> ${username}</p>
            ${passwordSection}
          </div>

          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Currently Assigned Parks:</strong></p>
            ${parksList}
          </div>

          <p>Please log in to your portal to view your full assignments.</p>
          <p style="color: #64748b; font-size: 0.85rem; margin-top: 30px;">This is an automated notification.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Sent Successfully] MessageId: ${info.messageId} to ${toEmail}`);
    if (isTest) {
      console.log('--- [TEST EMAIL SENT] ---');
      console.log('Recipient:', toEmail);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      console.log('--------------------------');
    }
    return info;
  } catch (error) {
    console.error('CRITICAL: Error sending update email to contractor:', error.message || error);
  }
};

const sendOfficialCredentialsEmail = async (toEmail, name, username, password) => {
  try {
    const { transporter, fromEmail, isTest } = await createTransporter();
    const mailOptions = {
      from: `"Parks Monitoring System" <${fromEmail}>`,
      to: toEmail,
      subject: 'Parks Monitoring System - Official Account Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #16a34a; margin-top: 0;">Welcome to Parks Monitoring System</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your government official account has been successfully registered by the System Administrator.</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #16a34a; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Account Credentials:</strong></p>
            <p style="margin: 0 0 5px 0;"><strong>Username:</strong> ${username}</p>
            <p style="margin: 0;"><strong>Password:</strong> ${password}</p>
          </div>

          <p>Please log in to your official portal to view your assigned parks and manage monitoring tasks.</p>
          <p style="color: #64748b; font-size: 0.85rem; margin-top: 30px;">This is an automated notification. Please do not reply directly to this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Sent Successfully] MessageId: ${info.messageId} to ${toEmail}`);
    if (isTest) {
      console.log('--- [TEST EMAIL SENT] ---');
      console.log('Recipient:', toEmail);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      console.log('--------------------------');
    }
    return info;
  } catch (error) {
    console.error('CRITICAL: Error sending email to official:', error.message || error);
  }
};

const sendWelcomePublicEmail = async (toEmail, name) => {
  try {
    const { transporter, fromEmail, isTest } = await createTransporter();
    const mailOptions = {
      from: `"Parks Monitoring System" <${fromEmail}>`,
      to: toEmail,
      subject: 'Thank you for joining - Parks Monitoring System',
      text: `Hello ${name || 'Citizen'},\n\nThank you for joining the Parks Monitoring System!\n\nWe are excited to have you on board. You can now explore nearby parks, submit and track maintenance complaints, book stalls, and register for park events.\n\nTogether, let's keep our parks green, clean, and vibrant.\n\nBest regards,\nParks Monitoring & Management Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #15803d, #064e3b); padding: 32px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Parks Monitoring System</h1>
            <p style="margin: 8px 0 0 0; color: #bbf7d0; font-size: 14px; font-weight: 500;">Civic Intelligence & Urban Park Management</p>
          </div>
          
          <div style="padding: 32px 24px;">
            <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">Thank you for joining!</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hello <strong>${name || 'Citizen'}</strong>,</p>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
              Thank you for joining the <strong>Parks Monitoring & Management System</strong>. We are thrilled to welcome you to our community!
            </p>

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="color: #0f172a; font-weight: 700; font-size: 14px; margin: 0 0 12px 0;">✨ What you can do now:</p>
              <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8;">
                <li><strong>Explore Parks:</strong> Discover nearby urban parks, amenities, and timings.</li>
                <li><strong>Report Issues:</strong> Submit maintenance grievances & cleanliness reports with ease.</li>
                <li><strong>Live Tracking:</strong> Track progress and resolution of your complaints in real time.</li>
                <li><strong>Stalls & Events:</strong> Reserve temporary stalls and register for community park events.</li>
              </ul>
            </div>

            <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
              Together, let's keep our city's parks green, beautiful, and accessible for everyone.
            </p>
          </div>

          <div style="background-color: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0 0 4px 0;">Parks Monitoring System • Official Civic Portal</p>
            <p style="margin: 0;">This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Welcome Email Sent] MessageId: ${info.messageId} to ${toEmail}`);
    if (isTest) {
      console.log('--- [TEST EMAIL SENT] ---');
      console.log('Recipient:', toEmail);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      console.log('--------------------------');
    }
    return info;
  } catch (error) {
    console.error('Error sending welcome email to public user:', error.message || error);
  }
};

const sendPasswordResetOtpEmail = async (toEmail, name, otp) => {
  try {
    const { transporter, fromEmail, isTest } = await createTransporter();
    const mailOptions = {
      from: `"Parks Monitoring System" <${fromEmail}>`,
      to: toEmail,
      subject: `${otp} is your Password Reset Code - Parks Monitoring System`,
      text: `Hello ${name || 'User'},\n\nYour 6-digit verification code to reset your password is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nParks Monitoring System`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          <div style="background: linear-gradient(135deg, #064e3b, #15803d); padding: 28px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Parks Monitoring System</h1>
            <p style="margin: 6px 0 0 0; color: #bbf7d0; font-size: 13px;">Security & Account Recovery</p>
          </div>
          
          <div style="padding: 28px 24px; text-align: center;">
            <h2 style="color: #0f172a; font-size: 19px; font-weight: 700; margin-top: 0; margin-bottom: 8px;">Password Reset Request</h2>
            <p style="color: #475569; font-size: 14px; margin: 0 0 20px 0;">Hello <strong>${name || 'User'}</strong>, use the verification code below to reset your password:</p>

            <div style="background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; padding: 18px 24px; display: inline-block; margin: 0 auto 20px auto;">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #15803d;">${otp}</span>
            </div>

            <p style="color: #64748b; font-size: 13px; margin: 0 0 16px 0;">
              ⏳ This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
            </p>

            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>

          <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">Parks Monitoring System • Official Automated Notification</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Password Reset OTP Sent] MessageId: ${info.messageId} to ${toEmail}`);
    if (isTest) {
      console.log('--- [TEST OTP EMAIL SENT] ---');
      console.log('Recipient:', toEmail);
      console.log('OTP:', otp);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      console.log('-----------------------------');
    }
    return info;
  } catch (error) {
    console.error('Error sending password reset OTP email:', error.message || error);
    throw error;
  }
};

const sendTaskAssignedEmail = async (toEmail, recipientName, role, complaint) => {
  try {
    if (!toEmail) return;
    const { transporter, fromEmail, isTest } = await createTransporter();
    const isContractor = role?.toLowerCase().includes('contractor');
    const roleTitle = isContractor ? 'Contractor Maintenance Task' : 'Official Inspection Task';
    const actionRoute = isContractor ? 'Contractor Portal Tasks' : 'Government Official Inspection Portal';

    const mailOptions = {
      from: `"Parks Monitoring System" <${fromEmail}>`,
      to: toEmail,
      subject: `[Assigned] Task #${complaint.complaintNumber} - ${complaint.parkName || 'Park Issue'}`,
      text: `Hello ${recipientName || 'Team Member'},\n\nA new task has been assigned to you:\n\nComplaint #: ${complaint.complaintNumber}\nPark: ${complaint.parkName || 'Park'}\nCategory: ${complaint.category || 'Maintenance'}\nPriority: ${complaint.priority || 'Medium'}\nDescription: ${complaint.description || 'N/A'}\n\nPlease log in to your ${actionRoute} to review details and begin required work.\n\nBest regards,\nParks Monitoring Administration`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #15803d, #16a34a); padding: 22px 24px; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px;">🔔 New ${roleTitle} Assigned</h2>
            <p style="margin: 6px 0 0 0; color: #dcfce7; font-size: 13px;">Ticket Reference: #${complaint.complaintNumber}</p>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 16px 0; color: #334155; font-size: 15px;">
              Hello <strong>${recipientName || 'Team Member'}</strong>, a new task has been assigned to you for resolution:
            </p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b; width: 35%;"><strong>Park Name:</strong></td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${complaint.parkName || 'Park Area'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b;"><strong>Category:</strong></td>
                <td style="padding: 8px 0; color: #0f172a;">${complaint.category || 'General'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b;"><strong>Priority:</strong></td>
                <td style="padding: 8px 0; color: #b91c1c; font-weight: 700;">${complaint.priority || 'Medium'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; vertical-align: top;"><strong>Description:</strong></td>
                <td style="padding: 8px 0; color: #334155;">${complaint.description || 'N/A'}</td>
              </tr>
            </table>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 16px 0;">
              Please log in to your dashboard to view complete park details, upload geo-tagged photo proofs, and submit your completion status.
            </p>
          </div>
          <div style="background-color: #f8fafc; padding: 14px 24px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
            Parks Monitoring System • Official Task Assignment Notification
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Task Assigned Email Sent] To: ${toEmail} (${role})`);
    return info;
  } catch (err) {
    console.error(`[sendTaskAssignedEmail Error] Failed to send email to ${toEmail}:`, err.message || err);
  }
};

const sendComplaintClosedEmail = async (toEmail, citizenName, complaint) => {
  try {
    if (!toEmail) return;
    const { transporter, fromEmail, isTest } = await createTransporter();

    const mailOptions = {
      from: `"Parks Monitoring System" <${fromEmail}>`,
      to: toEmail,
      subject: `✅ Issue Resolved - Complaint #${complaint.complaintNumber} Closed`,
      text: `Hello ${citizenName || 'Citizen'},\n\nYour complaint #${complaint.complaintNumber} regarding "${complaint.category || 'Park Maintenance'}" at "${complaint.parkName || 'Park'}" has been successfully resolved and officially closed by the administration.\n\nThank you for helping us keep our parks clean and safe!\n\nBest regards,\nParks Monitoring System`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 24px; color: #ffffff; text-align: center;">
            <div style="font-size: 36px; margin-bottom: 8px;">✅</div>
            <h2 style="margin: 0; font-size: 22px; font-weight: 800;">Complaint Resolved & Closed</h2>
            <p style="margin: 6px 0 0 0; color: #d1fae5; font-size: 14px;">Ticket Reference: #${complaint.complaintNumber}</p>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 16px 0; color: #334155; font-size: 15px;">
              Hello <strong>${citizenName || 'Citizen'}</strong>,
            </p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
              We are pleased to inform you that your reported issue at <strong>${complaint.parkName || 'the park'}</strong> has been inspected, resolved, and verified.
            </p>
            <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 16px; margin-bottom: 20px; border-radius: 4px;">
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #166534;"><strong>Issue Category:</strong> ${complaint.category || 'General'}</p>
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #166534;"><strong>Status:</strong> Closed (Verified & Approved)</p>
              <p style="margin: 0; font-size: 13px; color: #166534;"><strong>Park Location:</strong> ${complaint.parkName || 'Park'} ${complaint.locationInPark ? `(${complaint.locationInPark})` : ''}</p>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">
              Thank you for being an active civic citizen and helping us maintain clean, green, and vibrant parks for the entire community.
            </p>
          </div>
          <div style="background-color: #f8fafc; padding: 14px 24px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
            Parks Monitoring System • Official Citizen Notification
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Complaint Closed Email Sent] To Citizen: ${toEmail}`);
    return info;
  } catch (err) {
    console.error(`[sendComplaintClosedEmail Error] Failed to send email to ${toEmail}:`, err.message || err);
  }
};

module.exports = {
  sendContractorCredentialsEmail,
  sendContractorUpdateEmail,
  sendOfficialCredentialsEmail,
  sendWelcomePublicEmail,
  sendPasswordResetOtpEmail,
  sendTaskAssignedEmail,
  sendComplaintClosedEmail
};


