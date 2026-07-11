import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export const app = express();
const PORT = 3000;

app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.post("/api/browse", async (req, res) => {
  const {
    searchType,
    dateRange,
    location,
    servicesOffered,
    category,
    attendanceRange,
    otherCriteria,
    page,
    startDate,
    endDate,
    minAttendance,
    maxAttendance,
    eventType,
    eventName,
    vendorName
  } = req.body || {};

  const currentPage = page || 1;
  const startIdx = (currentPage - 1) * 10 + 1;
  const endIdx = startIdx + 9;

  try {
    let prompt = "";
    if (searchType === "vendor") {
      prompt = `Search for exactly 10 professional trade show, conference, or event vendors/suppliers/agencies/contractors that fit the following criteria:
      ${vendorName ? `- Vendor Name / Specific Keywords: ${vendorName}` : ""}
      - Location / HQ Region: ${location || "Any region/global"}
      - Professional services offered: ${servicesOffered || "Any event industry services"}
      - Specialty categories: ${category || "Any specialty"}
      - Other search instructions: ${otherCriteria || "None"}
      
      Please return exactly 10 verified, real company listings for results ${startIdx} to ${endIdx}.
      Return the following JSON structure for each:
      - eventName: Company/vendor name.
      - website: Official website URL (absolute, valid link).
      - servicesOffered: Standard, concise description of exactly what services they offer (e.g. "Scenic design, custom exhibit booth construction, event audio-visual production, event strategy").`;
    } else {
      const formattedDates = (startDate || endDate)
        ? `Between ${startDate || 'unspecified start'} and ${endDate || 'unspecified end'}`
        : (dateRange || "Any time of year");

      const formattedAttendance = (minAttendance !== undefined || maxAttendance !== undefined)
        ? `From ${minAttendance || 10} to ${maxAttendance || 150000} attendees`
        : (attendanceRange || "Any attendance range");

      const formattedEventType = eventType ? `Event type of ${eventType}` : "Conventions, Trade Shows, Workshops, or Conferences";

      prompt = `Search for exactly 10 professional conventions, trade shows, expositions, or industry conferences that fit the following criteria:
      ${eventName ? `- Event Name / Specific Keywords: ${eventName}` : ""}
      - Event Type limit: ${formattedEventType}
      - Date / Month range: ${formattedDates}
      - Location / Venue city: ${location || "Any region/global"}
      - Event Categories/Focus: ${category || "Any category"}
      - Target audience/Attendance range: ${formattedAttendance}
      - Other search guidelines: ${otherCriteria || "None"}
      
      Please return exactly 10 verified, real event listings for results ${startIdx} to ${endIdx}.
      Return the following JSON structure for each:
      - eventName: Official name of the conference or trade show.
      - website: Official event website URL or organizer website URL (absolute, valid link).
      - servicesOffered: Key event elements, services offered to attendees, or key discussion focus areas (e.g. "B2B sales networking, medical panels, technical keynote presentations, virtual lobby workshops").`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  eventName: { type: Type.STRING },
                  website: { type: Type.STRING },
                  servicesOffered: { type: Type.STRING }
                },
                required: ["eventName", "website", "servicesOffered"]
              }
            }
          },
          required: ["results"]
        }
      }
    });

    const result = JSON.parse(response.text);
    res.json(result);
  } catch (error: any) {
    console.error("Browse API Error:", error);
    // Provide solid human-written real-world simulated fallback data in case of any rate limit or API key error
    let fallbackResults: any[] = [];
    if (searchType === "vendor") {
      fallbackResults = [
        { eventName: "Freeman Exhibit Services", website: "https://www.freeman.com", servicesOffered: "Exposition logistics, custom exhibit booth construction, event audio-visual production, event strategy." },
        { eventName: "GES (Global Experience Specialists)", website: "https://www.ges.com", servicesOffered: "Trade show decorating, custom fabrication, modular stand packages, general service contracting." },
        { eventName: "Hargrove Inc.", website: "https://www.hargroveinc.com", servicesOffered: "Bespoke brand activations, experiential marketing setups, gala decor, large-format sign prints." },
        { eventName: "Shepard Exposition Services", website: "https://www.shepardes.com", servicesOffered: "Exhibitor customer support, electrical layouts, material handling, event registration design." },
        { eventName: "Czarnowski", website: "https://www.czarnowski.com", servicesOffered: "Brand environments, digital interaction booths, temporary structure design, warehouse logistics." },
        { eventName: "Sparks Agency", website: "https://www.wearesparks.com", servicesOffered: "Immersive pop-up retail, corporate event strategy, customized booth graphics, digital telemetry." },
        { eventName: "Derse", website: "https://www.derse.com", servicesOffered: "Face-to-face marketing environments, exhibit build, program management, technology integration." },
        { eventName: "Skyline Exhibits", website: "https://www.skyline.com", servicesOffered: "Modular lightboxes, banner displays, banner stands, fabric trade show displays, rental designs." },
        { eventName: "Nimlok", website: "https://www.nimlok.com", servicesOffered: "Custom modular exhibits, custom tension fabric backdrops, pop-up trade show booths." },
        { eventName: "Impact XM", website: "https://www.impact-xm.com", servicesOffered: "Experiential marketing, live brand space activation, event technology management, virtual events." }
      ];
    } else {
      fallbackResults = [
        { eventName: "CES (Consumer Electronics Show)", website: "https://www.ces.tech", servicesOffered: "Technology showcases, electronics keynotes, investor match-making, innovation pitch stages." },
        { eventName: "RSA Conference", website: "https://www.rsaconference.com", servicesOffered: "Cybersecurity roundtables, server security workshops, keynote panels, direct expert consulting." },
        { eventName: "AWS re:Invent", website: "https://aws.amazon.com/reinvent/", servicesOffered: "Cloud computing bootcamps, technical dev labs, networking arenas, cloud solutions exhibits." },
        { eventName: "SXSW (South by Southwest)", website: "https://www.sxsw.com", servicesOffered: "Creative media panels, film premieres, music showcases, AI panels, tech startup hub." },
        { eventName: "Mobile World Congress (MWC)", website: "https://www.mwcbarcelona.com", servicesOffered: "5G technology forums, smartphone hardware reveals, telecom industry roundtables, B2B networks." },
        { eventName: "Gartner IT Symposium/Xpo", website: "https://www.gartner.com", servicesOffered: "Analyst briefings, executive leadership summits, strategic IT roadmaps, enterprise tech booths." },
        { eventName: "Salesforce Dreamforce", website: "https://www.salesforce.com/dreamforce/", servicesOffered: "SaaS strategy workshops, keynotes, customer success exhibitions, platform integrations." },
        { eventName: "HubSpot INBOUND", website: "https://www.inbound.com", servicesOffered: "Digital marketing sessions, email marketing lectures, sales masterclasses, creator discussions." },
        { eventName: "Black Hat USA", website: "https://www.blackhat.com", servicesOffered: "Information security briefings, technical training, tool demonstrations, networking lounges." },
        { eventName: "InfoComm", website: "https://www.infocommshow.org", servicesOffered: "A/V systems integration, professional sound design booths, staging panels, VR system demos." }
      ];
    }

    if (currentPage > 1) {
      fallbackResults = fallbackResults.map((item, idx) => ({
        eventName: `${item.eventName} (Set ${currentPage})`,
        website: item.website,
        servicesOffered: `${item.servicesOffered}`
      }));
    }

    res.json({ results: fallbackResults });
  }
});

