# HustleHub+

**A secure freelance marketplace platform.**

- **Module:** INSY7314 - Information Systems 3D
- **Part:** 1
- **Youtube Video:** 

---

## Contents

1. [About HustleHub+](#1-about-hustlehub)
2. [Tech stack](#2-tech-stack)
3. [Team](#3-team)
4. [System architecture](#4-system-architecture)
5. [Security](#5-security)
6. [Getting started](#6-getting-started)
7. [API reference](#7-api-reference)
8. [Testing](#8-testing)
9. [Coming soon](#9-coming-soon)
10. [Demonstration](#10-demonstration)
11. [References](#11-references)

---

## 1. About HustleHub+

HustleHub+ is a secure freelance marketplace platform. Its purpose is to allow
freelancers to advertise services, and clients to browse and book those
services.

Beyond standard marketplace functionality, the system records the financial
transactions generated through bookings, and gives users an indication of income
earned and estimated tax obligations.

The platform processes sensitive information such as user credentials, transactional
records, and income related data. The system is designed with that in mind and
implemented with security as a primary concern rather than as an afterthought.

### The users

Every account has exactly one role. The role is set at registration, travels
inside the user's token, and is what the system uses to decide who may do what.
This is role based access control, in which privileges are attached to roles and
roles are assigned to users rather than granting each user permissions directly
(National Institute of Standards and Technology, 2026; OWASP, n.d. b).

| Role | Who they are | What they do |
|---|---|---|
| **Client** | Someone who needs work done | Browses services, books them, receives invoices |
| **Freelancer** | Someone selling a service | Advertises services with a rate, fulfils bookings, earns income |
| **Admin** | Platform operator | Changes another account's role and oversees the platform |

**Admin cannot be self assigned.** Registration validates the requested role
against the role list with `Admin` removed, so a request asking for `Admin` is
rejected before any database work happens. That closes the obvious privilege
escalation route (OWASP, 2021a), but creates a bootstrap problem: if registration refuses to
create an Admin and only an Admin can promote anyone, no Admin could ever exist.
The first one is therefore created outside the API entirely, by
`npm run seed:admin`, which needs filesystem and database access rather than an
HTTP request. Someone on the network cannot reach it.

### In Part 1

Part 1 is scoped to the **secure foundations**, as the backend must be correct and
hardened before any interface sits on top of it.

* Express backend with routes, controllers, models and middleware separated.
* User registration and login, stored in MongoDB.
* Passwords hashed with bcrypt. No plaintext password is ever stored.
* A JWT issued on registration and login, and required on every protected route.
* HTTPS with a locally generated certificate. There is no HTTP listener at all.
* Validation of every request body, including nested objects and arrays.
* Controlled errors that never leak a stack trace, file path or config value.
* A Postman collection of 83 requests and 401 assertions.

Everything in the wider brief that belongs to Parts 2 and 3 is listed in
[Coming soon](#9-coming-soon).

---

## 2. Tech stack

HustleHub+ is built on the **MERN** stack, the combination of MongoDB, Express,
React and Node.js in which a single language spans the database, the server and
the browser (MongoDB, Inc., n.d.; Ishaq et al., 2023). The React tier arrives
in Part 2, so Part 1 is the M, E and N.

| Tier | Technology | Version | Role in the system |
|---|---|---|---|
| **(M)** Database | MongoDB | 8.x | Stores users, services, bookings, invoices and proofs of payment |
| **(E)** Framework | Express | 5.2 | HTTP routing, middleware pipeline, error boundary |
| **(R)** Frontend | React | | *Coming soon in Part 2* |
| **(N)** Runtime | Node.js | 20+ | Runs the API as a single HTTPS process |

Node.js runs the API on a single thread and handles concurrent requests through
an event loop that offloads I/O rather than blocking on it (OpenJS Foundation,
n.d. a, n.d. f). Express supplies the routing and middleware model that the
security controls are built on (OpenJS Foundation, n.d. e, n.d. h).

### Libraries

| Package | Version | Why it is used |
|---|---|---|
| `mongoose` | 9.8 | Schema definitions, a second validation layer, and the bcrypt save hook |
| `bcryptjs` | 3.0 | Password hashing. Deliberately slow and adaptive |
| `jsonwebtoken` | 9.0 | Signs and verifies the JWT that authenticates every protected request |
| `dotenv` | 17.4 | Loads configuration from `.env`, which is never committed |
| `selfsigned` | 5.5 | Generates the local TLS certificate in pure JavaScript, so no `openssl` is needed |
| `newman` | 6.2 | Runs the Postman collection from the command line |

Official documentation for each: Mongoose (Automattic, n.d. c), bcryptjs
(Wirtz, n.d.), jsonwebtoken (Auth0, n.d.), dotenv (Motte, n.d.),
selfsigned (Romaniello, n.d.) and Newman (Postman, Inc., n.d. b).

### Tooling

| Tool | Purpose |
|---|---|
| Postman | The 83 request API test collection (Postman, Inc., n.d. a) |
| MongoDB Compass | Inspecting stored documents, including the password hashes |
| Git and GitHub | Version control and submission |

---

## 3. Team

| Member | Student number |
|---|---|
| Tyreece Sewbaran | *ST10439074* |
| Dylan Olsen | *ST10440133* |
| Ethan Edwards | *ST10442420* |
| Ndumsio Jwara | *ST10440124* |

---

## 4. System architecture

### 4.1 Architecture diagram

The diagram shows the MERN tiers, the two boundaries the system defends, and
where each security control sits. React is drawn as a Part 2 component so the
picture accurately represents the target architecture.

```mermaid
flowchart TB
    subgraph ZONE1["UNTRUSTED ZONE: outside the system boundary"]
        PM["<b>Postman / Newman</b><br/>API test client"]
        RE["<b>React SPA</b><br/>the R in MERN<br/><i>coming soon in Part 2</i>"]
        AT["<b>Attacker</b><br/>forged tokens, injection payloads,<br/>oversized bodies"]
    end

    TLS{{"<b>BOUNDARY 1: TLS</b><br/>HTTPS only on port 5001<br/>self signed local certificate<br/>no HTTP listener exists"}}

    PM --> TLS
    RE --> TLS
    AT --> TLS

    subgraph ZONE2["TRUSTED ZONE: Node.js process, the N and E in MERN"]
        direction TB

        CFG["<b>config/env.js</b><br/>refuses to start on a missing secret,<br/>a placeholder secret or a missing certificate"]
        SRV["<b>server.js</b><br/>https.createServer"]
        APP["<b>app.js</b><br/>express.json limit 10kb"]

        subgraph GUARD["BOUNDARY 2: per request security middleware"]
            direction TB
            AUTH["<b>authenticate</b><br/>verifies the JWT signature and expiry"]
            ROLE["<b>requireRole</b><br/>checks the role from the token"]
            VAL["<b>validateBody</b><br/>allowlist rules, blocks operator injection,<br/>writes the clean req.validated"]
            AUTH --> ROLE --> VAL
        end

        CTRL["<b>Controllers</b><br/>read req.validated, never req.body"]
        MOD["<b>Models</b><br/>Mongoose schemas, bcrypt hook,<br/>password hidden from queries and JSON"]
        ERR["<b>Error boundary</b><br/>full detail to the server console,<br/>a safe generic message to the client"]

        CFG --> SRV --> APP --> GUARD
        VAL --> CTRL --> MOD
        APP -.->|"bad JSON, oversized body"| ERR
        AUTH -.->|"401"| ERR
        ROLE -.->|"403"| ERR
        MOD -.->|"schema or index violation"| ERR
    end

    TLS ==> CFG

    subgraph ZONE3["DATA ZONE: MongoDB, the M in MERN"]
        DB[("<b>hustle_hub_plus</b><br/>bcrypt hashes only, never plaintext<br/>unique index on email")]
    end

    MOD <==>|"Mongoose driver"| DB
    ERR ==>|"safe JSON envelope"| TLS
```

A request crosses **Boundary 1** by arriving over TLS, which is the only way in.
It then crosses **Boundary 2**, where it must prove who it is (`authenticate`),
prove it is allowed (`requireRole`), and prove its body is well formed
(`validateBody`), in that order. Only a request that survives all three reaches a
controller. Anything that fails goes to the single error boundary, which decides
what the outside world is told.

### 4.2 Backend structure

```
INSY7314-POE/
|
+-- server.js              HTTPS server, Mongo connection
+-- app.js                 Express app, body limit, routers, error boundary
+-- config/env.js          Startup validation of .env and the certificate
|
+-- routes/                URL to middleware chain to controller
+-- middleware/            authenticate, authorize, validation, error handling
+-- controllers/           One request each: read input, call model, respond
+-- models/                Mongoose schemas, constraints, password hashing
+-- utils/                 Response envelope, token signing, validation rules
|
+-- postman/               The 83 request test collection
+-- scripts/               certs, seed:admin, db:reset, test:api
|
+-- .env.example           Template of every variable, committed, no real values
+-- .env                   Real secrets and connection string      NOT COMMITTED
+-- certs/                 localhost-key.pem, localhost-cert.pem   NOT COMMITTED
+-- node_modules/          Installed by npm install                NOT COMMITTED
|
+-- .gitignore             Keeps .env, certs/ and node_modules/ out of the repo
+-- package.json           Dependencies and the npm run scripts
+-- package-lock.json      Exact dependency versions, committed on purpose
```

Each directory is one layer with one responsibility, so that a change to
validation, storage or transport touches one place rather than being spread
across the codebase. That decomposition by responsibility, rather than by step in
the request, is the modularity criterion Parnas set out (Parnas, 1972), and the
split between the model and the controller follows the original Model View
Controller description (Reenskaug, 1979). The API itself is organised as REST
resources addressed by URL and acted on with HTTP methods (Fielding, 2000).

The three entries marked **NOT COMMITTED** are excluded by `.gitignore` because
each one is a secret or is rebuildable. A fresh clone therefore has none of them,
and [Getting started](#6-getting-started) is what creates all three: `npm install`
for `node_modules/`, `npm run certs` for `certs/`, and a copy of `.env.example`
for `.env`.

| Layer | Responsibility | Deliberately does **not** |
|---|---|---|
| `config/` | Validate environment values at startup | Contain a secret itself |
| `server.js`, `app.js` | Create the HTTPS server, mount routers | Contain business logic |
| `routes/` | Declare the middleware chain for a URL | Touch the database |
| `middleware/` | Authenticate, authorise, validate, handle errors | Know about a specific resource |
| `controllers/` | Orchestrate one request | Re-validate, or build JSON by hand |
| `models/` | Schema, constraints, password hashing | Know that HTTP exists |
| `utils/` | Shared envelope, tokens, validation primitives | Hold request state |

The useful property of this split is that **security is not scattered**. Every
protected route is guarded by one line, `router.use(authenticate)`, and there is
exactly one place where a token is verified, one where an error becomes a client
response, and one where a response is built. Each can be reviewed in a single
file, and a mistake cannot hide in a forgotten controller.

### 4.3 Request flow

```mermaid
sequenceDiagram
    autonumber
    participant U as Client
    participant T as TLS
    participant V as Validation
    participant A as authenticate
    participant C as Controller
    participant M as User model
    participant D as MongoDB

    Note over U,D: 1. Register
    U->>T: POST /auth/register over HTTPS
    T->>V: decrypted request, body capped at 10kb
    V->>V: check name, email, password, role
    alt any field invalid
        V-->>U: 400 Validation failed, every bad field at once
    end
    V->>C: req.validated, only the declared fields
    C->>M: create the user
    M->>M: schema validates the PLAINTEXT password
    M->>M: pre-save hook replaces it with a bcrypt hash, cost 12
    M->>D: insert
    alt email already registered
        D-->>U: 409, caught by the unique index
    end
    C-->>U: 201 + user + JWT

    Note over U,D: 2. Log in
    U->>T: POST /auth/login
    T->>C: email and password
    C->>D: find the user, explicitly asking for the hash
    C->>M: bcrypt compares the candidate against the stored hash
    alt no such user OR wrong password
        C-->>U: 401 Invalid email or password, identical for both
    end
    C-->>U: 200 + user + JWT

    Note over U,D: 3. Use the token
    U->>A: GET /services with Authorization Bearer header
    A->>A: verify the signature and the expiry
    alt header missing
        A-->>U: 401 Authentication required
    else signature forged
        A-->>U: 401 Invalid token
    else expired
        A-->>U: 401 Token has expired
    end
    A->>C: req.user is now id and role, taken from the verified token
    alt role not permitted for this route
        C-->>U: 403 You do not have permission to perform this action
    end
    C->>D: query
    C-->>U: 200 + data
```

Note the deliberate split between the two refusals. **401 means the system does
not know who you are.** **403 means it knows exactly who you are and the answer
is still no.** That is the distinction HTTP itself draws between `401
Unauthorized` and `403 Forbidden` (Fielding, Nottingham and Reschke, 2022).

---

## 5. Security

This section explains what each control is, why it was chosen, and what would go
wrong without it. Every claim is enforced by code in this repository and asserted
by the Postman suite. The controls are grouped around the risks named in the
OWASP Top 10 (OWASP, 2021a, 2021b, 2021c, 2021d, 2021e), and the requirements
they satisfy are the verifiable ones set out in the OWASP Application Security
Verification Standard (OWASP, 2025).

### 5.1 Password hashing

**bcrypt at a cost factor of 12, applied in a Mongoose pre-save hook.**

```js
// models/User.js
const SALT_ROUNDS = 12

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS)
})
```

**Why hash rather than encrypt.** Encryption is reversible by design. If the
platform can decrypt a password then so can anyone who obtains the key, and the
key has to live somewhere the server can reach. Hashing is one way, so a stolen
database yields no passwords. The system never needs the original back; it only
needs to answer "is this the same password". Stored authentication secrets are
required to be salted and hashed with a one way key derivation function rather
than kept in a recoverable form (Grassi et al., 2017), and `bcrypt.compare`
answers the question by
re-hashing the candidate with the salt stored inside the hash (OWASP, n.d. j).

**Why bcrypt and not SHA-256 or MD5.** General purpose hashes are built to be
fast, which is the wrong property here. A modern GPU computes billions of
SHA-256 hashes per second, which turns a stolen database into a solved one. Fast
general purpose hashes are unsuitable for password storage for exactly this
reason, because they let an attacker make a very large number of guesses cheaply
(OWASP, n.d. j).
bcrypt is deliberately slow and, importantly, **adaptive**: the cost factor is
stored in the hash itself, so it can be raised as hardware improves without
invalidating existing passwords (Provos and Mazières, 1999). It also salts per user automatically, so two
people who choose the same password get different hashes and rainbow tables are
useless.

**Why cost 12.** The cost is a base 2 exponent, so 12 means 4096 rounds
(kelektiv, n.d.). It is a
trade between login speed and cracking cost. Cost 10 is the library default and
is now considered low; cost 14 is noticeably slow for a user. Twelve costs about
a quarter of a second, which nobody notices, while multiplying an attacker's cost
across billions of guesses (OWASP, n.d. j).

**Why a hook rather than the controller.** The hook is Mongoose `pre('save')`
middleware, which runs before every document save regardless of the code path
that triggered it (Automattic, n.d. a). If the controller hashed, every future
path that writes a user (a seed script, a password reset, a data import) would
have to remember to do it, and one forgetful path stores plaintext. In the model
hook it is structurally impossible to save a user without hashing first.

**Why validation runs first.** Mongoose validates before the save hook, so the
password complexity rule is checked while the password is still readable. Once
hashed, every password looks like a 60 character bcrypt string and no strength
rule could be applied.

**Three barriers stop the hash leaking:**

| Barrier | Mechanism | What it stops |
|---|---|---|
| Query | `select: false` on the field, overridden per query with `.select()` (Automattic, n.d. b) | A stray `find()` returns no password at all |
| Opt in | Login must ask with `.select('+password')` | Retrieving the hash is a visible, deliberate act |
| Serialisation | `toJSON` deletes `password` | A document carrying the hash still cannot be sent to a client |

**Other choices.** Passwords are never trimmed, because a leading space is a real
character and removing it would store something different from what the user
chose. The 8 to 72 character range exists because bcrypt silently truncates past
72 bytes, so allowing more would give false confidence (Wirtz, n.d.). Complexity requires an
uppercase letter, a lowercase letter, a number and a symbol.

**Evidence.** Stored passwords are bcrypt hashes only. The `$2b$12$` prefix
records the algorithm and the cost:

```
Admin       admin@hustlehub.local          $2b$12$8fBd7yhb9KkEdg98vEKiUeclSC1fgRiReYS0KERMaSbwkEhoScZ9u
Freelancer  ethan.edwards@hustlehub.test   $2b$12$kZIOZH8JxtjgQmY31MKjye2XP1y5klj5ruSmYLlxq5ZRe0bDFCGeO
```

### 5.2 Token based authentication

**A stateless HS256 JSON Web Token carrying the user id and role, issued on
registration and login, and verified on every protected request.**

A JWT is three base64url segments, a header, a payload of claims and a signature,
joined by dots (Jones, Bradley and Sakimura, 2015). It is presented to protected
routes in the `Authorization` header using the `Bearer` scheme (Jones and Hardt,
2012).

```js
// utils/token.js
const payload = { id: user._id.toString(), role: user.role };
return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
```

A real issued token, decoded:

```
header   { "alg": "HS256", "typ": "JWT" }
payload  { "id": "6a91e48284e36fb40ec00de6", "role": "Freelancer",
           "iat": 1787946115, "exp": 1787949715 }
signature  HMAC-SHA256 over header.payload using JWT_SECRET
```

**Why tokens rather than sessions.** HTTP is stateless, so after login the server
needs a way to recognise the caller. A session table costs a database lookup on
every request and holds state that must be replicated if the service is ever
scaled or containerised. A signed token moves that state to the client. The
server keeps only the secret, and verification is a local computation with no
database round trip (Jones, Bradley and Sakimura, 2015).

**Why the token cannot simply be edited.** This is the question the whole design
turns on. A JWT is not encrypted: anyone can decode the payload and read
`"role": "Freelancer"`. But the third segment is an HMAC-SHA256 signature over
the first two, computed with `JWT_SECRET`. Changing `Freelancer` to `Admin`
changes the payload, which invalidates the signature, and verification throws.
Producing a matching signature requires the secret, which never leaves the
server. The verifier is also pinned to the expected algorithm, because accepting
whatever the header asks for is what enables the `alg: none` and algorithm
confusion attacks (Sheffer, Hardt and Jones, 2020; OWASP, n.d. g). The suite proves this with **"A forged Admin token is refused"**, which
rewrites the role claim in a valid token and receives `401 Invalid token`.

**Why `id` and `role` and nothing else.** That is the minimum needed to make an
authorisation decision without a database lookup. The payload is readable by
anyone holding the token, so it carries no name, no email and above all no
password hash.

**Why it expires.** One hour by default, carried in the registered `exp` claim
and checked at verification (Jones, Bradley and Sakimura, 2015; Auth0, n.d.). Because the token is stateless there is
no server side record to delete, so a stolen token stays valid until it expires.
Expiry is therefore the only thing between a leak and indefinite access, which is
why the window is short. Statelessness costs immediate revocation, and that trade
is made deliberately.

**Protecting the secret.** `JWT_SECRET` is read from the environment and never
committed. The application refuses to start if it is missing or still the
`GENERATE_ME` placeholder, and prints the command to generate a real one. A weak
or shared secret would let anyone who guesses it mint valid Admin tokens, which
is the worst failure available in this design, so it is checked before the server
accepts its first request. Keeping the signing key in the environment rather than
in the source is what allows the repository to be published without exposing it
(Wiggins, 2017), and a key hardcoded into the code would be a catalogued weakness
in its own right (MITRE, 2026f; OWASP, n.d. l).

**How routes are protected.** Each resource router applies one line:

```js
router.use(authenticate);   // everything below requires a valid JWT
```

Applying it at the router means an endpoint added later is protected by default,
which is the least privilege default that authorisation guidance asks for
(OWASP, n.d. b). Missing or inconsistent checks of this kind are the top
ranked risk in the OWASP Top 10 (OWASP, 2021a).
Leaving a route unprotected requires actively moving it out, which is visible in
review, rather than merely forgetting a line, which is not.

### 5.3 Input validation

**Allowlist validation in middleware, ahead of every controller, with the body
rebuilt from the rule table.**

Validation is positive: it defines exactly what is permitted rather than trying
to enumerate what is dangerous, because a denylist of bad characters is the
common mistake and is always incomplete (OWASP, n.d. f; OWASP, 2021c).
Failing to validate input properly is itself a catalogued weakness (MITRE,
2026a), and injection flaws arise precisely when unvalidated data reaches an
interpreter (OWASP, n.d. e).

Two properties make this stronger than a typical field check.

**The body is rebuilt, not just inspected.** After validating, a fresh object is
constructed containing only the declared fields, and controllers read
`req.validated`, never `req.body`. An attacker who adds an extra field, whether
`"isAdmin": true` or a field some future schema might recognise, finds it
discarded rather than passed to the database. Binding request fields straight
onto a stored object is mass assignment, ranked in its own right in the OWASP API
Security Top 10 (OWASP, 2023). Because it works for fields that do
not exist yet, the defence is structural rather than a list of things to
reject (OWASP, n.d. i; MITRE, 2026g). Asserted by **"Unexpected fields are ignored"** and, for nested
documents, **"Reject unknown fields inside an embedded document"**.

**Strict type checks block operator injection.** MongoDB queries are objects, not
strings, so the classic `' OR 1=1--` does not apply. The equivalent attack sends
an object where a string is expected:

```json
{ "email": { "$ne": null }, "password": { "$ne": null } }
```

Passed to a query, that means "find any user whose email is not null", which
matches the first account and logs the attacker in without a password. `$ne` and
`$gt` are ordinary MongoDB query operators, so the payload is valid to the query
engine and only the type check keeps it out (MongoDB, Inc., 2026a). The guard
is one explicit check:

```js
if (typeof value !== 'string') {
    return { field, message: `${label} must be text` };
}
```

Numbers are checked the same way, which also rejects `"250"` and `{ "$gt": 0 }`.
Because the check is on the primitive type rather than a blacklist of operator
names, it blocks every operator, including ones added in future MongoDB
versions (MITRE, 2026h; MongoDB, Inc., 2026a). Asserted by **"NoSQL operator injection is rejected"**.

**Why middleware rather than the controller.** Validation runs first, so an
invalid request never opens a database connection. It also keeps controllers
uniform: by the time one runs, its input is known to be good.

**Why every error is reported at once.** The checkers return an error rather than
throwing, so the middleware collects the full list. A user submitting an empty
form is told about all the missing fields in one response instead of discovering
them one at a time:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "name",     "message": "Name is required" },
    { "field": "email",    "message": "Email is required" },
    { "field": "password", "message": "Password must be 8-72 characters and include an uppercase letter, a lowercase letter, a number and a symbol" }
  ]
}
```

**Nested validation.** Rule tables compose, so a booking validates its embedded
client, freelancer and service, and errors report a full path:

```json
{ "field": "service.category", "message": "Category must be one of: HouseCleaning, DogGrooming" }
```

**Why the patterns are allowlists.** The name pattern permits letters, spaces,
hyphens and apostrophes and nothing else, so `<script>alert(1)</script>` is
refused as a name rather than escaped and stored. Unneutralised input reaching
generated page output is cross-site scripting (MITRE, 2026b; Mozilla, 2025), and
the patterns are kept simple and anchored so that validation cannot itself become
a denial of service through catastrophic backtracking (OWASP, n.d. k). Storing hostile content and
hoping every future consumer escapes it correctly is the pattern that produces
stored cross-site scripting, and it leaves the defence resting on every consumer
getting context aware output encoding right (OWASP, n.d. c); refusing it at
the boundary means the value never
enters the system (OWASP, n.d. f). Asserted by **"Script tag in name is rejected"**.

**Two layers.** Request validation is the first line and gives good messages
early. The Mongoose schema is the second and enforces `required`, `enum`, `min`
and `match`, with `runValidators: true` on updates so they are checked as
strictly as creates (Automattic, n.d. d). The schema exists so that no write path, including a
future script, can bypass the rules. MongoDB can enforce a third layer at the
collection itself if the schema is ever bypassed entirely (MongoDB, Inc.,
2026b).

**Non body input.** URL parameters are validated by the ObjectId cast, and the
resulting error becomes a clean `400` rather than a 500. Request size is capped
at 10kb through the `limit` option on `express.json()`, whose own default is
100kb, so an oversized body cannot exhaust server memory (OpenJS Foundation, n.d. c).

### 5.4 Why HTTPS matters

**HTTPS only, with a locally generated certificate. There is no HTTP listener.**

Every request this API handles carries something worth stealing. `POST
/auth/login` carries a plaintext password. Every request after it carries a
bearer token, and a bearer token is exactly what the name says: whoever holds it
is treated as the user. Over plain HTTP all of that is readable by anyone
positioned in between, such as a compromised router, another device on the same
public Wi-Fi, or an ISP. Failing to encrypt data in transit is ranked second in
the OWASP Top 10 (OWASP, 2021b). TLS provides three things at once (Rescorla, 2018; Mozilla, 2026b):

| Property | What it gives | What it prevents |
|---|---|---|
| Confidentiality | The traffic is encrypted | Interception of passwords and tokens |
| Integrity | Tampering is detected | Rewriting a booking amount in transit |
| Authentication | The server proves its identity | A fake server harvesting credentials |

**Why there is no HTTP fallback.** A convenience HTTP listener would undo the
protection, because a client can be induced to use it and a single plaintext
request leaks the token for everything that follows. The application binds only
an HTTPS socket through the Node.js `https` module, so there is nothing to
downgrade to (OpenJS Foundation, n.d. d). That is stronger than a redirect,
which still requires one plaintext round trip, and stronger than relying on HSTS,
which only takes effect after a browser has already made one successful HTTPS
visit (Hodges, Jackson and Barth, 2012; Mozilla, 2026a). The negotiated protocol
and cipher suites follow current TLS configuration guidance (McKay and Cooper,
2019; OWASP, n.d. m).

**What self signed does and does not mean.** Trust in a TLS certificate normally
comes from a chain that validates back to an authority the client already trusts
(Cooper et al., 2008). No certificate authority will vouch for `localhost`, so a
development certificate is signed by the project itself, which is the case Node.js
reports as a self signed certificate in the chain (OpenJS Foundation, n.d. g).
Browsers therefore warn that the connection is "not private". That warning is
about the *authentication* property only. Confidentiality and integrity are
unaffected and the traffic is genuinely encrypted. In deployment the certificate
is replaced by a CA issued one and no application code changes, because the trust
decision lives in the certificate rather than the server.

**Why `npm run certs` uses a library.** The obvious instruction is
`openssl req -x509 ...`, but `openssl` is absent from a default Windows install
and differs across versions. The script uses the `selfsigned` package instead, so
certificate generation is one command that behaves identically everywhere
(Romaniello, n.d.). The
certificate lists both `localhost` and `127.0.0.1`, because modern clients read
the address from that extension.

**Why the certificate is not committed.** A TLS private key is the secret that
proves the server's identity, so anyone holding it can impersonate the server.
`certs/`, `*.pem` and `*.key` are gitignored and each developer generates their
own.

### 5.5 Controlled error handling

**Full detail to the server console, a safe generic message to the client, in
one shape, from one place.**

Express by default returns the stack trace as an HTML page unless `NODE_ENV` is
set to production (OpenJS Foundation, n.d. b). A stack trace tells an attacker
the framework and version, absolute filesystem paths, internal module names and
often the shape of the failing query. That is free reconnaissance, and an error
message carrying that kind of internal detail is a catalogued weakness (MITRE,
2026d) as well as a named form of security misconfiguration (OWASP, 2021d). The
correct shape is the one used here: a generic response to the caller, the full
detail logged server side (OWASP, n.d. d). This
API never emits one (OpenJS Foundation, n.d. b; MITRE, 2026d).

| Error | Response | Reasoning |
|---|---|---|
| Schema validation | `400` with a per field `errors` array | The user can fix this, and it describes only their own input |
| Bad ObjectId | `400 Invalid value supplied for '_id'` | Names the parameter without revealing the schema |
| Duplicate key | `409 An account with that email already exists` | The conflict is meaningful and actionable |
| Malformed JSON | `400 Request body is not valid JSON` | Raised before any route runs, and still caught |
| Body over 10kb | `413 Request body is too large` | Explicit rather than a connection reset |
| No route matched | `404 Route not found` as JSON | Never Express's HTML default page |
| **Anything else** | `500 An unexpected error occurred`, logged in full server side | An unrecognised error is exactly the kind whose message is most likely to contain internal detail |

That last row is the important one. The rule is **describe only what was
recognised**, and everything else is generic. Each status code is used with the
meaning HTTP defines for it (Fielding, Nottingham and Reschke, 2022).

**What reaches the log.** The server side record carries the stack and the
failing operation, never the request credentials. Passwords, tokens, connection
strings and keys are excluded from log output by design (OWASP, n.d. h), since
a log holding them becomes a second, less protected copy of the secret (MITRE,
2026e). Logging of authentication attempts is not part of Part 1 and is
scheduled for Part 3, since unlogged security events are their own Top 10
category (OWASP, 2021e).

**Account enumeration is closed.** Login returns the identical
`401 Invalid email or password` whether the email is unregistered or the password
is wrong. Distinguishing them would turn login into a free membership oracle. A response
that differs between a bad username and a bad password is an observable response
discrepancy and is what makes account enumeration possible (MITRE, 2026c), so the
guidance is a single generic failure message (OWASP, n.d. a). Both conditions
are evaluated in one expression:

```js
if (!user || !(await user.comparePassword(password))) {
    return fail(res, 401, 'Invalid email or password');
}
```

**This is tested, not just claimed.** Every one of the 83 requests is checked by
a collection level test that the response is JSON rather than an HTML error page,
and that the body contains none of `node_modules`, the repository path,
`at JSON.parse` or `MongoServerError`. That is 166 assertions dedicated purely to
proving nothing leaks.

### 5.6 Other decisions

**Uniqueness is enforced by the database, not a check then write.** The obvious
approach queries for the email then inserts if absent, which contains a race:
two simultaneous registrations can both pass the check before either writes. The
code does not query at all. It relies on the unique index, which MongoDB enforces
atomically, and translates the duplicate key error into a `409`
(MongoDB, Inc., 2026c).

**Emails are normalised.** Trimmed and lowercased in validation and again in the
schema, so `TYREECE.S@HUSTLEHUB.TEST` and `tyreece.s@hustlehub.test` are the same
account. Without this, case variation would create duplicates the unique index
could not see.

**The application refuses to start if misconfigured.** Startup validates all six
required values, reports every missing one at once, rejects the placeholder
secret, and confirms the certificate files exist. A security control that fails
silently is worse than no control, because it looks like it is working.

**Secrets never enter the repository.** Configuration that varies between
deployments, and every credential in it, is read from the environment rather than
committed, so the codebase could be made public at any moment without exposing a
secret (Wiggins, 2017; OWASP, n.d. l). `.env`, `certs/`, `*.pem` and `*.key`
are gitignored, and `.env.example` documents every key with a safe placeholder. The
Postman collection ships with the admin password blank and it is injected from
`.env` at run time.

### 5.7 Summary

| Threat | Control | Test that proves it |
|---|---|---|
| Credential theft from a stolen database | bcrypt cost 12, salted per user | Hash inspection, see 5.1 |
| Password hash leaking through the API | `select: false` plus `toJSON` transform | Global check on all 83 responses |
| Privilege escalation at registration | `Admin` removed from the self service roles | Admin role cannot be self assigned |
| Privilege escalation by token forgery | Signature verification | A forged Admin token is refused |
| Unauthorised access to data | `authenticate` on every resource router | Folder 4, five requests |
| Unauthorised role change | `requireRole('Admin')` | A Client cannot change a role |
| NoSQL operator injection | Strict type checks | NoSQL operator injection is rejected |
| Mass assignment | Body rebuilt from the rule table | Unexpected fields are ignored |
| Stored cross-site scripting | Allowlist patterns reject markup | Script tag in name is rejected |
| Interception of passwords and tokens | HTTPS only, no HTTP listener | The whole suite runs over `https://` |
| Information disclosure via errors | Single error boundary | 166 no-leak assertions |
| Account enumeration | Identical login failure message | Wrong password / unknown account |
| Duplicate accounts via a race | Atomic unique index | Duplicate email is rejected |
| Memory exhaustion | 10kb body limit | Oversized body is rejected |

---

## 6. Getting started

Every instruction works identically on Windows, macOS and Linux. Nothing needs
`openssl`, shell specific quoting, or an absolute path.

### 6.1 Prerequisites

| Requirement | Version | Check with |
|---|---|---|
| Node.js | 20 or newer | `node --version` |
| npm | 10 or newer | `npm --version` |
| MongoDB Community Server | 6 or newer | `mongod --version` |
| Postman | any recent | optional, `npm run test:api` runs the suite without it |

**Starting MongoDB:**

| OS | Start | Stop |
|---|---|---|
| macOS (Homebrew) | `brew services start mongodb-community` | `brew services stop mongodb-community` |
| Windows | Runs as a service after the MSI install, otherwise `net start MongoDB` | `net stop MongoDB` |
| Linux (systemd) | `sudo systemctl start mongod` | `sudo systemctl stop mongod` |

### 6.2 Install

```bash
git clone https://github.com/ethan-edwards102/INSY7314-POE.git
cd INSY7314-POE
npm install
```

### 6.3 Configure

Copy the template. `.env` is gitignored and never committed.

```bash
cp .env.example .env               # macOS and Linux
copy .env.example .env             # Windows
```

Generate a real `JWT_SECRET` and paste it into `.env`. The server refuses to
start while the placeholder is in place.

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Set `ADMIN_PASSWORD` to a value that meets the password rules: 8 to 72
characters with an uppercase letter, a lowercase letter, a number and a symbol.

| Key | Purpose | Default |
|---|---|---|
| `PORT` | Port the HTTPS server listens on | `5001` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/hustle_hub_plus` |
| `SSL_KEY_PATH` | TLS private key | `./certs/localhost-key.pem` |
| `SSL_CERT_PATH` | TLS certificate | `./certs/localhost-cert.pem` |
| `JWT_SECRET` | Signs and verifies tokens | **must be replaced** |
| `JWT_EXPIRES_IN` | Token lifetime | `1h` |
| `ADMIN_NAME` | Seeded Admin display name | `Site Admin` |
| `ADMIN_EMAIL` | Seeded Admin login | `admin@hustlehub.local` |
| `ADMIN_PASSWORD` | Seeded Admin password | **must be replaced** |


### 6.4 Generate the certificate

Run once. The files are gitignored, so every developer generates their own.

```bash
npm run certs
```

```
Private key written to ./certs/localhost-key.pem
Certificate written to ./certs/localhost-cert.pem
Valid for 365 days. These files are ignored by git and must not be committed.
```

### 6.5 Seed the first Admin

Registration refuses the `Admin` role, so the first Admin is created out of band.
This also empties the database, which is the state the test suite expects.

```bash
npm run db:reset
```

```
Dropped hustle_hub_plus.
  users: 5 removed
Created Admin admin@hustlehub.local.
```

To seed without dropping anything, run `npm run seed:admin` on its own.

### 6.6 Run

```bash
npm start
```

```
Connected to MongoDB
Server started on https://localhost:5001
```

Stop it with **Ctrl-C**. Verify it works:

```bash
curl -k -X POST https://localhost:5001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Tyreece S","email":"tyreece.s@hustlehub.test","password":"Tyreece!Pass1"}'
```

`-k` skips certificate verification, which is needed because the development
certificate is self signed. A `201` with a token means the stack works end to
end. Postman users must turn off **Settings > General > SSL certificate
verification** for the same reason.

### 6.7 Scripts

| Command | What it does |
|---|---|
| `npm start` | Starts the HTTPS API |
| `npm run certs` | Generates the self signed development certificate |
| `npm run seed:admin` | Creates or promotes the Admin account |
| `npm run db:reset` | Drops the database and reseeds the Admin |
| `npm run test:api` | Runs all 83 requests through Newman |

### 6.8 Troubleshooting

| Symptom | Fix |
|---|---|
| `Missing required configuration in .env` | The message names every missing key and what it is for |
| `JWT_SECRET is still set to the .env.example placeholder` | Run the `randomBytes` command in 6.3 |
| `TLS certificate not found` | `npm run certs` |
| `MongooseServerSelectionError` | MongoDB is not running, see the table in 6.1 |
| `Browser or Postman warns "not private"` | Expected, the certificate is self signed. Proceed or disable SSL verification |
| `The database holds N accounts, and the suite expects only the seeded Admin` | `npm run db:reset` |

---

## 7. API reference

Base URL `https://localhost:5001`. All bodies are JSON. Protected routes need the
header `Authorization: Bearer <token>`.

### 7.1 Endpoints

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `POST` | `/auth/register` | none | none | Create an account, returns a JWT |
| `POST` | `/auth/login` | none | none | Sign in, returns a JWT |
| `PATCH` | `/users/:id/role` | JWT | **Admin** | Change another account's role |
| `POST` | `/{resource}` | JWT | any | Create a record |
| `GET` | `/{resource}` | JWT | any | List records, with a `count` |
| `GET` | `/{resource}/:id` | JWT | any | Fetch one record |
| `PUT` | `/{resource}/:id` | JWT | any | Replace a record in full |
| `DELETE` | `/{resource}/:id` | JWT | any | Delete a record |

`{resource}` is one of `bookings`, `clients`, `freelancers`, `invoices`, `pops`
or `services`. All six expose the same five verbs, so they are documented once.

### 7.2 Register and login

**`POST /auth/register`**

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | yes | 2 to 50 characters, letters, spaces, hyphens and apostrophes |
| `email` | string | yes | Valid address, trimmed and lowercased, must be unique |
| `password` | string | yes | 8 to 72 characters with upper, lower, number and symbol. Never trimmed |
| `role` | string | no | `Client` or `Freelancer`, defaults to `Client`. `Admin` is refused |

```json
{
  "name": "Ethan Edwards",
  "email": "ethan.edwards@hustlehub.test",
  "password": "Ethan!Pass1",
  "role": "Freelancer"
}
```

`201 Created`

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "name": "Ethan Edwards",
    "email": "ethan.edwards@hustlehub.test",
    "role": "Freelancer",
    "_id": "6a91e48284e36fb40ec00de6",
    "createdAt": "2026-08-28T19:41:54.910Z",
    "updatedAt": "2026-08-28T19:41:54.910Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhOTFlNDgyODRlMzZmYjQwZWMwMGRlNiIsInJvbGUiOiJGcmVlbGFuY2VyIiwiaWF0IjoxNzg3OTQ2MTE1LCJleHAiOjE3ODc5NDk3MTV9.C4iLwlKx80u3hNPaj8xLQsW8ndRCBBNTXP7rjwsbddM"
}
```

`password` is absent from `data`. It is stripped by the model and can never
appear in a response.

| Status | Cause |
|---|---|
| `201` | Account created, returns the user and a token |
| `400` | Any field invalid, including a self assigned `Admin` role or a non string value |
| `409` | Email already registered, in any letter case |
| `413` | Body over 10kb |

**`POST /auth/login`**

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | yes | Valid address, trimmed and lowercased |
| `password` | string | yes | Any non empty string, not trimmed |

```json
{ "email": "ethan.edwards@hustlehub.test", "password": "Ethan!Pass1" }
```

`200 OK` returns the same envelope as registration with the message
`Login successful`.

| Status | Cause |
|---|---|
| `200` | Credentials correct, returns the user and a token |
| `400` | `email` or `password` missing or not a string |
| `401` | Unknown email **or** wrong password, identical message for both |

Login deliberately does not apply the password complexity pattern. Complexity is
a rule for choosing a password, not for presenting one, and applying it here
would reveal the rule and reject older passwords under a tightened policy.

### 7.3 Marketplace resources

All six share the same status codes.

| Status | Cause |
|---|---|
| `201` | Created, `POST` only |
| `200` | Retrieved, updated or deleted |
| `400` | Validation failed, or the `:id` is not a valid ObjectId |
| `401` | Missing, malformed, forged or expired token |
| `404` | No record with that id |
| `413` | Body over 10kb |
| `500` | Unexpected error, logged in full server side |

| Resource | Fields |
|---|---|
| **Services** | `category` (`HouseCleaning` or `DogGrooming`), `rate` (number, 0 or more), `rateType` (`Once`, `Hour` or `Day`) |
| **Clients** | `name` |
| **Freelancers** | `name`, optional `services` array of service objects |
| **Invoices** | `amount` (number, 0 or more), optional `dateIssued`, optional embedded `pop` |
| **Pops** | optional `datePaid`, defaults to now |
| **Bookings** | `date`, optional `quantity` (whole number, defaults to 1), and embedded `client`, `freelancer` and `service` objects |

```json
// POST /bookings
{
  "date": "2026-09-01T09:00:00.000Z",
  "quantity": 3,
  "client": { "name": "Tyreece S" },
  "freelancer": {
    "name": "Ndumsio J",
    "services": [ { "category": "HouseCleaning", "rate": 300, "rateType": "Hour" } ]
  },
  "service": { "category": "HouseCleaning", "rate": 300, "rateType": "Hour" }
}
```

A booking embeds copies of the client, freelancer and service rather than
referencing them. This is deliberate: a booking is a financial record and must
stay an accurate account of the terms agreed on the day, even if the freelancer
later changes their advertised rate.

```http
POST   /services       201  { "success": true, "message": "Service created",    "data": { ... } }
GET    /services       200  { "success": true, "message": "Services retrieved", "data": [ ... ], "count": 4 }
GET    /services/:id   200  { "success": true, "message": "Service retrieved",  "data": { ... } }
PUT    /services/:id   200  { "success": true, "message": "Service updated",    "data": { ... } }
DELETE /services/:id   200  { "success": true, "message": "Service deleted" }
```

`PUT` replaces the whole document and uses the same rules as `POST`, so every
required field must be resent. `DELETE` responses carry no `data`, because there
is no longer a record to return.

### 7.4 `PATCH /users/:id/role`

Requires a valid JWT **and** the `Admin` role. The body is `{ "role": "..." }`
where the value is `Client`, `Freelancer` or `Admin`. `Admin` is allowed here,
unlike at registration; the safety comes from `requireRole('Admin')` on the
route, not from restricting the list.

| Status | Cause |
|---|---|
| `200` | `Role updated` |
| `400` | `role` missing or unknown, or `:id` is not an ObjectId |
| `401` | Missing, forged or expired token |
| `403` | Authenticated, but not an Admin |
| `404` | `User not found` |

There is intentionally no `GET /users` or `DELETE /users/:id`. A user listing
endpoint would be a ready made harvest of every email address on the platform and
is not needed by any Part 1 requirement.

### 7.5 Response format

Every response, success or failure, uses one of two shapes, so a client never has
to guess what it received.

```json
// success
{ "success": true, "message": "Services retrieved", "data": [], "count": 0 }

// failure
{ "success": false, "message": "Validation failed",
  "errors": [ { "field": "email", "message": "Email must be text" } ] }
```

| Key | When present |
|---|---|
| `success` | Always |
| `message` | Always. Safe text only, never a stack trace, path or config value |
| `data` | On success, except `DELETE` |
| `count` | List endpoints only |
| `token` | Register and login only |
| `errors` | Validation failures only, one entry per rejected field |

**Live failure captures.** Each of these is a real response from the running API:

```jsonc
// 400  privilege escalation refused at registration
{ "success": false, "message": "Validation failed",
  "errors": [ { "field": "role", "message": "Role must be one of: Client, Freelancer" } ] }

// 400  NoSQL operator injection refused
{ "success": false, "message": "Validation failed",
  "errors": [ { "field": "email", "message": "Email must be text" } ] }

// 400  malformed JSON, caught before any route runs
{ "success": false, "message": "Request body is not valid JSON" }

// 401  no token, then a token that will not verify
{ "success": false, "message": "Authentication required" }
{ "success": false, "message": "Invalid token" }

// 401  identical for an unknown email and a wrong password
{ "success": false, "message": "Invalid email or password" }

// 403  authenticated, but not an Admin
{ "success": false, "message": "You do not have permission to perform this action" }

// 404  unknown route, as JSON rather than an HTML error page
{ "success": false, "message": "Route not found" }

// 409  duplicate registration, caught by the unique index
{ "success": false, "message": "An account with that email already exists" }

// 413  oversized body
{ "success": false, "message": "Request body is too large" }
```

Not one of them names a file, a line, a module or a database.

---

## 8. Testing

The API is tested with a Postman collection of **83 requests** making **401
assertions**. All of them pass.

The collection is organised into **12 folders** rather than a flat list, because
83 individual requests is unreadable as a checklist and gives no sense of what is
covered. Each folder is a self contained theme and can be run on its own.

### 8.1 How to run it

**Headless, through Newman.** Newman is Postman's command line collection runner,
so the same collection that runs in the app runs unattended and can be scripted
(Postman, Inc., n.d. b). The fastest way, and the one used for evidence.

```bash
# terminal 1
npm run db:reset      # empty database with a seeded Admin, the state the suite expects
npm start

# terminal 2
npm run test:api
```

`npm run test:api` does more than call Newman. It checks that every required
`.env` value is present, that something is answering on the HTTPS port, and that
the database holds only the seeded Admin, failing with an actionable message
rather than a confusing test failure. It then injects `baseUrl`, `adminEmail` and
`adminPassword` from `.env`, which is why the admin password is not stored in the
collection file.

**In the Postman app.** Import
`postman/HustleHub-Plus.postman_collection.json`, turn off **Settings > General >
SSL certificate verification**, create an environment supplying `adminEmail` and
`adminPassword`, run `npm run db:reset`, then **Run collection**.

### 8.2 Coverage

| # | Folder | Requests | Assertions | What it covers |
|---|---|---:|---:|---|
| 1 | Registration, successful | 4 | 29 | Creates the four fixture accounts reused by every later folder. Confirms a `201`, a well formed token, and no password in the response |
| 2 | Registration, invalid scenarios | 11 | 52 | The negative path: duplicate emails, case variants, self assigned Admin, NoSQL operators, missing fields, weak passwords, malformed emails, script tags, malformed JSON, oversized bodies, unknown routes |
| 3 | Login | 4 | 20 | Successful login for a user and the Admin, capturing both tokens. Wrong password and unknown account, each asserting the identical message |
| 4 | Authentication required | 5 | 20 | A protected route refused with no token, a malformed header, a token that is not a JWT, and a **forged Admin token** |
| 5 | Role enforcement | 5 | 23 | A Client cannot change a role, an Admin can, an unknown role is refused, an unknown account gives `404`, then the change is reverted |
| 6 | Services | 8 | 40 | Full CRUD, plus an invalid category and a negative rate, ending with a delete and a `404` confirming it is gone |
| 7 | Clients | 8 | 38 | Full CRUD, plus a script tag in the name and a malformed ObjectId in the URL |
| 8 | Freelancers | 8 | 39 | Full CRUD, plus an invalid nested service entry and a `services` value that is not a list |
| 9 | Invoices | 8 | 40 | Full CRUD, plus a negative amount carrying a malformed nested date, and a non numeric amount |
| 10 | Pops | 7 | 34 | Full CRUD for proof of payment records, plus an invalid date |
| 11 | Bookings | 9 | 42 | Full CRUD across three embedded documents, plus nested validation failures and **unknown fields inside an embedded document** |
| 12 | The suite leaves no records behind | 6 | 24 | Confirms all six collections are empty again, proving the suite cleans up after itself |
| | **Total** | **83** | **401** | |

### 8.3 What every response is checked for

Assertions are written as `pm.test` blocks against the parsed response (Postman,
Inc., n.d. c). Beyond each request's own assertions, a collection level test
runs after **all 83 requests**. It contributes 166 of the 401 assertions and enforces two guarantees
that must hold everywhere, including on every failure path:

1. **The response is JSON, not an HTML error page.** This catches anything that
   fell through to Express's default handler.
2. **The response exposes no internal detail.** The body must not contain
   `node_modules`, the repository path, `at JSON.parse` or `MongoServerError`, so
   no stack trace, file path or raw driver error can reach a client.

This is what makes the claim in [5.5](#55-controlled-error-handling) testable
rather than merely stated.

### 8.4 The fixture cast

The suite uses a fixed cast rather than generated addresses, so a run is
reproducible and assertions can be exact.

| Account | Email | Role |
|---|---|---|
| Tyreece S | `tyreece.s@hustlehub.test` | Client |
| Dylan Olsen | `dylan.olsen@hustlehub.test` | Client |
| Ethan Edwards | `ethan.edwards@hustlehub.test` | Freelancer |
| Ndumsio J | `ndumsio.j@hustlehub.test` | Freelancer |
| Site Admin | from `.env` | Admin, seeded out of band |

Tokens and record ids pass between requests through collection variables, so the
suite is one ordered run rather than a set of independent calls.

### 8.5 Result

```
┌─────────────────────────┬───────────────────┬──────────────────┐
│                         │          executed │           failed │
├─────────────────────────┼───────────────────┼──────────────────┤
│              iterations │                 1 │                0 │
├─────────────────────────┼───────────────────┼──────────────────┤
│                requests │                83 │                0 │
├─────────────────────────┼───────────────────┼──────────────────┤
│            test-scripts │               166 │                0 │
├─────────────────────────┼───────────────────┼──────────────────┤
│      prerequest-scripts │                 1 │                0 │
├─────────────────────────┼───────────────────┼──────────────────┤
│              assertions │               401 │                0 │
├─────────────────────────┴───────────────────┴──────────────────┤
│ total run duration: 3.3s                                       │
└────────────────────────────────────────────────────────────────┘
```

---

## 9. Coming soon

The full HustleHub+ system is built across three parts. Part 1 delivers the
secure backend foundations. The rest arrives in Parts 2 and 3.

| Capability | Part | Status |
|---|---|---|
| User registration and authentication using secure practices | 1 | **Done** |
| Security controls: validation, HTTPS, access restrictions, safe errors | 1 | **Done** |
| Automated API endpoint testing | 1 | **Done** |
| A React frontend for registering, logging in, browsing and booking | 2 | Coming soon |
| Freelancer management of gigs | 2 | Coming soon |
| Client browsing and booking of gigs | 2 | Coming soon |
| Role based access control across every endpoint | 2 | Coming soon |
| Ownership checks, so users only reach their own records | 2 | Coming soon |
| Transaction records created from bookings, with simulated payment | 2 | Coming soon |
| Income tracking for Freelancers | 2 | Coming soon |
| Input sanitisation | 2 | Coming soon |
| Rate limiting on authentication and booking endpoints | 2 | Coming soon |
| Security headers and a Content Security Policy | 2 | Coming soon |
| Frontend component and interaction tests | 2 | Coming soon |
| Estimated tax calculation for Freelancers | 3 | Coming soon |
| A financial dashboard with charts and summaries | 3 | Coming soon |
| Logging of key system events | 3 | Coming soon |
| Containerisation with Docker and Docker Compose | 3 | Coming soon |
| A CI/CD pipeline with automated tests and security scans | 3 | Coming soon |
| Static code analysis | 3 | Coming soon |

Two Part 1 details will also be revisited later. Because the role is read from
the token, a demoted Admin keeps their authority until the token expires, which
short lived tokens with refresh will address in Part 2. And the self signed
certificate is replaced by a CA issued one at deployment, which needs no code
change.

---

## 10. Demonstration

### 10.1 Video

> **[Video link]**

The recording shows the API running, a successful registration, and a login
producing a token:

1. MongoDB started, then `npm start` printing `https://localhost:5001`.
2. `POST /auth/register` returning `201` with a token.
3. `POST /auth/login` returning `200` with a token.
4. The token used on a protected route, returning `200`.
5. The same route without the token, returning `401`.
6. MongoDB Compass showing the stored `$2b$12$` bcrypt hash.

### 10.2 Screenshots

> **[`docs/screenshots/`]**

| # | Screenshot | Demonstrates |
|---|---|---|
| 1 | `POST /auth/register` returning `201` with a token | Registration works and issues a JWT |
| 2 | `POST /auth/login` returning `200` with a token | Login works and issues a JWT |
| 3 | Duplicate registration returning `409` | Uniqueness enforced by the database |
| 4 | Wrong password returning `401` | Identical message, no account enumeration |
| 5 | Validation failure returning `400` with the `errors` array | Every bad field reported at once |
| 6 | A protected route with no token returning `401` | The JWT is required, not optional |
| 7 | A forged Admin token returning `401` | Signature verification cannot be bypassed |
| 8 | Compass showing `$2b$12$` hashes in `users` | No plaintext password is stored |
| 9 | The certificate warning or padlock on `https://localhost:5001` | The API is served over TLS |
| 10 | The Newman summary showing 401 of 401 passing | The full suite passes |

---

## 11. References

Auth0 (n.d.) *node-jsonwebtoken*. Available at:
https://github.com/auth0/node-jsonwebtoken (Accessed: 29 August 2026).

Automattic (n.d. a) *Middleware*. Mongoose Documentation. Available at:
https://mongoosejs.com/docs/middleware.html (Accessed: 29 August 2026).

Automattic (n.d. b) *Query*. Mongoose API Documentation. Available at:
https://mongoosejs.com/docs/api/query.html (Accessed: 29 August 2026).

Automattic (n.d. c) *Schemas*. Mongoose Documentation. Available at:
https://mongoosejs.com/docs/guide.html (Accessed: 29 August 2026).

Automattic (n.d. d) *Validation*. Mongoose Documentation. Available at:
https://mongoosejs.com/docs/validation.html (Accessed: 29 August 2026).

Cooper, D., Santesson, S., Farrell, S., Boeyen, S., Housley, R. and Polk, W.
(2008) *Internet X.509 public key infrastructure certificate and certificate
revocation list (CRL) profile*. RFC 5280. Internet Engineering Task Force.
Available at: https://www.rfc-editor.org/rfc/rfc5280 (Accessed: 29 August 2026).

Fielding, R.T. (2000) *Architectural styles and the design of network-based
software architectures*. PhD thesis. University of California, Irvine. Available
at: https://www.ics.uci.edu/~fielding/pubs/dissertation/top.htm (Accessed:
29 August 2026).

Fielding, R., Nottingham, M. and Reschke, J. (eds.) (2022) *HTTP semantics*.
RFC 9110. Internet Engineering Task Force. Available at:
https://www.rfc-editor.org/rfc/rfc9110.html (Accessed: 29 August 2026).

Grassi, P.A., Fenton, J.L., Newton, E.M., Perlner, R.A., Regenscheid, A.R.,
Burr, W.E. and Richer, J.P. (2017) *Digital identity guidelines: authentication
and lifecycle management*. NIST Special Publication 800-63B. Gaithersburg, MD:
National Institute of Standards and Technology. Available at:
https://pages.nist.gov/800-63-3/sp800-63b.html (Accessed: 29 August 2026).

Hodges, J., Jackson, C. and Barth, A. (2012) *HTTP strict transport security
(HSTS)*. RFC 6797. Internet Engineering Task Force. Available at:
https://www.rfc-editor.org/rfc/rfc6797 (Accessed: 29 August 2026).

Ishaq, M.M., Singh, P., Badjatya, S., Kumar, S., Tomar, Y. and Bansal, S. (2023)
'Design and development of a user-friendly social media app using the MERN
stack', *2023 International Conference on Circuit Power and Computing
Technologies (ICCPCT)*. Kollam, India. IEEE, pp. 1730-1736.
doi: 10.1109/ICCPCT58313.2023.10245371.

Jones, M., Bradley, J. and Sakimura, N. (2015) *JSON web token (JWT)*. RFC 7519.
Internet Engineering Task Force. Available at:
https://datatracker.ietf.org/doc/html/rfc7519 (Accessed: 29 August 2026).

Jones, M. and Hardt, D. (2012) *The OAuth 2.0 authorization framework: bearer
token usage*. RFC 6750. Internet Engineering Task Force. Available at:
https://datatracker.ietf.org/doc/html/rfc6750 (Accessed: 29 August 2026).

kelektiv (n.d.) *node.bcrypt.js*. Available at:
https://github.com/kelektiv/node.bcrypt.js (Accessed: 29 August 2026).

McKay, K.A. and Cooper, D.A. (2019) *Guidelines for the selection, configuration,
and use of transport layer security (TLS) implementations*. NIST Special
Publication 800-52 Revision 2. Gaithersburg, MD: National Institute of Standards
and Technology. Available at: https://csrc.nist.gov/pubs/sp/800/52/r2/final
(Accessed: 29 August 2026).

MITRE (2026a) *CWE-20: improper input validation*. Common Weakness Enumeration,
version 4.20. Available at: https://cwe.mitre.org/data/definitions/20.html
(Accessed: 29 August 2026).

MITRE (2026b) *CWE-79: improper neutralization of input during web page
generation ('cross-site scripting')*. Common Weakness Enumeration, version 4.20.
Available at: https://cwe.mitre.org/data/definitions/79.html (Accessed:
29 August 2026).

MITRE (2026c) *CWE-204: observable response discrepancy*. Common Weakness
Enumeration, version 4.20. Available at:
https://cwe.mitre.org/data/definitions/204.html (Accessed: 29 August 2026).

MITRE (2026d) *CWE-209: generation of error message containing sensitive
information*. Common Weakness Enumeration, version 4.20. Available at:
https://cwe.mitre.org/data/definitions/209.html (Accessed: 29 August 2026).

MITRE (2026e) *CWE-532: insertion of sensitive information into log file*. Common
Weakness Enumeration, version 4.20. Available at:
https://cwe.mitre.org/data/definitions/532.html (Accessed: 29 August 2026).

MITRE (2026f) *CWE-798: use of hard-coded credentials*. Common Weakness
Enumeration, version 4.20. Available at:
https://cwe.mitre.org/data/definitions/798.html (Accessed: 29 August 2026).

MITRE (2026g) *CWE-915: improperly controlled modification of
dynamically-determined object attributes*. Common Weakness Enumeration, version
4.20. Available at: https://cwe.mitre.org/data/definitions/915.html (Accessed:
29 August 2026).

MITRE (2026h) *CWE-943: improper neutralization of special elements in data query
logic*. Common Weakness Enumeration, version 4.20. Available at:
https://cwe.mitre.org/data/definitions/943.html (Accessed: 29 August 2026).

MongoDB, Inc. (n.d.) *MERN stack explained*. Available at:
https://www.mongodb.com/resources/languages/mern-stack (Accessed:
29 August 2026).

MongoDB, Inc. (2026a) *Query predicates*. MongoDB Manual. Available at:
https://www.mongodb.com/docs/manual/reference/mql/query-predicates/ (Accessed:
29 August 2026).

MongoDB, Inc. (2026b) *Schema validation*. MongoDB Manual. Available at:
https://www.mongodb.com/docs/manual/core/schema-validation/ (Accessed:
29 August 2026).

MongoDB, Inc. (2026c) *Unique indexes*. MongoDB Manual. Available at:
https://www.mongodb.com/docs/manual/core/index-unique/ (Accessed:
29 August 2026).

Motte, S. (n.d.) *dotenv*. Available at:
https://github.com/motdotla/dotenv (Accessed: 29 August 2026).

Mozilla (2025) *Cross-site scripting (XSS)*. MDN Web Docs. Available at:
https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/XSS (Accessed:
29 August 2026).

Mozilla (2026a) *Strict-Transport-Security header*. MDN Web Docs. Available at:
https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
(Accessed: 29 August 2026).

Mozilla (2026b) *Transport layer security (TLS)*. MDN Web Docs. Available at:
https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Transport_Layer_Security
(Accessed: 29 August 2026).

National Institute of Standards and Technology (2026) *Role based access
control*. Computer Security Resource Center. Available at:
https://csrc.nist.gov/projects/role-based-access-control (Accessed:
29 August 2026).

OpenJS Foundation (n.d. a) *About Node.js*. Available at:
https://nodejs.org/en/about (Accessed: 29 August 2026).

OpenJS Foundation (n.d. b) *Error handling*. Express.js Guide. Available at:
https://expressjs.com/en/guide/error-handling.html (Accessed: 29 August 2026).

OpenJS Foundation (n.d. c) *Express object*. Express 5.x API Reference.
Available at: https://expressjs.com/en/5x/api/express/ (Accessed:
29 August 2026).

