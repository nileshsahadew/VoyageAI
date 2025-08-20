import { NextResponse } from "next/server";
import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import itineraryGeneratorAgent from "@/utils/agents/itineraryGeneratorAgent";

const styles = StyleSheet.create({
  page: { padding: 28, backgroundColor: "#ffffff" },
  headerBar: {
    backgroundColor: "#0d47a1",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  headerTitle: { fontSize: 20, color: "#ffffff", textAlign: "center" },
  headerSubtitle: { fontSize: 11, color: "#e3f2fd", textAlign: "center", marginTop: 4 },
  summaryContainer: { flexDirection: "row", gap: 10, marginBottom: 14 },
  summaryItem: {
    flexGrow: 1,
    backgroundColor: "#f3f7ff",
    borderColor: "#d6e4ff",
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  summaryLabel: { fontSize: 9, color: "#546e7a" },
  summaryValue: { fontSize: 12, color: "#0d47a1", fontWeight: "bold" },
  sectionHeader: { fontSize: 13, color: "#263238", marginTop: 10, marginBottom: 6 },
  dateHeader: {
    backgroundColor: "#e3f2fd",
    borderLeftColor: "#1e88e5",
    borderLeftWidth: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 10,
    marginBottom: 6,
  },
  dateTitle: { fontSize: 12, color: "#0d47a1", fontWeight: "bold" },
  dayChip: {
    marginTop: 2,
    alignSelf: "flex-start",
    backgroundColor: "#bbdefb",
    color: "#0d47a1",
    fontSize: 9,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 999,
  },
  activityCard: {
    borderColor: "#e0e0e0",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fafafa",
  },
  timePill: {
    alignSelf: "flex-start",
    backgroundColor: "#eeeeee",
    color: "#424242",
    fontSize: 9,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginBottom: 6,
  },
  attractionTitle: { fontSize: 12, fontWeight: "bold", color: "#212121", marginBottom: 2 },
  metaRow: { flexDirection: "row", gap: 8, marginBottom: 4, flexWrap: "wrap" },
  metaText: { fontSize: 10, color: "#455a64" },
  description: { fontSize: 10, color: "#37474f", marginTop: 2 },
  link: { fontSize: 10, color: "#1e88e5", textDecoration: "none", marginTop: 3 },
  footer: { fontSize: 9, color: "#90a4ae", textAlign: "center", marginTop: 12 },
});

function groupItineraryByDate(itinerary) {
  const grouped = {};
  for (const item of itinerary) {
    if (!grouped[item.date]) grouped[item.date] = [];
    grouped[item.date].push(item);
  }
  for (const date of Object.keys(grouped)) {
    grouped[date].sort((a, b) => parseTimeToMinutes(a.hour) - parseTimeToMinutes(b.hour));
  }
  return grouped;
}

function parseTimeToMinutes(timeString) {
  const match = timeString.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3]?.toUpperCase();
  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function parseToDate(dateStr, timeStr) {
  const minutes = parseTimeToMinutes(timeStr);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return new Date(`${dateStr}T${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`);
}

const ItineraryPDF = ({ itinerary, recipientName }) => {
  const grouped = groupItineraryByDate(itinerary);
  const dates = Object.keys(grouped).sort();
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  const activitiesCount = itinerary.length;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Your Travel Itinerary</Text>
          {recipientName ? <Text style={styles.headerSubtitle}>For {recipientName}</Text> : null}
        </View>
        <View style={styles.summaryContainer}>
          {dates.length > 0 ? (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Dates</Text>
              <Text style={styles.summaryValue}>{startDate}{startDate !== endDate ? ` to ${endDate}` : ""}</Text>
            </View>
          ) : null}
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Days</Text>
            <Text style={styles.summaryValue}>{dates.length || 1}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Activities</Text>
            <Text style={styles.summaryValue}>{activitiesCount}</Text>
          </View>
        </View>
        <Text style={styles.sectionHeader}>Daily Plan</Text>
        {dates.map((date) => (
          <View key={date}>
            <View style={styles.dateHeader}>
              <Text style={styles.dateTitle}>{date}</Text>
              {grouped[date][0]?.day ? <Text style={styles.dayChip}>{grouped[date][0].day}</Text> : null}
            </View>
            {grouped[date].map((item, idx) => (
              <View key={`${date}-${idx}`} style={styles.activityCard}>
                {item.hour ? <Text style={styles.timePill}>{item.hour}</Text> : null}
                <Text style={styles.attractionTitle}>{item.attraction_name}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{item.location}{item.region ? ` • ${item.region}` : ""}</Text>
                  {typeof item.rating === "number" ? (
                    <Text style={styles.metaText}>Rating: {item.rating}/5</Text>
                  ) : null}
                </View>
                {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
                {item.url ? (
                  <Link src={item.url} style={styles.link}>Open in Google Maps</Link>
                ) : null}
              </View>
            ))}
          </View>
        ))}
        <Text style={styles.footer}>Generated on {new Date().toLocaleDateString()} · AuraDrive Resort</Text>
      </Page>
    </Document>
  );
};

export async function POST(req) {
  try {
    const body = await req.json();
    const userInput = body.userInput;
    const providedItinerary = Array.isArray(body.itinerary) ? body.itinerary : [];

    // Prefer body-provided recipient, else fall back to authenticated session
    const session = await getServerSession(authOptions);
    const recipientEmail = body.recipientEmail || session?.user?.email;
    const recipientName = body.recipientName || session?.user?.name || "";

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "Missing required field: recipientEmail" },
        { status: 400 }
      );
    }

    let itinerary = providedItinerary;
    if (!itinerary.length) {
      if (!userInput) {
        return NextResponse.json(
          { error: "Missing userInput or itinerary. Provide either to proceed." },
          { status: 400 }
        );
      }
      const result = await itineraryGeneratorAgent.invoke({ userInput });
      itinerary = Array.isArray(result.itinerary) ? result.itinerary : [];
      if (!itinerary.length) {
        return NextResponse.json(
          { error: "No itinerary generated. Please refine your request." },
          { status: 422 }
        );
      }
    }

    const { renderToBuffer } = await import("@react-pdf/renderer");
    const pdfBuffer = await renderToBuffer(
      <ItineraryPDF itinerary={itinerary} recipientName={recipientName} />
    );

    const ics = await import("ics");
    const events = itinerary.map((item) => {
      const startDate = parseToDate(item.date, item.hour);
      return {
        title: item.attraction_name,
        description: item.description || "",
        location: `${item.location}${item.region ? ", " + item.region : ""}`,
        start: [
          startDate.getFullYear(),
          startDate.getMonth() + 1,
          startDate.getDate(),
          startDate.getHours(),
          startDate.getMinutes(),
        ],
        duration: { hours: 1 },
        url: item.url || undefined,
      };
    });
    const { error, value: icsContent } = ics.createEvents(events);
    if (error) throw error;

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
            text: `Hi ${recipientName || "there"},\n\nPlease find attached your itinerary PDF and calendar (.ics).\n\nEnjoy your trip!\nAuraDrive Resort` ,
            attachments: [
                { filename: "itinerary.pdf", content: pdfBuffer, contentType: "application/pdf" },
                { filename: "itinerary.ics", content: icsContent, contentType: "text/calendar" },
            ],
        });

        return NextResponse.json({
            success: true,
            itinerary,
            pdfBase64: pdfBuffer.toString("base64"),
            icsBase64: Buffer.from(icsContent).toString("base64"),
        });
  } catch (error) {
    console.error("Itinerary generation/email error:", error);
    return NextResponse.json(
      { error: "Failed to generate or send itinerary", details: String(error?.message || error) },
      { status: 500 }
    );
  }
}


