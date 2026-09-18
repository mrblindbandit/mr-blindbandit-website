"""Twenty substantive public artist, music, label, creator, press and fan pages."""
import html

def expand_public(output,layout,pages):
    entries=[
      ('/artist/creative-process/','Creative process','How Mr. Blindbandit develops an idea from atmosphere and rhythm into a finished independent release.',[
       ('Starting with feeling','The process often begins with a mood, texture, rhythm or imagined place rather than a fixed genre. That first idea becomes a reference point for every later decision.'),
       ('Building the arrangement','Sounds are layered, removed and reshaped until the track has a clear movement. Space matters as much as density: a quiet transition can give the next section more weight.'),
       ('Accessible production','Screen readers, keyboard commands, careful file naming and repeatable workflows make independent production practical. Accessibility is part of the working method, not an afterthought.'),
       ('Finishing the record','The final stage checks structure, credits, versions, artwork, metadata and delivery requirements. A release is ready only when the creative idea and the practical details agree.')],('/music/','Explore the music')),
      ('/artist/accessibility-story/','Creating without sight','A closer look at blindness, accessible technology and the working perspective behind Mr. Blindbandit.',[
       ('Sound as primary information','Blindness does not make music abstract or distant. Sound carries location, emotion, timing, personality and detail, making it a direct way to understand and shape an experience.'),
       ('Tools that provide access','VoiceOver, screen readers, keyboard navigation and consistent digital organization turn visual interfaces into usable information. Tools work best when labels and controls are designed accessibly.'),
       ('Creative independence','Accessible technology supports research, communication, publishing and production. It allows the artist to make decisions directly and maintain control over the work.'),
       ('A wider standard','Accessibility benefits listeners, collaborators and visitors with many different needs. Captions, transcripts, meaningful labels and keyboard access are professional production practices.')],('/accessibility/','Visit the accessibility hub')),
      ('/artist/influences/','Sounds and influences','The environments, genres and creative ideas that shape the Mr. Blindbandit sound.',[
       ('Atmosphere','Ambient and cinematic music show how tone, space and repetition can build a world without needing to explain it in words.'),
       ('Rhythm and connection','Hip-hop and electronic production bring movement, contrast and collaboration. A beat can anchor an experimental texture and make it immediate.'),
       ('Memory and place','Virginia roots, travel and life in the Philippines contribute different sounds, rhythms and emotional associations to the creative vocabulary.'),
       ('Independent experimentation','The catalog is allowed to move between styles. Alternate versions, dreamscape mixes and collaborations make exploration part of the identity.')],('/music/','Browse the catalog')),
      ('/artist/quick-facts/','Artist quick facts','A concise, artist-supplied reference about Kaeleb Savon Heck and the Mr. Blindbandit project.',[
       ('Identity','Mr. Blindbandit is the professional artist name of Kaeleb Savon Heck, an American recording artist, producer and digital creator.'),
       ('Creative home','The project connects Virginia roots with life in the Philippines and a worldwide digital audience.'),
       ('Work','The catalog includes ambient, cinematic, electronic, experimental and hip-hop-connected releases, along with collaborative recordings.'),
       ('Organization','Kaeleb founded Blindbandit Records as the independent label identity supporting releases, collaborations and artist services.')],('/biography/','Read the full biography')),
      ('/music/listening-guide/','Listening guide','Ways to enter the Mr. Blindbandit catalog by mood, format and listening setting.',[
       ('Start with atmosphere','Choose an ambient or cinematic release when you want a spacious background for rest, reflection, reading or late-night listening.'),
       ('Follow the rhythm','Use the singles and collaborations when you want stronger beats, featured voices and a more direct connection to hip-hop and electronic production.'),
       ('Compare versions','Original, extended and dreamscape versions reveal how pacing and texture change the emotional shape of the same idea.'),
       ('Use the official players','The music and listening-room pages connect to official streaming destinations. Availability can vary by platform and location.')],('/listen/','Open the listening room')),
      ('/music/mood-guide/','Music by mood','Find a starting point in the catalog based on the feeling or activity you want.',[
       ('Rest and reflection','Look for slower ambient pieces, wide textures and gentle repetition when the goal is calm or focused background listening.'),
       ('Movement and energy','Beat-driven singles and collaborations suit workouts, travel and moments that need forward motion.'),
       ('Dreamlike spaces','Dreamscape and alternate versions emphasize transition, distance and immersive sound design.'),
       ('Curious listening','Albums and EPs reward uninterrupted listening because neighboring tracks can reveal a larger creative arc.')],('/music/','Choose a release')),
      ('/music/ambient-worlds/','Ambient worlds','How atmosphere, repetition and imagined space operate inside the Mr. Blindbandit catalog.',[
       ('Music as environment','An ambient track can behave like a room: every texture changes the sense of size, distance and light.'),
       ('Repetition with purpose','Repeating phrases create familiarity while small changes keep the listener attentive. The movement can be subtle without being static.'),
       ('Space in the mix','Silence, decay and separation allow individual sounds to remain clear. The result can feel larger than a densely filled arrangement.'),
       ('Listening intentionally','Headphones reveal detail, while speakers let the music blend with a physical space. Both approaches can create a different experience.')],('/music/','Explore ambient releases')),
      ('/music/collaboration-guide/','Collaboration guide','Explore the shared records, featured artists and creative connections around Mr. Blindbandit.',[
       ('A shared record','A collaboration brings separate voices, audiences and working methods into one release. Clear credits help listeners follow every contributor.'),
       ('Featured connections','The site highlights UUu Tang Maskman and other credited collaborators, with links to shared releases and each artist’s work.'),
       ('Respecting ownership','A feature or production contribution does not automatically transfer ownership. Splits, permissions and release responsibilities should be agreed in writing.'),
       ('Proposing a collaboration','A useful introduction includes the concept, reference music, expected role, timeline, budget and a private working link.')],('/collaborators/','Meet the collaborators')),
      ('/label/artist-services/','Artist services','What Blindbandit Records can evaluate with an artist before any formal engagement.',[
       ('Release preparation','The label can review whether masters, artwork, credits, identifiers and delivery plans are organized for distribution.'),
       ('Project coordination','A clear plan connects deadlines, responsibilities, approvals, assets and campaign activity around one release.'),
       ('Rights readiness','Artists should understand who owns the master and composition, whether samples are cleared and which contributors need credit or approval.'),
       ('Individual terms','Services, fees, revenue shares and commitments are never created by visiting this page or submitting music. They require a separate written agreement.')],('/submit/','Submit music for consideration')),
      ('/label/distribution-guide/','Music distribution guide','A practical overview of preparing music for digital distribution through an independent label or distributor.',[
       ('Prepare the audio','Use the final approved master in the format requested by the chosen distributor. Do not deliver unfinished mixes under a final title.'),
       ('Prepare metadata','Confirm artist names, titles, featured credits, writers, producers, release dates, language, explicit-content status and identifiers.'),
       ('Prepare artwork','Use artwork you own or are authorized to distribute. Check dimensions, text, logos and platform restrictions before delivery.'),
       ('Verify after release','Check every store listing, artist profile, credit and link. Document errors precisely so corrections can be submitted efficiently.')],('/release-checklist/','Use the release checklist')),
      ('/label/demo-review/','How demo review works','What artists should expect when submitting music to Blindbandit Records.',[
       ('What to send','Provide a working private or public listening link, the project title, genre, contact email and a short explanation of what you want.'),
       ('What is considered','Review can consider musical fit, originality, recording readiness, rights clarity, audience strategy and whether the label has capacity to help.'),
       ('What submission means','Submitting allows private review and contact about the submission. It does not transfer ownership, guarantee feedback or create a signing agreement.'),
       ('Protect your work','Keep your original files and ownership records. Do not send passwords, identity documents, banking details or unrelated confidential information.')],('/submit/','Open the submission form')),
      ('/label/release-strategy/','Independent release strategy','Build a realistic release plan around the music, audience and resources actually available.',[
       ('Choose one objective','Decide whether the release should deepen fan connection, introduce a new sound, support a collaboration or build a larger project.'),
       ('Work backward','Set the target release date, then reserve time for masters, artwork, metadata, delivery, content, pitching and correction.'),
       ('Create useful content','Prepare a small set of strong assets with captions, alt text, clear calls to action and platform-appropriate formats.'),
       ('Review honestly','Measure what happened using dated, sourced numbers. Separate meaningful listener behavior from vanity metrics and artificial engagement.')],('/label/','Explore Blindbandit Records')),
      ('/creators/accessible-studio/','Accessible studio practices','Practical habits for making a music workspace easier to navigate without sight.',[
       ('Consistent organization','Use predictable folders, descriptive filenames, version numbers and dated exports so files can be identified without relying on cover images.'),
       ('Keyboard-first operation','Learn reliable shortcuts for transport, editing, navigation and export. A repeatable sequence reduces dependence on inaccessible pointer controls.'),
       ('Accessible collaboration','Ask collaborators to label tracks clearly, describe visual meters when needed and send structured notes with time references.'),
       ('Verification','Listen to exports from beginning to end, confirm silence and fades, and use trusted assistance for visual details that software does not expose.')],('/accessibility/listening/','Explore accessible listening')),
      ('/creators/screen-reader-music/','Screen readers and music work','How screen-reader users can structure research, communication and production tasks.',[
       ('Choose compatible tools','Accessibility varies between operating systems, audio applications and plug-ins. Test essential workflows before purchasing or committing to a platform.'),
       ('Build command knowledge','Keyboard commands and custom shortcuts can turn complex repeated actions into dependable workflows.'),
       ('Document the session','Track tempo, key, versions, contributors, plug-ins and export settings in a plain-text session note that remains easy to search.'),
       ('Ask for specific access','When a control is unlabeled, report the product version, screen reader, operating system and exact blocked action to the developer.')],('/accessibility/','Accessibility resources')),
      ('/creators/independent-release/','Independent artist release guide','A start-to-finish framework for releasing music without losing control of the details.',[
       ('Define the release','Choose the approved recording, artist presentation, title, version, audience and purpose before building the campaign.'),
       ('Confirm rights','Document master ownership, writer shares, producer terms, samples, features and artwork permission before distribution.'),
       ('Deliver carefully','Use consistent metadata and identifiers, review store dates and preserve the distributor confirmation reference.'),
       ('Maintain the catalog','After launch, archive masters and artwork, verify links, record corrections and keep credits current on the official website.')],('/release-checklist/','Prepare an independent release')),
      ('/press/interview-topics/','Interview topics','Suggested factual directions for interviews with Mr. Blindbandit.',[
       ('Music and process','Discuss how atmosphere, rhythm, alternate versions and collaboration shape the catalog.'),
       ('Blindness and technology','Explore accessible production, VoiceOver, screen readers and the difference between genuine access and symbolic inclusion.'),
       ('Independent work','Discuss Blindbandit Records, digital publishing and the responsibilities that come with controlling a release operation.'),
       ('Life across places','Virginia roots, travel and life in the Philippines offer context for identity, sound and personal storytelling.')],('/booking/','Request an interview')),
      ('/press/brand-facts/','Brand and naming guide','Approved names, descriptions and linking practices for Mr. Blindbandit and Blindbandit Records.',[
       ('Artist name','Use “Mr. Blindbandit” as the preferred artist styling. Kaeleb Savon Heck may be used when identifying the person behind the project.'),
       ('Label name','Use “Blindbandit Records” for the independent label identity. Do not imply that the label represents an artist without confirmation.'),
       ('Biography claims','Treat website biographies as artist-supplied information. Independent articles should verify material claims through appropriate sources.'),
       ('Official reference','Link to mrblindbandit.net for the current catalog, biography, press materials, contact routes and policies.')],('/press/','Open the press room')),
      ('/fans/starter-guide/','New listener starter guide','A simple path through the music, story and community for first-time visitors.',[
       ('Meet the artist','Begin with the biography for the concise reference or the first-person story for a more personal introduction.'),
       ('Choose a sound','Use the music catalog, mood guide or listening room to find a release that fits the moment.'),
       ('Follow official channels','Official streaming and social links reduce confusion and help listeners reach the correct artist profiles.'),
       ('Join respectfully','The fan community welcomes music discussion and creative exchange. Use a public display name and keep private information out of posts.')],('/discover/','Start discovering')),
      ('/fans/community-guide/','Fan community guide','How to create a profile, publish posts and participate safely in the Mr. Blindbandit community.',[
       ('Create one account','Use Clerk sign-in, then choose the public display name shown beside your posts and comments.'),
       ('Start a useful discussion','Choose the right board, write a clear title and give enough context for other fans to respond.'),
       ('Keep private details private','Posts are public. Do not publish passwords, account links, phone numbers, private email, contracts or someone else’s personal information.'),
       ('Use community controls','You can review your activity in the dashboard, remove your contributions and report material that needs moderator attention.')],('/community/account/','Create a community profile')),
      ('/resources/','Artist and label resource center','A guided directory of useful Mr. Blindbandit, Blindbandit Records, creator, press and fan resources.',[
       ('For listeners','Use the listening guide, mood guide, ambient overview and collaborator directory to navigate the catalog.'),
       ('For artists','Use the demo review, distribution, release strategy and independent release pages before sending music.'),
       ('For media','Use the quick facts, interview topics, brand guide, biography and downloadable press kit for accurate reference.'),
       ('For creators and fans','Explore accessible studio practices, screen-reader workflows, the starter guide and safe community participation.')],('/explore/','Browse every public page'))
    ]
    for path,title,description,sections,action in entries:
        toc=''.join(f'<a href="#section-{i}">{html.escape(name)}</a>' for i,(name,_) in enumerate(sections,1))
        body='<section class="page-intro shell"><p class="eyebrow">MR. BLINDBANDIT / RESOURCE</p><h1>'+html.escape(title)+'</h1><p class="lede">'+html.escape(description)+'</p></section><div class="shell policy-layout"><aside><nav aria-label="On this page">'+toc+'</nav></aside><article>'+''.join(f'<section id="section-{i}"><span class="policy-index">{i:02}</span><h2>{html.escape(name)}</h2><p>{html.escape(text)}</p></section>' for i,(name,text) in enumerate(sections,1))+'</article></div><section class="shell section"><h2>Take the next step</h2><a class="button" href="'+action[0]+'">'+html.escape(action[1])+' ↗</a> <a class="text-link" href="/resources/">Resource center</a></section>'
        layout(path,title,description,body)
        if not any(existing==path for _,existing in pages):pages.append((title,path))
