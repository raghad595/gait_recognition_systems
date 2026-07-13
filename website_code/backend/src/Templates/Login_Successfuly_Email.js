export const login_successfuly_template = (fullname) => {
  return `
    <html>
      <body>
        <h1>Welcome Back!</h1>
        <p>Hello ${fullname},</p>
        <p>You have successfully logged in to your Gait Recognition account.</p>
        <p>If this wasn't you, please change your password immediately.</p>
        <br>
        <p>Best regards,<br>Gait Recognition Team</p>
      </body>
    </html>
  `;
};
