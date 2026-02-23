function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    // Safe extraction
    const name = data.name || "";
    const email = data.email || "";
    const phone = data.phone || "";
    const country = data.country || "";
    const meetingSchedule = data.meetingSchedule || data.meeting || "";
    const source = data.source || "Website Waitlist";

    // Extra API / Tracking Data — use full geoRaw if available
    var apiData = {};

    if (data.geoRaw && typeof data.geoRaw === "object") {
      // Full ipapi.co response: ip, city, region, country_name, timezone, org, postal, lat, lon, etc.
      apiData = data.geoRaw;
    } else {
      apiData.ip = data.ip || "";
      apiData.city = data.city || "";
      apiData.region = data.region || "";
    }

    // Always add tracking fields
    apiData.userAgent = data.userAgent || "";
    apiData.referrer = data.referrer || "";
    apiData.timestamp = new Date();

    // Append in EXACT column order
    sheet.appendRow([
      name, // Name
      email, // Email
      phone, // Phone
      country, // Country
      new Date(), // Date Of SignUp
      meetingSchedule, // Meeting Schedule
      source, // Source
      JSON.stringify(apiData), // API DATA (full geo + tracking)
    ]);

    // Send Email Notification
    MailApp.sendEmail({
      to: "connect@socialimpression.co",
      subject: "New Website Lead - Social Impressions",
      body:
        "New Lead Details:\n\n" +
        "Name: " +
        name +
        "\n" +
        "Email: " +
        email +
        "\n" +
        "Phone: " +
        phone +
        "\n" +
        "Country: " +
        country +
        "\n" +
        "Region: " +
        (apiData.region || "") +
        "\n" +
        "City: " +
        (apiData.city || "") +
        "\n" +
        "Meeting Schedule: " +
        meetingSchedule +
        "\n" +
        "Source: " +
        source +
        "\n\n" +
        "IP: " +
        (apiData.ip || "") +
        "\n" +
        "ISP: " +
        (apiData.org || "") +
        "\n" +
        "User Agent: " +
        (apiData.userAgent || "") +
        "\n" +
        "Time: " +
        new Date(),
    });

    return ContentService.createTextOutput(
      JSON.stringify({ status: "success" }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: "error",
        message: error.toString(),
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