OpenJS Foundation (n.d. d) *HTTPS*. Node.js API Documentation. Available at:
https://nodejs.org/api/https.html (Accessed: 29 August 2026).

OpenJS Foundation (n.d. e) *Routing*. Express.js Guide. Available at:
https://expressjs.com/en/guide/routing.html (Accessed: 29 August 2026).

OpenJS Foundation (n.d. f) *The Node.js event loop*. Node.js Documentation.
Available at:
https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick
(Accessed: 29 August 2026).

OpenJS Foundation (n.d. g) *TLS (SSL)*. Node.js API Documentation. Available
at: https://nodejs.org/api/tls.html (Accessed: 29 August 2026).

OpenJS Foundation (n.d. h) *Using middleware*. Express.js Guide. Available at:
https://expressjs.com/en/guide/using-middleware.html (Accessed: 29 August 2026).

OWASP (n.d. a) *Authentication cheat sheet*. OWASP Cheat Sheet Series.
Available at:
https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
(Accessed: 29 August 2026).

OWASP (n.d. b) *Authorization cheat sheet*. OWASP Cheat Sheet Series.
Available at:
https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
(Accessed: 29 August 2026).

OWASP (n.d. c) *Cross site scripting prevention cheat sheet*. OWASP Cheat
Sheet Series. Available at:
https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
(Accessed: 29 August 2026).