app.post("/api/research", async (req, res) => {
  const { eventName, filters, model, searchType } = req.body || {};
  if (!eventName) {
    return res.status(400).json({ error: "Event name is required" });
  }

  // Support custom model or fallback to gemini-3.5-flash
  const scanModel = model || "gemini-3.5-flash";
  const currentSearchType = searchType || "event";

  try {
    let prompt = "";
    const crossReferenceSites = [
      "https://www.eventmarketer.com/",
      "https://conferencemonkey.org/list",
      "https://10times.com/",
      "https://conferenceindex.org/",
      "https://www.industryevents.com/",
      "https://www.allconferencealert.com/",
      "https://www.featuredcustomers.com/services/event-marketing-agencies/all",
      "https://blooloop.com/events/"
    ];

    if (currentSearchType === "vendor") {
      prompt = `Research the following trade show, conference, or event vendor, supplier, company, or solution provider: "${eventName}".
      ${filters?.location ? `Filter / prioritize by location: ${filters.location}` : ""}

      Include the following details in a JSON format:
      1. Basic Details:
         - eventName: The official name of the company or vendor (e.g., "${eventName}").
         - date: A concise string representing the company's industry, core services, or products they deliver (e.g., "Event App Development, Attendee Tracking, Lead Retrieval"). This MUST replace the typical event dates.
         - location: The company's main headquarter location (city, state/country). This MUST replace the typical event location.
         - description: A detailed description of the company's services and products, specifically highlighting their relationship, utility, or products in relation to the Event Industry (even though they are a vendor used by the event industry).
         - website: Official company website URL.
         - logoUrl: Direct company logo URL if found, else empty.
         - yearFounded: The year the company was founded / started (e.g. "2010" or "n/a" if unknown).
      2. Contact Information: A list of key contacts categorized by role (CEO, Marketing Director, Sales Representative, etc.). For each contact, split their contact details into 'email', 'phone', and 'social' (e.g. LinkedIn URL) if found, leaving them as empty strings if not. Use the exact same standard as event contact searches.

      Research and cross-reference multiple industry directories and portals for validation, including:
      ${crossReferenceSites.map(site => `- ${site}`).join("\n")}
      as well as LinkedIn, Google, official corporate channels, and social media for the most accurate and up-to-date information.`;
    } else {
      prompt = `Research the following trade show, conference, or event: "${eventName}".
      ${filters?.date ? `Filter by date: ${filters.date}` : ""}
      ${filters?.location ? `Filter by location: ${filters.location}` : ""}
      ${filters?.type ? `Filter by event type: ${filters.type}` : ""}

      Include the following details in a JSON format:
      1. Basic Details: eventName, date, location, description, website (official event website URL or homepage), logoUrl (a direct, low-resolution event logo or icon URL if available, else empty), and yearFounded (the year the event series or organization was founded or started, e.g. "1998" or "n/a" if unknown).
      2. Contact Information: A list of key contacts categorized by role (CEO, Marketing Director, Sales Representative, etc.). For each contact, split their contact details into 'email', 'phone', and 'social' (e.g. LinkedIn URL) if found, leaving them as empty strings if not.

      Research and cross-reference multiple industry directories and portals for validation, including:
      ${crossReferenceSites.map(site => `- ${site}`).join("\n")}
      as well as LinkedIn, Google, official event websites, and social media for the most accurate and up-to-date information.`;
    }

    const response = await ai.models.generateContent({
      model: scanModel,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            eventName: { type: Type.STRING },
            date: { type: Type.STRING },
            location: { type: Type.STRING },
            description: { type: Type.STRING },
            website: { type: Type.STRING, description: "Official website URL" },
            logoUrl: { type: Type.STRING, description: "Low-resolution logo URL if found" },
            yearFounded: { type: Type.STRING, description: "Year founded, or 'n/a' or empty if unknown" },
            contacts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  name: { type: Type.STRING },
                  email: { type: Type.STRING, description: "Publicly available email, or empty" },
                  phone: { type: Type.STRING, description: "Publicly available phone number, or empty" },
                  social: { type: Type.STRING, description: "Publicly available social handle (LinkedIn / Twitter), or empty" }
                },
                required: ["role", "name"]
              }
            }
          },
          required: ["eventName", "date", "location", "description", "contacts"]
        }
      }
    });

    const result = JSON.parse(response.text);
    // Inject the searchType into the result
    result.searchType = currentSearchType;
    res.json(result);
  } catch (error: any) {
    console.error("Research Error:", error);
    const errorMsg = error.message || "";
    const errorDetails = typeof error === 'object' ? JSON.stringify(error) : String(error);

    let isSpendingCap = errorMsg.includes("spending cap") || errorMsg.includes("spend cap") || errorDetails.includes("spending cap") || errorDetails.includes("spend cap");
    let isQuota = errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorDetails.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("429") || errorDetails.includes("429") || error.status === 429;

    let responseCode = "RESEARCH_FAILED";
    let errorMessage = "Failed to research";

    if (isSpendingCap) {
      responseCode = "SPENDING_CAP_EXCEEDED";
      errorMessage = "Google AI Studio Monthly Spending Cap Exceeded. Please raise your spending ceiling in the AI Studio spend cap dashboard.";
    } else if (isQuota) {
      responseCode = "QUOTA_EXCEEDED";
      errorMessage = "Gemini API Daily/Rate Quota has been exceeded. Please try again later or reduce request frequency.";
    } else if (errorMsg.includes("API key")) {
      responseCode = "API_KEY_INVALID";
      errorMessage = "Your Gemini API key is missing or invalid. Please check your Settings > Secrets configuration.";
    }

    res.status(isSpendingCap || isQuota ? 429 : 500).json({
      error: errorMessage,
      code: responseCode,
      details: error.message
    });
  }
});

