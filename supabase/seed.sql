-- Curriculum, achievements, and hashed educational flags.
-- Flags are stored only as SHA-256 hashes. Ordinary clients cannot read this table.

insert into public.achievements (slug, title, description) values
  ('first-login', 'First Login', 'Created a HackLab Academy account and entered the campus.'),
  ('linux-explorer', 'Linux Explorer', 'Completed a Linux fundamentals challenge or lesson path.'),
  ('network-apprentice', 'Network Apprentice', 'Completed networking fundamentals practice.'),
  ('web-security-student', 'Web Security Student', 'Finished a web application security training challenge.'),
  ('ctf-champion', 'CTF Champion', 'Solved 8 or more Capture the Flag challenges.'),
  ('security-analyst', 'Security Analyst', 'Completed an advanced defensive or forensics assessment.'),
  ('master-hacker', 'Master Hacker', 'Reached expert-level certification assessment completion.')
on conflict (slug) do nothing;

insert into public.courses (slug, title, summary, level, duration_minutes, sort_order) values
  ('linux-fundamentals', 'Linux Fundamentals', 'Navigate a Unix-like training host, inspect files, and reason about permissions.', 1, 70, 10),
  ('command-line-ops', 'Command-line Navigation', 'Work fluently with paths, history, and safe file operations in a simulated shell.', 1, 55, 20),
  ('file-permissions', 'File Permissions', 'Read, write, and execute bits; ownership; and why least privilege matters.', 1, 50, 30),
  ('networking-basics', 'Networking Basics', 'Packets, ports, and how hosts find each other on a training network.', 1, 80, 40),
  ('ip-and-transport', 'IP, TCP, and UDP', 'Addressing, reliable streams, and datagrams using authorized lab diagrams.', 1, 60, 50),
  ('dns-http', 'DNS, HTTP, and HTTPS', 'Name resolution and why encrypted transport protects session integrity.', 1, 65, 60),
  ('security-fundamentals', 'Cybersecurity Fundamentals', 'CIA triad, threat actors, and authorized testing boundaries.', 1, 50, 70),
  ('web-app-security', 'Web Application Security', 'OWASP-aligned defensive review of a deliberately vulnerable training app.', 2, 90, 80),
  ('injection-defense', 'Injection Defense Lab', 'Practice detecting injection in a sandboxed training shop, then fix the pattern.', 2, 80, 90),
  ('xss-and-output', 'XSS Simulations', 'See reflected output encoding failures inside an isolated renderer.', 2, 70, 100),
  ('auth-passwords', 'Authentication and Passwords', 'Hashing, salting, lockouts, and recovery flows that do not leak user existence.', 2, 75, 110),
  ('sessions-headers', 'Sessions, Headers, Validation', 'Cookie flags, session rotation, security headers, and input validation.', 2, 80, 120),
  ('vuln-assessment', 'Vulnerability Assessment', 'Scoped scanning methodology against authorized training targets only.', 3, 90, 130),
  ('network-auditing', 'Network Security Auditing', 'Review segmented lab networks, ACLs, and exposed training services.', 3, 85, 140),
  ('access-control', 'Access Control Testing', 'Map roles on an isolated training machine without touching production.', 3, 80, 150),
  ('priv-esc-training', 'Privilege Escalation Training', 'Study misconfigurations on disposable lab images with expiration.', 3, 95, 160),
  ('digital-forensics', 'Digital Forensics', 'Preserve evidence, build a timeline, and write defensible notes.', 3, 90, 170),
  ('secure-config-monitor', 'Secure Configuration and Monitoring', 'Hardening baselines and defensive telemetry in a SOC training lab.', 3, 85, 180),
  ('advanced-ctf', 'Advanced CTF Operations', 'Multi-stage authorized challenges that reward notes and patience.', 4, 100, 190),
  ('incident-response', 'Incident Response', 'Contain, eradicate, recover — with communications and legal awareness.', 4, 90, 200),
  ('threat-hunting', 'Threat Hunting', 'Hypothesis-driven hunts on provided telemetry, not live third-party networks.', 4, 90, 210),
  ('malware-analysis-edu', 'Educational Malware Analysis', 'Harmless samples only (including EICAR-class strings) in isolated tooling.', 4, 80, 220),
  ('secure-infrastructure', 'Secure Infrastructure', 'Architecture, identity, logging, and blast-radius reduction.', 4, 85, 230),
  ('pentest-reporting', 'Pentest Methodology and Reporting', 'Rules of engagement, evidence, and professional reporting.', 4, 95, 240)
