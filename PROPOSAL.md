# Design Proposal: Kemotown - A Community Platform for Korean Furry Meetups

**Version:** 0.6
**Date:** May 19, 2025

## 1. Introduction and Objectives**

The Korean furry community currently experiences challenges in organizing and discovering local meetups. Existing methods often rely on public platforms, which can be difficult to moderate for specific community needs, or on fragmented private channels, which can limit broader community engagement.

**Kemotown** is a proposed application designed to provide a dedicated, semi-formal digital space for the Korean furry community. The objective is to support a more cohesive, accessible, and engaging community through tools for event organization, participation, and social interaction. To further assist event hosts and simplify participation in paid events, Kemotown will also incorporate an automated payment system leveraging Toss Payments. The goal is for Kemotown to serve as a primary platform for discovering and hosting furry meetups in Korea, facilitating real-world connections. The platform's user interface will draw from familiar Korean social networking services like "Naver Band." A key metric for the platform's utility will be the organization of at least two meetups per month through its features, indicating active community use.

Kemotown will feature an integrated social experience centered around event attendance. Key differentiating aspects include features for community familiarity (such as past event attendance tracking) and practical tools like streamlined payment handling.

## 2. Platform Overview and Core Functionality

**Kemotown** will be developed as a cross-platform application (Web, iOS, Android) using Next.js/React for accessibility and rapid development. The initial launch (Minimum Viable Product - MVP) will focus on essential features for event hosting, attendance, basic user profiles, user discovery, and will include integrated payment processing for paid events.

### 2.1. Event Creation and Management

Kemotown will provide hosts with a set of tools for event management, including payment handling:

* **Detailed Event Listings:** Hosts can create new meetups with information including a title, cover image/banner, and a Markdown-enabled description (a WYSIWYG editor may be considered for web). Hosts will define the event's date, start/end times (localized to Korea), and physical location (address and embedded Naver Map link). The exact location can be configured to be visible only to confirmed attendees for privacy.
* **Cost and Attendance - Automated Payment System (via Toss Payments):**
  * **Function:** For paid events, Kemotown will automate payment collection and confirmation.
  * **Kemotown's Role as Intermediary:** Kemotown (operated by the project's `개인사업자` - sole proprietorship) will function as a marketplace intermediary (통신판매중개업). This requires:
    * One Toss Payments merchant ID (MID).
    * Enabling Toss's Marketplace/지급대행 (Payout Service) feature.
    * A one-time 통신판매중개업 notice filing at the local district office.
  * **Host Onboarding for Payments:** To receive payments, each host undergoes a one-time registration within Kemotown as a "seller" with Toss Payments via API integration (POST /v2/sellers). This typically involves name/bank account verification and phone verification. Hosts do not need separate PG licenses or marketplace filings.
  * **Attendee Payment & Host Payout Flow:**
        1. For an approved attendee of a paid event, Kemotown, via Toss Payments, issues a unique virtual bank account.
        2. The attendee wires the fee to this virtual account.
        3. Toss Payments triggers a deposit-callback webhook to Kemotown's backend.
        4. Kemotown's backend updates the attendee's status to "Paid."
        5. Kemotown instructs Toss Payments (via payout API) to transfer funds to the host's registered bank account.
  * **Operation & Compliance:** This system facilitates prompt fund reception for hosts. Kemotown does not hold customer funds directly in its operational account; Toss manages the payment flow. The settlement account on Kemotown's Toss MID belongs to the Kemotown `개인사업자`.