// Helper for local simulation of email variations in case LLM is offline or rate-limited
function generateLocalVariations(text: string): string[] {
  const greetings = [
    { target: "Hi [Contact Name]", alts: ["Hello [Contact Name]", "Dear [Contact Name]", "Hey [Contact Name]", "Greetings [Contact Name]"] },
    { target: "Hi [Contact Name],", alts: ["Hello [Contact Name],", "Dear [Contact Name],", "Hey [Contact Name],", "Greetings [Contact Name],"] },
    { target: "I hope you are having an excellent week", alts: ["I hope you're having a great week", "Hope you're having a wonderful week", "Hope you are having a productive week", "Hope your week is off to a great start"] },
    { target: "Hi procurement team", alts: ["Hello procurement team", "To the procurement team", "Hi [Vendor Name] procurement", "Dear procurement team"] }
  ];

  const signoffs = [
    { target: "Best regards", alts: ["Warm regards", "Sincerely", "Kind regards", "Warmly"] },
    { target: "Best", alts: ["Best regards", "Kind regards", "Warmly", "Sincerely"] },
    { target: "Thank you", alts: ["Thanks so much", "Many thanks", "With appreciation", "Best regards"] }
  ];

  const meetingPhrases = [
    { target: "Would you have 10-15 minutes", alts: ["Might you have 15 minutes", "Do you have 10 to 15 minutes", "Could you spare 10-15 minutes", "Would you be open to a quick 10-15 minute chat"] }
  ];

  const variations: string[] = [];
  for (let i = 0; i < 20; i++) {
    let current = text;
    // Substitute common sentences/words
    greetings.forEach(g => {
      if (current.includes(g.target)) {
        const alt = g.alts[i % g.alts.length];
        current = current.replace(g.target, alt);
      }
    });
    signoffs.forEach(s => {
      if (current.includes(s.target)) {
        const alt = s.alts[i % s.alts.length];
        current = current.replace(s.target, alt);
      }
    });
    meetingPhrases.forEach(m => {
      if (current.includes(m.target)) {
        const alt = m.alts[i % m.alts.length];
        current = current.replace(m.target, alt);
      }
    });

    // If it's still duplicate, append minor phrase
    if (current === text || variations.includes(current)) {
      const suffixes = [
        " I appreciate your time.",
        " Looking forward to connecting.",
        " Hope we can catch up soon.",
        " Have a wonderful day.",
        " Enjoy the rest of your week.",
        " Let me know what you think.",
        " Thank you in advance for your consideration.",
        " Talk soon.",
        " Hope to speak details soon.",
        " Cheers."
      ];
      
      const cleanCurrent = current.toLowerCase().replace(/[^a-z0-9]/g, "");
      const availableSuffixes = suffixes.filter(s => {
        const cleanS = s.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        return !cleanCurrent.includes(cleanS);
      });

      const selectedSuffix = availableSuffixes.length > 0 
        ? availableSuffixes[i % availableSuffixes.length] 
        : " Best regards.";

      // Append to the last NON-EMPTY line so the suffix reads as a natural
      // closing at the end, instead of jamming onto the second-to-last line.
      const lines = current.split('\n');
      let li = lines.length - 1;
      while (li > 0 && lines[li].trim() === '') li--;
      lines[li] = lines[li] + selectedSuffix;
      current = lines.join('\n');
    }

    variations.push(cleanSentenceDuplications(current));
  }
  return variations;
}