on conflict (slug) do nothing;

insert into public.lessons (course_id, slug, title, summary, content, has_terminal, sort_order)
select c.id, v.slug, v.title, v.summary, v.content::jsonb, v.has_terminal, v.sort_order
from public.courses c
join (values
  ('linux-fundamentals', 'paths-and-pwd', 'Where you are', 'pwd, absolute paths, and home directories.', '[{"type":"p","text":"Every process has a working directory. On Unix-like systems, pwd prints it. Absolute paths start at / ; relative paths start from your current location."},{"type":"p","text":"In HackLab, the browser terminal is a simulator. It never executes operating-system commands on the application server."}]', true, 1),
  ('linux-fundamentals', 'listing-files', 'Listing files', 'ls, hidden files, and metadata.', '[{"type":"p","text":"ls lists directory entries. Names beginning with a dot are hidden from the default listing. ls -a reveals them. That convention is educational, not a hiding place for production secrets."}]', true, 2),
  ('command-line-ops', 'moving-around', 'cd and path hygiene', 'Move without leaving the training tree.', '[{"type":"p","text":"cd changes directory. cd .. goes up one level. Stay inside authorized lab trees. The simulator rejects attempts to traverse into host or production paths."}]', true, 1),
  ('file-permissions', 'rwx-bits', 'Permission bits', 'Read, write, execute as a contract.', '[{"type":"p","text":"Permission bits describe who may read, write, or execute a file. 644 and 755 are common training examples. Production systems should follow least privilege, not copy-paste from a blog."}]', false, 1),
  ('networking-basics', 'packets-ports', 'Packets and ports', 'Hosts, ports, and services.', '[{"type":"p","text":"An IP address names a host interface. A port names a service. Training commands such as ping and dig in this academy only resolve lab.hacklab.internal names."}]', false, 1),
  ('ip-and-transport', 'tcp-vs-udp', 'TCP versus UDP', 'Reliability tradeoffs.', '[{"type":"p","text":"TCP provides a stream with acknowledgements. UDP sends datagrams without that handshake. Choose based on the application, then document why."}]', false, 1),
  ('dns-http', 'https-why', 'Why HTTPS', 'TLS protects integrity and confidentiality in transit.', '[{"type":"p","text":"HTTP is readable in transit. HTTPS wraps HTTP in TLS. Certificate validation belongs in clients; disabling it for convenience is a training anti-pattern."}]', false, 1),
  ('security-fundamentals', 'authorized-scope', 'Authorized testing only', 'Ethics, law, and written scope.', '[{"type":"p","text":"HackLab Academy permits offensive techniques only against deliberately vulnerable training systems that you own in this platform or that a client authorizes in writing. Scanning random internet hosts is out of scope and prohibited."}]', false, 1),
  ('web-app-security', 'owasp-map', 'Map the training app', 'Identify trust boundaries.', '[{"type":"p","text":"Start with how data enters the training application: forms, cookies, headers. Trust boundaries are where attacker-controlled data meets queries, HTML, or commands."}]', false, 1),
  ('injection-defense', 'parameterize', 'Parameterize queries', 'The defensive fix is not a filter list.', '[{"type":"p","text":"SQL injection training in HackLab uses an in-memory fake shop. The durable fix is parameterized queries and least-privilege database roles — not denylists."}]', false, 1),
  ('xss-and-output', 'encode-output', 'Encode untrusted output', 'Context-aware encoding.', '[{"type":"p","text":"Reflected XSS training here is a sandbox. Production defenses: encode for HTML, attributes, or JavaScript context; use a strict Content-Security-Policy; never innerHTML untrusted strings."}]', false, 1),
  ('auth-passwords', 'hashing', 'Password hashing', 'Slow hashes and unique salts.', '[{"type":"p","text":"Store passwords with a memory-hard or slow hash (Argon2id, bcrypt, scrypt) and a unique salt. Never log passwords. Recovery tokens must be random and single-use."}]', false, 1),
  ('sessions-headers', 'cookie-flags', 'Cookie and header baseline', 'HttpOnly, Secure, SameSite, CSP.', '[{"type":"p","text":"Session cookies should be HttpOnly, Secure, and SameSite. Rotate session identifiers at login. Security headers are a baseline, not a complete product."}]', false, 1),
  ('vuln-assessment', 'scope-first', 'Scope first', 'Rules of engagement.', '[{"type":"p","text":"A vulnerability assessment without scope is just unauthenticated scanning of someone else. HackLab labs are the only networks these exercises may target."}]', false, 1),
  ('network-auditing', 'segmentation', 'Segmentation', 'Reduce blast radius.', '[{"type":"p","text":"Lab networks are isolated from production databases and from other students. Mirror that idea in real architecture: management planes, data planes, and identity boundaries."}]', false, 1),
  ('access-control', 'rbac', 'Roles and paths', 'Broken access control is common.', '[{"type":"p","text":"Test whether user A can read user B objects by ID. In this academy, you only test the training API tied to your account."}]', false, 1),
  ('priv-esc-training', 'misconfig', 'Misconfiguration stories', 'Sudo, SUID, and secrets in training images.', '[{"type":"p","text":"Privilege escalation exercises run in disposable, unprivileged containers. They expire. They cannot see the host filesystem or production data."}]', true, 1),
  ('digital-forensics', 'preserve', 'Preserve then analyze', 'Chain of custody.', '[{"type":"p","text":"Hash evidence, write a timeline, and do not modify the original disk image. Training artifacts live in the lab object store, not on student laptops by default."}]', false, 1),
  ('secure-config-monitor', 'baselines', 'Hardening baselines', 'CIS-style thinking.', '[{"type":"p","text":"Disable unused services, manage secrets outside images, and alert on identity anomalies. Monitoring without response runbooks is just expensive logging."}]', false, 1),
  ('advanced-ctf', 'notes', 'Take notes', 'Multi-stage discipline.', '[{"type":"p","text":"Expert challenges reward a lab notebook: commands, hashes, assumptions, and disproven hypotheses."}]', true, 1),
  ('incident-response', 'cissp-loop', 'IR loop', 'Prepare, detect, contain, eradicate, recover, lessons.', '[{"type":"p","text":"Incident response is an operations problem. Communication templates and legal hold matter as much as technical containment."}]', false, 1),
  ('threat-hunting', 'hypothesis', 'Hypothesis first', 'Do not boil the ocean.', '[{"type":"p","text":"A hunt starts with a question: what would this actor leave behind in our telemetry? Then you query authorized datasets."}]', false, 1),
  ('malware-analysis-edu', 'harmless-only', 'Harmless samples only', 'EICAR-class education.', '[{"type":"p","text":"HackLab never distributes functional malware. Educational detections use harmless signatures such as the EICAR test string concept."}]', false, 1),
  ('secure-infrastructure', 'architecture', 'Security architecture', 'Identity, logging, isolation.', '[{"type":"p","text":"Prefer explicit trust maps over product checklists. Ask what happens when this control fails."}]', false, 1),
  ('pentest-reporting', 'roe', 'Rules of engagement', 'Professional reporting.', '[{"type":"p","text":"A penetration test is a project: scope, evidence, risk language a business can act on, and no surprise destructive actions."}]', false, 1)
) as v(course_slug, slug, title, summary, content, has_terminal, sort_order)
on c.slug = v.course_slug
on conflict do nothing;

