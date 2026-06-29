import sgMail from "@sendgrid/mail";

export function getSendGridClient(): typeof sgMail {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error("SENDGRID_API_KEY is not set");
  }
  sgMail.setApiKey(apiKey);
  return sgMail;
}

export async function sendEmail(opts: {
  to: string;
  toName?: string | null;
  subject: string;
  body: string;
}): Promise<void> {
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  if (!fromEmail) {
    throw new Error("SENDGRID_FROM_EMAIL is not set");
  }

  const sg = getSendGridClient();
  await sg.send({
    to: { email: opts.to, name: opts.toName ?? undefined },
    from: { email: fromEmail, name: "MindPartner" },
    subject: opts.subject,
    text: opts.body,
  });
}