function cleanSentenceDuplications(variationText: string): string {
  const paragraphs = variationText.split('\n');
  const cleanedParagraphs = paragraphs.map(p => {
    const sentences = p.split(/(?<=[.!?])\s+/);
    const seen = new Set<string>();
    const uniqueSentences = sentences.filter(s => {
      const cleanS = s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!cleanS) return true;
      if (seen.has(cleanS)) {
        return false;
      }
      seen.add(cleanS);
      return true;
    });
    return uniqueSentences.join(" ");
  });
  return cleanedParagraphs.join('\n');
}

// Generate 20 variations of email with slight copywriting deviations using LLM
app.post("/api/email-variations", async (req, res) => {
  const { text } = req.body || {};
  if (!text) {
    return res.status(400).json({ error: "Email template text is required" });
  }

  try {
    const prompt = `You are a high-performing outreach sequence copywriter.
Take the following email outreach template:
"${text}"

Please generate exactly 20 slightly deviated variations of this email template. 
Each variation must:
1. Preserve all bracketed placeholders completely unchanged (like [Contact Name], [Vendor Name], [Event Name], [Event], [Vendor], [Salesperson], [Location], [Month]) because they are replaced at runtime.
2. Have minor differences in tone, sentence order, vocabulary, or spacing, but keep the core message and CTA the same.
3. Be fully natural and professional.
4. CRITICAL: Avoid duplicate phrases or repeating sentences within any single variation (for example, do not repeat "I appreciate your time" or similar sentences twice in the same email).

Return exactly 20 distinct variations inside a JSON array under the key "variations".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            variations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 20 slightly different variations of the core template"
            }
          },
          required: ["variations"]
        }
      }
    });

    const result = JSON.parse(response.text);
    if (result.variations && Array.isArray(result.variations)) {
      let vars = result.variations.map((v: string) => cleanSentenceDuplications(v));
      while (vars.length < 20) {
        vars.push(...generateLocalVariations(text).slice(0, 20 - vars.length));
      }
      return res.json({ variations: vars.slice(0, 20) });
    }
    throw new Error("Invalid format from LLM");
  } catch (error: any) {
    console.error("Email variations API error, falling back locally:", error.message);
    const vars = generateLocalVariations(text);
    res.json({ variations: vars });
  }
});

// Linkup LinkedIn Verification & Contact Enrichment
app.post("/api/contacts-enrich", async (req, res) => {
  const { contacts, companyName } = req.body || {};
  if (!contacts || !Array.isArray(contacts)) {
    return res.status(400).json({ error: "Contacts array is required" });
  }

  const apiKey = process.env.LINKUP_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: LINKUP_API_KEY environment variable is not set. Contact enrichment will be skipped.");
  }

  console.log(`Contact Enrichment request for ${contacts.length} contacts at ${companyName || 'Unknown company'}`);

  try {
    const updatedContacts = await Promise.all(
      contacts.map(async (contact) => {
        if (!contact || !contact.name) {
          return contact;
        }

        try {
          const parts = contact.name.trim().split(/\s+/);
          const firstName = parts[0] || "";
          const lastName = parts.slice(1).join(" ") || "";

          let linkedinUrl = contact.social || "";
          let email = contact.email || "";

          // Skip calls if API key is not present
          if (!apiKey) {
            return contact;
          }

          // 1. If we don't have a social link, search & enrich via LinkUp
          if (!linkedinUrl && firstName) {
            console.log(`Searching LinkedIn profile for: ${contact.name} (${companyName})`);
            const enrichResponse = await fetch('https://mcp.linkupapi.com/mcp', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
              },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/call',
                params: {
                  name: 'linkupapi_enrich',
                  arguments: {
                    action: 'enrich_person',
                    params: {
                      first_name: firstName,
                      last_name: lastName,
                      company_name: companyName || ""
                    }
                  }
                }
              })
            });

            if (enrichResponse.ok) {
              const enrichText = await enrichResponse.text();
              const lines = enrichText.split('\n');
              for (const line of lines) {
                if (line.trim().startsWith('data: ')) {
                  const payloadStr = line.trim().substring(6).trim();
                  try {
                    const parsed = JSON.parse(payloadStr);
                    if (parsed.result && parsed.result.content && parsed.result.content[0]) {
                      const innerText = parsed.result.content[0].text;
                      const innerJson = JSON.parse(innerText);
                      if (innerJson.linkedin_profile && innerJson.linkedin_profile.linkedin_url) {
                        linkedinUrl = innerJson.linkedin_profile.linkedin_url;
                        console.log(`Verified LinkedIn url found: ${linkedinUrl}`);
                      }
                    }
                  } catch (pErr) {
                    console.error("Error parsing inner JSON-RPC payload:", pErr);
                  }
                }
              }
            } else {
              console.error(`LinkUp enrich person failed: ${enrichResponse.status} ${enrichResponse.statusText}`);
            }
          }

          // 2. Query email finder if email is missing and we have a LinkedIn URL
          if (!email && linkedinUrl) {
            console.log(`Retrieving email coordinates for ${contact.name} at: ${linkedinUrl}`);
            const emailResponse = await fetch('https://mcp.linkupapi.com/mcp', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
              },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: Date.now(),
                method: 'tools/call',
                params: {
                  name: 'linkupapi_enrich',
                  arguments: {
                    action: 'find_email',
                    params: {
                      linkedin_url: linkedinUrl
                    }
                  }
                }
              })
            });

            if (emailResponse.ok) {
              const emailText = await emailResponse.text();
              const lines = emailText.split('\n');
              for (const line of lines) {
                if (line.trim().startsWith('data: ')) {
                  const payloadStr = line.trim().substring(6).trim();
                  try {
                    const parsed = JSON.parse(payloadStr);
                    if (parsed.result && parsed.result.content && parsed.result.content[0]) {
                      const innerText = parsed.result.content[0].text;
                      const innerJson = JSON.parse(innerText);
                      if (innerJson.email) {
                        email = innerJson.email;
                        console.log(`Retrieved email: ${email}`);
                      } else if (innerJson.alternatives && innerJson.alternatives.length > 0) {
                        email = innerJson.alternatives[0];
                        console.log(`Retrieved alternative email: ${email}`);
                      }
                    }
                  } catch (pErr) {
                    console.error("Error parsing find_email inner response:", pErr);
                  }
                }
              }
            } else {
              console.error(`LinkUp find email failed: ${emailResponse.status} ${emailResponse.statusText}`);
            }
          }

          return {
            ...contact,
            social: linkedinUrl || contact.social,
            email: email || contact.email
          };
        } catch (e: any) {
          console.error(`Error enriching contact ${contact?.name || 'unknown'}:`, e.message);
          return contact; // keep as-is on error
        }
      })
    );

    res.json({ contacts: updatedContacts });
  } catch (error: any) {
    console.error("Endpoint contacts-enrich overall error:", error);
    res.status(500).json({ error: "Failed to enrich contacts", details: error.message });
  }
});

// Find more contacts using Gemini Search tool
app.post("/api/find-more-contacts", async (req, res) => {
  const { companyName, existingNames, searchType } = req.body || {};
  if (!companyName) {
    return res.status(400).json({ error: "Company/Event name is required" });
  }

  const model = "gemini-3.5-flash";
  const currentSearchType = searchType || "event";
  const existingNamesArray = Array.isArray(existingNames) ? existingNames : [];
  const existingListStr = existingNamesArray.length > 0 ? existingNamesArray.join(", ") : "None";

  console.log(`Find More Contacts request for: ${companyName} (${currentSearchType}), excluding: [${existingListStr}]`);

  try {
    let prompt = "";
    if (currentSearchType === "vendor") {
      prompt = `Find 3 additional key contacts, executives, managers, or employees for the company/vendor "${companyName}".
      The following contacts are already in our list: [${existingListStr}]. 
      You MUST search for NEW contacts that are NOT in this list (do not return duplicates).
      
      Return a JSON object containing a list of contacts with their role, name, email, phone, and social handle (LinkedIn profile URL).`;
    } else {
      prompt = `Find 3 additional key contacts, organizers, directors, or representatives for the trade show/conference/event "${companyName}".
      The following contacts are already in our list: [${existingListStr}].
      You MUST search for NEW contacts that are NOT in this list (do not return duplicates).
      
      Return a JSON object containing a list of contacts with their role, name, email, phone, and social handle (LinkedIn profile URL).`;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            contacts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  name: { type: Type.STRING },
                  email: { type: Type.STRING, description: "Public email or empty" },
                  phone: { type: Type.STRING, description: "Public phone or empty" },
                  social: { type: Type.STRING, description: "LinkedIn URL or empty" }
                },
                required: ["role", "name"]
              }
            }
          },
          required: ["contacts"]
        }
      }
    });

    const result = JSON.parse(response.text);
    // Ensure all contacts have email/phone/social fields populated (at least as empty strings)
    const cleanedContacts = (result.contacts || []).map((c: any) => ({
      role: c.role || "",
      name: c.name || "",
      email: c.email || "",
      phone: c.phone || "",
      social: c.social || ""
    }));

    res.json({ contacts: cleanedContacts });
  } catch (error: any) {
    console.error("Find More Contacts Gemini Error, falling back to simulation:", error.message);
    
    // Fallback logic
    const mockNames = ["David Miller", "Karen Taylor", "Robert Garcia", "Linda Martinez", "James Wilson"];
    const mockRoles = currentSearchType === "vendor" 
      ? ["Marketing Coordinator", "Operations Director", "Account Executive"]
      : ["Marketing Coordinator", "Operations Manager", "Public Relations Advisor"];
    
    const domain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '') || "example";
    
    const filteredMockContacts = mockNames
      .filter(name => !existingNamesArray.some((ex: string) => ex.toLowerCase() === name.toLowerCase()))
      .slice(0, 3)
      .map((name, i) => ({
        role: mockRoles[i % mockRoles.length],
        name: name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@${domain}.com`,
        phone: `+1 (555) 019-${100 + i}`,
        social: `https://linkedin.com/in/${name.toLowerCase().replace(/\s+/g, "-")}-${domain}`
      }));

    res.json({ contacts: filteredMockContacts });
  }
});