OWASP (n.d. d) *Error handling cheat sheet*. OWASP Cheat Sheet Series.
Available at:
https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html
(Accessed: 29 August 2026).

OWASP (n.d. e) *Injection prevention cheat sheet*. OWASP Cheat Sheet Series.
Available at:
https://cheatsheetseries.owasp.org/cheatsheets/Injection_Prevention_Cheat_Sheet.html
(Accessed: 29 August 2026).

OWASP (n.d. f) *Input validation cheat sheet*. OWASP Cheat Sheet Series.
Available at:
https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
(Accessed: 29 August 2026).

OWASP (n.d. g) *JSON web token cheat sheet*. OWASP Cheat Sheet Series.
Available at:
https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html
(Accessed: 29 August 2026).

OWASP (n.d. h) *Logging cheat sheet*. OWASP Cheat Sheet Series. Available at:
https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
(Accessed: 29 August 2026).

OWASP (n.d. i) *Mass assignment cheat sheet*. OWASP Cheat Sheet Series.
Available at:
https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html
(Accessed: 29 August 2026).

OWASP (n.d. j) *Password storage cheat sheet*. OWASP Cheat Sheet Series.
Available at:
https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
(Accessed: 29 August 2026).

OWASP (n.d. k) *Regular expression denial of service - ReDoS*. Available at:
https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS
(Accessed: 29 August 2026).