insert into public.learning_paths (slug, title, summary, level, sort_order) values
  ('foundations', 'Foundations Path', 'Linux, networking, and ethics for new operators.', 1, 1),
  ('web-defender', 'Web Defender Path', 'Application security, authentication, and output encoding.', 2, 2),
  ('analyst', 'Analyst Path', 'Assessment, forensics, and monitoring on isolated labs.', 3, 3),
  ('operator', 'Operator Path', 'IR, hunting, architecture, and professional reporting.', 4, 4)
on conflict (slug) do nothing;

insert into public.learning_path_courses (path_id, course_id, sort_order)
select p.id, c.id, x.sort_order
from public.learning_paths p
join (values
  ('foundations', 'linux-fundamentals', 1),
  ('foundations', 'command-line-ops', 2),
  ('foundations', 'file-permissions', 3),
  ('foundations', 'networking-basics', 4),
  ('foundations', 'ip-and-transport', 5),
  ('foundations', 'dns-http', 6),
  ('foundations', 'security-fundamentals', 7),
  ('web-defender', 'web-app-security', 1),
  ('web-defender', 'injection-defense', 2),
  ('web-defender', 'xss-and-output', 3),
  ('web-defender', 'auth-passwords', 4),
  ('web-defender', 'sessions-headers', 5),
  ('analyst', 'vuln-assessment', 1),
  ('analyst', 'network-auditing', 2),
  ('analyst', 'access-control', 3),
  ('analyst', 'priv-esc-training', 4),
  ('analyst', 'digital-forensics', 5),
  ('analyst', 'secure-config-monitor', 6),
  ('operator', 'advanced-ctf', 1),
  ('operator', 'incident-response', 2),
  ('operator', 'threat-hunting', 3),
  ('operator', 'malware-analysis-edu', 4),
  ('operator', 'secure-infrastructure', 5),
  ('operator', 'pentest-reporting', 6)
) as x(path_slug, course_slug, sort_order)
on p.slug = x.path_slug
join public.courses c on c.slug = x.course_slug
on conflict do nothing;