* **Attendee Management & Event Caps:** Hosts can set a maximum number of attendees. For paid events, confirmed attendance will likely be tied to successful payment. A waitlist system will manage overflow.
* **Other Host Tools:** Hosts can choose between Permissioned Events (manual review, optional screening questions) or Freely Attended Events (open, optional cap). Hosts can broadcast one-way messages to attendees. Co-hosts can be appointed with full administrative permissions for the event (for MVP). A "clone event" feature will allow duplication of past events. Event tags (e.g., #FursuitFriendly) will aid discoverability. Event rules can be included in the main description.

### 2.2. User Participation

Kemotown will provide functionality for discovering and participating in meetups, including payment for paid events:

* **Event Discovery:** Upcoming meetups will be presented in a card list format, sorted by most recent by default. Simple date-based filtering will be available. Users can export event details as an `.ics` file.
* **RSVP System & Payment:**
  * Users can select "Attending," "Considering," or "Not Attending."
  * For paid events, selecting "Attending" (and being approved if permissioned) initiates the virtual account issuance for payment. "Attending" status is confirmed upon payment verification.
  * Lists of "Attending" and "Considering" users are visible on the event page to other logged-in users (hosts can restrict this). "Not Attending" status is host-only. Users can change their RSVP status (prior to payment). Hosts are notified of new RSVPs and payment confirmations.

### 2.3. User Profiles & Discovery

User profiles are a component for community interaction. Kemotown will also provide basic tools for user discovery:

* **Profile Content:** Users can include a username, optional furry/character name, profile picture, a fursuit photo gallery, character details, links to social media, and user-selectable interest tags.
* **Attendance History:** A feature will be the automatic population of a user's profile with a list of attended events.
* **Profile Visibility:** Within the platform, profile information is visible to other logged-in users. No user data is publicly accessible outside the application.
* **User Search & Discovery (MVP):**
  * A search function for finding users by username or furry name.
  * A "Discovery" tab presenting a gallery of users, sortable by physical distance (requires user opt-in for approximate location sharing).
* **The "Bump" Feature:** A "Bump" feature is designed to record in-person interactions at events. This can be achieved via QR code scanning or manual confirmation, requiring mutual consent. Successful "bumps" contribute to a visible count of interactions and can unlock badges or achievements. This is intended to encourage in-person engagement.

### 2.4. Event Timelines (Post-MVP Enhancement)

A high-priority future addition is an event-specific timeline. This would allow attendees to:

* Share text posts, photos, videos, links, and polls. Posts will be displayed most recent first.
* Engage with comments and reactions.
* The timeline would be active before, during, and after the event, serving as a persistent archive (unless content is deleted).
* Hosts would control privacy and have moderation rights.

### 2.5. Informal Meetups: "Looking for Group/Event" (LFG - Future Feature)

A "Looking for Group/Event" feature is planned to allow users to post informal meetup suggestions.

* **Functionality:** LFG posts will form a global timeline, displayed most recent first, and will not expire unless deleted.
* **Searchability/Notifications:** No specific search or location-based notifications for LFG posts in MVP.
* This feature allows for low-friction organization of smaller gatherings.

## 3. Design Philosophy and User Experience (UI/UX)

The application's design will aim for a **simple, cute, and modern aesthetic, intended to be welcoming.** Inspiration will be drawn from the card layouts and icon styles of "Naver Band" (avoiding green as a primary color theme) and recent Google Material Design updates. The UI will be minimal but not overly simplistic. No platform mascot is planned for now.

Key user flows will be designed for ease of use. The UX for host payment onboarding and attendee payment will be designed for simplicity and clarity. The new user onboarding process will be quick and require minimal initial information. Basic accessibility considerations like good color contrast will be kept in mind.

## 4. Safety, Privacy, and Moderation

A safe and respectful environment is a primary consideration.

* **Age Policy & Content:** The platform is for all ages; R18+/NSFW content is prohibited. Enforcement will be reactive via user reports.
* **User Blocking:** Users can block other users. This limits profile visibility, hides content on timelines (with an option to show), and prevents "bump" interactions or DMs (if added). The blocked user is not notified.
* **Platform Code of Conduct (CoC):** A concise CoC will outline expectations for respectful behavior and content.
* **Moderation:** User reports will notify platform operator(s) for manual review. Moderators will have tools to view reports/content, warn, suspend, ban users, and delete content. An email appeal process will be available.
* **Data Privacy:** Only data essential for service provision will be collected.
  * For Toss Payments integration, Kemotown will facilitate collection of information required by Toss for host seller registration and virtual account issuance.
  * Kemotown will not store sensitive payment details beyond what's necessary for the Toss integration. Payment processing occurs within Toss Payments' environment.
  * The Privacy Policy will detail the role of Toss Payments.

## 5. Monetization and Long-Term Sustainability

**Kemotown** is planned as a non-commercial project. There are no plans for monetization. The payment system is for compliance and convenience. Server/domain costs will be covered by the project lead.

## 6. Future Roadmap

Future development beyond the MVP and initial post-MVP features may include:

* Convention integration.
* Official group pages.
* Event templates.
* Anonymous and private post-event feedback for hosts.
* Verified host/organizer badges.
* Advanced user discovery (topological distance, follow/friend system).
* Direct messaging.
* Enhanced financial reporting for hosts.

## 7. Areas for Continued Design and Development

* Finalizing "Bump" Mechanics (QR vs. Manual for MVP), visibility rules for "bump" history.
* Specific fields for "Character Details" in profiles.
* **Detailed UX/UI for Toss Payments Integration:**
  * Host onboarding flow for seller registration.
  * Attendee experience for virtual accounts and payment status.
  * Display of "Paid" status.
  * Handling edge cases (payment errors, refund process, etc.).
* Detailed content for Privacy Policy and Terms of Service.
* Waitlist behavior details for paid spots.
* Defining a non-green color palette and specific UI card layouts.
* Implementation details for location services.