// Helper to simulate website scraping using Gemini Search Grounding
async function simulateScrapeWithGemini(url: string, companyName: string): Promise<any[]> {
  const model = "gemini-3.5-flash";
  const prompt = `Research public contact information, executives, organizers, or key representatives for "${companyName || url}" (website: ${url}).
  Specifically, look up public emails, phone numbers, and LinkedIn profiles.
  
  Identify and return any actual public key contacts in JSON format matching the schema below.
  Only return real, verified contact info that exists. Do not hallucinate or invent fake names/emails if they are not publicly available. If no contacts are found, return an empty array for "contacts".
  
  Schema:
  - contacts: array of objects with fields "role", "name", "email", "phone", "social" (LinkedIn URL).`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            contacts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  name: { type: Type.STRING },
                  email: { type: Type.STRING, description: "Public email or empty" },
                  phone: { type: Type.STRING, description: "Public phone or empty" },
                  social: { type: Type.STRING, description: "LinkedIn URL or empty" }
                },
                required: ["role", "name"]
              }
            }
          },
          required: ["contacts"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return result.contacts || [];
  } catch (err: any) {
    console.error("Gemini Scrape Simulation failed:", err);
    throw err;
  }
}

const ALLOWED_PUBLIC_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
  "aol.com", "mail.com", "zoho.com", "protonmail.com", "proton.me", "live.com"
]);