insert into public.challenges (slug, title, summary, description, category, challenge_type, difficulty, xp_reward, featured) values
  ('linux-hidden-file', 'Hidden Notes', 'Use the training terminal to inspect a cadet home directory.', 'Authorized target: simulated host `lab-linux-01`. List files, including hidden entries, then read the cadet note. Submit the HLA{...} flag. This filesystem exists only in the simulator.', 'beginner', 'terminal', 1, 50, true),
  ('perm-contract', 'Permission Contract', 'Explain a permission mode found in a training file.', 'Authorized target: simulated host `lab-linux-01`. Inspect `/etc/motd` and `/home/cadet/access.txt` in the terminal. The flag is not in the public lesson text.', 'beginner', 'terminal', 2, 50, false),
  ('dns-lab-resolve', 'Resolve the Lab', 'Use simulated dig against lab.hacklab.internal only.', 'Authorized target: `lab.hacklab.internal`. Use the training terminal `dig` command. Public internet resolution is disabled.', 'beginner', 'terminal', 2, 50, true),
  ('http-vs-https', 'Transit Integrity', 'Quiz on HTTP versus HTTPS properties.', 'No live scanning. Answer the assessment from course material. Flags are issued by the server after a correct submission.', 'beginner', 'quiz', 1, 50, false),
  ('training-shop-login', 'Training Shop Login', 'A deliberately broken login exists only in this sandbox.', 'Authorized target: HackLab Training Shop simulator (in-app). Practice identifying unsanitized input. Real-world systems are out of scope. A correct training condition returns a flag from the server.', 'intermediate', 'simulator', 3, 100, true),
  ('xss-sandbox', 'Output Encoding Sandbox', 'Trigger the isolated reflected renderer.', 'Authorized target: HackLab XSS sandbox. The renderer is not a general browser exploit surface; it only recognizes a training marker and then shows a server-issued flag.', 'intermediate', 'simulator', 3, 100, false),
  ('password-policy', 'Password Policy Review', 'Choose the defensible password storage design.', 'Multiple-choice assessment. XP is granted only by the API after validation.', 'intermediate', 'quiz', 2, 100, false),
  ('session-rotation', 'Session Rotation', 'Fix the session handling story on a training API description.', 'Read the scenario and submit the flag issued for the correct defensive control name.', 'intermediate', 'quiz', 3, 100, false),
  ('acl-review', 'ACL Review', 'Find the over-permissive training group on a fake export.', 'Authorized target: simulated config dump in the terminal. Do not import this thinking into production without change control.', 'advanced', 'terminal', 4, 200, true),
  ('timeline-builder', 'Forensic Timeline', 'Order the provided training events.', 'You receive a sanitized log excerpt from an authorized lab. Build the timeline and submit the flag.', 'advanced', 'quiz', 4, 200, false),
  ('contain-first', 'Contain First', 'Incident response tabletop with a single best next step.', 'A ransomware tabletop using fictional company Northwind Lab. Choose containment before eradication theater.', 'expert', 'quiz', 4, 400, false),
  ('cert-assessment', 'Operator Certification', 'Capstone: methodology, ethics, and reporting.', 'Final certification-style assessment. Completing it awards Master Hacker after server-side checks.', 'expert', 'quiz', 5, 400, true)
