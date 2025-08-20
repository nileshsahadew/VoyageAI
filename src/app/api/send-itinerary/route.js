import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    const { pdfBase64, icsBase64, recipientEmail: bodyEmail, recipientName: bodyName } = await req.json();

    const session = await getServerSession(authOptions);

    const recipientEmail = bodyEmail || session?.user?.email;
    const recipientName = bodyName || session?.user?.name || "there";

    // if (!recipientEmail || !pdfBase64 || !icsBase64) {
    //   return NextResponse.json(
    //     { error: "Missing required fields (need recipientEmail, pdfBase64, icsBase64)" },
    //     { status: 400 }
    //   );
    // }

    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"AuraDrive Resort" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: "Your VoyageAI Itinerary",
      text: `Hi ${recipientName},\n\nPlease find attached your itinerary PDF and calendar (.ics).\n\nEnjoy your trip!\nAuraDrive Resort`,
      attachments: [
        {
          filename: "itinerary.pdf",
          content: Buffer.from(pdfBase64, "base64"),
          contentType: "application/pdf",
        },
        {
          filename: "itinerary.ics",
          content: Buffer.from(icsBase64, "base64"),
          contentType: "text/calendar",
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email sending error:", err);
    return NextResponse.json(
      { error: "Failed to send itinerary email", details: err.message },
      { status: 500 }
    );
  }
}
