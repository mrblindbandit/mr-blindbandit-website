# Writing and community follow-up — 2026-09-09

Three improvements across the internal and public checklist:

1. Writing shortcuts in Publishing studio: new titles fill an untouched slug field; text-based suggestions provide a title, collision-checked slug and excerpt. Applying suggestions only fills empty fields, including search metadata. Nothing publishes automatically; preview and validation remain mandatory.
2. Public community entry points on Home, News and Community; official announcements are linked alongside posting. The private overview has a public-announcement shortcut with the correct board preselected in Community publishing. Private label announcements remain separate.
3. Protected Portal guide with a task-search interface, role-filtered tool links and plain instructions. It does not inspect records, send messages or make changes.

The runtime has no AI provider configured. Writing suggestions and the portal guide are explicitly identified as text-based tools, not AI. No chatbot provider or paid integration was enabled.

Validation: 23 automated tests pass, including slug collisions, no implicit article creation, authenticated writing access, guide page protection, existing publication checks and private audience isolation. Frontend JavaScript syntax checks passed.