on conflict (slug) do nothing;

insert into public.challenge_flags (challenge_id, flag_hash)
select c.id, encode(digest(f.flag, 'sha256'), 'hex')
from public.challenges c
join (values
  ('linux-hidden-file', 'HLA{follow_the_dotfiles}'),
  ('perm-contract', 'HLA{chmod_is_a_contract}'),
  ('dns-lab-resolve', 'HLA{resolve_then_connect}'),
  ('http-vs-https', 'HLA{https_beats_cleartext}'),
  ('training-shop-login', 'HLA{parameterize_every_query}'),
  ('xss-sandbox', 'HLA{encode_untrusted_output}'),
  ('password-policy', 'HLA{hash_salt_and_mfa}'),
  ('session-rotation', 'HLA{rotate_session_on_login}'),
  ('acl-review', 'HLA{least_privilege_always}'),
  ('timeline-builder', 'HLA{document_every_artifact}'),
  ('contain-first', 'HLA{contain_eradicate_recover}'),
  ('cert-assessment', 'HLA{report_like_a_pro}')
) as f(slug, flag) on f.slug = c.slug
on conflict do nothing;

insert into public.challenge_hints (challenge_id, sort_order, body, xp_cost)
select c.id, h.sort_order, h.body, h.xp_cost
from public.challenges c
join (values
  ('linux-hidden-file', 1, 'Default listings hide names that start with a dot.', 0),
  ('linux-hidden-file', 2, 'Read files with cat after you can see them.', 5),
  ('dns-lab-resolve', 1, 'Only lab.hacklab.internal is defined in the simulator.', 0),
  ('training-shop-login', 1, 'This shop concatenates strings in a fake query. Think about closing a quoted value.', 10),
  ('xss-sandbox', 1, 'The sandbox looks for a script marker in training input, then stops. It is not a general exploit kit.', 10),
  ('acl-review', 1, 'Look at /etc/group in the training terminal.', 0)
) as h(slug, sort_order, body, xp_cost) on h.slug = c.slug;