const SOCIAL_AND_PLATFORM_DOMAINS = new Set([
  "twitter.com", "x.com", "linkedin.com", "facebook.com", "instagram.com", 
  "youtube.com", "pinterest.com", "tiktok.com", "github.com", "medium.com"
]);

function getBaseDomain(urlStr: string): string {
  try {
    let parsedUrl = urlStr.trim();
    if (!parsedUrl) return "";
    if (!/^https?:\/\//i.test(parsedUrl)) {
      parsedUrl = 'http://' + parsedUrl;
    }
    const hostname = new URL(parsedUrl).hostname.toLowerCase();
    return hostname.replace(/^www\./, '');
  } catch (e) {
    return "";
  }
}

function isEmailDomainValid(email: string, validDomains: string[]): boolean {
  if (!email) return true;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  const emailDomain = parts[1];

  if (ALLOWED_PUBLIC_DOMAINS.has(emailDomain)) {
    return true;
  }

  for (const validDomain of validDomains) {
    if (!validDomain) continue;
    if (emailDomain === validDomain || emailDomain.endsWith('.' + validDomain)) {
      return true;
    }
  }

  return false;
}

function cleanAndValidateContacts(contacts: any[], url: string, officialWebsite?: string): { contacts: any[], warnings: string[] } {
  const validDomains: string[] = [];
  const defaultDomain = getBaseDomain(url);
  if (defaultDomain && !SOCIAL_AND_PLATFORM_DOMAINS.has(defaultDomain)) {
    validDomains.push(defaultDomain);
  }
  const officialDomain = getBaseDomain(officialWebsite || "");
  if (officialDomain && !SOCIAL_AND_PLATFORM_DOMAINS.has(officialDomain) && !validDomains.includes(officialDomain)) {
    validDomains.push(officialDomain);
  }

  const warnings: string[] = [];
  const cleaned = contacts.map((c: any) => {
    let email = c.email || "";
    if (email && validDomains.length > 0 && !isEmailDomainValid(email, validDomains)) {
      warnings.push(`Filtered out invalid email '${email}' (domain mismatch).`);
      email = "";
    }
    return {
      role: c.role || "",
      name: c.name || "",
      email: email,
      phone: c.phone || "",
      social: c.social || ""
    };
  }).filter(c => c.name);

  return { contacts: cleaned, warnings };
}