OWASP (n.d. l) *Secrets management cheat sheet*. OWASP Cheat Sheet Series.
Available at:
https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
(Accessed: 29 August 2026).

OWASP (n.d. m) *Transport layer security cheat sheet*. OWASP Cheat Sheet
Series. Available at:
https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html
(Accessed: 29 August 2026).

OWASP (2021a) *A01:2021 broken access control*. OWASP Top 10:2021. Available at:
https://owasp.org/Top10/2021/A01_2021-Broken_Access_Control/ (Accessed:
29 August 2026).

OWASP (2021b) *A02:2021 cryptographic failures*. OWASP Top 10:2021. Available at:
https://owasp.org/Top10/2021/A02_2021-Cryptographic_Failures/ (Accessed:
29 August 2026).

OWASP (2021c) *A03:2021 injection*. OWASP Top 10:2021. Available at:
https://owasp.org/Top10/2021/A03_2021-Injection/ (Accessed: 29 August 2026).

OWASP (2021d) *A05:2021 security misconfiguration*. OWASP Top 10:2021. Available
at: https://owasp.org/Top10/2021/A05_2021-Security_Misconfiguration/ (Accessed:
29 August 2026).

OWASP (2021e) *A09:2021 security logging and monitoring failures*. OWASP Top
10:2021. Available at:
https://owasp.org/Top10/2021/A09_2021-Security_Logging_and_Monitoring_Failures/
(Accessed: 29 August 2026).