insert into public.terminal_files (challenge_id, path, is_dir, content)
select c.id, t.path, t.is_dir, t.content
from public.challenges c
join (values
  ('linux-hidden-file', '/', true, null),
  ('linux-hidden-file', '/home', true, null),
  ('linux-hidden-file', '/home/cadet', true, null),
  ('linux-hidden-file', '/home/cadet/notes.txt', false, 'Welcome to the Linux lab. Hidden files still exist even when ls does not show them.'),
  ('linux-hidden-file', '/home/cadet/.secret', false, 'HLA{follow_the_dotfiles}'),
  ('linux-hidden-file', '/etc', true, null),
  ('linux-hidden-file', '/etc/hostname', false, 'lab-linux-01'),
  ('perm-contract', '/', true, null),
  ('perm-contract', '/etc', true, null),
  ('perm-contract', '/etc/motd', false, 'Training host. Permissions are a contract with the kernel.'),
  ('perm-contract', '/home', true, null),
  ('perm-contract', '/home/cadet', true, null),
  ('perm-contract', '/home/cadet/access.txt', false, 'mode 640 owner root:soc\nWhen this file is readable by the cadet group, submit HLA{chmod_is_a_contract}'),
  ('dns-lab-resolve', '/', true, null),
  ('dns-lab-resolve', '/etc', true, null),
  ('dns-lab-resolve', '/etc/resolv.conf', false, 'nameserver 10.8.0.53\nsearch hacklab.internal'),
  ('dns-lab-resolve', '/etc/lab-txt', false, 'lab.hacklab.internal. 300 IN TXT "HLA{resolve_then_connect}"'),
  ('acl-review', '/', true, null),
  ('acl-review', '/etc', true, null),
  ('acl-review', '/etc/group', false, 'root:x:0:\nsoc:x:200:cadet\nworld-readable-secrets:x:666:cadet\n# The over-permissive group is a training defect.\n# Flag: HLA{least_privilege_always}')
) as t(slug, path, is_dir, content) on t.slug = c.slug;

insert into public.quiz_questions (lesson_id, prompt, choices, sort_order)
select l.id, q.prompt, q.choices::jsonb, q.sort_order
from public.lessons l
join public.courses c on c.id = l.course_id
join (values
  ('authorized-scope', 'When may you run an intrusive test?', '["Against any host that looks misconfigured","Only against systems you own or have written authorization to test","Whenever a bug bounty page exists without reading it","If the IP is in your traceroute"]', 1),
  ('https-why', 'What does HTTPS primarily add to HTTP?', '["Faster routing","TLS confidentiality and integrity in transit","A new DNS record type","Automatic input validation"]', 1),
  ('parameterize', 'What is the durable fix for SQL injection?', '["Block the word SELECT","Parameterized queries and least-privilege DB roles","Hide the error messages only","Switch to UDP"]', 1)
) as q(lesson_slug, prompt, choices, sort_order)
on l.slug = q.lesson_slug;

insert into public.quiz_answers (question_id, correct_index)
select qq.id, a.correct_index
from public.quiz_questions qq
join (values
  ('When may you run an intrusive test?', 1),
  ('What does HTTPS primarily add to HTTP?', 1),
  ('What is the durable fix for SQL injection?', 1)
) as a(prompt, correct_index) on a.prompt = qq.prompt
on conflict do nothing;

insert into public.lab_templates (slug, title, summary, image_ref, cpu_limit, memory_limit, expires_minutes) values
  ('linux-basics', 'Linux Basics Lab', 'Disposable unprivileged container for filesystem practice.', 'hacklab/linux-basics:edu', '0.50', '512m', 60),
  ('web-training-shop', 'Web Training Shop', 'Isolated deliberately vulnerable app, published only via the lab gateway.', 'hacklab/web-shop:edu', '0.50', '768m', 45),
  ('soc-range', 'SOC Range', 'Read-only telemetry workstation for hunting exercises.', 'hacklab/soc-range:edu', '1.00', '1024m', 90)
on conflict (slug) do nothing;
