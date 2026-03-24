# ADR-004: Choosing JAMstack Architecture

## Status
Accepted

## Context
The portfolio project needs an architecture that can deliver fast, secure, and scalable web experiences. The application is primarily content-driven and requires high performance, global scalability, and a streamlined deployment process. 

To meet these needs, the **JAMstack (JavaScript, APIs, and Markup)** architecture has been chosen. JAMstack promotes decoupling the frontend and backend, where the frontend is pre-built and served statically, while dynamic functionalities are handled via API calls to third-party services or microservices.

Before deciding on JAMstack, several architectural alternatives were considered, each with distinct strengths and weaknesses for a portfolio project.

## Decision
The project will adopt **JAMstack** architecture for the following reasons:
- **Performance**: Since the frontend is served as static assets, the site can be globally distributed via CDNs (Content Delivery Networks), ensuring fast load times for users regardless of location.
- **Security**: With no direct server involved, common vulnerabilities associated with server-side architectures (e.g., DDoS attacks, server injections) are minimized. 
- **Scalability**: Static sites are inherently scalable, as serving static assets from a CDN requires no scaling effort on the server side. Dynamic content is managed through API endpoints, which can scale independently.
- **Developer Experience**: With modern frameworks like Next.js, the development workflow is streamlined, allowing for easy integration with modern JavaScript tools and libraries, as well as deployment processes tailored for static sites (e.g., Vercel, Netlify).
- **Cost Efficiency**: Static assets reduce infrastructure costs, as the bulk of the application does not require traditional server hosting.

## Alternatives Considered

### 1. **Server-Side Rendering (SSR)**
   - **Pros**:
     - Dynamic content generation on each request ensures that users receive the latest data without relying on API calls.
     - Suitable for highly dynamic applications where real-time data or complex server-side logic is critical.
   - **Cons**:
     - **Performance**: Pages are generated at request time, leading to higher response times compared to JAMstack’s pre-built static pages.
     - **Complexity**: Requires server infrastructure to handle rendering and additional resources for scaling.
     - **Cost**: Managing servers for rendering and scaling for high traffic can increase costs significantly.

### 2. **Single-Page Application (SPA)**
   - **Pros**:
     - Smooth client-side navigation with no page reloads, leading to better user experience.
     - API calls can update content dynamically on the client side.
   - **Cons**:
     - **SEO**: SPAs can have SEO challenges since search engines might struggle to index dynamic content rendered on the client side, though frameworks like Next.js mitigate this issue with pre-rendering.
     - **Performance**: Large SPAs can suffer from performance issues due to the need to load all JavaScript upfront.
     - **Complexity**: Requires careful management of routing, state, and APIs to ensure smooth client-side interactions.

### 3. **Traditional Multi-Page Application (MPA) with Backend Framework**
   - **Pros**:
     - Offers full control over server-side logic and database interactions, allowing complex business logic and highly dynamic content.
     - Easy integration with traditional server-side frameworks (e.g., Django, Rails, Laravel).
   - **Cons**:
     - **Performance**: Slower load times due to repeated server round trips and heavier backend infrastructure.
     - **Scalability**: Requires more effort to scale, both in terms of servers and databases, as each page load requires a full request-response cycle.
     - **Complexity**: Higher infrastructure overhead and more complex CI/CD pipelines compared to JAMstack.

### 4. **Content Management System (CMS)-Driven Approach (WordPress, Drupal)**
   - **Pros**:
     - Easily manageable content with a user-friendly interface for adding and updating pages.
     - A wide range of plugins and themes, making it easy to extend the website with minimal coding.
   - **Cons**:
     - **Performance**: Traditional CMS platforms are server-side by default, meaning they can’t take full advantage of CDNs for static delivery. This results in slower page loads, especially under high traffic.
     - **Security**: CMS platforms are frequent targets for attacks due to their popularity and the complexity of keeping plugins and systems up to date.
     - **Customization**: While CMS platforms offer flexibility with plugins, fully customizing them to meet specific design and functionality needs can be limiting or overly complex.

### Why JAMstack?

The **JAMstack architecture** is optimal for the portfolio project for the following reasons:
1. **Performance**: Pre-built static pages are fast and can be globally distributed via CDNs, ensuring excellent load times for a portfolio where fast, accessible content is critical.
2. **SEO**: With static content that’s pre-rendered, JAMstack offers excellent SEO performance, allowing search engines to index content easily.
3. **Security**: There’s no need to maintain a server, minimizing potential security vulnerabilities. API calls are used only when necessary for dynamic content.
4. **Developer Experience**: The decoupled nature of JAMstack allows for faster development and iteration cycles. The project can be developed using modern tools and frameworks such as **Next.js** or **Gatsby**, which support both static site generation (SSG) and dynamic capabilities via APIs.
5. **Integration with APIs**: As the project grows, additional features can be added by integrating third-party APIs or backend microservices, maintaining the flexibility to scale without affecting the frontend.

## Consequences
- **Static Content**: The project will rely on static site generation (SSG), with API calls made only for dynamic content, improving speed but potentially requiring careful management of API usage.
- **Frontend First**: The architecture requires the frontend to be prioritized in development, as the static assets form the core of the user-facing application.
- **Decoupled Backend**: The project will use external APIs or microservices to handle dynamic content, which could require additional effort to develop and maintain in the future.

## Alternatives Considered (Revisited)
1. **Server-Side Rendering (SSR)** was rejected due to its complexity and higher infrastructure costs, which are unnecessary for the portfolio’s static content.
2. **Single-Page Application (SPA)** was ruled out because SEO is a priority, and managing a large SPA can introduce performance bottlenecks.
3. **Traditional MPA with Backend Framework** introduces overhead that isn’t required for a personal portfolio, where pre-built static content suffices.
4. **CMS-driven** architecture was considered overkill and introduces potential security issues and performance challenges. JAMstack provides the needed flexibility and performance without the overhead of managing a traditional CMS.
