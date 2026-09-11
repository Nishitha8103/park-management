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

module.exports = {
  sendContractorCredentialsEmail,
  sendContractorUpdateEmail,
  sendOfficialCredentialsEmail
};


