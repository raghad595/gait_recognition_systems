export const template = (otp, fullname, subject = "Verify Your Email") => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
            body { font-family: 'Inter', system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f4f7f9; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #2563eb, #7c3aed); color: #ffffff; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
            .content { padding: 40px 30px; text-align: center; }
            .greeting { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #111827; }
            .instruction { color: #4b5563; margin-bottom: 32px; font-size: 16px; }
            .otp-container { background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 32px; }
            .otp-code { font-family: 'Monaco', 'Consolas', monospace; font-size: 40px; font-weight: 700; color: #2563eb; letter-spacing: 8px; margin: 0; }
            .expiry { font-size: 14px; color: #94a3b8; font-style: italic; }
            .footer { padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #f3f4f6; }
            .footer p { margin: 0; color: #6b7280; font-size: 14px; }
            .brand { font-weight: 700; color: #374151; margin-top: 8px; block; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Gait Recognition</h1>
            </div>
            <div class="content">
                <p class="greeting">Hello ${fullname},</p>
                <p class="instruction">To complete your verification, please use the secure code below:</p>
                <div class="otp-container">
                    <p class="otp-code">${otp}</p>
                </div>
                <p class="expiry">This code is valid for 2 minutes and can only be used once.</p>
                <p class="instruction" style="margin-top: 24px;">If you didn't request this code, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p>Best regards,</p>
                <span class="brand">The Gait Recognition Team</span>
            </div>
        </div>
    </body>
    </html>
  `;
};
