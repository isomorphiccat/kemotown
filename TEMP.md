# Unresolved CodeRabbit Review Issues

## Security Concerns

### 1. XSS Vulnerability in Timeline Component
**File:** `src/components/timeline/Timeline.tsx` (lines 243-259)
- The `renderContent` function renders usernames as links without validation
- Malicious usernames containing HTML or special characters could cause XSS attacks
- **Recommendation:** Add username validation and sanitization before rendering

### 2. Missing Input Validation in Bot Route
**File:** `src/app/api/timeline/bot/route.ts`
- No validation for `eventId` parameter before database operations
- Could lead to injection attacks or unexpected errors
- **Recommendation:** Add proper input validation using zod or similar validation library

## Authorization Issues

### 3. Overly Restrictive Event Host Permissions
**File:** `src/lib/timeline/timeline-service.ts` (lines 222-224)
- Event hosts cannot react to their own event posts before anyone RSVPs
- This seems like unintended behavior
- **Recommendation:** Allow event hosts to react even without RSVPs by checking host status

### 4. Incomplete Post Deletion Authorization
**File:** `src/lib/timeline/timeline-service.ts` (lines 321-339)
- Only allows deletion by original user author
- Doesn't handle bot-authored posts or admin privileges
- **Recommendation:** 
  - Allow deletion if post was authored by requester's `botUserId`
  - Allow deletion by event hosts or site admins
  - Return more specific error types

## Code Quality Issues

### 5. Limited Username Pattern Support
**File:** `src/lib/timeline/timeline-service.ts` (lines 72-73)
- Mention regex `/@(\w+)/g` only matches word characters
- Doesn't support common username patterns with hyphens, dots, or underscores
- **Recommendation:** Update regex to `/@([\w\-_.]+)/g`

### 6. Documentation Formatting Issues
**File:** `DESIGN.md`
- Missing comma in date format (line 3)
- Tables need blank lines around them (lines 254, 339, 353)
- Emphasis used instead of headings (lines 396, 402, 408, 414, 420)
- **Recommendation:** Fix markdown formatting for better readability

## Bot System Security

### 7. Bot Authentication Not Fully Implemented
**File:** `src/app/api/timeline/bot/route.ts`
- While API key validation exists, the bot system needs additional security measures
- Consider rate limiting per bot/API key
- Add bot-specific permissions and scopes
- **Recommendation:** Implement comprehensive bot authentication and authorization

These issues should be addressed to improve the security, functionality, and code quality of the timeline feature.