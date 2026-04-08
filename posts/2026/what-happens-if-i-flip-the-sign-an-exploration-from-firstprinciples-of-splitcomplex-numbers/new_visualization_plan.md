

Read [](file:///Users/vepopo/GitHub/venpopov.com/posts/2026/what-happens-if-i-flip-the-sign-an-exploration-from-firstprinciples-of-splitcomplex-numbers/index.qmd#1-1), lines 1 to 200

Fetched https://worrydream.com/LadderOfAbstraction/

Read [](file:///Users/vepopo/GitHub/venpopov.com/posts/2026/what-happens-if-i-flip-the-sign-an-exploration-from-firstprinciples-of-splitcomplex-numbers/index.qmd#200-200), lines 200 to 650

Read [](file:///Users/vepopo/GitHub/venpopov.com/posts/2026/what-happens-if-i-flip-the-sign-an-exploration-from-firstprinciples-of-splitcomplex-numbers/index.qmd#650-650), lines 650 to 707

Now let me examine Quarto's OJS capabilities and the existing post structure more closely: 

Explore OJS and Quarto capabilities

Read [](file:///Users/vepopo/GitHub/venpopov.com/posts/2026/what-happens-if-i-flip-the-sign-an-exploration-from-firstprinciples-of-splitcomplex-numbers/visualizations.qmd)

Searched for text ```` ```{ojs} ```` (`**/posts/**/*.qmd`), 8 results

Read [](file:///Users/vepopo/GitHub/venpopov.com/posts/2026/what-happens-if-i-flip-the-sign-an-exploration-from-firstprinciples-of-splitcomplex-numbers)

Read [](file:///Users/vepopo/GitHub/venpopov.com/_quarto.yml)

Read [](file:///Users/vepopo/GitHub/venpopov.com/posts/_metadata.yml)

Read [](file:///Users/vepopo/GitHub/venpopov.com/posts/2026/what-happens-if-i-flip-the-sign-an-exploration-from-firstprinciples-of-splitcomplex-numbers/index.qmd#1-1), lines 1 to 100

Searched for regex `ojs|observable` (`**/_quarto.yml`), no results

Searched for regex `ojs|observable|visualization` (`**/posts/2026/what-happens-if-i-flip-the-sign-an-exploration-from-firstprinciples-of-splitcomplex-numbers/index.qmd`), no results

Searched for regex `quarto-ojs` (`**/_site/site_libs/**`), 20 results

I now have deep understanding of the mathematical content (10 sections), the existing 4 visualizations, Bret Victor's design philosophy, and OJS technical capabilities. Let me design the plan. 

Created memory file [](file:///Users/vepopo/Library/Application%20Support/Code/User/workspaceStorage/07e3c9110252c82400527343294c1e5f/GitHub.copilot-chat/memory-tool/memories/MzY2MWM4YTMtNjdjYy00ODVkLWFlMjEtMTU4ZDQxMjFhOTZl/plan.md)

Here's the plan.

---

## Plan: Split-Complex Interactive Visualization Suite

Redesign the visualizations into a cohesive, Bret-Victor-inspired explorable essay. The existing 4 visualizations are surface-level and disconnected. The new suite: **5 phases, ~12 major visualizations**, using linked multi-view panels, abstraction layers (control → abstract → step down), and progressive disclosure. All OJS with Plot + D3 + Inputs.

### Design Philosophy

From Bret Victor: for each concept, (1) **control** a parameter, (2) **abstract over** it to see all values at once, (3) **step down** from the abstraction to explain patterns, and (4) **link multiple representations** of the same object. Here the "parameters" to abstract over are: the elements, the operation, the basis, the defining relation $t^2 = c$, and the group order $n$.

---

### Phase 1: "The Sign Flip" (Sections 1–2)

**Viz 1.1 — "Build Your Own Algebra" ($t^2 = c$ Continuum)**

A slider for $c \in [-1.5, 1.5]$, with landmarks at $c = -1$ (complex), $c = 0$ (dual), $c = 1$ (split-complex). The $(u,v)$-plane shows:
- The "unit curve" $u^2 - cv^2 = 1$ morphing from ellipse → parallel lines → hyperbola
- The zero-divisor set $u^2 = cv^2$ — absent for $c < 0$, emerging for $c > 0$
- A background heatmap of the norm $N = u^2 - cv^2$
- A draggable point showing norm value

The reader watches the phase transition at $c = 0$: zero divisors appear, the norm becomes indefinite, the unit curve breaks apart. This is "abstracting over the algebra itself."

**Viz 1.2 — "Zero Divisors in Action" (replaces existing Viz 1)**

Two draggable elements $x$ and $y$ on the split-complex plane. Continuously compute and display $xy$ as a third point. As one factor approaches the $u = v$ line and the other approaches $u = -v$, the product visibly collapses to zero. A "norm gauge" crosses zero at the diagonals. Plane colored by norm sign (+/−).

---

### Phase 2: "The Diagonalization" (Sections 3–4)

**Viz 2.1 — "The Split" — Linked Dual-Plane Isomorphism (★ Centerpiece)**

Two planes side by side, linked by $u + vt \mapsto (u+v, u-v)$:
- **Left:** $(u,v)$ coordinates. **Right:** $(a,b)$ coordinates.
- **Drag in either plane** → the other updates instantly.
- Geometric landmarks shown in both:
  - Zero-divisor lines $u = \pm v$ ↔ coordinate axes $a = 0, b = 0$
  - Hyperbola $u^2 - v^2 = 1$ ↔ rectangular hyperbola $ab = 1$
  - Grids in one = 45°-rotated grids in the other
- Norm value shown in both: $N = u^2 - v^2 = ab$

The reader sees: what looks like a "defect" (zero divisors, indefinite norm) in $(u,v)$ is perfectly ordinary in $(a,b)$ — just the coordinate axes. The algebra is $\mathbb{R} \times \mathbb{R}$.

**Viz 2.2 — "The Multiplication Machine"**

Two elements with adjustable coordinates. Show $x \cdot y$ computed:
- **Left panel (standard basis):** FOIL expansion — 4 color-coded terms, cross-terms highlighted
- **Right panel (idempotent basis):** Only 2 independent multiplications, cross-terms grayed out as zero
- Both arrive at the same answer. A "cross-talk meter" shows zero in the idempotent basis.

**Viz 2.3 — "Pointwise Channels"**

Two horizontal number lines ($e_+$ channel, $e_-$ channel). Two elements as draggable dots on each line. Operation selector: Add / Multiply / Power. Results computed independently per channel (animated). Below: the same result in the $(u,v)$ plane. Toggle between views to feel the decoupling.

---

### Phase 3: "The Function Algebra" (Section 6)

**Viz 3.1 — "The Function Algebra Reveal" (progressive, stepped)**

1. Show two points $\{+, -\}$ as colored circles
2. A "function" on this set = two real numbers → bar chart with two adjustable bars
3. Show $\delta_+$ and $\delta_-$ as indicator bar charts (each lights up one point)
4. Expand $f = f(+)\delta_+ + f(-)\delta_-$ — animate scaling and stacking of indicator bars
5. Multiply two functions pointwise — bar-by-bar, no cross-talk
6. **The bridge:** animate the bar chart morphing into the $(a,b)$-plane, with $\delta_\pm$ becoming $e_\pm$

Punchline equation: $\text{split-complex plane} = \text{functions on } \{+, -\}$

**Viz 3.2 — "Projection as Filtering" (replaces/improves existing Viz 2)**

An element $x = ae_+ + be_-$ shown as both a bar chart and a plane point. Three outputs:
- $e_+ \cdot x$: only the $+$ bar survives
- $e_- \cdot x$: only the $-$ bar survives
- Sum recovers $x$

Dragging $x$ updates all projections in real time. In the plane view, projection flattens the point onto the $e_+$ or $e_-$ diagonal line.

---

### Phase 4: "Functions Act Coordinatewise" (Section 4)

**Viz 4.1 — "The Power Orbit"**

An element $x = ae_+ + be_-$. Function selector: $x^2, x^3, \exp, \sin$, custom polynomial.
- **$(a,b)$ plane:** Orbit $x, f(x), f^2(x), \ldots$ — each channel evolves independently along its axis. Trajectory is trivially predictable.
- **$(u,v)$ plane:** Same points but the trajectory looks complex due to coordinate mixing.
- "Show all" toggle: display entire trajectory at once (abstracting over iteration count) vs. step-by-step animation (concrete).
- Special case: $\exp(u + vt) = e^u(\cosh v + t\sinh v)$ shown side-by-side with the complex $e^{x+iy}$ — circle ↔ hyperbola. Replaces and deepens existing Viz 3.

---

### Phase 5: "The Generalization" (Sections 7–8)

**Viz 5.1 — "The $t^n = 1$ Staircase"**

Slider for $n$ (2–8). Left: $n$th roots of unity on the unit circle, colored. Right: indicator functions $\delta_0, \ldots, \delta_{n-1}$ as bar charts. For $n = 2$: highlight that this IS $e_+, e_-$. Click any root to see its idempotent formula.

**Viz 5.2 — "The DFT Matrix as Phasor Grid"**

An $n \times n$ grid of phasors (arrows) showing $W_{mj} = \omega^{mj}$. Input vector in power basis (adjustable bars) → matrix acting visually → output in idempotent basis. For $n = 2$: the matrix is $\begin{pmatrix}1 & 1 \\ 1 & -1\end{pmatrix}$ — exactly the familiar change of basis.

**Viz 5.3 — "Constructive & Destructive Interference" (improved existing Viz 4)**

Step-by-step animated vector addition for $e_j$ evaluated at $\omega^k$. When $j = k$: vectors align → sum = 1. When $j \neq k$: vectors fan into a closed polygon → sum = 0. Side panel shows the indicator function bar chart updating.

---

### Structural Decisions

- **Embed inline** in index.qmd at each section, not in a separate file
- Keep visualizations.qmd as a dev sandbox
- Shared utility functions (coordinate transforms, multiplication helpers) defined in early OJS cells
- Consistent color palette: $e_+$ = `#10b981`, $e_-$ = `#8b5cf6`, complex = `#3b82f6`, hyperbolic = `#ef4444`
- Sections 9–10 (infinite sets, $\ell^2$) excluded — inherently non-finite, don't lend to interactive vis
- No external imports needed — all built-in OJS libraries

### Verification

1. `quarto preview` — all visualizations load and are interactive
2. Cross-browser test of D3 drag (Chrome, Firefox, Safari)
3. Narrow viewport — panels stack gracefully
4. Math correctness: dual planes stay in sync, FOIL and idempotent results match, DFT output correct, interference sums to 1 or 0
5. `quarto render` — no OJS compilation errors

### Further Considerations

1. **Bar-chart → plane morph (Viz 3.1 Step 6):** Most ambitious animation. D3 transitions can interpolate between positions; if too complex, a toggle with crossfade is fine.
2. **Embedding size:** If index.qmd exceeds ~1500 lines, split OJS utility functions into a shared `.ojs` file and import.
3. **Animation style:** Orbits (Viz 4.1) should start animated (concrete), then offer "show all" toggle (abstract) — the Bret Victor pattern.