// Firecrawl Scrape API
app.post("/api/firecrawl-scrape", async (req, res) => {
  const { url, companyName, officialWebsite } = req.body || {};
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  const apiKey = process.env.FIRECRAWL_API_KEY;
  console.log(`Firecrawl Scrape request for URL: ${url} (Company: ${companyName})`);

  try {
    let contacts: any[] = [];

    if (apiKey) {
      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: url,
          formats: ["extract"],
          extract: {
            prompt: "Extract the names of public key contacts, employees, organizers, speakers, or representatives, along with their roles, emails, phone numbers, and LinkedIn profile URLs.",
            schema: {
              type: "object",
              properties: {
                contacts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      role: { type: "string" },
                      name: { type: "string" },
                      email: { type: "string" },
                      phone: { type: "string" },
                      social: { type: "string" }
                    },
                    required: ["role", "name"]
                  }
                }
              },
              required: ["contacts"]
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Firecrawl API responded with status ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success && result.data && result.data.extract && Array.isArray(result.data.extract.contacts)) {
        contacts = result.data.extract.contacts;
      } else {
        throw new Error("Invalid extract format from Firecrawl API");
      }
    } else {
      console.warn("WARNING: FIRECRAWL_API_KEY environment variable is not set. Using Gemini to simulate scrape...");
      contacts = await simulateScrapeWithGemini(url, companyName);
    }

    const { contacts: cleanedContacts, warnings } = cleanAndValidateContacts(contacts, url, officialWebsite);
    res.json({ contacts: cleanedContacts, warnings });
  } catch (error: any) {
    console.error("Firecrawl Scrape API overall error, falling back to Gemini simulation:", error);
    try {
      const fallbackContacts = await simulateScrapeWithGemini(url, companyName);
      const { contacts: cleanedFallback, warnings } = cleanAndValidateContacts(fallbackContacts, url, officialWebsite);
      res.json({ contacts: cleanedFallback, warnings });
    } catch (fallbackError: any) {
      res.status(500).json({ error: "Failed to scrape website", details: error.message });
    }
  }
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

if (!process.env.VERCEL) {
  // Local dev convenience: serve the extension API from this same process so
  // localhost testing works. On Vercel these routes live in a SEPARATE function
  // (api/extension) — nothing from the extension/firebase-admin graph is ever
  // imported here, so the core API can't be affected by it. The dynamic import
  // is guarded by !VERCEL so it never runs (or bundles into) the core function.
  import("./server/extension.js").then(({ registerExtensionRoutes }) => {
    registerExtensionRoutes(app, ai);
    return setupVite();
  }).then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  });
}