OWASP (2023) *API3:2023 broken object property level authorization*. OWASP API
Security Top 10, 2023 edition. Available at:
https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/
(Accessed: 29 August 2026).

OWASP (2025) *OWASP application security verification standard (ASVS)*. Version
5.0.0. Available at:
https://owasp.org/www-project-application-security-verification-standard/
(Accessed: 29 August 2026).

Parnas, D.L. (1972) 'On the criteria to be used in decomposing systems into
modules', *Communications of the ACM*, 15(12), pp. 1053-1058.
doi: 10.1145/361598.361623.

Postman, Inc. (n.d. a) *Create and manage request collections in Postman*.
Postman Learning Center. Available at:
https://learning.postman.com/docs/collections/collections-overview/ (Accessed:
29 August 2026).

Postman, Inc. (n.d. b) *Run and test collections from the command line using
Newman CLI*. Postman Learning Center. Available at:
https://learning.postman.com/docs/collections/using-newman-cli/command-line-integration-with-newman/
(Accessed: 29 August 2026).

Postman, Inc. (n.d. c) *Write scripts to test API response data in Postman*.
Postman Learning Center. Available at:
https://learning.postman.com/docs/tests-and-scripts/write-scripts/test-scripts/
(Accessed: 29 August 2026).

Provos, N. and Mazières, D. (1999) 'A future-adaptable password scheme',
*Proceedings of the FREENIX Track: 1999 USENIX Annual Technical Conference*.
Monterey, CA. USENIX Association, pp. 81-91. Available at:
https://www.usenix.org/legacy/events/usenix99/provos/provos.pdf (Accessed:
29 August 2026).

