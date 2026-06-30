// Pure data, no imports — shared by the web app composer (PipelineCard) and the
// extension backend (server/templates.ts) so the built-in default template is
// defined exactly once. User/shared templates live in Firestore on top of this.

export const DEFAULT_TEMPLATE_ID = "druid_intro";
export const DEFAULT_TEMPLATE_NAME = "Druid Event Introduction";
export const DEFAULT_TEMPLATE_SUBJECT = "Event video & photography coverage for [Event Name]";

export const DEFAULT_TEMPLATE_TEXT = `Hello!

My name is Chris, I'm the owner of Druid Productions. A colleague informed me of your upcoming event in [Month] and encouraged me to reach out as we work with many similar companies and events. Hopefully I have the correct contact, this is my first time attempting to introduce our company to yours. Please let me know if this ended up in the right place!

Druid Productions is 100% dedicated to event video and photography coverage, providing a wide range of services for major events across the US. Specializing in coverage for corporate events, summits, expos, trade shows and conferences, our work includes many of the premier events and brands in the US. Druid has developed a reputation as a reliable high quality vendor in the event space.

We are a national company, fulfilling ongoing services for our clients year after year in all 50 states. A significant portion of the work we do is in the [Location] area.
You may already have someone lined up to assist with your event, but in case you still need help, I wanted to introduce myself and start a conversation. Druid has some unique offerings that can complement your existing production, or we can step in as a turnkey solution for any event size or production level.

My teams use the most modern equipment and we provide a premium service at an excellent price. All my staff are veterans in the event industry and we show up with total professionalism. Should your project require editing services, our team of editors is standing by and we include a robust review process with every video we deliver.
 I appreciate your time.
Please check us out and see what our clients have to say. If you are impressed with what you see, let me know if you would like to discuss the possibilities of working together on your upcoming initiatives. We come highly rated and won't stop until you're 100% satisfied.`;