Reenskaug, T. (1979) *Models-views-controllers*. Xerox PARC technical note.
Available at:
https://folk.universitetetioslo.no/trygver/1979/mvc-2/1979-12-MVC.pdf (Accessed:
29 August 2026).

Rescorla, E. (2018) *The transport layer security (TLS) protocol version 1.3*.
RFC 8446. Internet Engineering Task Force. Available at:
https://www.rfc-editor.org/rfc/rfc8446 (Accessed: 29 August 2026).

Romaniello, J.F. (n.d.) *selfsigned*. Available at:
https://github.com/jfromaniello/selfsigned (Accessed: 29 August 2026).

Sheffer, Y., Hardt, D. and Jones, M. (2020) *JSON web token best current
practices*. RFC 8725. Internet Engineering Task Force. Available at:
https://datatracker.ietf.org/doc/html/rfc8725 (Accessed: 29 August 2026).

Wiggins, A. (2017) *III. Config*. The Twelve-Factor App. Available at:
https://12factor.net/config (Accessed: 29 August 2026).

Wirtz, D. (n.d.) *bcrypt.js*. Available at:
https://github.com/dcodeIO/bcrypt.js (Accessed: 29 August 2026).

---

**HustleHub+** | INSY7314 | Information Systems 3D | Portfolio of Evidence | Part 1
